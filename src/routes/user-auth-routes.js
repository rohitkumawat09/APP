import express from "express";
import {
  checkToken,
  forgotPasswordOtp,
  googleLogin,
  register,
  userLogin,
  userLogout,
  userRefreshToken,
  userResetPassword,
  verifyEmail,
  verifyForgotPasswordOtp,
} from "../controllers/user-auth-controller.js";
import { validate } from "../middlewares/validate.js";
import {
  emailSchema,
  registerSchema,
  userLoginSchema,
  userResetPasswordSchema,
  verifyEmailSchema,
} from "../user-validation.js";
import { verifyUserAccessToken } from "../middlewares/user-auth.middleware.js";

const router = express.Router();
router.post("/google-login", googleLogin);
router.post("/register", validate(registerSchema), register);
router.post("/verify-email", validate(verifyEmailSchema), verifyEmail);

router.post("/login", validate(userLoginSchema), userLogin);
router.post("/forgot-password", validate(emailSchema), forgotPasswordOtp);
router.post(
  "/verify-forgot-password-otp",
  validate(verifyEmailSchema),
  verifyForgotPasswordOtp,
);
router.post(
  "/reset-password",
  validate(userResetPasswordSchema),
  userResetPassword,
);
router.get("/check-token", checkToken);
router.post("/refresh-token", userRefreshToken);
router.get("/logout", verifyUserAccessToken, userLogout);
export default router;
