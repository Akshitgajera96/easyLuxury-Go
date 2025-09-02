const express = require("express");
const { body, param, query } = require("express-validator");
const {
  cancelTicket, // ✅ changed from requestRefund to cancelTicket
  getRefundHistory,
  getRefundDetails,
  processManualRefund,
  getRefundStats,
  updateRefundStatus,
  exportRefunds
} = require("../controllers/refundController");
const { protect, admin } = require("../middlewares/authMiddleware"); // ✅ removed authorizeResourceOwner

const router = express.Router();

// Validation rules
const cancelTicketValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid ticket ID is required'),
  
  body('cancellationReason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason cannot exceed 500 characters')
];

const manualRefundValidation = [
  body('ticketId')
    .isMongoId()
    .withMessage('Valid ticket ID is required'),
  
  body('refundAmount')
    .isFloat({ min: 0.01 })
    .withMessage('Valid refund amount is required'),
  
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters')
];

const updateRefundStatusValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid refund ID is required'),
  
  body('status')
    .isIn(['pending', 'approved', 'rejected', 'processing', 'refunded', 'failed']) // ✅ simplified status options
    .withMessage('Invalid refund status'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

const refundIdParamValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid refund ID is required')
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
  
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'processing', 'refunded', 'failed']) // ✅ simplified status options
    .withMessage('Invalid refund status'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Valid start date is required'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Valid end date is required'),
  
  query('type')
    .optional()
    .isIn(['user_cancelled', 'bus_cancelled', 'service_issue', 'duplicate_booking', 'payment_error', 'schedule_change', 'other'])
    .withMessage('Invalid refund type')
];

// @route   POST /api/refunds/request/:id
// @desc    Request refund for a ticket
// @access  Private (User - own tickets)
router.post("/request/:id", protect, cancelTicketValidation, cancelTicket); // ✅ changed to cancelTicket

// @route   GET /api/refunds/history
// @desc    Get user's refund history
// @access  Private (User)
router.get("/history", protect, queryValidation, getRefundHistory);

// @route   GET /api/refunds/:id
// @desc    Get refund details by ID
// @access  Private (User - own refunds, Admin - all refunds)
router.get("/:id", protect, refundIdParamValidation, getRefundDetails);

// @route   POST /api/refunds/admin/manual
// @desc    Process manual refund (admin)
// @access  Private (Admin)
router.post("/admin/manual", protect, admin, manualRefundValidation, processManualRefund);

// @route   PATCH /api/refunds/admin/:id/status
// @desc    Update refund status (admin)
// @access  Private (Admin)
router.patch("/admin/:id/status", protect, admin, updateRefundStatusValidation, updateRefundStatus);

// @route   GET /api/refunds/admin/stats
// @desc    Get refund statistics (admin)
// @access  Private (Admin)
router.get("/admin/stats", protect, admin, queryValidation, getRefundStats); // ✅ added queryValidation

// @route   GET /api/refunds/admin/export
// @desc    Export refunds data (admin)
// @access  Private (Admin)
router.get("/admin/export", protect, admin, queryValidation, exportRefunds); // ✅ added queryValidation

// @route   GET /api/refunds/admin/all
// @desc    Get all refunds with filtering (admin)
// @access  Private (Admin)
router.get("/admin/all", protect, admin, queryValidation, getRefundHistory);

module.exports = router;