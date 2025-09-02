const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user ? req.user.id : 'unauthenticated',
    timestamp: new Date().toISOString()
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = {
      message,
      statusCode: 404,
      details: `Invalid ${err.path}: ${err.value}`
    };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate field value: ${value}. Please use another value.`;
    error = {
      message,
      statusCode: 400,
      details: `Duplicate entry for field: ${field}`
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = 'Validation failed';
    const details = Object.values(err.errors).map(val => val.message);
    error = {
      message,
      statusCode: 400,
      details: details.length > 0 ? details : 'Invalid input data'
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = {
      message,
      statusCode: 401,
      details: 'Authentication token is invalid'
    };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = {
      message,
      statusCode: 401,
      details: 'Authentication token has expired. Please login again.'
    };
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = {
      message,
      statusCode: 400,
      details: `File size exceeds the limit of ${err.limit / 1024 / 1024}MB`
    };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = {
      message,
      statusCode: 400,
      details: `Unexpected field: ${err.field}`
    };
  }

  // Rate limit errors
  if (err.statusCode === 429) {
    error = {
      message: 'Too many requests',
      statusCode: 429,
      details: 'Please try again later.'
    };
  }

  // Default to 500 server error
  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Error response structure
  const errorResponse = {
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err.message,
      details: error.details
    }),
    ...(process.env.NODE_ENV !== 'production' && statusCode === 500 && {
      // In non-production environments, show more details for server errors
      stack: err.stack,
      details: error.details
    })
  };

  // Remove undefined fields
  Object.keys(errorResponse).forEach(key => {
    if (errorResponse[key] === undefined) {
      delete errorResponse[key];
    }
  });

  res.status(statusCode).json(errorResponse);
};

// ✅ Async error handler wrapper (eliminates try-catch blocks)
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ✅ Custom error class for consistent error handling
class AppError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// ✅ Common error types for consistent usage
const errorTypes = {
  NOT_FOUND: (message = 'Resource not found', details = null) => 
    new AppError(message, 404, details),
  
  BAD_REQUEST: (message = 'Bad request', details = null) => 
    new AppError(message, 400, details),
  
  UNAUTHORIZED: (message = 'Not authorized', details = null) => 
    new AppError(message, 401, details),
  
  FORBIDDEN: (message = 'Forbidden', details = null) => 
    new AppError(message, 403, details),
  
  CONFLICT: (message = 'Conflict', details = null) => 
    new AppError(message, 409, details),
  
  VALIDATION_ERROR: (message = 'Validation failed', details = null) => 
    new AppError(message, 422, details),
  
  SERVER_ERROR: (message = 'Internal server error', details = null) => 
    new AppError(message, 500, details)
};

// ✅ Validation error formatter
const formatValidationErrors = (validationErrors) => {
  return Object.values(validationErrors).map(error => ({
    field: error.path,
    message: error.message,
    value: error.value
  }));
};

module.exports = {
  errorHandler,
  asyncHandler,
  AppError,
  errorTypes,
  formatValidationErrors
};