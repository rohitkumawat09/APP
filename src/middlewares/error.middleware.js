import logger from "../utils/logger.js";
import { env } from "../config/env.js";

export const errorHandler = (err, req, res, next) => {
  logger.error(err);

  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    success: false,
    message:
      env.NODE_ENV === "production" ? "Internal Server Error" : err.message,
  });
};
