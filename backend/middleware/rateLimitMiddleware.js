// FILE: backend/middleware/rateLimitMiddleware.js
/**
 * Rate limiting middleware for API endpoints
 * Protects against brute force and DDoS attacks
 */

const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// General API rate limiter
// Development: 10000 requests per 15 minutes (unlimited for testing)
// Production: 200 requests per 15 minutes (reasonable for normal usage)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 200 : 10000,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again after 15 minutes.'
    });
  },
});

// Strict limiter for authentication endpoints
// Development: 100 requests per 15 minutes (lenient for testing)
// Production: 10 requests per 15 minutes (strict for security)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' 
    ? (process.env.MAX_LOGIN_ATTEMPTS || 10) 
    : 100,
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests, not just failed ones
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}, path: ${req.path}`);
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again after 15 minutes.',
      retryAfter: 15 * 60 // seconds
    });
  },
});

// Moderate limiter for booking endpoints
// Development: 1000 requests per 15 minutes (very lenient for testing)
// Production: 50 requests per 15 minutes (reasonable for normal usage)
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 50 : 1000,
  message: {
    success: false,
    message: 'Too many booking requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Booking rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many booking attempts. Please slow down and try again in a few minutes.'
    });
  },
});

// Moderate limiter for payment endpoints
// Development: 500 requests per 15 minutes (lenient for testing)
// Production: 30 requests per 15 minutes (reasonable for payments)
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 30 : 500,
  message: {
    success: false,
    message: 'Too many payment requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Payment rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many payment attempts. Please contact support if you need assistance.'
    });
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  bookingLimiter,
  paymentLimiter
};
