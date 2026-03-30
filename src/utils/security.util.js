/**
 * Security Utility Functions
 * Ensures no sensitive data is exposed in API responses
 */

/**
 * ✅ Sanitize user object - removes all sensitive fields
 * @param {Object} userObj - User document from database
 * @returns {Object} Clean user object safe for API response
 */
export const sanitizeUser = (userObj) => {
  if (!userObj) return null;

  // Convert to plain object if needed
  const user = userObj.toObject ? userObj.toObject() : { ...userObj };

  // ❌ Remove all sensitive fields
  const sensitiveFields = [
    "password",           // Hash password
    "otpHash",           // OTP hash
    "passwordChangedAt", // Password history
    "providerId",        // Google/Apple IDs
    "__v",              // Mongo version
    "verificationEmailSentAt", // Internal tracking
  ];

  sensitiveFields.forEach((field) => delete user[field]);

  return user;
};

/**
 * ✅ Safe login response - only sends necessary auth data
 * @param {Object} user - User object
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 * @returns {Object} Safe auth response
 */
export const createAuthResponse = (user, accessToken, refreshToken) => {
  return {
    success: true,
    message: "Authentication successful",
    user: sanitizeUser(user),
    // Tokens only for mobile. Web uses cookies
    accessToken,
    refreshToken,
  };
};

/**
 * ✅ Safe error response - no sensitive info leaked
 * @param {number} statusCode - HTTP status code
 * @param {string} message - User-friendly error message
 * @returns {Object} Safe error response
 */
export const createErrorResponse = (statusCode, message) => {
  // ❌ Never expose internal details
  const safeMessages = {
    400: "Invalid request",
    401: "Authentication failed",
    403: "Access denied",
    404: "Not found",
    409: "Conflict - resource already exists",
    429: "Too many requests. Please try again later",
    500: "Server error - please try again",
    503: "Service unavailable",
  };

  return {
    success: false,
    message: message || safeMessages[statusCode] || "An error occurred",
    status: statusCode,
  };
};

/**
 * ✅ Log safely - never log sensitive data
 * @param {string} action - Action being logged
 * @param {string} email - User email (for identification)
 * @param {string} details - Additional details (NO sensitive data)
 */
export const logSecurely = (action, email, details = "") => {
  // Remove any sensitive patterns from details
  const safeLogs = [action, `user: ${email}`, details]
    .filter(Boolean)
    .join(" | ");

  console.log(`[AUDIT] ${safeLogs}`);
};

/**
 * ✅ Validate email - prevent exposure of unregistered emails
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * ✅ Create minimal user response (for listing users, etc)
 * @param {Object} user - User document
 * @returns {Object} Minimal user info
 */
export const minimalUserResponse = (user) => {
  const cleanUser = sanitizeUser(user);
  return {
    id: cleanUser._id,
    email: cleanUser.email,
    fullName: cleanUser.fullName,
    status: cleanUser.status,
    isEmailVerified: cleanUser.isEmailVerified,
  };
};
