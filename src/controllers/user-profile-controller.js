import {
  deleteUserAvatarService,
  getUserProfileService,
  updateUserProfileService,
} from "../services/user-profile.service.js";
import logger from "../utils/logger.js";

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }
    const result = await getUserProfileService(userId);

    return res.status(result.status).json({
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    logger.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const result = await updateUserProfileService({
      userId,
      body: req.body,
      file: req.file,
    });

    return res.status(result.status).json({
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const deleteUserAvatar = async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const result = await deleteUserAvatarService(userId);

    return res.status(result.status).json({
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    logger.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};
