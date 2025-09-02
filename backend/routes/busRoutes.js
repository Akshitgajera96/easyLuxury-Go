const express = require('express');
const { body, param, query } = require('express-validator');
const {
  createBus,
  getAllBuses,
  getBusById,
  updateBus,
  deleteBus,
  getBusesByRoute,
  getBusAvailability,
  updateBusStatus,
  getBusAnalytics,
  exportBuses
} = require('../controllers/busController');
const { protect, admin, captain } = require('../middlewares/authMiddleware');

const router = express.Router();

// Validation rules
const createBusValidation = [
  body('busNumber')
    .notEmpty()
    .withMessage('Bus number is required')
    .trim()
    .isLength({ max: 20 })
    .withMessage('Bus number cannot exceed 20 characters')
    .matches(/^[A-Z0-9\-]+$/)
    .withMessage('Bus number can only contain letters, numbers, and hyphens'),
  
  body('busName')
    .notEmpty()
    .withMessage('Bus name is required')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Bus name cannot exceed 100 characters'),
  
  body('operator')
    .notEmpty()
    .withMessage('Bus operator is required')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Operator name cannot exceed 100 characters'),
  
  body('totalSeats')
    .isInt({ min: 1, max: 100 })
    .withMessage('Total seats must be between 1 and 100'),
  
  body('route.from')
    .notEmpty()
    .withMessage('Departure location is required')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Departure location cannot exceed 100 characters'),
  
  body('route.to')
    .notEmpty()
    .withMessage('Destination location is required')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Destination location cannot exceed 100 characters'),
  
  body('route.distance')
    .isFloat({ min: 1 })
    .withMessage('Distance must be at least 1 km'),
  
  body('route.duration')
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 minute'),
  
  body('schedule.departure')
    .isISO8601()
    .withMessage('Valid departure time is required'),
  
  body('schedule.arrival')
    .isISO8601()
    .withMessage('Valid arrival time is required'),
  
  body('basePrice')
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),
  
  body('amenities')
    .optional()
    .isArray()
    .withMessage('Amenities must be an array'),
  
  body('features.ac')
    .optional()
    .isBoolean()
    .withMessage('AC feature must be a boolean'),
  
  body('features.wifi')
    .optional()
    .isBoolean()
    .withMessage('WiFi feature must be a boolean')
];

const updateBusValidation = [
  body('busNumber')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Bus number cannot exceed 20 characters')
    .matches(/^[A-Z0-9\-]+$/)
    .withMessage('Bus number can only contain letters, numbers, and hyphens'),
  
  body('busName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Bus name cannot exceed 100 characters'),
  
  body('totalSeats')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Total seats must be between 1 and 100'),
  
  body('basePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),
  
  body('status')
    .optional()
    .isIn(['active', 'maintenance', 'out_of_service', 'scheduled'])
    .withMessage('Invalid status')
];

const busIdParamValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid bus ID is required')
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
  
  query('routeFrom')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Departure location cannot exceed 100 characters'),
  
  query('routeTo')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Destination location cannot exceed 100 characters'),
  
  query('minSeats')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum seats must be a positive integer'),
  
  query('maxSeats')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Maximum seats must be a positive integer'),
  
  query('status')
    .optional()
    .isIn(['active', 'maintenance', 'out_of_service', 'scheduled'])
    .withMessage('Invalid status'),
  
  query('sortBy')
    .optional()
    .isIn(['busNumber', 'busName', 'basePrice', 'totalSeats', 'createdAt'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  query('date')
    .optional()
    .isISO8601()
    .withMessage('Valid date is required')
];

const routeValidation = [
  query('from')
    .notEmpty()
    .withMessage('Departure location is required')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Departure location cannot exceed 100 characters'),
  
  query('to')
    .notEmpty()
    .withMessage('Destination location is required')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Destination location cannot exceed 100 characters'),
  
  query('date')
    .optional()
    .isISO8601()
    .withMessage('Valid date is required')
];

// @route   GET /api/buses
// @desc    Get all buses with filtering and pagination
// @access  Public
router.get('/', queryValidation, getAllBuses);

// @route   GET /api/buses/route
// @desc    Get buses by route with optional date filter
// @access  Public
router.get('/route', routeValidation, getBusesByRoute);

// @route   GET /api/buses/availability/:id
// @desc    Get bus availability for specific date
// @access  Public
router.get('/availability/:id', [
  param('id')
    .isMongoId()
    .withMessage('Valid bus ID is required'),
  
  query('date')
    .isISO8601()
    .withMessage('Valid date is required')
], getBusAvailability);

// @route   GET /api/buses/:id
// @desc    Get a specific bus by ID
// @access  Public
router.get('/:id', busIdParamValidation, getBusById);

// @route   POST /api/buses
// @desc    Create a new bus
// @access  Private (Admin)
router.post('/', protect, admin, createBusValidation, createBus);

// @route   PUT /api/buses/:id
// @desc    Update an existing bus
// @access  Private (Admin)
router.put('/:id', protect, admin, busIdParamValidation, updateBusValidation, updateBus);

// @route   PATCH /api/buses/:id/status
// @desc    Update bus status
// @access  Private (Admin, Captain)
router.patch('/:id/status', protect, busIdParamValidation, [
  body('status')
    .isIn(['active', 'maintenance', 'out_of_service', 'scheduled'])
    .withMessage('Invalid status'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters')
], updateBusStatus);

// @route   DELETE /api/buses/:id
// @desc    Delete a bus (soft delete)
// @access  Private (Admin)
router.delete('/:id', protect, admin, busIdParamValidation, deleteBus);

// @route   GET /api/buses/admin/analytics
// @desc    Get bus analytics and statistics
// @access  Private (Admin)
router.get('/admin/analytics', protect, admin, getBusAnalytics);

// @route   GET /api/buses/admin/export
// @desc    Export buses data
// @access  Private (Admin)
router.get('/admin/export', protect, admin, exportBuses);

module.exports = router;