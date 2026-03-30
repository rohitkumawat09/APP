import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import logger from "../utils/logger.js";
import { env } from "../config/env.js";

let io;

/* =========================
   INITIALIZE SOCKET
========================= */

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true,
    },
    transports: ["websocket"],
  });

  /* =========================
     AUTH MIDDLEWARE
  ========================= */

  io.use((socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;

      if (!cookieHeader) {
        return next(new Error("Authentication failed"));
      }

      const cookies = cookie.parse(cookieHeader);

      const accessToken = cookies.userAccessToken;

      if (!accessToken) {
        return next(new Error("Access token missing"));
      }

      const decoded = jwt.verify(accessToken, env.USER_JWT_ACCESS_SECRET);

      socket.user = decoded;

      next();
    } catch (error) {
      logger.error(error, "Socket authentication error");
      next(new Error("Authentication error"));
    }
  });

  /* =========================
     CONNECTION
  ========================= */

  io.on("connection", (socket) => {
    const userId = socket.user?.userId;
    const sessionId = socket.user?.sessionId;

    if(!userId || !sessionId){
      return socket.disconnect();
    }

    logger.info(`User connected: ${userId} | socketId: ${socket.id}`);

    // 🔥 user room (optional)
    socket.join(`user:${userId}`);

    // 🔥 session specific room (MOST IMPORTANT)
    socket.join(`session:${sessionId}`);

    logger.info(`Joined session room: session:${sessionId}`);

    socket.on("send_message", ({ receiverId, message }) => {
      io.to(`user:${receiverId}`).emit("receive_message", {
        senderId: userId,
        message,
      });
    });

    socket.on("disconnect", () => {
      logger.info(`User disconnected: ${userId} | socketId: ${socket.id}`);
    });
  });

  return io;
};

/* =========================
   GET SOCKET INSTANCE
========================= */

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }

  return io;
};
