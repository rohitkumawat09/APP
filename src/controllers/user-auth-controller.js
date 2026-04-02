import userSession from "../models/user-session.js";
import {
  googleLoginService,
  loginUserService,
  registerUserService,
  verifyEmailService,
  forgotPasswordService,
  verifyForgotPasswordService,
  userResetPasswordService,
  refreshUserTokenService,
  checkTokenService,
} from "../services/user-auth.service.js";
import {
  ACCESS_COOKIE_OPTIONS,
  FORGOT_PASSWORD_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
} from "../utils/cookie.util.js";
import logger from "../utils/logger.js";
import { sanitizeUser, logSecurely } from "../utils/security.util.js";

export const googleLogin = async (req, res) => {
  try {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      req.ip;

    const result = await googleLoginService({
      code: req.body.code,
      ip,
      userAgent: req.headers["user-agent"],
    });

    if (result.status !== 200) {
      return res.status(result.status).json({
        message: result.message,
      });
    }

    res.cookie("userAccessToken", result.accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie("userRefreshToken", result.refreshToken, REFRESH_COOKIE_OPTIONS);

    logSecurely("GOOGLE_LOGIN_SUCCESS", result.user.email);

    return res.status(200).json({
      success: true,
      message: "Google login successful",
      user: sanitizeUser(result.user),
    });
  } catch (error) {
    logger.error(`GOOGLE LOGIN ERROR: ${error.message}`);
    return res.status(500).json({
      message: "Authentication failed",
    });
  }
};

export const register = async (req, res) => {
  try {
    const result = await registerUserService(req.body);

    return res.status(result.status).json({
      message: result.message,
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const result = await verifyEmailService(req.body);

    return res.status(result.status).json({
      message: result.message,
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const userLogin = async (req, res) => {
  try {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      req.ip;

    const result = await loginUserService({
      email: req.body.email,
      password: req.body.password,
      ip,
      userAgent: req.headers["user-agent"],
    });

    if (result.status !== 200) {
      return res.status(result.status).json({
        message: result.message,
      });
    }

    // ✅ Set cookies for web
    res.cookie("userAccessToken", result.accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie("userRefreshToken", result.refreshToken, REFRESH_COOKIE_OPTIONS);

    logSecurely("LOGIN_SUCCESS", result.user.email);

    // ✅ Return ONLY safe data - sanitize user object
    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: sanitizeUser(result.user),
      // Mobile tokens (Web uses cookies)
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    logger.error(`LOGIN ERROR: ${error.message}`);
    return res.status(500).json({
      message: "Authentication failed",
    });
  }
};

export const forgotPasswordOtp = async (req, res) => {
  try {
    const result = await forgotPasswordService(req.body);

    return res.status(result.status).json({
      message: result.message,
    });
  } catch (error) {
    logger.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const verifyForgotPasswordOtp = async (req, res) => {
  try {
    const result = await verifyForgotPasswordService(req.body);

    res.cookie(
      "userResetToken",
      result.userResetToken,
      FORGOT_PASSWORD_COOKIE_OPTIONS,
    );

    return res.status(result.status).json({
      message: result.message,
      // Include token in response for mobile clients (who can't use cookies)
      userResetToken: result.userResetToken,
    });
  } catch (error) {
    logger.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// export const userResetPassword = async (req, res) => {
//   try {
//     // Get token from cookies (web) or request body (mobile)
//     const token = req.cookies?.userResetToken || req.body?.userResetToken;

//     const result = await userResetPasswordService({
//       token,
//       newPassword: req.body.newPassword,
//     });

//     if (result.status === 200) {
//       res.clearCookie("userResetToken");
//     }

//     return res.status(result.status).json({
//       message: result.message,
//     });
//   } catch (error) {
//     logger.error(`[RESET PASSWORD ERROR] ${error}`);

//     return res.status(500).json({
//       message: "Server error",
//     });
//   }
// };

export const userResetPassword = async (req, res) => {
  try {
    const token = getResetToken(req);
    
    console.log('[RESET-PASSWORD] Token extraction:');
    console.log('  - Header:', req.headers.authorization ? '[Bearer token present]' : '[Not found]');
    console.log('  - Cookie:', req.cookies?.userResetToken ? '[Token present]' : '[Not found]');
    console.log('  - Body:', req.body?.userResetToken ? '[Token present]' : '[Not found]');
    console.log('  - Final token:', token ? '[Extracted successfully]' : '[Failed to extract]');

    if (!token) {
      return res.status(401).json({
        message: "No reset token provided",
      });
    }

    const result = await userResetPasswordService({
      token,
      newPassword: req.body.newPassword,
    });

    if (result.status === 200) {
      res.clearCookie("userResetToken");
    }

    return res.status(result.status).json({
      message: result.message,
    });
  } catch (error) {
    logger.error(`[RESET PASSWORD ERROR] ${error}`);

    return res.status(500).json({
      message: "Server error",
    });
  }
};
const getResetToken = (req) => {
  // 1. Header (Mobile)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // 2. Cookie (Web)
  if (req.cookies?.userResetToken) {
    return req.cookies.userResetToken;
  }

  // 3. Body fallback
  if (req.body?.userResetToken) {
    return req.body.userResetToken;
  }

  return null;
};

export const checkToken = async (req, res) => {
  try {
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
    });

    // ✅ Try cookie first (Web), then Bearer token (Mobile)
    let token = req.cookies?.userAccessToken;

    if (!token) {
      // Check Authorization header for Bearer token
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    const result = await checkTokenService(token);

    if (result.status !== 200) {
      return res.status(result.status).json({
        message: result.message,
      });
    }

    // ✅ Return ONLY safe user data
    return res.status(200).json({
      success: true,
      user: sanitizeUser(result.user),
    });
  } catch (error) {
    logger.error(`CHECK TOKEN ERROR: ${error.message}`);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const userRefreshToken = async (req, res) => {
  try {
    // ✅ Try cookie first (Web), then Bearer token (Mobile)
    let refreshToken = req.cookies.userRefreshToken;

    if (!refreshToken) {
      // Check Authorization header for Bearer token
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        refreshToken = authHeader.substring(7);
      }
    }

    if (!refreshToken)
      return res.status(401).json({ message: "Refresh token missing" });

    const result = await refreshUserTokenService(refreshToken);
    if (result.status !== 200) {
      return res.status(result.status).json({
        message: result.message,
      });
    }

    // ✅ Set cookie for web
    res.cookie("userAccessToken", result.accessToken, ACCESS_COOKIE_OPTIONS);

    // ✅ Return tokens for mobile
    return res.status(200).json({
      message: result.message,
      success: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    logger.error(`USER REFRESH TOKEN ERROR: ${error}`);

    return res.status(401).json({
      message: "Invalid refresh token",
    });
  }
};

export const userLogout = async (req, res) => {
  try {
    const { sessionId } = req.user;

    await userSession.findByIdAndUpdate(sessionId, {
      isActive: false,
    });

    res.clearCookie("userAccessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    res.clearCookie("userRefreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    logger.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};
