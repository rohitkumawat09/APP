import crypto from "crypto";
import User from "../models/user-register.js";
import UserProfile from "../models/user-profile.js";
import Otp from "../models/user-otp.js";
import Session from "../models/user-session.js";

import { hashPassword } from "../utils/password.util.js";
import { generateOtp, getOtpExpiry } from "../utils/generateOtp.util.js";

import { comparePassword } from "../utils/password.util.js";
import {
  createUserAccessToken,
  createUserRefreshToken,
  createUserResetToken,
  verifyUserAccessToken,
  verifyUserRefreshToken,
  verifyUserResetToken,
} from "../utils/jwt.util.js";

import { sendEmail } from "../utils/email.util.js";
import { googleClient } from "../config/google.js";
import { UAParser } from "ua-parser-js";

import { env } from "../config/env.js";

import logger from "../utils/logger.js";
import userSession from "../models/user-session.js";
import UserSettings from "../models/user-settings.js";
import { sanitizeUser } from "../utils/security.util.js";

const OTP_CONFIG = {
  COOLDOWN_SECONDS: 60,
  EXPIRY_MINUTES: 5,
  MAX_ATTEMPTS: 5,
};

export const googleLoginService = async ({ code, ip, userAgent }) => {
  try {
    if (!code) {
      return {
        status: 400,
        message: "Authorization code is required",
      };
    }

    const looksLikeGoogleIdToken =
      /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(code);

    if (looksLikeGoogleIdToken) {
      return {
        status: 403,
        message: "Google login is available only on the website",
      };
    }

    const { tokens } = await googleClient.getToken({
      code,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
    });

    if (!tokens?.id_token) {
      return {
        status: 401,
        message: "Failed to retrieve Google ID token",
      };
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: env.GOOGLE_WEB_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.email || !payload?.sub) {
      return {
        status: 401,
        message: "Invalid Google token",
      };
    }

    const email = payload.email.toLowerCase().trim();
    const googleId = payload.sub;
    let fullName = payload.name || "Google User";

    if (fullName.length < 4) {
      fullName = fullName.padEnd(4, ".");
    }

    let user = await User.findOne({
      email,
      deletedAt: null,
    });

    if (user?.status === "SUSPENDED") {
      logger.warn(`User ${email} login blocked: account suspended`);
      return {
        status: 403,
        message: "Account suspended",
      };
    }

    if (!user) {
      user = await User.create({
        email,
        fullName,
        authProvider: ["GOOGLE"],
        providerId: new Map([["GOOGLE", googleId]]),
        role: "USER",
        status: "ACTIVE",
        isEmailVerified: true,
        lastLoginProvider: "GOOGLE",
      });

      await UserProfile.create({
        userId: user._id,
        fullName,
      });

      await UserSettings.create({
        userId: user._id,
      });
    } else {
      const storedGoogleId = user.providerId?.get?.("GOOGLE");

      if (storedGoogleId && storedGoogleId !== googleId) {
        logger.warn(
          `Google account mismatch for ${email}: stored=${storedGoogleId}, current=${googleId}`,
        );
        return {
          status: 403,
          message: "Google account mismatch",
        };
      }

      const providers = new Set(user.authProvider || []);
      providers.add("GOOGLE");
      user.authProvider = Array.from(providers);

      if (!user.providerId) {
        user.providerId = new Map();
      }

      user.providerId.set("GOOGLE", googleId);
      user.isEmailVerified = true;
      user.status = "ACTIVE";
      user.lastLoginProvider = "GOOGLE";

      if (fullName.length >= 4) {
        user.fullName = fullName;
      }

      await user.save();

      const existingProfile = await UserProfile.findOne({ userId: user._id });
      if (!existingProfile) {
        await UserProfile.create({
          userId: user._id,
          fullName: user.fullName,
        });
      }

      const existingSettings = await UserSettings.findOne({ userId: user._id });
      if (!existingSettings) {
        await UserSettings.create({
          userId: user._id,
        });
      }
    }

    const parser = new UAParser(userAgent);
    const ua = parser.getResult();
    const expireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const session = await Session.create({
      userId: user._id,
      ipAddress: ip,
      browser: ua.browser?.name || "Unknown",
      os: ua.os?.name || "Unknown",
      device: ua.device?.type || "desktop",
      userAgent,
      expireAt,
    });

    const accessToken = createUserAccessToken({
      userId: user._id,
      role: user.role,
      sessionId: session._id,
    });

    const refreshToken = createUserRefreshToken({
      userId: user._id,
      role: user.role,
      sessionId: session._id,
    });

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          lastLoginAt: new Date(),
          lastLoginProvider: "GOOGLE",
        },
      },
    );

    return {
      status: 200,
      message: "Google login successful",
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  } catch (error) {
    logger.error(`GOOGLE LOGIN SERVICE ERROR: ${error.message}`);
    return {
      status: 500,
      message: "Server error",
    };
  }
};

