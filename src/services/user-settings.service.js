import bcrypt from "bcryptjs";
import User from "../models/user-register.js";
import UserSettings from "../models/user-settings.js";
import { comparePassword } from "../utils/password.util.js";
import userSession from "../models/user-session.js";

export const updateThemeService = async (userId, body) => {
  const settings = await UserSettings.findOneAndUpdate(
    { userId },
    { theme: body.theme },
    { returnDocument: "after" },
  );

  return {
    status: 200,
    message: "Theme updated successfully",
    data: settings,
  };
};

export const updateOnlineStatusService = async (userId, body) => {
  const settings = await UserSettings.findOneAndUpdate(
    { userId },
    { showOnlineStatus: body.showOnlineStatus },
    { returnDocument: "after" },
  );

  return {
    status: 200,
    message: "Online status updated",
    data: settings,
  };
};

export const changePasswordService = async (userId, body) => {
  const user = await User.findById(userId).select("+password");

  if (!user.authProvider.includes("LOCAL")) {
    return {
      status: 403,
      message: "User not registered with local authentication",
    };
  }

  const isMatch = await bcrypt.compare(body.oldPassword, user.password);

  if (!isMatch) {
    return {
      status: 400,
      message: "Old password incorrect",
    };
  }

  const hashedPassword = await bcrypt.hash(body.newPassword, 10);

  user.password = hashedPassword;

  user.passwordChangedAt = new Date();

  await user.save();

  await userSession.updateMany({ userId }, { isActive: false });

  return {
    status: 200,
    message: "Password changed successfully",
  };
};

export const logoutAllDevicesService = async (userId) => {
  // 1️⃣ DB: deactivate all sessions
  await userSession.updateMany({ userId }, { isActive: false });

  return {
    status: 200,
    message: "Logged out from all devices",
  };
};

export const deleteAccountService = async (userId, body) => {
  if (body?.confirm !== true) {
    return {
      status: 400,
      message: "Please confirm account deletion",
    };
  }
  const user = await User.findById(userId);

  if (!user) {
    return {
      status: 404,
      message: "User not found",
    };
  }

  await userSession.updateMany({ userId }, { isActive: false });

  await User.findByIdAndUpdate(userId, {
    // deletedAt: new Date(),
    status: "INACTIVE",
  });

  return {
    status: 200,
    message: "Account deleted successfully",
  };
};

export const getActiveSessionsService = async (userId, currentSessionId) => {
  const sessions = await userSession
    .find({
      userId,
      isActive: true,
      expireAt: { $gt: new Date() }, // expired remove
    })
    .sort({ lastActivity: -1 })
    .lean();

  const formattedSessions = sessions.map((session) => ({
    _id: session._id,
    ipAddress: session.ipAddress,
    browser: session.browser,
    os: session.os,
    device: session.device,
    lastActivity: session.lastActivity,
    createdAt: session.createdAt,

    // 🔥 current device identify
    isCurrent: session._id.toString() === currentSessionId,
  }));

  return {
    status: 200,
    message: "Active sessions fetched successfully",
    data: formattedSessions,
  };
};
