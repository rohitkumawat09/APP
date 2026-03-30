import mongoose from "mongoose";

const { Schema, model } = mongoose;

const userProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // 👤 Profile Section
    fullName: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
    },
    avatarPath: {
      type: String,
    },
    bio: {
      type: String,
    },
    phone: {
      type: String,
    },
    address: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
    },
    dateOfBirth: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

const UserProfile = model("UserProfile", userProfileSchema);
export default UserProfile;
