// FILE: backend/constants/messages.js
/**
 * Standardized response messages for the application
 * Centralizes all user-facing and system messages
 */

const MESSAGES = {
  // Auth messages
  AUTH: {
    REGISTER_SUCCESS: 'User registered successfully',
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
    INVALID_CREDENTIALS: 'Invalid email or password',
    UNAUTHORIZED: 'Unauthorized access',
    TOKEN_REQUIRED: 'Access token required',
    TOKEN_INVALID: 'Invalid token',
    TOKEN_EXPIRED: 'Token expired'
  },

  // User messages
  USER: {
    PROFILE_FETCHED: 'User profile fetched successfully',
    PROFILE_UPDATED: 'Profile updated successfully',
    USER_NOT_FOUND: 'User not found',
    EMAIL_EXISTS: 'Email already exists',
    INSUFFICIENT_BALANCE: 'Insufficient wallet balance'
  },

  // Trip messages
  TRIP: {
    TRIP_FOUND: 'Trip found successfully',
    TRIPS_FOUND: 'Trips found successfully',
    TRIP_NOT_FOUND: 'Trip not found',
    NO_TRIPS_FOUND: 'No trips found for the given criteria'
  },

  // Booking messages
  BOOKING: {
    BOOKING_CREATED: 'Booking created successfully',
    BOOKINGS_FETCHED: 'Bookings fetched successfully',
    BOOKING_CANCELLED: 'Booking cancelled successfully',
    SEATS_UNAVAILABLE: 'Selected seats are not available',
    INVALID_BOOKING: 'Invalid booking data'
  },

  // General messages
  GENERAL: {
    SERVER_ERROR: 'Internal server error',
    VALIDATION_ERROR: 'Validation failed',
    NOT_FOUND: 'Resource not found',
    FORBIDDEN: 'Access forbidden',
    SUCCESS: 'Operation completed successfully'
  }
};

module.exports = MESSAGES;