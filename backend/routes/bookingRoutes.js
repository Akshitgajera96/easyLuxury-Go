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
  exportBookings,
  getBookingStats,
  getRevenueTrends
} = require('../controllers/bookingController');

const {
  protect,
  requireRole,
  authorizeResourceOwner,
  validate
} = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * -------------------------
 * Validation middlewares
 * -------------------------
 */

// Create booking validation
const createBookingValidation = [
  body('userId').optional().isMongoId().withMessage('Valid userId required'),
  body('busId').isMongoId().withMessage('Valid busId required'),
  body('seatNumbers')
    .isArray({ min: 1 }).withMessage('At least one seat number is required')
    .custom(seats => {
      if (!seats.every(Number.isInteger)) throw new Error('All seat numbers must be integers');
      return true;
    }),
  body('price').isFloat({ min: 0 }).withMessage('Price must be valid'),
  body('date').isISO8601().withMessage('Valid date required'),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Time must be HH:MM'),
  validate
];

// Seat availability validation
const checkSeatAvailabilityValidation = [
  body('busId').isMongoId().withMessage('Valid busId required'),
  body('seats')
    .isArray({ min: 1 }).withMessage('Seats array required')
    .custom(seats => {
      if (!seats.every(Number.isInteger)) throw new Error('All seat numbers must be integers');
      return true;
    }),
  body('date').optional().isISO8601().withMessage('Valid date required'),
  validate
];

// Update booking validation
const updateBookingValidation = [
  body('seatNumbers').optional()
    .isArray({ min: 1 }).withMessage('seatNumbers must be an array')
    .custom(seats => {
      if (!seats.every(Number.isInteger)) throw new Error('All seat numbers must be integers');
      return true;
    }),
  body('status').optional().isIn(['confirmed', 'cancelled', 'refunded']).withMessage('Invalid status'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be valid'),
  validate
];

// Params validation
const bookingIdParamValidation = [
  param('bookingId').isMongoId().withMessage('Valid bookingId required'),
  validate
];
const userIdParamValidation = [
  param('userId').isMongoId().withMessage('Valid userId required'),
  validate
];
const busIdParamValidation = [
  param('busId').isMongoId().withMessage('Valid busId required'),
  validate
];

// Query validation
const queryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('status').optional().isIn(['confirmed','cancelled','refunded','completed']).withMessage('Invalid status'),
  query('startDate').optional().isISO8601().withMessage('Valid startDate required'),
  query('endDate').optional().isISO8601().withMessage('Valid endDate required'),
  validate
];

/**
 * -------------------------
 * Routes
 * -------------------------
 */

// Create new booking (user or admin)
router.post('/', protect, createBookingValidation, createBooking);

// Check seat availability (public)
router.post('/check-availability', checkSeatAvailabilityValidation, checkSeatAvailability);

// Bus seat availability by date (public)
router.get(
  '/bus/:busId/availability',
  busIdParamValidation,
  query('date').isISO8601().withMessage('Valid date required'),
  validate,
  checkSeatAvailability
);

// Get bookings for authenticated user or specific user (admin/resource owner)
router.get(
  '/user/:userId',
  protect,
  userIdParamValidation,
  authorizeResourceOwner(req => req.params.userId),
  queryValidation,
  getBookingsByUser
);

// Get bookings for authenticated user (no param)
router.get('/',protect, queryValidation, getBookingsByUser);

// Get booking by ID
router.get('/:bookingId', protect, bookingIdParamValidation, getBookingById);

// Update booking (admin only)
router.put(
  '/:bookingId',
  protect,
  requireRole('admin'),
  bookingIdParamValidation,
  updateBookingValidation,
  updateBooking
);

// Cancel booking (user owns booking or admin)
router.post(
  '/:bookingId/cancel',
  protect,
  bookingIdParamValidation,
  cancelBooking
);

// Admin-only routes
router.get('/all', protect, requireRole('admin'), queryValidation, getAllBookings);

// Analytics routes
router.get('/admin/stats', protect, requireRole('admin'), getBookingStats); // <-- આ નવો રાઉટ ઉમેરો
router.get('/analytics/revenue', protect, requireRole('admin'), getRevenueTrends); // <-- આ નવો રાઉટ ઉમેરો

// Existing analytics route
router.get('/analytics', protect, requireRole('admin'), getBookingAnalytics);

router.get('/export', protect, requireRole('admin'), exportBookings);

module.exports = router;
