// FILE: backend/routes/promoCodeRoutes.js
/**
 * Promo code management routes
 * Defines endpoints for promo code CRUD operations (Admin only)
 */

const express = require('express');
const promoCodeController = require('../controllers/promoCodeController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// All routes are protected
router.use(protect);

/**
 * @route   POST /api/v1/promocodes/validate
 * @desc    Validate and apply promo code
 * @access  Private
 */
router.post('/validate', promoCodeController.validatePromoCode);

/**
 * @route   GET /api/v1/promocodes/available
 * @desc    Get available promo codes for user
 * @access  Private
 */
router.get('/available', promoCodeController.getAvailablePromoCodes);

// Admin only routes
router.use(authorize(ROLES.ADMIN));

/**
 * @route   POST /api/v1/promocodes
 * @desc    Create a new promo code
 * @access  Private/Admin
 */
router.post('/', promoCodeController.createPromoCode);

/**
 * @route   GET /api/v1/promocodes
 * @desc    Get all promo codes with filtering and pagination
 * @access  Private/Admin
 */
router.get('/', promoCodeController.getAllPromoCodes);

/**
 * @route   GET /api/v1/promocodes/:id
 * @desc    Get promo code by ID
 * @access  Private/Admin
 */
router.get('/:id', promoCodeController.getPromoCodeById);

/**
 * @route   PUT /api/v1/promocodes/:id
 * @desc    Update promo code by ID
 * @access  Private/Admin
 */
router.put('/:id', promoCodeController.updatePromoCode);

/**
 * @route   DELETE /api/v1/promocodes/:id
 * @desc    Delete promo code by ID
 * @access  Private/Admin
 */
router.delete('/:id', promoCodeController.deletePromoCode);

/**
 * @route   PATCH /api/v1/promocodes/:id/toggle-status
 * @desc    Toggle promo code active status
 * @access  Private/Admin
 */
router.patch('/:id/toggle-status', promoCodeController.togglePromoCodeStatus);

module.exports = router;