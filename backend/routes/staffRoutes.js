// FILE: backend/routes/staffRoutes.js
/**
 * Staff management routes
 * Defines endpoints for staff operations
 */

const express = require('express');
const staffController = require('../controllers/staffController');
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// ❌ REMOVED DUPLICATE: Staff login is handled by /api/v1/auth/staff/login in authRoutes.js
// This route was causing conflicts with the proper authentication flow

// All routes are protected
router.use(protect);

// Staff accessible routes (both admin and staff can access)
/**
 * @route   GET /api/v1/staff/bookings
 * @desc    Get all bookings for staff management
 * @access  Private/Admin/Staff
 */
router.get('/bookings', authorize(ROLES.ADMIN, ROLES.STAFF), adminController.getAllBookings);

/**
 * @route   GET /api/v1/staff/bookings/:id
 * @desc    Get booking details
 * @access  Private/Admin/Staff
 */
router.get('/bookings/:id', authorize(ROLES.ADMIN, ROLES.STAFF), adminController.getBookingDetails);

/**
 * @route   PATCH /api/v1/staff/bookings/:id/status
 * @desc    Update booking status (confirm/complete)
 * @access  Private/Admin/Staff
 */
router.patch('/bookings/:id/status', authorize(ROLES.ADMIN, ROLES.STAFF), adminController.updateBookingStatus);

// Admin only routes
router.use(authorize(ROLES.ADMIN));

/**
 * @route   POST /api/v1/staff
 * @desc    Create a new staff member
 * @access  Private/Admin
 */
router.post('/', staffController.createStaff);

/**
 * @route   GET /api/v1/staff
 * @desc    Get all staff with filtering and pagination
 * @access  Private/Admin
 */
router.get('/', staffController.getAllStaff);

/**
 * @route   GET /api/v1/staff/drivers/available
 * @desc    Get available drivers
 * @access  Private/Admin
 */
router.get('/drivers/available', staffController.getAvailableDrivers);

/**
 * @route   GET /api/v1/staff/:id
 * @desc    Get staff by ID
 * @access  Private/Admin
 */
router.get('/:id', staffController.getStaffById);

/**
 * @route   PUT /api/v1/staff/:id
 * @desc    Update staff by ID
 * @access  Private/Admin
 */
router.put('/:id', staffController.updateStaff);

/**
 * @route   DELETE /api/v1/staff/:id
 * @desc    Delete staff by ID
 * @access  Private/Admin
 */
router.delete('/:id', staffController.deleteStaff);

/**
 * @route   PATCH /api/v1/staff/:id/toggle-status
 * @desc    Toggle staff active status
 * @access  Private/Admin
 */
router.patch('/:id/toggle-status', staffController.toggleStaffStatus);

/**
 * @route   PATCH /api/v1/staff/:id/assign-bus
 * @desc    Assign bus to staff
 * @access  Private/Admin
 */
router.patch('/:id/assign-bus', staffController.assignBusToStaff);

module.exports = router;