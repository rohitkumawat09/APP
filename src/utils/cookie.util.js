import { env } from "../config/env.js";
export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production" ? true : false,
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

export const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production" ? true : false,
  sameSite: "lax",
  maxAge: 30 * 60 * 1000,
  path: "/",
};

export const FORGOT_PASSWORD_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production" ? true : false,
  sameSite: "lax",
  maxAge: 10 * 60 * 1000,
  path: "/",
};