export const registerUserService = async ({ email, password, fullName }) => {
  const existingUser = await User.findOne({
    email,
    deletedAt: null,
  }).select("isEmailVerified authProvider");

  // GOOGLE only account
  if (
    existingUser &&
    existingUser.authProvider?.includes("GOOGLE") &&
    !existingUser.authProvider.includes("LOCAL")
  ) {
    return {
      status: 409,
      message:
        "This email is already registered with Google on the website. Please use 'Forgot Password' to set a password for app login.",
    };
  }

  // LOCAL user already verified
  if (existingUser?.isEmailVerified) {
    return {
      status: 409,
      message: "Email is already registered",
    };
  }

  // USER EXISTS BUT NOT VERIFIED
  if (existingUser && !existingUser.isEmailVerified) {
    const existingOtp = await Otp.findOne({
      email,
      purpose: "VERIFY_EMAIL",
    });

    if (existingOtp) {
      const secondsPassed =
        (Date.now() - existingOtp.updatedAt.getTime()) / 1000;

      if (secondsPassed < OTP_CONFIG.COOLDOWN_SECONDS) {
        return {
          status: 429,
          message: `Please wait ${Math.ceil(OTP_CONFIG.COOLDOWN_SECONDS - secondsPassed)} seconds before requesting a new OTP`,
        };
      }
    }

    const hashedPassword = await hashPassword(password);

    await User.updateOne(
      { email },
      {
        fullName,
        password: hashedPassword,
      },
    );

    const { otp, otpHash } = generateOtp();

    const expiresAt = getOtpExpiry(OTP_CONFIG.EXPIRY_MINUTES);

    await Otp.findOneAndUpdate(
      { email, purpose: "VERIFY_EMAIL" },
      {
        otpHash,
        expiresAt,
        attempts: 0,
      },
      { upsert: true, returnDocument: 'after' },
    );

    // Send Email
    const emailResult = await sendEmail({
      to: email,
      subject: "Verify your email",
      text: `Your verification OTP is ${otp}. It expires in ${OTP_CONFIG.EXPIRY_MINUTES} minutes.`,
    });
    
    if (!emailResult || !emailResult.success) {
      logger.error(`Email sending failed for ${email}: ${emailResult?.error || 'Unknown error'}`);
      // Delete OTP record since email failed
      await Otp.findOneAndDelete({ email, purpose: "VERIFY_EMAIL" });
      return {
        status: 503,
        message: "Failed to send verification email. Please try registering again.",
      };
    }
    
    logger.info(`OTP email sent successfully to ${email}`);
    return {
      status: 200,
      message: "OTP sent to your email. Please check and verify.",
    };
  }

  // =========================
  // NEW USER
  // =========================

  const hashedPassword = await hashPassword(password);

  await User.create({
    email,
    fullName,
    password: hashedPassword,
    authProvider: ["LOCAL"],
    role: "USER",
    status: "INACTIVE",
    isEmailVerified: false,
    verificationEmailSentAt: new Date(),
  });

  const { otp, otpHash } = generateOtp();

  const expiresAt = getOtpExpiry(OTP_CONFIG.EXPIRY_MINUTES);

  await Otp.findOneAndUpdate(
    { email, purpose: "VERIFY_EMAIL" },
    {
      otpHash,
      expiresAt,
      attempts: 0,
    },
    { upsert: true, returnDocument: 'after' },
  );
  // Send Email
  const emailResult = await sendEmail({
    to: email,
    subject: "Verify your email",
    text: `Your verification OTP is ${otp}. It expires in ${OTP_CONFIG.EXPIRY_MINUTES} minutes.`,
  });

  if (!emailResult || !emailResult.success) {
    logger.error(`Email sending failed for ${email}: ${emailResult?.error || 'Unknown error'}`);
    // Delete user and OTP since email failed
    await User.deleteOne({ email });
    await Otp.findOneAndDelete({ email, purpose: "VERIFY_EMAIL" });
    return {
      status: 503,
      message: "Failed to send verification email. Please try registering again.",
    };
  }
  
  logger.info(`OTP email sent successfully to ${email}`);
  return {
    status: 201,
    message:
      "User registered successfully. OTP sent to email for verification.",
    // otp,
  };
};

