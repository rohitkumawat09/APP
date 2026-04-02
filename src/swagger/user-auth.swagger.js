/**
 * ✅ User Authentication Swagger Documentation
 * Updated with Security Best Practices:
 * - No OTP in API responses (only sent via email)
 * - No passwords in responses
 * - Sanitized user objects only
 * - Generic error messages (no internal details)
 * - Clear security warnings
 */

export const userAuthSwagger = {
  "/api/users/auth/google-login": {
    post: {
      tags: ["User Auth"],
      summary: "✅ Login with Google OAuth (Website)",
      description:
        "Authenticates user using Google OAuth for the website only. Backend exchanges a browser authorization code, sets HTTP-only cookies, and returns a sanitized user object. Native/mobile Google tokens are rejected. ✅ NO passwords or OTP exposed.",

      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["code"],
              properties: {
                code: {
                  type: "string",
                  example: "4/0AVMBsJj...authCode",
                  description: "Authorization code from Google OAuth",
                },
              },
            },
          },
        },
      },

      responses: {
        200: {
          description: "✅ Google login successful - Sanitized user returned",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Google login successful" },
                  user: {
                    $ref: "#/components/schemas/SafeUser",
                    description: "✅ Sensitive fields removed (password, OTP, etc)"
                  },
                },
              },
            },
          },
        },
        400: { description: "❌ Missing authorization code" },
        401: { description: "❌ Invalid or expired token" },
        403: { description: "❌ Website-only Google login or access denied" },
        500: { description: "❌ Authentication failed" },
      },
      security: [],
    },
  },

  "/api/users/auth/register": {
    post: {
      tags: ["User Auth"],
      summary: "✅ Register new user",
      description:
        "Creates new user account. Generates OTP and sends via email. ✅ OTP is NOT returned in response for security. User must verify email before login.",

      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["fullName", "email", "password"],
              properties: {
                fullName: { type: "string", example: "John Doe" },
                email: { type: "string", format: "email", example: "john@example.com" },
                password: {
                  type: "string",
                  format: "password",
                  example: "SecurePass@123",
                  minLength: 8,
                  description: "✅ Hashed before storage, never exposed",
                },
              },
            },
          },
        },
      },

      responses: {
        201: {
          description: "✅ User registered - OTP sent to email (NOT in response)",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "User registered successfully. OTP sent to email for verification." },
                },
              },
            },
          },
        },
        200: {
          description: "✅ User exists unverified - OTP re-sent",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "OTP sent to your email. Please check and verify." },
                },
              },
            },
          },
        },
        409: { description: "❌ Email already registered" },
        429: { description: "❌ Too many requests (60s cooldown)" },
        503: { description: "❌ Email service unavailable" },
      },
      security: [],
    },
  },

  "/api/users/auth/verify-email": {
    post: {
      tags: ["User Auth"],
      summary: "✅ Verify email with OTP",
      description:
        "Verifies user email using OTP from email. Once verified, user can login.",

      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "otp"],
              properties: {
                email: { type: "string", format: "email", example: "john@example.com" },
                otp: { type: "string", example: "123456", minLength: 6 },
              },
            },
          },
        },
      },

      responses: {
        200: {
          description: "✅ Email verified successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "Email verified successfully" },
                },
              },
            },
          },
        },
        400: { description: "❌ Invalid request" },
        401: { description: "❌ Invalid or expired OTP" },
        404: { description: "❌ User not found" },
      },
      security: [],
    },
  },

  "/api/users/auth/login": {
    post: {
      tags: ["User Auth"],
      summary: "✅ Login with email & password",
      description:
        "Authenticates user with email/password. ✅ Returns sanitized user object only. NO passwords or sensitive data exposed.",

      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "password"],
              properties: {
                email: { type: "string", format: "email", example: "john@example.com" },
                password: { type: "string", format: "password", example: "SecurePass@123" },
              },
            },
          },
        },
      },

      responses: {
        200: {
          description: "✅ Login successful - Sanitized user returned",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Login successful" },
                  user: {
                    $ref: "#/components/schemas/SafeUser",
                    description: "✅ Sensitive fields removed"
                  },
                  accessToken: { type: "string", description: "✅ Mobile only" },
                  refreshToken: { type: "string", description: "✅ Mobile only" },
                },
              },
            },
          },
        },
        400: { description: "❌ Invalid request" },
        401: { description: "❌ Authentication failed" },
        403: { description: "❌ Account not active" },
        500: { description: "❌ Authentication failed" },
      },
      security: [],
    },
  },

  "/api/users/auth/forgot-password": {
    post: {
      tags: ["User Auth"],
      summary: "✅ Request password reset",
      description:
        "Sends password reset OTP to email. ✅ OTP is NOT returned in response. User receives OTP in email only.",

      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email"],
              properties: {
                email: { type: "string", format: "email", example: "john@example.com" },
              },
            },
          },
        },
      },

      responses: {
        200: {
          description: "✅ Password reset OTP sent to email (NOT in response)",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "Password reset OTP sent to john@example.com. Please check your email." },
                },
              },
            },
          },
        },
        404: { description: "❌ User not found" },
        429: { description: "❌ Too many requests" },
      },
      security: [],
    },
  },

  "/api/users/auth/verify-forgot-password-otp": {
    post: {
      tags: ["User Auth"],
      summary: "✅ Verify password reset OTP",
      description:
        "Verifies password reset OTP. Returns reset token in secure cookie for next step.",

      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "otp"],
              properties: {
                email: { type: "string", format: "email", example: "john@example.com" },
                otp: { type: "string", example: "123456" },
              },
            },
          },
        },
      },

      responses: {
        200: {
          description: "✅ OTP verified - Reset token issued (in secure cookie)",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "OTP verified successfully" },
                },
              },
            },
          },
        },
        400: { description: "❌ Invalid request" },
        401: { description: "❌ Invalid or expired OTP" },
        404: { description: "❌ User not found" },
      },
      security: [],
    },
  },

  "/api/users/auth/reset-password": {
    post: {
      tags: ["User Auth"],
      summary: "✅ Reset password with OTP",
      description:
        "Sets new password after OTP verification. ✅ Old password not required. Uses reset token from OTP verification.",

      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["newPassword"],
              properties: {
                newPassword: {
                  type: "string",
                  format: "password",
                  example: "NewSecurePass@456",
                  minLength: 8,
                },
              },
            },
          },
        },
      },

      responses: {
        200: {
          description: "✅ Password reset successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "Password reset successfully" },
                },
              },
            },
          },
        },
        400: { description: "❌ Invalid request" },
        401: { description: "❌ Reset token missing or expired" },
        404: { description: "❌ User not found" },
      },
      security: [{ userResetPasswordAuth: [] }],
    },
  },

  "/api/users/auth/check-token": {
    get: {
      tags: ["User Auth"],
      summary: "✅ Validate authentication token",
      description:
        "Checks if user's access token is valid. Returns basic sanitized user info. Used to verify auth on app startup.",

      responses: {
        200: {
          description: "✅ Token valid",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  user: {
                    $ref: "#/components/schemas/SafeUser",
                    description: "✅ Sanitized user object"
                  },
                },
              },
            },
          },
        },
        401: { description: "❌ Unauthorized - Token invalid/expired" },
      },
      security: [{ userCookieAuth: [] }],
    },
  },

  "/api/users/auth/refresh-token": {
    post: {
      tags: ["User Auth"],
      summary: "✅ Refresh access token",
      description:
        "Generates new access token using refresh token. Refresh token can be in cookie (web) or Bearer header (mobile).",

      responses: {
        200: {
          description: "✅ New tokens issued",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "Token refreshed successfully" },
                  accessToken: { type: "string" },
                  refreshToken: { type: "string" },
                },
              },
            },
          },
        },
        401: { description: "❌ Refresh token missing or invalid" },
      },
      security: [{ userCookieAuth: [] }],
    },
  },

  "/api/users/auth/logout": {
    post: {
      tags: ["User Auth"],
      summary: "✅ Logout user",
      description:
        "Invalidates user session and clears authentication cookies. User must login again.",

      responses: {
        200: {
          description: "✅ Logged out successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "Logged out successfully" },
                },
              },
            },
          },
        },
        401: { description: "❌ Unauthorized" },
      },
      security: [{ userCookieAuth: [] }],
    },
  },
};

