// 📁 constants/index.js

module.exports = {
  USER_ROLES: {
    ADMIN: 'admin',
    CAPTAIN: 'captain',
    USER: 'user',
  },

  BOOKING_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed',
  },

  TRANSACTION_TYPES: {
    CREDIT: 'credit',
    DEBIT: 'debit',
  },

  TRANSACTION_STATUS: {
    COMPLETED: 'completed',
    FAILED: 'failed',
  },

  TICKET_STATUS: {
    ACTIVE: 'active',
    CANCELLED: 'cancelled',
  },

  DEFAULT_MESSAGES: {
    UNAUTHORIZED: 'Unauthorized access.',
    NOT_FOUND: 'Resource not found.',
    SERVER_ERROR: 'Something went wrong on the server.',
    INVALID_INPUT: 'Invalid input data.',
  },
};
