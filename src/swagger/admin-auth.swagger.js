export const adminAuthSwagger = {
  "/api/admin/auth/login": {
    post: {
      tags: ["Admin Auth"],
      summary: "Admin login",
      description: "Login admin user",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                email: {
                  type: "string",
                  example: "admin@gmail.com"
                },
                password: {
                  type: "string",
                  example: "123456"
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: "Admin login successful"
        },
        401: {
          description: "Invalid credentials"
        }
      }
    }
  }
};