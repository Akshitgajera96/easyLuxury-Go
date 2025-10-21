// FILE: backend/middleware/errorMiddleware.js
/**
 * Global error handling middleware for Express
 * Catches all errors and returns consistent JSON error responses
 */

const errorMiddleware = (err, req, res, next) => {
  // Start with default 500 status code
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server Error';

  // Log error for debugging with full stack trace
  console.error('❌ Error caught by middleware:', {
    message: err.message,
    name: err.name,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    code: err.code,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  res.status(statusCode).json({
    success: false,
    message,
    error: err.name,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err
    })
  });
};

module.exports = errorMiddleware;