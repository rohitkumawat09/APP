import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";

//user routes
import userRoutes from "./routes/user-auth-routes.js";
import userProfileRoutes from "./routes/user-profile-routes.js";
import userSettingsRoutes from "./routes/user-settings.routes.js";

//admin routes
import adminRoutes from "./routes/admin.routes.js";

//middlewares
import { errorHandler } from "./middlewares/error.middleware.js";
import { swaggerUiServe, swaggerUiSetup } from "./swagger/swagger.js";

//config
import { env } from "./config/env.js";

dotenv.config();

const app = express();

app.use(helmet()); // 🔒 security headers

// Parse CORS origins as array for multiple origins
const corsOrigins = env.CORS_ORIGINS.split(",").map((origin) =>
  origin.trim()
);

console.log("[CORS] Configuration:");
console.log("  Raw CORS_ORIGINS:", env.CORS_ORIGINS);
console.log("  Parsed Origins:", corsOrigins);

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
);

app.use(compression());
app.use(express.json());

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[REQUEST] [${req.method}] ${req.path}`);
  console.log(`   Origin: ${req.get('origin')}`);
  console.log(`   Body:`, req.body);
  next();
});

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

// Swagger docs
app.use("/api-docs", swaggerUiServe, swaggerUiSetup);

// =======================
// ROUTES
// =======================

app.use("/api/users/auth", userRoutes);
app.use("/api/users/profile", userProfileRoutes);
app.use("/api/users/settings", userSettingsRoutes);
app.use("/api/admin", adminRoutes);

// =======================
// HEALTH CHECK
// =======================

app.get("/", (req, res) => {
  res.json({
    message: "Live Chat Notification Backend Running 🚀",
  });
});

// =======================
// 404
// =======================

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});
// GLOBAL ERROR HANDLER
app.use(errorHandler);

export default app;
