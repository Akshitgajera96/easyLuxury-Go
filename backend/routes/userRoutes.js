// FILE: backend/routes/userRoutes.js
/**
 * User profile and wallet routes
 * Defines endpoints for user profile management and wallet operations
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { updateProfileValidation } = require('../validations/authValidation');

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

// All routes are protected
router.use(protect);

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authController.getProfile);

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', updateProfileValidation, handleValidationErrors, authController.updateProfile);

/**
 * @route   POST /api/v1/users/wallet/add
 * @desc    Add funds to user wallet
 * @access  Private
 */
router.post('/wallet/add', 
  [
    body('amount')
      .isFloat({ min: 1 })
      .withMessage('Amount must be a positive number')
  ],
  handleValidationErrors,
  userController.addToWallet
);

/**
 * @route   GET /api/v1/users/wallet/balance
 * @desc    Get user wallet balance
 * @access  Private
 */
router.get('/wallet/balance', userController.getWalletBalance);

/**
 * @route   GET /api/v1/users/passengers
 * @desc    Get user's saved passengers
 * @access  Private
 */
router.get('/passengers', userController.getSavedPassengers);

/**
 * @route   POST /api/v1/users/passengers
 * @desc    Add a saved passenger
 * @access  Private
 */
router.post('/passengers',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Passenger name is required'),
    body('age')
      .isInt({ min: 1, max: 120 })
      .withMessage('Age must be between 1 and 120'),
    body('gender')
      .isIn(['male', 'female', 'other'])
      .withMessage('Gender must be male, female, or other')
  ],
  handleValidationErrors,
  userController.addSavedPassenger
);

/**
 * @route   PUT /api/v1/users/passengers/:id
 * @desc    Update a saved passenger
 * @access  Private
 */
router.put('/passengers/:id',
  [
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Passenger name cannot be empty'),
    body('age')
      .optional()
      .isInt({ min: 1, max: 120 })
      .withMessage('Age must be between 1 and 120'),
    body('gender')
      .optional()
      .isIn(['male', 'female', 'other'])
      .withMessage('Gender must be male, female, or other')
  ],
  handleValidationErrors,
  userController.updateSavedPassenger
);

/**
 * @route   DELETE /api/v1/users/passengers/:id
 * @desc    Delete a saved passenger
 * @access  Private
 */
router.delete('/passengers/:id', userController.deleteSavedPassenger);

module.exports = router;