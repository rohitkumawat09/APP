import mongoose from "mongoose";

const { Schema, model } = mongoose;

const userSettingsSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    theme: {
      type: String,
      enum: ["LIGHT", "DARK", "SYSTEM"],
      default: "SYSTEM",
    },

    showOnlineStatus: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const UserSettings = model("UserSettings", userSettingsSchema);

export default UserSettings;
