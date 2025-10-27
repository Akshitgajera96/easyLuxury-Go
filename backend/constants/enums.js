// FILE: backend/constants/enums.js
/**
 * Application enums and constants
 * Defines various status types and static values used throughout the system
 */

const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
};

const PAYMENT_METHODS = {
  WALLET: 'wallet',
  CARD: 'card',
  UPI: 'upi',
  NETBANKING: 'netbanking'
};

const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

const TRIP_STATUS = {
  SCHEDULED: 'scheduled',
  BOARDING: 'boarding',
  DEPARTED: 'departed',
  ARRIVED: 'arrived',
  CANCELLED: 'cancelled',
  DELAYED: 'delayed',
  EXPIRED: 'expired'
};

const SEAT_TYPES = {
  SLEEPER: 'sleeper',
  SEMI_SLEEPER: 'semi-sleeper',
  SEATER: 'seater',
  LUXURY: 'luxury'
};

const SEAT_STATUS = {
  AVAILABLE: 'available',
  BOOKED: 'booked',
  SELECTED: 'selected',
  BLOCKED: 'blocked'
};

const AMENITIES = {
  AC: 'ac',
  WIFI: 'wifi',
  CHARGING_POINT: 'charging_point',
  BLANKET: 'blanket',
  WATER_BOTTLE: 'water_bottle',
  SNACKS: 'snacks',
  ENTERTAINMENT: 'entertainment'
};

const NOTIFICATION_TYPES = {
  BOOKING_CONFIRMED: 'booking_confirmed',
  BOOKING_CANCELLED: 'booking_cancelled',
  TRIP_REMINDER: 'trip_reminder',
  TRIP_DELAYED: 'trip_delayed',
  WALLET_TRANSACTION: 'wallet_transaction'
};

module.exports = {
  BOOKING_STATUS,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  TRIP_STATUS,
  SEAT_TYPES,
  SEAT_STATUS,
  AMENITIES,
  NOTIFICATION_TYPES
};