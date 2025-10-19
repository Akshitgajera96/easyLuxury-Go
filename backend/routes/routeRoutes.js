// FILE: backend/routes/routeRoutes.js
/**
 * Route management routes
 * Defines endpoints for route CRUD operations (Admin only)
 */

const express = require('express');
const routeController = require('../controllers/routeController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// All routes are protected
router.use(protect);

/**
 * @route   GET /api/v1/routes/search
 * @desc    Search routes by source and destination
 * @access  Private
 */
router.get('/search', routeController.searchRoutes);

// Admin only routes
router.use(authorize(ROLES.ADMIN));

/**
 * @route   POST /api/v1/routes
 * @desc    Create a new route
 * @access  Private/Admin
 */
router.post('/', routeController.createRoute);

/**
 * @route   GET /api/v1/routes
 * @desc    Get all routes with filtering and pagination
 * @access  Private/Admin
 */
router.get('/', routeController.getAllRoutes);

/**
 * @route   GET /api/v1/routes/:id
 * @desc    Get route by ID
 * @access  Private/Admin
 */
router.get('/:id', routeController.getRouteById);

/**
 * @route   PUT /api/v1/routes/:id
 * @desc    Update route by ID
 * @access  Private/Admin
 */
router.put('/:id', routeController.updateRoute);

/**
 * @route   DELETE /api/v1/routes/:id
 * @desc    Delete route by ID
 * @access  Private/Admin
 */
router.delete('/:id', routeController.deleteRoute);

/**
 * @route   PATCH /api/v1/routes/:id/toggle-pricing
 * @desc    Toggle dynamic pricing for a route
 * @access  Private/Admin
 */
router.patch('/:id/toggle-pricing', routeController.toggleDynamicPricing);

module.exports = router;