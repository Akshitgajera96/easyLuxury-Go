const express = require('express');
const { body, param, query } = require('express-validator');
const {
  createBooking,
  getBookingsByUser,
  getBookingById,
  cancelBooking,
  getAllBookings,
  checkSeatAvailability,
  updateBooking,
  getBookingAnalytics,
  exportBookings
} = require('../controllers/bookingController');
const { protect, admin, authorizeResourceOwner } = require('../middlewares/authMiddleware');

const router = express.Router();

// Validation rules
const createBookingValidation = [
  body('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
  
  body('busId')
    .isMongoId()
    .withMessage('Valid bus ID is required'),
  
  body('seatNumbers')
    .isArray({ min: 1 })
    .withMessage('At least one seat number is required')
    .custom((seats) => {
      if (!seats.every(seat => Number.isInteger(seat) && seat > 0)) {
        throw new Error('All seat numbers must be positive integers');
      }
      return true;
    }),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Valid price is required'),
  
  body('date')
    .isISO8601()
    .withMessage('Valid date is required'),
  
  body('time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid time format (HH:MM) is required')
];

const checkSeatAvailabilityValidation = [
  body('busId')
    .isMongoId()
    .withMessage('Valid bus ID is required'),
  
  body('seats')
    .isArray({ min: 1 })
    .withMessage('At least one seat number is required')
    .custom((seats) => {
      if (!seats.every(seat => Number.isInteger(seat) && seat > 0)) {
        throw new Error('All seat numbers must be positive integers');
      }
      return true;
    }),
  
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Valid date is required')
];

const updateBookingValidation = [
  body('seatNumbers')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one seat number is required')
    .custom((seats) => {
      if (!seats.every(seat => Number.isInteger(seat) && seat > 0)) {
        throw new Error('All seat numbers must be positive integers');
      }
      return true;
    }),
  
  body('status')
    .optional()
    .isIn(['confirmed', 'cancelled', 'refunded'])
    .withMessage('Invalid status'),
  
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Valid price is required')
];

const userIdParamValidation = [
  param('userId')
    .isMongoId()
    .withMessage('Valid user ID is required')
];

const bookingIdParamValidation = [
  param('bookingId')
    .isMongoId()
    .withMessage('Valid booking ID is required')
];

const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('status')
    .optional()
    .isIn(['confirmed', 'cancelled', 'refunded', 'completed'])
    .withMessage('Invalid status filter'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Valid start date is required'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Valid end date is required')
];

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private (User)
router.post('/', protect, createBookingValidation, createBooking);

// @route   GET /api/bookings
// @desc    Get user's bookings with filtering and pagination
// @access  Private (User)
router.get('/', protect, queryValidation, getBookingsByUser);

// @route   GET /api/bookings/all
// @desc    Get all bookings (admin access) with filtering
// @access  Private (Admin)
router.get('/all', protect, admin, queryValidation, getAllBookings);

// @route   GET /api/bookings/analytics
// @desc    Get booking analytics (admin access)
// @access  Private (Admin)
router.get('/analytics', protect, admin, getBookingAnalytics);

// @route   GET /api/bookings/export
// @desc    Export bookings data (admin access)
// @access  Private (Admin)
router.get('/export', protect, admin, exportBookings);

// @route   GET /api/bookings/user/:userId
// @desc    Get bookings for a specific user (admin or same user)
// @access  Private (Admin or User)
router.get('/user/:userId', protect, userIdParamValidation, authorizeResourceOwner('params'), queryValidation, getBookingsByUser);

// @route   GET /api/bookings/:bookingId
// @desc    Get booking by ID
// @access  Private (User - own booking, Admin - any booking)
router.get('/:bookingId', protect, bookingIdParamValidation, getBookingById);

// @route   PUT /api/bookings/:bookingId
// @desc    Update a booking (admin only)
// @access  Private (Admin)
router.put('/:bookingId', protect, admin, bookingIdParamValidation, updateBookingValidation, updateBooking);

// @route   POST /api/bookings/:bookingId/cancel
// @desc    Cancel a booking
// @access  Private (User - own booking, Admin - any booking)
router.post('/:bookingId/cancel', protect, bookingIdParamValidation, cancelBooking);

// @route   POST /api/bookings/check-availability
// @desc    Check seat availability
// @access  Public
router.post('/check-availability', checkSeatAvailabilityValidation, checkSeatAvailability);

// @route   GET /api/bookings/bus/:busId/availability
// @desc    Get all available seats for a bus on a specific date
// @access  Public
router.get('/bus/:busId/availability', [
  param('busId')
    .isMongoId()
    .withMessage('Valid bus ID is required'),
  
  query('date')
    .isISO8601()
    .withMessage('Valid date is required')
], checkSeatAvailability);

module.exports = router;