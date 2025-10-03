const express = require('express');
const { body, param, query } = require('express-validator');
const {
  createBus,
  getAllBuses,
  getBusById,
  updateBus,
  deleteBus,
  getBusAvailability,
  updateBusStatus,
  getBusAnalytics,
  exportBuses,
  getFeaturedBuses,
  getPopularBuses,
  searchBuses,
  getPopularRoutes
} = require('../controllers/busController');
const { protect, admin, validate } = require('../middlewares/authMiddleware');

const router = express.Router();

/* ------------------------- VALIDATIONS ------------------------- */

// Create bus validation
const createBusValidation = [
  body('busNumber').notEmpty().withMessage('Bus number is required').trim().isLength({ max: 20 }),
  body('busName').notEmpty().withMessage('Bus name is required').trim().isLength({ max: 100 }),
  body('operator').notEmpty().withMessage('Bus operator is required').trim().isLength({ max: 100 }),
  body('totalSeats').isInt({ min: 1, max: 100 }).withMessage('Total seats must be between 1 and 100'),
  body('route.from').notEmpty().withMessage('Departure location is required').trim().isLength({ max: 100 }),
  body('route.to').notEmpty().withMessage('Destination location is required').trim().isLength({ max: 100 }),
  body('route.distance').isFloat({ min: 1 }).withMessage('Distance must be at least 1 km'),
  body('route.duration').isInt({ min: 1 }).withMessage('Duration must be at least 1 minute'),
  body('schedule.departure').isISO8601().withMessage('Valid departure time is required'),
  body('schedule.arrival').isISO8601().withMessage('Valid arrival time is required'),
  body('basePrice').isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
  body('amenities').optional().isArray().withMessage('Amenities must be an array'),
  body('features.ac').optional().isBoolean().withMessage('AC feature must be a boolean'),
  body('features.wifi').optional().isBoolean().withMessage('WiFi feature must be a boolean'),
  validate
];

// Update bus validation
const updateBusValidation = [
  body('busNumber').optional().trim().isLength({ max: 20 }),
  body('busName').optional().trim().isLength({ max: 100 }),
  body('totalSeats').optional().isInt({ min: 1, max: 100 }),
  body('basePrice').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(['active', 'maintenance', 'out_of_service', 'scheduled']),
  validate
];

// Bus ID param validation
const busIdParamValidation = [
  param('id').isMongoId().withMessage('Valid bus ID is required'),
  validate
];

// Query validations
const queryValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim().isLength({ max: 100 }),
  query('routeFrom').optional().trim().isLength({ max: 100 }),
  query('routeTo').optional().trim().isLength({ max: 100 }),
  query('minSeats').optional().isInt({ min: 0 }),
  query('maxSeats').optional().isInt({ min: 1 }),
  query('status').optional().isIn(['active', 'maintenance', 'out_of_service', 'scheduled']),
  query('sortBy').optional().isIn(['busNumber', 'busName', 'basePrice', 'totalSeats', 'createdAt']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('date').optional().isISO8601(),
  query('city').optional().trim().isLength({ max: 100 }),
  validate
];

// Route search validation
const routeValidation = [
  query('from').notEmpty().withMessage('Departure location is required').trim().isLength({ max: 100 }),
  query('to').notEmpty().withMessage('Destination location is required').trim().isLength({ max: 100 }),
  query('date').optional().isISO8601(),
  validate
];

/* ------------------------- ROUTES ------------------------- */

// Admin routes
router.get('/analytics', protect, admin, getBusAnalytics);
router.get('/export', protect, admin, exportBuses);

// Featured, popular, search buses
router.get('/featured', queryValidation, getFeaturedBuses);
router.get('/popular', queryValidation, getPopularBuses);
router.get('/search', routeValidation, searchBuses);

// Bus availability
router.get('/availability/:id', [
  param('id').isMongoId().withMessage('Valid bus ID is required'),
  query('date').isISO8601().withMessage('Valid date is required'),
  validate
], getBusAvailability);

// CRUD operations
router.get('/', queryValidation, getAllBuses);
router.get('/:id', busIdParamValidation, getBusById);
router.post('/', protect, admin, createBusValidation, createBus);
router.put('/:id', protect, admin, busIdParamValidation, updateBusValidation, updateBus);
router.delete('/:id', protect, admin, busIdParamValidation, deleteBus);

// Get popular routes analytics
router.get('/route', queryValidation, getPopularRoutes); // <-- આ નવો રાઉટ ઉમેરો

// Update bus status
router.patch('/:id/status', protect, admin, busIdParamValidation, [
  body('status').isIn(['active', 'maintenance', 'out_of_service', 'scheduled']),
  body('reason').optional().trim().isLength({ max: 500 }),
  validate
], updateBusStatus);

module.exports = router;
