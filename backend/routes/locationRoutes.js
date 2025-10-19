// FILE: backend/routes/locationRoutes.js
/**
 * Location tracking routes
 * Defines endpoints for real-time bus location tracking
 */

const express = require('express');
const locationController = require('../controllers/locationController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

/**
 * @route   POST /api/v1/location/update
 * @desc    Update bus location (Staff only - drivers/conductors)
 * @access  Private/Staff/Admin
 */
router.post('/update', protect, authorize(ROLES.ADMIN, ROLES.STAFF), locationController.updateLocation);

/**
 * @route   GET /api/v1/location/all-active
 * @desc    Get all active trips with current locations (Admin only)
 * @access  Private/Admin
 */
router.get('/all-active', protect, authorize(ROLES.ADMIN), locationController.getAllActiveLocations);

/**
 * @route   GET /api/v1/location/:tripId
 * @desc    Get current location of a trip
 * @access  Private
 */
router.get('/:tripId', protect, locationController.getLocation);

/**
 * @route   GET /api/v1/location/:tripId/history
 * @desc    Get location history for a trip
 * @access  Private
 */
router.get('/:tripId/history', protect, locationController.getLocationHistory);

module.exports = router;
