import UserProfile from "../models/user-profile.js";
import User from "../models/user-register.js";
import {
  deleteFromCloudinary,
  uploadImageToCloudinary,
} from "../utils/cloudinary-upload.js";
import logger from "../utils/logger.js";

export const getUserProfileService = async (userId) => {
  const profile = await UserProfile.findOne({ userId }).populate(
    "userId",
    "email",
  );

  if (!profile) {
    return {
      status: 404,
      message: "Profile not found",
    };
  }

  const profileObj = profile.toObject();

  return {
    status: 200,
    message: "Profile fetched successfully",
    data: {
      email: profileObj.userId.email,
      ...profileObj,
      userId: undefined,
    },
  };
};

export const updateUserProfileService = async ({ userId, body, file }) => {
  try {
    const profile = await UserProfile.findOne({ userId });

    if (!profile) {
      return {
        status: 404,
        message: "Profile not found",
      };
    }

    let avatar;
    let avatarPath;

    if (file) {
      try {
        // delete old avatar if exists
        if (profile.avatarPath) {
          try {
            await deleteFromCloudinary(profile.avatarPath);
          } catch (deleteError) {
            logger.warn(
              `Failed to delete old avatar: ${deleteError.message}`,
            );
            // Continue anyway, old file stays in cloudinary
          }
        }

        // upload new avatar
        const uploadResult = await uploadImageToCloudinary(
          file.buffer,
          "user-profile",
          file.mimetype,
        );

        if (!uploadResult || !uploadResult.secure_url) {
          return {
            status: 503,
            message: "Failed to upload avatar. Please try again.",
          };
        }

        avatar = uploadResult.secure_url;
        avatarPath = uploadResult.public_id;
      } catch (uploadError) {
        logger.error(`Avatar upload error: ${uploadError.message}`);
        return {
          status: 503,
          message:
            "Image upload failed. Please try again with a smaller file.",
        };
      }
    }

    const updateData = {
      ...body,
    };

    if (avatar) {
      updateData.avatar = avatar;
      updateData.avatarPath = avatarPath;
    }

  const updatedProfile = await UserProfile.findOneAndUpdate(
    { userId },
    updateData,
    {
      returnDocument: "after",
      runValidators: true,
    },
  ).populate("userId", "email");

  // update fullname in user collection
  if (body.fullName) {
    await User.findByIdAndUpdate(userId, {
      fullName: body.fullName,
    });
  }

    const profileObj = updatedProfile.toObject();

    return {
      status: 200,
      message: "Profile updated successfully",
      data: {
        email: profileObj.userId.email,
        ...profileObj,
        userId: undefined,
      },
    };
  } catch (error) {
    logger.error(`updateUserProfileService error: ${error.message}`);
    return {
      status: 500,
      message: "Failed to update profile",
    };
  }
};

export const deleteUserAvatarService = async (userId) => {
  const profile = await UserProfile.findOne({ userId });

  if (!profile) {
    return {
      status: 404,
      message: "Profile not found",
    };
  }

  // check avatar exists
  if (!profile.avatarPath) {
    return {
      status: 400,
      message: "No avatar to delete",
    };
  }

  // delete from cloudinary
  await deleteFromCloudinary(profile.avatarPath);

  // remove avatar from DB
  profile.avatar = undefined;
  profile.avatarPath = undefined;

  await profile.save();

  return {
    status: 200,
    message: "Profile picture deleted successfully",
    data: null,
  };
};
