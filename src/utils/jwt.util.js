import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const createUserAccessToken = (payload) => {
  return jwt.sign(payload, env.USER_JWT_ACCESS_SECRET, {
    expiresIn: "30m",
  });
};

export const verifyUserAccessToken = (token) => {
  try {
    return jwt.verify(token, env.USER_JWT_ACCESS_SECRET);
  } catch (error) {
    return null;
  }
};

export const createUserRefreshToken = (payload) => {
  return jwt.sign(payload, env.USER_JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

export const verifyUserRefreshToken = (token) => {
  try {
    return jwt.verify(token, env.USER_JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};

export const createUserResetToken = (userId) => {
  return jwt.sign(
    {
      userId,
      purpose: "PASSWORD_RESET",
    },
    env.JWT_USER_OTP_SECRET,
    {
      expiresIn: "10m",
    },
  );
};

export const verifyUserResetToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_USER_OTP_SECRET);
  } catch (error) {
    return null;
  }
};
