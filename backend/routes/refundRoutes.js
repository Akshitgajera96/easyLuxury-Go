const express = require("express");
const { body, param, query } = require("express-validator");
const {
  cancelTicket,
  getRefundHistory,
  getRefundDetails,
  processManualRefund,
  getRefundStats,
  updateRefundStatus,
  exportRefunds
} = require("../controllers/refundController");

const {
  protect,
  requireRole,
  validate
} = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * -------------------------
 * Validation middlewares
 * -------------------------
 */

// Cancel ticket (request refund)
const cancelTicketValidation = [
  param('id').isMongoId().withMessage('Valid ticket ID is required'),
  body('cancellationReason').optional().trim().isLength({ max: 500 }).withMessage('Cancellation reason max 500 chars'),
  validate
];

// Manual refund (admin)
const manualRefundValidation = [
  body('ticketId').isMongoId().withMessage('Valid ticket ID is required'),
  body('refundAmount').isFloat({ min: 0.01 }).withMessage('Valid refund amount required'),
  body('reason').notEmpty().trim().isLength({ max: 500 }).withMessage('Reason is required and max 500 chars'),
  validate
];

// Update refund status (admin)
const updateRefundStatusValidation = [
  param('id').isMongoId().withMessage('Valid refund ID is required'),
  body('status').isIn(['pending','approved','rejected','processing','refunded','failed']).withMessage('Invalid refund status'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 chars'),
  validate
];

// Refund ID param
const refundIdParamValidation = [
  param('id').isMongoId().withMessage('Valid refund ID is required'),
  validate
];

// Query validation (for history, admin filters)
const queryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('status').optional().isIn(['pending','approved','rejected','processing','refunded','failed']).withMessage('Invalid refund status'),
  query('startDate').optional().isISO8601().withMessage('Valid start date required'),
  query('endDate').optional().isISO8601().withMessage('Valid end date required'),
  query('type').optional().isIn(['user_cancelled','bus_cancelled','service_issue','duplicate_booking','payment_error','schedule_change','other']).withMessage('Invalid refund type'),
  validate
];

/**
 * -------------------------
 * Routes
 * -------------------------
 */

// User: request refund (cancel ticket)
router.post("/request/:id", protect, cancelTicketValidation, cancelTicket);

// User: refund history
router.get("/history", protect, queryValidation, getRefundHistory);

// User/Admin: refund details
router.get("/:id", protect, refundIdParamValidation, getRefundDetails);

// Admin: manual refund
router.post("/admin/manual", protect, requireRole('admin'), manualRefundValidation, processManualRefund);

// Admin: update refund status
router.patch("/admin/:id/status", protect, requireRole('admin'), updateRefundStatusValidation, updateRefundStatus);

// Admin: refund statistics
router.get("/admin/stats", protect, requireRole('admin'), queryValidation, getRefundStats);

// Admin: export refunds
router.get("/admin/export", protect, requireRole('admin'), queryValidation, exportRefunds);

// Admin: all refunds with filtering
router.get("/admin/all", protect, requireRole('admin'), queryValidation, getRefundHistory);

module.exports = router;
