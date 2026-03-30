import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number(),

  CORS_ORIGINS: z.string(),

  //   RATE_LIMIT_WINDOW_MS: z.coerce.number(),
  //   RATE_LIMIT_MAX: z.coerce.number(),
  //   MAX_ATTEMPTS: z.coerce.number(),

  //   REDIS_URL: z.string(),
  MONGO_URL: z.string(),

  USER_JWT_ACCESS_SECRET: z.string().min(1),
  USER_JWT_REFRESH_SECRET: z.string().min(1),
  JWT_USER_OTP_SECRET: z.string().min(1),
  ADMIN_JWT_ACCESS_SECRET: z.string().min(1),
  ADMIN_JWT_REFRESH_SECRET: z.string().min(1),

  BACKEND_URL: z.string(),
  FRONTEND_URL: z.string(),

  GOOGLE_WEB_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI: z.string(),

  RESEND_API_KEY: z.string(),
  EMAIL_FROM: z.string().email(),

  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

const envData = parsed.data;

// ✅ Log loaded env variables (without sensitive data)
console.log("[ENV] Environment Variables Loaded:");
console.log("  NODE_ENV:", envData.NODE_ENV);
console.log("  PORT:", envData.PORT);
console.log("  CORS_ORIGINS:", envData.CORS_ORIGINS);
console.log("  MONGO_URL: Connected");
console.log("  BACKEND_URL:", envData.BACKEND_URL);
console.log("  FRONTEND_URL:", envData.FRONTEND_URL);
console.log("  GOOGLE_WEB_CLIENT_ID: Loaded");
console.log("  RESEND_API_KEY: Loaded");
console.log("  EMAIL_FROM:", envData.EMAIL_FROM);
console.log("  CLOUDINARY_CLOUD_NAME:", envData.CLOUDINARY_CLOUD_NAME);
console.log("");

export const env = envData;
