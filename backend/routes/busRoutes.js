// FILE: backend/routes/busRoutes.js
/**
 * Bus management routes
 * Defines endpoints for bus CRUD operations (Admin only)
 */

const express = require('express');
const busController = require('../controllers/busController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// All routes are protected and require admin role
router.use(protect);
router.use(authorize(ROLES.ADMIN));

/**
 * @route   POST /api/v1/buses
 * @desc    Create a new bus
 * @access  Private/Admin
 */
router.post('/', busController.createBus);

/**
 * @route   GET /api/v1/buses
 * @desc    Get all buses with filtering and pagination
 * @access  Private/Admin
 */
router.get('/', busController.getAllBuses);

/**
 * @route   GET /api/v1/buses/:id
 * @desc    Get bus by ID
 * @access  Private/Admin
 */
router.get('/:id', busController.getBusById);

/**
 * @route   PUT /api/v1/buses/:id
 * @desc    Update bus by ID
 * @access  Private/Admin
 */
router.put('/:id', busController.updateBus);

/**
 * @route   DELETE /api/v1/buses/:id
 * @desc    Delete bus by ID
 * @access  Private/Admin
 */
router.delete('/:id', busController.deleteBus);

/**
 * @route   PATCH /api/v1/buses/:id/toggle-status
 * @desc    Toggle bus active status
 * @access  Private/Admin
 */
router.patch('/:id/toggle-status', busController.toggleBusStatus);

module.exports = router;