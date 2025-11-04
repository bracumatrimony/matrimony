const {
  formatValidationError,
  getErrorStatusCode,
} = require("../utils/errorFormatter");


const errorHandler = (err, req, res, next) => {
  
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
    
    console.error("Error:", err.message);
  }

  const formattedError = formatValidationError(err);
  const statusCode = getErrorStatusCode(formattedError.type);

  
  if (process.env.NODE_ENV === "production") {
    res.status(statusCode).json({
      success: false,
      message: formattedError.message || "An error occurred",
    });
  } else {
    
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


const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};


const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
};
