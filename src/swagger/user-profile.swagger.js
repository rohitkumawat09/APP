export const userProfileSwagger = {
  "/api/users/profile/me": {
    get: {
      tags: ["User Profile"],
      summary: "Get logged-in user profile",
      description:
        "Fetches the profile details of the currently authenticated user. Requires a valid access token.",
      security: [{ userCookieAuth: [] }],
      responses: {
        200: {
          description: "Profile fetched successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "Profile fetched successfully",
                  },
                  data: {
                    type: "object",
                    properties: {
                      user: {
                        type: "object",
                        properties: {
                          _id: {
                            type: "string",
                            example: "65f3c9e9f2a5b3d123456789",
                          },
                          fullName: {
                            type: "string",
                            example: "Rahul Sharma",
                          },
                          email: {
                            type: "string",
                            example: "rahul@example.com",
                          },
                          role: {
                            type: "string",
                            example: "USER",
                          },
                        },
                      },
                      profile: {
                        type: "object",
                        properties: {
                          _id: {
                            type: "string",
                            example: "65f3c9e9f2a5b3d123456999",
                          },
                          userId: {
                            type: "string",
                            example: "65f3c9e9f2a5b3d123456789",
                          },
                          profile: {
                            type: "object",
                            properties: {
                              fullName: {
                                type: "string",
                                example: "Rahul Sharma",
                              },
                              avatar: {
                                type: "string",
                                example: "https://example.com/avatar.jpg",
                              },
                              bio: {
                                type: "string",
                                example: "Software Developer",
                              },
                              phone: {
                                type: "string",
                                example: "9876543210",
                              },
                            },
                          },
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
          description: "Authentication required or invalid access token",
        },

        404: {
          description: "User not found",
        },

        500: {
          description: "Internal server error",
        },
      },
    },
  },
  "/api/users/profile/update": {
    patch: {
      tags: ["User Profile"],
      summary: "Update logged-in user profile",
      description:
        "Updates the profile details of the currently authenticated user. Supports avatar upload using multipart/form-data.",
      security: [{ userCookieAuth: [] }],
      requestBody: {
        required: false,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                avatar: {
                  type: "string",
                  format: "binary",
                  description: "User profile avatar image",
                },
                fullName: {
                  type: "string",
                  example: "Rahul Sharma",
                },
                bio: {
                  type: "string",
                  example: "Software Developer",
                },
                phone: {
                  type: "string",
                  example: "9876543210",
                },
                address: {
                  type: "string",
                  example: "MG Road",
                },
                city: {
                  type: "string",
                  example: "Jaipur",
                },
                state: {
                  type: "string",
                  example: "Rajasthan",
                },
                gender: {
                  type: "string",
                  enum: ["MALE", "FEMALE", "OTHER"],
                  example: "MALE",
                },
                dateOfBirth: {
                  type: "string",
                  format: "date",
                  example: "1998-05-21",
                },
              },
            },
          },
        },
      },

      responses: {
        200: {
          description: "Profile updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "Profile updated successfully",
                  },
                  data: {
                    type: "object",
                    properties: {
                      email: {
                        type: "string",
                        example: "rahul@example.com",
                      },
                      fullName: {
                        type: "string",
                        example: "Rahul Sharma",
                      },
                      avatar: {
                        type: "string",
                        example:
                          "https://res.cloudinary.com/demo/image/upload/v123/user-profile/avatar.webp",
                      },
                      bio: {
                        type: "string",
                        example: "Software Developer",
                      },
                      phone: {
                        type: "string",
                        example: "9876543210",
                      },
                      city: {
                        type: "string",
                        example: "Jaipur",
                      },
                      state: {
                        type: "string",
                        example: "Rajasthan",
                      },
                      gender: {
                        type: "string",
                        example: "MALE",
                      },
                      dateOfBirth: {
                        type: "string",
                        example: "1998-05-21",
                      },
                    },
                  },
                },
              },
            },
          },
        },

        400: {
          description: "Validation error",
        },

        401: {
          description: "Authentication required or invalid access token",
        },

        404: {
          description: "Profile not found",
        },

        500: {
          description: "Internal server error",
        },
      },
    },
  },
  "/api/users/profile/avatar": {
    delete: {
      tags: ["User Profile"],
      summary: "Delete user profile avatar",
      description:
        "Allows the authenticated user to delete their profile picture (avatar). The image will also be removed from Cloudinary and the database.",
      security: [{ userCookieAuth: [] }],
      responses: {
        200: {
          description: "Profile picture deleted successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "Profile picture deleted successfully",
                  },
                  data: {
                    type: "null",
                    example: null,
                  },
                },
              },
            },
          },
        },

        400: {
          description: "No avatar to delete",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "No avatar to delete",
                  },
                },
              },
            },
          },
        },

        401: {
          description: "Authentication required or invalid access token",
        },

        404: {
          description: "Profile not found",
        },

        500: {
          description: "Internal server error",
        },
      },
    },
  },
};
