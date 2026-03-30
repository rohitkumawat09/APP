import express from "express";
import { verifyUserAccessToken } from "../middlewares/user-auth.middleware.js";
import {
  deleteUserAvatar,
  getUserProfile,
  updateUserProfile,
} from "../controllers/user-profile-controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { validate } from "../middlewares/validate.js";
import { updateUserProfileSchema } from "../user-validation.js";

const router = express.Router();

router.use(verifyUserAccessToken);

router.get("/me", getUserProfile);

router.patch(
  "/update",
  upload.single("avatar"),
  validate(updateUserProfileSchema),
  updateUserProfile,
);

router.delete("/avatar", deleteUserAvatar);

export default router;
