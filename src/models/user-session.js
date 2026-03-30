import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    ipAddress: String,
    browser: String,
    os: String,
    device: String,
    userAgent: String,

    lastActivity: {
      type: Date,
      default: Date.now,
    },

    expireAt: {
      type: Date,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

/* TTL Index */
sessionSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Session", sessionSchema);