export const verifyEmailService = async ({ email, otp }) => {
  if (!email || !otp) {
    return {
      status: 400,
      message: "Email and OTP are required",
    };
  }

  const normalizedEmail = email.toLowerCase().trim();

  /* =======================================================
       1️⃣ Find OTP record
    ======================================================== */
  const otpRecord = await Otp.findOne({
    email: normalizedEmail,
    purpose: "VERIFY_EMAIL",
  });

  if (!otpRecord) {
    return {
      status: 400,
      message: "OTP expired or invalid",
    };
  }

  /* =======================================================
       2️⃣ Check expiry
    ======================================================== */
  if (otpRecord.expiresAt.getTime() < Date.now()) {
    return {
      status: 400,
      message: "OTP expired or invalid",
    };
  }

  /* =======================================================
       3️⃣ Check max attempts
    ======================================================== */
  if (otpRecord.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
    return {
      status: 429,
      message: "Too many incorrect attempts. Please request a new OTP.",
    };
  }

  /* =======================================================
       4️⃣ Compare OTP (hash)
    ======================================================== */
  // Ensure OTP is string and trim whitespace
  const otpString = String(otp || "").trim();

  if (!otpString || otpString.length < 4) {
    return { status: 400, message: "Invalid OTP format" };
  }

  const incomingOtpHash = crypto.createHash("sha256").update(otpString).digest("hex");

  if (incomingOtpHash !== otpRecord.otpHash) {
    await Otp.updateOne({ _id: otpRecord._id }, { $inc: { attempts: 1 } });

    return {
      status: 400,
      message: "Invalid OTP",
    };
  }

  const user = await User.findOne({
    email: normalizedEmail,
    deletedAt: null,
  });

  if (!user) {
    return {
      status: 404,
      message: "User not found",
    };
  }

  if (user.isEmailVerified) {
    return {
      status: 400,
      message: "Email already verified",
    };
  }

  await User.findByIdAndUpdate(user._id, {
    isEmailVerified: true,
    status: "ACTIVE",
  });

  const existingProfile = await UserProfile.findOne({
    userId: user._id,
  });

  if (!existingProfile) {
    await UserProfile.create({
      userId: user._id,
      fullName: user.fullName,
    });
  }

  const existingSettings = await UserSettings.findOne({
    userId: user._id,
  });
  if (!existingSettings) {
    await UserSettings.create({
      userId: user._id,
    });
  }

  await Otp.deleteOne({
    email: normalizedEmail,
    purpose: "VERIFY_EMAIL",
  });

  return {
    status: 200,
    message: "Email verified successfully",
  };
};

export const loginUserService = async ({ email, password, ip, userAgent }) => {
  try {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
      deletedAt: null,
    }).select(
      "+password role authProvider status fullName email isEmailVerified",
    );

    if (!user) {
      return { status: 404, message: "User not found" };
    }

    if (user.status === "INACTIVE") {
      return { status: 403, message: "User not active" };
    }

    if (user.status === "SUSPENDED") {
      return { status: 403, message: "Account suspended" };
    }

    if (!user.authProvider.includes("LOCAL")) {
      return {
        status: 403,
        message:
          "This account uses Google login on the website. Please use 'Forgot Password' to set a password for app login.",
      };
    }

    if (!user.isEmailVerified) {
      return { status: 403, message: "Email not verified" };
    }

    // Check if password field exists
    if (!user.password) {
      logger.warn(`Password field missing for user: ${normalizedEmail}`);
      return {
        status: 403,
        message: "Password login not configured for this account",
      };
    }

    // Verify password
    const isPasswordValid = await comparePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      return { status: 401, message: "Invalid credentials" };
    }

    /* =====================================================
       1️⃣ Parse Device Info
    ===================================================== */

    const parser = new UAParser(userAgent);
    const ua = parser.getResult();

    /* =====================================================
       2️⃣ Create Session
    ===================================================== */

    const expireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const session = await Session.create({
      userId: user._id,
      ipAddress: ip,
      browser: ua.browser?.name || "Unknown",
      os: ua.os?.name || "Unknown",
      device: ua.device?.type || "desktop",
      userAgent,
      expireAt,
    });

    /* =====================================================
       3️⃣ Generate Tokens (session bind)
    ===================================================== */

    const accessToken = createUserAccessToken({
      userId: user._id,
      role: user.role,
      sessionId: session._id,
    });

    const refreshToken = createUserRefreshToken({
      userId: user._id,
      role: user.role,
      sessionId: session._id,
    });

    /* =====================================================
       4️⃣ Update Login Metadata
    ===================================================== */

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          lastLoginAt: new Date(),
          lastLoginProvider: "LOCAL",
        },
      },
    );

    // ✅ Send ONLY safe user data back
    return {
      status: 200,
      message: "Login successful",
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  } catch (error) {
    logger.error(`LOCAL LOGIN SERVICE ERROR: ${error.message}`);

    return {
      status: 500,
      message: "Server error",
    };
  }
};