/**
 * Shared Security Components & Schemas
 */
export const userAuthComponents = {
  schemas: {
    SafeUser: {
      type: "object",
      description: "✅ User object with ALL sensitive fields removed (password, OTP, provider IDs, etc)",
      properties: {
        _id: {
          type: "string",
          description: "User ID",
          example: "65f3c9e9f2a5b3d123456789",
        },
        email: {
          type: "string",
          format: "email",
          example: "john@example.com",
        },
        fullName: {
          type: "string",
          example: "John Doe",
        },
        role: {
          type: "string",
          enum: ["USER"],
          example: "USER",
        },
        status: {
          type: "string",
          enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
          example: "ACTIVE",
        },
        isEmailVerified: {
          type: "boolean",
          example: true,
        },
        authProvider: {
          type: "array",
          items: { type: "string", enum: ["LOCAL", "GOOGLE", "APPLE"] },
          example: ["LOCAL", "GOOGLE"],
        },
        lastLoginAt: {
          type: "string",
          format: "date-time",
          example: "2026-03-29T11:00:15.150Z",
        },
        createdAt: {
          type: "string",
          format: "date-time",
          example: "2026-01-15T10:30:00.000Z",
        },
      },
      required: ["_id", "email", "fullName", "role", "status", "isEmailVerified"],
      not: {
        required: ["password", "otpHash", "providerId", "__v"],
      },
    },

    ErrorResponse: {
      type: "object",
      description: "✅ Standard error response (NO sensitive data leaked)",
      properties: {
        success: { type: "boolean", example: false },
        message: { 
          type: "string",
          description: "User-friendly message (never exposes internal details)",
          example: "Authentication failed"
        },
      },
      required: ["success", "message"],
    },
  },

  securitySchemes: {
    userCookieAuth: {
      type: "apiKey",
      in: "cookie",
      name: "userAccessToken",
      description: "✅ HTTP-only secure cookie (Web authentication)",
    },
    userRefreshAuth: {
      type: "apiKey",
      in: "cookie",
      name: "userRefreshToken",
      description: "✅ HTTP-only secure cookie (Refresh token)",
    },
    userResetPasswordAuth: {
      type: "apiKey",
      in: "cookie",
      name: "userResetToken",
      description: "✅ HTTP-only secure cookie (Password reset session)",
    },
    userBearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description: "✅ Bearer token in Authorization header (Mobile authentication)",
    },
  },
};
