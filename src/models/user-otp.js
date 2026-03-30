import mongoose from "mongoose";

const { Schema, model } = mongoose;

const otpSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    otpHash: {
      type: String,
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    purpose: {
      type: String,
      enum: ["FORGOT_PASSWORD", "VERIFY_EMAIL"],
      required: true,
      default: "LOGIN",
    },

    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index
    },

    ipAddress: {
      type: String,
    },

    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Unique OTP per email + purpose
otpSchema.index({ email: 1, purpose: 1 }, { unique: true });

const Otp = model("user_Otp", otpSchema);
export default Otp;