export const forgotPasswordService = async ({ email }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({
    email: normalizedEmail,
    status: "ACTIVE",
    deletedAt: null,
  }).select("authProvider");

  if (!user) {
    return {
      status: 404,
      message: "User not found",
    };
  }

  // cooldown check
  const existingOtp = await Otp.findOne({
    email: normalizedEmail,
    purpose: "FORGOT_PASSWORD",
  });

  if (existingOtp) {
    const secondsPassed = (Date.now() - existingOtp.updatedAt.getTime()) / 1000;

    if (secondsPassed < OTP_CONFIG.COOLDOWN_SECONDS) {
      return {
        status: 429,
        message: `Please wait ${Math.ceil(
          OTP_CONFIG.COOLDOWN_SECONDS - secondsPassed,
        )} seconds before requesting a new OTP`,
      };
    }
  }

  // generate OTP
  const { otp, otpHash } = generateOtp();

  const expiresAt = getOtpExpiry(OTP_CONFIG.EXPIRY_MINUTES);

  await Otp.findOneAndUpdate(
    { email: normalizedEmail, purpose: "FORGOT_PASSWORD" },
    {
      otpHash,
      expiresAt,
      attempts: 0,
    },
    { upsert: true, returnDocument: 'after' },
  );

  // Send Email
  const emailResult = await sendEmail({
    to: normalizedEmail,
    subject: "Reset Your Password",
    text: `Your password reset OTP is ${otp}. It expires in ${OTP_CONFIG.EXPIRY_MINUTES} minutes.`,
  });

  if (!emailResult.success) {
    logger.error(`Forgot password email failed for ${normalizedEmail}`);
  } else {
    logger.info(`Forgot password OTP sent to ${normalizedEmail}`);
  }

  return {
    status: 200,
    message: `Password reset OTP sent to ${normalizedEmail}. Please check your email.`,
  };
};

export const verifyForgotPasswordService = async ({ email, otp }) => {
  if (!email || !otp) {
    return {
      status: 400,
      message: "Email and OTP are required",
    };
  }

  const normalizedEmail = email.toLowerCase().trim();

  const otpRecord = await Otp.findOne({
    email: normalizedEmail,
    purpose: "FORGOT_PASSWORD",
  });

  if (!otpRecord) {
    return {
      status: 400,
      message: "OTP expired",
    };
  }

  // expiry check
  if (otpRecord.expiresAt.getTime() < Date.now()) {
    return {
      status: 400,
      message: "OTP expired",
    };
  }

  // attempts check
  if (otpRecord.attempts >= 5) {
    await otpRecord.deleteOne();

    return {
      status: 429,
      message: "Too many incorrect attempts",
    };
  }

  const incomingOtpHash = crypto.createHash("sha256").update(otp).digest("hex");

  if (incomingOtpHash !== otpRecord.otpHash) {
    otpRecord.attempts += 1;
    await otpRecord.save();

    return {
      status: 401,
      message: "Invalid OTP",
    };
  }

  // OTP correct → delete
  await otpRecord.deleteOne();

  const user = await User.findOne({
    email: normalizedEmail,
    status: "ACTIVE",
    deletedAt: null,
  });

  if (!user) {
    return {
      status: 404,
      message: "User not found",
    };
  }

  // create temporary reset token
  const userResetToken = createUserResetToken(user._id.toString());

  return {
    status: 200,
    message: "OTP verified successfully",
    userResetToken: userResetToken,
  };
};

