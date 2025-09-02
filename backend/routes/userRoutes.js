const express = require("express");
const { body, param, query } = require("express-validator");
const {
  getUserProfile,
  updateUserProfile,
  updateWallet,
  getWalletTransactions,
  getUserDetails,
  getAllUsers,
  deleteUser,
  changePassword,
  updatePreferences,
  getUserStats
} = require("../controllers/userController");
const { protect, admin, authorizeResourceOwner } = require("../middlewares/authMiddleware");

const router = express.Router();

// Validation rules
const updateWalletValidation = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Valid amount is required'),
  
  body('type')
    .isIn(['deposit', 'withdrawal', 'refund', 'payment'])
    .withMessage('Invalid transaction type'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
];

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number with country code'),
  
  body('profile.dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  
  body('profile.gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Invalid gender value'),
  
  body('address.street')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Street address cannot exceed 200 characters'),
  
  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City cannot exceed 100 characters'),
  
  body('address.zipCode')
    .optional()
    .matches(/^\d{5,10}(?:[-\s]\d{4})?$/)
    .withMessage('Please provide a valid zip code')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    })
];

const updatePreferencesValidation = [
  body('preferences.notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Email notification preference must be a boolean'),
  
  body('preferences.notifications.sms')
    .optional()
    .isBoolean()
    .withMessage('SMS notification preference must be a boolean'),
  
  body('preferences.language')
    .optional()
    .isIn(['en', 'es', 'fr', 'de', 'hi'])
    .withMessage('Invalid language preference'),
  
  body('preferences.currency')
    .optional()
    .isLength({ max: 3 })
    .withMessage('Currency code cannot exceed 3 characters'),
  
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage('Invalid theme preference')
];

const userIdParamValidation = [
  param('userId')
    .isMongoId()
    .withMessage('Valid user ID is required')
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
  
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query cannot exceed 100 characters'),
  
  query('role')
    .optional()
    .isIn(['user', 'admin', 'captain'])
    .withMessage('Invalid role filter'),
  
  query('status')
    .optional()
    .isIn(['active', 'suspended', 'deactivated', 'pending'])
    .withMessage('Invalid status filter')
];

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get("/profile", protect, getUserProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put("/profile", protect, updateProfileValidation, updateUserProfile);

// @route   PUT /api/users/password
// @desc    Change user password
// @access  Private
router.put("/password", protect, changePasswordValidation, changePassword);

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put("/preferences", protect, updatePreferencesValidation, updatePreferences);

// @route   PUT /api/users/wallet
// @desc    Update wallet balance
// @access  Private
router.put("/wallet", protect, updateWalletValidation, updateWallet);

// @route   GET /api/users/wallet/transactions
// @desc    Get wallet transactions
// @access  Private
router.get("/wallet/transactions", protect, queryValidation, getWalletTransactions);

// @route   GET /api/users/:userId
// @desc    Get user details by ID
// @access  Private (Admin or same user)
router.get("/:userId", protect, userIdParamValidation, authorizeResourceOwner('params'), getUserDetails);

// @route   GET /api/users
// @desc    Get all users with filtering (admin only)
// @access  Private (Admin)
router.get("/", protect, admin, queryValidation, getAllUsers);

// @route   GET /api/users/admin/stats
// @desc    Get user statistics (admin only)
// @access  Private (Admin)
router.get("/admin/stats", protect, admin, getUserStats);

// @route   DELETE /api/users/:userId
// @desc    Delete user account (admin or same user)
// @access  Private (Admin or same user)
router.delete("/:userId", protect, userIdParamValidation, authorizeResourceOwner('params'), deleteUser);

module.exports = router;