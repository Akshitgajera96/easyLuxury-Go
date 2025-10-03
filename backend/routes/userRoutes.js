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

const {
  protect,
  requireRole,
  authorizeResourceOwner,
  validate
} = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * -------------------------
 * Validation middlewares
 * -------------------------
 */

// ✅ Update wallet validation
const updateWalletValidation = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount is required'),
  body('type')
    .isIn(['deposit','withdrawal','refund','payment'])
    .withMessage('Invalid transaction type'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  validate
];

// ✅ Update profile validation
const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 chars'),
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Valid phone with country code required'),

  body('address.street')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Street max 200 chars'),
  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City max 100 chars'),
  body('address.zipCode')
    .optional()
    .matches(/^\d{5,10}(?:[-\s]\d{4})?$/)
    .withMessage('Valid zip code required'),
  validate
];

// ✅ Change password validation
const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).*$/)
    .withMessage('New password must have uppercase, lowercase, number, and special character'),
  body('confirmPassword').custom((val, { req }) => {
    if (val !== req.body.newPassword) {
      throw new Error('Password confirmation does not match');
    }
    return true;
  }),
  validate
];

// ✅ Update preferences validation
const updatePreferencesValidation = [
  body('preferences.notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Email preference must be boolean'),
  body('preferences.notifications.sms')
    .optional()
    .isBoolean()
    .withMessage('SMS preference must be boolean'),
  body('preferences.language')
    .optional()
    .isIn(['en','es','fr','de','hi'])
    .withMessage('Invalid language'),
  body('preferences.currency')
    .optional()
    .isLength({ max: 3 })
    .withMessage('Currency max 3 chars'),
  body('preferences.theme')
    .optional()
    .isIn(['light','dark','auto'])
    .withMessage('Invalid theme'),
  validate
];

// ✅ Params validation
const userIdParamValidation = [
  param('userId').isMongoId().withMessage('Valid userId required'),
  validate
];

// ✅ Query validation
const queryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit 1-100'),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search max 100 chars'),
  query('role').optional().isIn(['user','admin','captain']).withMessage('Invalid role'),
  query('status').optional().isIn(['active','suspended','deactivated','pending']).withMessage('Invalid status'),
  validate
];

/**
 * -------------------------
 * Routes
 * -------------------------
 */

// ✅ Current user profile
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateProfileValidation, updateUserProfile);

// ✅ Password change
router.put("/password", protect, changePasswordValidation, changePassword);

// ✅ Preferences
router.put("/preferences", protect, updatePreferencesValidation, updatePreferences);

// ✅ Wallet
router.put("/wallet", protect, updateWalletValidation, updateWallet);
router.get("/wallet/transactions", protect, queryValidation, getWalletTransactions);

// ✅ User stats (admin only) – keep before dynamic routes
router.get("/admin/stats", protect, requireRole('admin'), getUserStats);

// ✅ All users (admin only)
router.get("/", protect, requireRole('admin'), queryValidation, getAllUsers);

// ✅ User by ID (admin or owner)
router.get(
  "/:userId",
  protect,
  userIdParamValidation,
  authorizeResourceOwner('userId'),
  getUserDetails
);

// ✅ Delete user (admin or owner)
router.delete(
  "/:userId",
  protect,
  userIdParamValidation,
  authorizeResourceOwner('userId'),
  deleteUser
);

module.exports = router;
