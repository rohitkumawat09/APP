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

    const updateData = {};

    // Only add fields that are provided and not empty
    if (body.fullName) updateData.fullName = body.fullName;
    if (body.bio) updateData.bio = body.bio;
    if (body.phone) updateData.phone = body.phone;
    if (body.address) updateData.address = body.address;
    if (body.city) updateData.city = body.city;
    if (body.state) updateData.state = body.state;
    if (body.gender) updateData.gender = body.gender;
    if (body.dateOfBirth) updateData.dateOfBirth = body.dateOfBirth;

    if (avatar) {
      updateData.avatar = avatar;
      updateData.avatarPath = avatarPath;
    }

    console.log('[updateUserProfileService] Update data:', updateData);

    const updatedProfile = await UserProfile.findOneAndUpdate(
      { userId },
      updateData,
      {
        new: true,
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
    console.error(`[updateUserProfileService] Error: ${error.message}`);
    logger.error(`updateUserProfileService error: ${error.message}`);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
      }));
      return {
        status: 400,
        message: "Validation failed",
        errors,
      };
    }

    return {
      status: 500,
      message: error.message || "Failed to update profile",
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
