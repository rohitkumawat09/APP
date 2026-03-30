import mongoose from "mongoose";

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 4,
      maxlength: 20,
    },

    password: {
      type: String,
      select: false,
    },

    authProvider: {
      type: [String],
      enum: ["LOCAL", "GOOGLE", "APPLE"],
      default: ["LOCAL"],
      required: true,
    },

    providerId: {
      type: Map,
      of: String,
      default: {},
    },

    role: {
      type: String,
      enum: ["USER"],
      default: "USER",
      immutable: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
      default: "ACTIVE",
      index: true,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    verificationEmailSentAt: {
      type: Date,
      default: null,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },

    lastLoginProvider: {
      type: String,
      enum: ["LOCAL", "GOOGLE", "APPLE"],
      default: null,
    },

    passwordChangedAt: Date,

    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// unique email index (only if deletedAt null)
userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
);

// pre-save validation
userSchema.pre("save", async function () {
  const isOnlyLocal =
    this.authProvider.length === 1 && this.authProvider[0] === "LOCAL";

  if (isOnlyLocal && !this.password) {
    throw new Error("Password is required for LOCAL authentication");
  }
});

const User = model("User", userSchema);
export default User;
