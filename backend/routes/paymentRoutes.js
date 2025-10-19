// FILE: backend/routes/paymentRoutes.js
/**
 * Payment routes
 * Handles Razorpay payment operations
 */

const express = require('express');
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/v1/payment/create-order
 * @desc    Create Razorpay payment order
 * @access  Private
 */
router.post('/create-order', paymentController.createPaymentOrder);

/**
 * @route   POST /api/v1/payment/verify
 * @desc    Verify payment and confirm booking
 * @access  Private
 */
router.post('/verify', paymentController.verifyPayment);

/**
 * @route   POST /api/v1/payment/failure
 * @desc    Handle payment failure
 * @access  Private
 */
router.post('/failure', paymentController.handlePaymentFailure);

module.exports = router;
