import mongoose from "mongoose";

import logger from "../utils/logger.js";
import { env } from "./env.js";

const MONGO_URL = env.MONGO_URL;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URL);

    logger.info("[DB] MongoDB connected successfully");

    mongoose.connection.on("disconnected", () => {
      logger.warn("[DB] MongoDB disconnected");
    });
  } catch (error) {
    logger.error(error, "MongoDB connection error");
    process.exit(1);
  }
};

export default connectDB;
