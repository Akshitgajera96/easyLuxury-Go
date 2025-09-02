const express = require('express');
const { body, param, query } = require('express-validator');
const {
  registerCaptain,
  getAllCaptains,
  getCaptainById,
  updateCaptain,
  deleteCaptain,
  getCaptainAvailability,
  updateCaptainAvailability,
  getCaptainStats,
  assignBusToCaptain,
  removeBusFromCaptain
} = require('../controllers/captainController');
const { protect, admin } = require('../middlewares/authMiddleware');

const router = express.Router();

// Validation rules
const registerCaptainValidation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email cannot exceed 255 characters'),
  
  body('phone')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('licenseNumber')
    .notEmpty()
    .withMessage('License number is required')
    .trim()
    .isLength({ max: 50 })
    .withMessage('License number cannot exceed 50 characters'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

const updateCaptainValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('licenseNumber')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('License number cannot exceed 50 characters')
];

const captainIdParamValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid captain ID is required')
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
  
  query('isAvailable')
    .optional()
    .isBoolean()
    .withMessage('isAvailable must be a boolean')
];

// @route   POST /api/captains
// @desc    Register a new captain
// @access  Private (Admin)
router.post('/', protect, admin, registerCaptainValidation, registerCaptain);

// @route   GET /api/captains
// @desc    Get all captains with filtering and pagination
// @access  Private (Admin)
router.get('/', protect, admin, queryValidation, getAllCaptains);

// @route   GET /api/captains/stats
// @desc    Get captain statistics
// @access  Private (Admin)
router.get('/stats', protect, admin, getCaptainStats);

// @route   GET /api/captains/:id
// @desc    Get a captain by ID
// @access  Private (Admin)
router.get('/:id', protect, admin, captainIdParamValidation, getCaptainById);

// @route   GET /api/captains/:id/availability
// @desc    Get captain availability status
// @access  Private (Admin)
router.get('/:id/availability', protect, admin, captainIdParamValidation, getCaptainAvailability);

// @route   PUT /api/captains/:id
// @desc    Update a captain's profile
// @access  Private (Admin)
router.put('/:id', protect, admin, captainIdParamValidation, updateCaptainValidation, updateCaptain);

// @route   PATCH /api/captains/:id/availability
// @desc    Update captain availability status
// @access  Private (Admin)
router.patch('/:id/availability', protect, admin, captainIdParamValidation, [
  body('isAvailable')
    .isBoolean()
    .withMessage('isAvailable must be a boolean')
], updateCaptainAvailability);

// @route   PATCH /api/captains/:id/assign-bus
// @desc    Assign a bus to captain
// @access  Private (Admin)
router.patch('/:id/assign-bus', protect, admin, captainIdParamValidation, [
  body('busId')
    .isMongoId()
    .withMessage('Valid bus ID is required')
], assignBusToCaptain);

// @route   PATCH /api/captains/:id/remove-bus
// @desc    Remove bus assignment from captain
// @access  Private (Admin)
router.patch('/:id/remove-bus', protect, admin, captainIdParamValidation, removeBusFromCaptain);

// @route   DELETE /api/captains/:id
// @desc    Delete a captain
// @access  Private (Admin)
router.delete('/:id', protect, admin, captainIdParamValidation, deleteCaptain);

module.exports = router;