import express from "express";
import { verifyUserAccessToken } from "../middlewares/user-auth.middleware.js";

import { validate } from "../middlewares/validate.js";
import {
  updateThemeSchema,
  updateOnlineStatusSchema,
  changePasswordSchema,
} from "../user-validation.js";
import {
  changePassword,
  deleteAccount,
  getActiveSessions,
  logoutAllDevices,
  logoutSingleSession,
  updateOnlineStatus,
  updateTheme,
} from "../controllers/user-settings.controller.js";

const router = express.Router();

router.use(verifyUserAccessToken);

router.patch("/theme", validate(updateThemeSchema), updateTheme);

router.patch(
  "/online-status",
  validate(updateOnlineStatusSchema),
  updateOnlineStatus,
);

router.patch(
  "/change-password",
  validate(changePasswordSchema),
  changePassword,
);

router.post("/logout-all", logoutAllDevices);

router.delete("/delete-account", deleteAccount);

router.get("/sessions", getActiveSessions);

router.delete("/sessions/:sessionId", logoutSingleSession);

export default router;
