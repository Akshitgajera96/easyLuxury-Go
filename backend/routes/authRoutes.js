// FILE: backend/routes/authRoutes.js
/**
 * Authentication routes
 * Defines endpoints for user registration and login
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { registerValidation, loginValidation } = require('../validations/authValidation');

const router = express.Router();

// Validation result handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registerValidation, handleValidationErrors, authController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', loginValidation, handleValidationErrors, authController.login);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', protect, authController.logout);

/**
 * @route   POST /api/v1/auth/admin/login
 * @desc    Admin login (environment-based)
 * @access  Public
 */
router.post('/admin/login', loginValidation, handleValidationErrors, authController.adminLogin);

/**
 * @route   POST /api/v1/auth/staff/register
 * @desc    Register new staff (pending admin approval)
 * @access  Public
 */
router.post('/staff/register', authController.staffRegister);

/**
 * @route   POST /api/v1/auth/staff/login
 * @desc    Staff login (only approved staff)
 * @access  Public
 */
router.post('/staff/login', loginValidation, handleValidationErrors, authController.staffLogin);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset OTP
 * @access  Public
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @route   POST /api/v1/auth/verify-reset-otp
 * @desc    Verify OTP for password reset
 * @access  Public
 */
router.post('/verify-reset-otp', authController.verifyResetOTP);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password after OTP verification
 * @access  Public
 */
router.post('/reset-password', authController.resetPassword);

module.exports = router;