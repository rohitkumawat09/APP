export const userSettingsSwagger = {
  "/api/users/settings/theme": {
    patch: {
      tags: ["User Settings"],
      summary: "Update theme",
      description: "Update user theme (light/dark mode)",
      security: [{ userCookieAuth: [] }],

      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                theme: {
                  type: "string",
                  enum: ["LIGHT", "DARK"],
                  example: "DARK",
                },
              },
              required: ["theme"],
            },
          },
        },
      },

      responses: {
        200: {
          description: "Theme updated successfully",
        },
        401: { description: "Unauthorized" },
        500: { description: "Server error" },
      },
    },
  },

  "/api/users/settings/online-status": {
    patch: {
      tags: ["User Settings"],
      summary: "Update online status visibility",
      description: "Toggle whether others can see your online status",
      security: [{ userCookieAuth: [] }],

      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                showOnlineStatus: {
                  type: "boolean",
                  example: true,
                },
              },
              required: ["showOnlineStatus"],
            },
          },
        },
      },

      responses: {
        200: {
          description: "Online status updated",
        },
        401: { description: "Unauthorized" },
        500: { description: "Server error" },
      },
    },
  },

  "/api/users/settings/change-password": {
    patch: {
      tags: ["User Settings"],
      summary: "Change password",
      description: "Change user password using old password verification",
      security: [{ userCookieAuth: [] }],

      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                oldPassword: {
                  type: "string",
                  example: "OldPassword@123",
                },
                newPassword: {
                  type: "string",
                  example: "NewPassword@123",
                },
              },
              required: ["oldPassword", "newPassword"],
            },
          },
        },
      },

      responses: {
        200: {
          description: "Password changed successfully",
        },
        400: {
          description: "Old password incorrect",
        },
        401: { description: "Unauthorized" },
        500: { description: "Server error" },
      },
    },
  },

  "/api/users/settings/logout-all": {
    post: {
      tags: ["User Settings"],
      summary: "Logout from all devices",
      description:
        "Logs out the user from all devices by invalidating all sessions using passwordChangedAt",
      security: [{ userCookieAuth: [] }],

      responses: {
        200: {
          description: "Logged out from all devices",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "Logged out from all devices",
                  },
                },
              },
            },
          },
        },
        401: { description: "Unauthorized" },
        500: { description: "Server error" },
      },
    },
  },

  "/api/users/settings/delete-account": {
    delete: {
      tags: ["User Settings"],
      summary: "Delete account",
      description: "Deletes user account after password verification",
      security: [{ userCookieAuth: [] }],

      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                password: {
                  type: "string",
                  example: "Password@123",
                },
              },
              required: ["password"],
            },
          },
        },
      },

      responses: {
        200: {
          description: "Account deleted successfully",
        },
        400: {
          description: "Password incorrect",
        },
        401: { description: "Unauthorized" },
        500: { description: "Server error" },
      },
    },
  },

  "/api/users/settings/sessions": {
    get: {
      tags: ["User Settings"],
      summary: "Get active sessions",
      description:
        "Fetch all active sessions (devices) of the logged-in user, including current session identification",
      security: [{ userCookieAuth: [] }],

      responses: {
        200: {
          description: "Active sessions fetched successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "Active sessions fetched successfully",
                  },
                  data: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        _id: {
                          type: "string",
                          example: "65f3c9e9f2a5b3d123456789",
                        },
                        ipAddress: {
                          type: "string",
                          example: "192.168.1.1",
                        },
                        browser: {
                          type: "string",
                          example: "Chrome",
                        },
                        os: {
                          type: "string",
                          example: "Windows",
                        },
                        device: {
                          type: "string",
                          example: "Desktop",
                        },
                        lastActivity: {
                          type: "string",
                          example: "2026-03-17T10:00:00Z",
                        },
                        createdAt: {
                          type: "string",
                          example: "2026-03-16T10:00:00Z",
                        },
                        isCurrent: {
                          type: "boolean",
                          example: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },

        401: {
          description: "Unauthorized",
        },

        500: {
          description: "Server error",
        },
      },
    },
  },

  "/api/users/settings/sessions/{sessionId}": {
    delete: {
      tags: ["User Settings"],
      summary: "Logout specific session (device)",
      description:
        "Logs out a specific active session (device) of the user. This will mark the session as inactive and trigger a real-time force logout event for that device.",

      security: [{ userCookieAuth: [] }],

      parameters: [
        {
          name: "sessionId",
          in: "path",
          required: true,
          description: "Session ID of the device to logout",
          schema: {
            type: "string",
            example: "65f3c9e9f2a5b3d123456789",
          },
        },
      ],

      responses: {
        200: {
          description: "Session logged out successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "Session logged out successfully",
                  },
                },
              },
            },
          },
        },

        400: {
          description: "Invalid session ID",
        },

        401: {
          description: "Authentication required or invalid token",
        },

        404: {
          description: "Session not found",
        },

        500: {
          description: "Internal server error",
        },
      },
    },
  },
};
