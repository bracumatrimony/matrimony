const {
  formatValidationError,
  getErrorStatusCode,
} = require("../utils/errorFormatter");

/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Log full error details server-side only
  if (process.env.NODE_ENV !== "production") {
    console.error("Error:", {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
  } else {
    // Production: log minimal error info
    console.error("Error:", err.message);
  }

  const formattedError = formatValidationError(err);
  const statusCode = getErrorStatusCode(formattedError.type);

  // Production: send minimal error info to client
  if (process.env.NODE_ENV === "production") {
    res.status(statusCode).json({
      success: false,
      message: formattedError.message || "An error occurred",
    });
  } else {
    // Development: send detailed error info
    res.status(statusCode).json({
      success: false,
      message: formattedError.message,
      ...(formattedError.errors && { errors: formattedError.errors }),
      ...(formattedError.details && { details: formattedError.details }),
      ...(formattedError.field && { field: formattedError.field }),
      stack: err.stack,
    });
  }
};

/**
 * Handle 404 errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};

/**
 * Async error wrapper - wraps async route handlers to catch errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
};
