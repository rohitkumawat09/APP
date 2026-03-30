import userSession from "../models/user-session.js";
import {
  deleteAccountService,
  changePasswordService,
  logoutAllDevicesService,
  updateOnlineStatusService,
  updateThemeService,
  getActiveSessionsService,
} from "../services/user-settings.service.js";
import { getIO } from "../sockets/socket.js";

export const updateTheme = async (req, res) => {
  const userId = req.user.userId;

  const result = await updateThemeService(userId, req.body);

  res.status(result.status).json(result);
};

export const updateOnlineStatus = async (req, res) => {
  const userId = req.user.userId;

  const result = await updateOnlineStatusService(userId, req.body);

  res.status(result.status).json(result);
};

export const changePassword = async (req, res) => {
  const userId = req.user.userId;

  const result = await changePasswordService(userId, req.body);

  if (result.status === 200) {
    const io = getIO();
    io.to(`user:${userId}`).emit("force_logout");
  }

  res.status(result.status).json(result);
};

export const logoutAllDevices = async (req, res) => {
  try {
    const { userId } = req.user;

    const result = await logoutAllDevicesService(userId);

    if (result.status === 200) {
      const io = getIO();
      io.to(`user:${userId}`).emit("force_logout");
    }

    return res.status(result.status).json(result);
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const deleteAccount = async (req, res) => {
  const userId = req.user.userId;

  const result = await deleteAccountService(userId, req.body);

  if (result.status === 200) {
    const io = getIO();
    io.to(`user:${userId}`).emit("force_logout");
  }

  res.status(result.status).json(result);
};

export const getActiveSessions = async (req, res) => {
  try {
    const { userId, sessionId } = req.user;

    const result = await getActiveSessionsService(userId, sessionId);

    return res.status(result.status).json(result);
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const logoutSingleSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    await userSession.findByIdAndUpdate(sessionId, {
      isActive: false,
    });

    const io = getIO();
    io.to(`session:${sessionId}`).emit("force_logout");

    return res.status(200).json({
      message: "Session logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
    });
  }
};
