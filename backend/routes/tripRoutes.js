// FILE: backend/routes/tripRoutes.js
/**
 * Trip management routes
 * Defines endpoints for trip CRUD operations and search
 */

const express = require('express');
const tripController = require('../controllers/tripController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// Public/User accessible routes (with authentication)
router.use(protect);

/**
 * @route   GET /api/v1/trips
 * @desc    Get all trips with filtering and pagination
 * @access  Private (All authenticated users)
 */
router.get('/', tripController.getAllTrips);

/**
 * @route   GET /api/v1/trips/search
 * @desc    Search trips by source, destination, and date
 * @access  Private (All authenticated users)
 */
router.get('/search', tripController.searchTrips);

/**
 * @route   GET /api/v1/trips/:id
 * @desc    Get trip by ID
 * @access  Private (All authenticated users)
 */
router.get('/:id', tripController.getTripById);

// Admin only routes (must come after public routes)
router.use(authorize(ROLES.ADMIN));

/**
 * @route   POST /api/v1/trips
 * @desc    Create a new trip
 * @access  Private/Admin
 */
router.post('/', tripController.createTrip);

/**
 * @route   PUT /api/v1/trips/:id
 * @desc    Update trip by ID
 * @access  Private/Admin
 */
router.put('/:id', tripController.updateTrip);

/**
 * @route   PATCH /api/v1/trips/:id/status
 * @desc    Update trip status
 * @access  Private/Admin
 */
router.patch('/:id/status', tripController.updateTripStatus);

module.exports = router;