// FILE: backend/routes/bookingRoutes.js
/**
 * Booking management routes
 * Defines endpoints for booking operations
 */

const express = require('express');
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

/**
 * @route   POST /api/v1/bookings
 * @desc    Create a new booking
 * @access  Private
 */
router.post('/', bookingController.createBooking);

/**
 * @route   GET /api/v1/bookings/mybookings
 * @desc    Get user's bookings
 * @access  Private
 */
router.get('/mybookings', bookingController.getMyBookings);

/**
 * @route   GET /api/v1/bookings/:id
 * @desc    Get booking by ID
 * @access  Private
 */
router.get('/:id', bookingController.getBookingById);

/**
 * @route   PUT /api/v1/bookings/:id/cancel
 * @desc    Cancel a booking
 * @access  Private
 */
router.put('/:id/cancel', bookingController.cancelBooking);

/**
 * @route   POST /api/v1/bookings/send-otp
 * @desc    Send OTP for booking confirmation
 * @access  Private
 */
router.post('/send-otp', bookingController.sendBookingConfirmationOTP);

/**
 * @route   POST /api/v1/bookings/verify-otp
 * @desc    Verify OTP for booking
 * @access  Private
 */
router.post('/verify-otp', bookingController.verifyBookingOTP);

module.exports = router;