// FILE: backend/routes/rentalInquiryRoutes.js
/**
 * Rental inquiry management routes
 * Defines endpoints for rental inquiry operations
 */

const express = require('express');
const rentalInquiryController = require('../controllers/rentalInquiryController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

/**
 * @route   POST /api/v1/rentals/inquiry
 * @desc    Create a new rental inquiry
 * @access  Public
 */
router.post('/inquiry', rentalInquiryController.createRentalInquiry);

// All other routes are protected
router.use(protect);

// Admin only routes
router.use(authorize(ROLES.ADMIN));

/**
 * @route   GET /api/v1/rentals/inquiries
 * @desc    Get all rental inquiries with filtering and pagination
 * @access  Private/Admin
 */
router.get('/inquiries', rentalInquiryController.getAllRentalInquiries);

/**
 * @route   GET /api/v1/rentals/inquiries/upcoming
 * @desc    Get upcoming rental inquiries
 * @access  Private/Admin
 */
router.get('/inquiries/upcoming', rentalInquiryController.getUpcomingInquiries);

/**
 * @route   GET /api/v1/rentals/inquiries/statistics
 * @desc    Get rental inquiry statistics
 * @access  Private/Admin
 */
router.get('/inquiries/statistics', rentalInquiryController.getInquiryStatistics);

/**
 * @route   GET /api/v1/rentals/inquiries/:id
 * @desc    Get rental inquiry by ID
 * @access  Private/Admin
 */
router.get('/inquiries/:id', rentalInquiryController.getRentalInquiryById);

/**
 * @route   PATCH /api/v1/rentals/inquiries/:id/status
 * @desc    Update rental inquiry status
 * @access  Private/Admin
 */
router.patch('/inquiries/:id/status', rentalInquiryController.updateInquiryStatus);

/**
 * @route   PATCH /api/v1/rentals/inquiries/:id/assign-staff
 * @desc    Assign staff to rental inquiry
 * @access  Private/Admin
 */
router.patch('/inquiries/:id/assign-staff', rentalInquiryController.assignStaffToInquiry);

/**
 * @route   PATCH /api/v1/rentals/inquiries/:id/quote
 * @desc    Set quote for rental inquiry
 * @access  Private/Admin
 */
router.patch('/inquiries/:id/quote', rentalInquiryController.setInquiryQuote);

/**
 * @route   DELETE /api/v1/rentals/inquiries/:id
 * @desc    Delete rental inquiry
 * @access  Private/Admin
 */
router.delete('/inquiries/:id', rentalInquiryController.deleteRentalInquiry);

module.exports = router;