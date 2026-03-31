import { z } from "zod";

const passwordRegex =
  /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/;

export const registerSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),

  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .transform((val) => val.toLowerCase()),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      passwordRegex,
      "Password must contain at least 1 uppercase letter, 1 number, and 1 special character",
    ),
});

export const verifyEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .transform((val) => val.toLowerCase()),

  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const userLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .transform((val) => val.toLowerCase()),

  password: z.string().min(1, "Password is required"),
});

export const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .transform((val) => val.toLowerCase()),
});

export const userResetPasswordSchema = z
  .object({
    userResetToken: z.string().optional(), // Mobile sends token in body
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        passwordRegex,
        "Password must contain at least 1 uppercase letter, 1 number, and 1 special character",
      ),
    confirmPassword: z
      .string()
      .min(8, "Confirm password must be at least 8 characters")
      .optional(), // Mobile doesn't send this (validated on frontend)
  })
  .refine(
    (data) => {
      // Only check if confirmPassword is provided (web form)
      if (data.confirmPassword) {
        return data.newPassword === data.confirmPassword;
      }
      return true; // Mobile skips this check (already validated on frontend)
    },
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );

const emptyToUndefined = (val) => (val === "" ? undefined : val);

export const updateUserProfileSchema = z.object({
  fullName: z.preprocess(
    emptyToUndefined,
    z.string().min(2).max(50).optional(),
  ),

  bio: z.preprocess(emptyToUndefined, z.string().max(200).optional()),

  phone: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(/^[0-9+\-\s()]{7,}$/, "Phone must be at least 7 characters")
      .optional(),
  ),

  address: z.preprocess(emptyToUndefined, z.string().max(200).optional()),

  city: z.preprocess(emptyToUndefined, z.string().max(50).optional()),

  state: z.preprocess(emptyToUndefined, z.string().max(50).optional()),

  gender: z.preprocess(
    emptyToUndefined,
    z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  ),

  dateOfBirth: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of Birth must be in YYYY-MM-DD format")
      .refine(
        (dateString) => {
          const date = new Date(dateString);
          const today = new Date();
          return !isNaN(date.getTime()) && date <= today && date.getFullYear() >= 1900;
        },
        "Date of Birth must be a valid past date (1900 onwards)",
      )
      .optional(),
  ),
});

export const updateThemeSchema = z.object({
  theme: z.enum(["LIGHT", "DARK"]),
});

export const updateOnlineStatusSchema = z.object({
  showOnlineStatus: z.boolean(),
});

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Old password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        passwordRegex,
        "Password must contain at least 1 uppercase letter, 1 number, and 1 special character",
      ),
    confirmPassword: z
      .string()
      .min(8, "Confirm password must be at least 8 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

