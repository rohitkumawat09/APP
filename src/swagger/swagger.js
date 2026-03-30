import swaggerUi from "swagger-ui-express";

import { adminAuthSwagger } from "./admin-auth.swagger.js";
import { userAuthSwagger } from "./user-auth.swagger.js";
import { userProfileSwagger } from "./user-profile.swagger.js";
import { userSettingsSwagger } from "./user-setting.swagger.js";

export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Live Chat Notification API",
    version: "1.0.0",
    description: "API documentation for backend",
  },

  servers: [
    {
      url: process.env.BACKEND_URL || "http://localhost:3000",
      description: "Development server",
    },
  ],

  tags: [
    {
      name: "Admin Auth",
      description: "Admin authentication APIs",
    },
    {
      name: "User Auth",
      description: "User authentication APIs",
    },
    {
      name: "User Profile",
      description: "User profile APIs",
    },
  ],
  components: {
    securitySchemes: {
      adminCookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "adminAccessToken",
      },
      userCookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "userAccessToken",
      },
      userResetPasswordAuth: {
        type: "apiKey",
        in: "cookie",
        name: "userResetToken",
      },
    },
  },
  paths: {
    ...adminAuthSwagger,
    ...userAuthSwagger,
    ...userProfileSwagger,
    ...userSettingsSwagger,
  },
};

export const swaggerUiServe = swaggerUi.serve;
export const swaggerUiSetup = swaggerUi.setup(swaggerSpec, {
  explorer: true,
});
