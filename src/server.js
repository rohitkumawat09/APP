import http from "http";
import app from "./app.js";
import { initSocket } from "./sockets/socket.js";
import connectDB from "./config/db.js";
import logger from "./utils/logger.js";
import { env } from "./config/env.js";


const PORT = env.PORT || 5000;
const NODE_ENV = env.NODE_ENV || "development";

logger.info(`Starting server in ${NODE_ENV} mode...`);
const backendUrl = env.BACKEND_URL || `http://localhost:${PORT}`;
logger.info(`Backend URL: ${backendUrl}`);

// Create HTTP server
const server = http.createServer(app);

// Start server function
const startServer = async () => {
  try {
    // Connect database
    await connectDB();

    // Initialize Socket.io
    initSocket(server);

    // Start server
    // server.listen(PORT, () => {
    //   logger.info(`🚀 Server running on port ${PORT}`);
    //   logger.info(`📚 Swagger docs available at ${backendUrl}/api-docs`);
    // });

    server.listen(PORT, '0.0.0.0', () => {
  logger.info(`[SERVER] Server running on port ${PORT}`);
  
});
  } catch (error) {
    logger.error(error, "Server start failed");
    process.exit(1);
  }
};

// Start application
startServer();
