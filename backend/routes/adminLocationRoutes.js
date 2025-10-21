// FILE: backend/routes/adminLocationRoutes.js
/**
 * Admin Location Monitoring Routes
 * Protected routes for admin location monitoring and management
 */

const express = require('express');
const adminLocationController = require('../controllers/adminLocationController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// All routes are admin-only
router.use(protect);
router.use(authorize(ROLES.ADMIN));

/**
 * @route   GET /api/v1/admin/location-monitor/buses
 * @desc    Get all monitored bus locations with status
 * @access  Private/Admin
 */
router.get('/buses', adminLocationController.getAllMonitoredBuses);

/**
 * @route   GET /api/v1/admin/location-monitor/stats
 * @desc    Get location monitoring dashboard statistics
 * @access  Private/Admin
 */
router.get('/stats', adminLocationController.getMonitoringStats);

/**
 * @route   GET /api/v1/admin/location-monitor/logs
 * @desc    Get activity logs with optional filters
 * @access  Private/Admin
 */
router.get('/logs', adminLocationController.getActivityLogs);

/**
 * @route   GET /api/v1/admin/location-monitor/trip/:tripId
 * @desc    Get location status for a specific trip
 * @access  Private/Admin
 */
router.get('/trip/:tripId', adminLocationController.getTripLocationStatus);

/**
 * @route   POST /api/v1/admin/location-monitor/remind/:tripId
 * @desc    Send location update reminder to staff
 * @access  Private/Admin
 */
router.post('/remind/:tripId', adminLocationController.sendLocationReminder);

/**
 * @route   PATCH /api/v1/admin/location-monitor/status/:tripId
 * @desc    Manually update bus location status
 * @access  Private/Admin
 */
router.patch('/status/:tripId', adminLocationController.updateBusStatus);

module.exports = router;