export const userResetPasswordService = async ({ token, newPassword }) => {
  logger.info({ token, newPassword }, "Reset password request");
  if (!token) {
    return {
      status: 401,
      message: "OTP session expired or invalid",
    };
  }

  // verify token using helper
  const payload = verifyUserResetToken(token);

  if (!payload) {
    return {
      status: 401,
      message: "OTP session expired or invalid",
    };
  }

  // purpose check
  if (payload.purpose !== "PASSWORD_RESET") {
    return {
      status: 403,
      message: "Invalid password reset session",
    };
  }

  const userId = payload.userId;

  const user = await User.findById(userId);

  if (!user) {
    return {
      status: 404,
      message: "User not found",
    };
  }

  // hash password
  const hashedPassword = await hashPassword(newPassword);

  user.password = hashedPassword;
  user.passwordChangedAt = new Date();

  // Ensure LOCAL provider exists
  const providers = new Set(user.authProvider || []);
  providers.add("LOCAL");
  user.authProvider = Array.from(providers);

  await user.save();
  await userSession.updateMany(
    { userId: userId, isActive: true },
    { $set: { isActive: false } },
  );

  /* ==============================
   Send Security Email
============================== */

  const emailResult = await sendEmail({
    to: user.email,
    subject: "Password Changed",
    text: `Your password has been changed successfully.

If this wasn't you, please contact support immediately.`,
  });

  if (!emailResult.success) {
    logger.error(`Password change email failed for ${user.email}`);
  } else {
    logger.info(`Password change email sent to ${user.email}`);
  }
  return {
    status: 200,
    message: "Password reset successful",
  };
};

export const checkTokenService = async (token) => {
  if (!token) {
    return { status: 401, message: "Token not found" };
  }

  let payload;

  try {
    payload = verifyUserAccessToken(token);
  } catch (error) {
    return { status: 401, message: "Token expired or invalid" };
  }

  if (payload.role !== "USER") {
    return { status: 403, message: "Forbidden" };
  }
  const userSessions = await userSession.findById(payload.sessionId);
  if (
    !userSessions ||
    userSessions.isActive !== true ||
    userSessions.userId.toString() !== payload.userId
  ) {
    return { status: 401, message: "Session not found" };
  }
  const user = await User.findById(payload.userId).select(
    "_id role fullName email passwordChangedAt authProvider ",
  );

  if (!user) {
    return { status: 401, message: "User not found" };
  }

  if (payload.iat && user.passwordChangedAt) {
    if (payload.iat * 1000 < user.passwordChangedAt.getTime()) {
      return { status: 401, message: "Password changed, login again" };
    }
  }

  return {
    status: 200,
    user: {
      userId: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      authProvider: user.authProvider,
    },
  };
};

export const refreshUserTokenService = async (refreshToken) => {
  if (!refreshToken) {
    return {
      status: 401,
      message: "Refresh token missing",
    };
  }

  let payload;

  try {
    payload = verifyUserRefreshToken(refreshToken);
  } catch (err) {
    return {
      status: 401,
      message: "Invalid refresh token",
    };
  }

  if (!payload || payload.role !== "USER" || !payload.userId) {
    return {
      status: 401,
      message: "Invalid refresh token",
    };
  }

  const user = await User.findById(payload.userId);

  if (!user || user.status !== "ACTIVE" || user.deletedAt) {
    return {
      status: 403,
      message: "Account disabled",
    };
  }

  if (
    user.passwordChangedAt &&
    payload.iat &&
    payload.iat * 1000 < user.passwordChangedAt.getTime() - 1000
  ) {
    return {
      status: 401,
      message: "Password changed, login again",
    };
  }
  const userSessions = await userSession.findById(payload.sessionId);
  if (
    !userSessions ||
    userSessions.isActive !== true ||
    userSessions.userId.toString() !== payload.userId
  ) {
    return { status: 401, message: "Session not found or expired" };
  }
  const newAccessToken = createUserAccessToken({
    userId: payload.userId,
    role: payload.role,
    sessionId: payload.sessionId,
  });

  const newRefreshToken = createUserRefreshToken({
    userId: payload.userId,
    role: payload.role,
    sessionId: payload.sessionId,
  });

  return {
    status: 200,
    message: "Access token refreshed",
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};
