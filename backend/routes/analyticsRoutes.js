// FILE: backend/routes/analyticsRoutes.js
/**
 * Analytics routes
 * Defines endpoints for advanced analytics and reporting
 */

const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// All routes are protected and require admin role
router.use(protect);
router.use(authorize(ROLES.ADMIN));

/**
 * @route   GET /api/v1/analytics/comprehensive
 * @desc    Get comprehensive analytics report
 * @access  Private/Admin
 */
router.get('/comprehensive', analyticsController.getComprehensiveAnalytics);

/**
 * @route   GET /api/v1/analytics/export
 * @desc    Export analytics data in various formats
 * @access  Private/Admin
 */
router.get('/export', analyticsController.exportAnalyticsData);

/**
 * @route   GET /api/v1/analytics/realtime
 * @desc    Get real-time analytics data
 * @access  Private/Admin
 */
router.get('/realtime', analyticsController.getRealTimeAnalytics);

module.exports = router;