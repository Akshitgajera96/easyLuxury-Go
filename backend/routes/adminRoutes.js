// FILE: backend/routes/adminRoutes.js
/**
 * Admin management routes
 * Defines endpoints for admin operations and analytics
 */

const express = require('express');
const adminController = require('../controllers/adminController');
const analyticsController = require('../controllers/analyticsController');
const { verifyAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require admin authentication
router.use(verifyAdmin);

// Analytics Routes
/**
 * @route   GET /api/v1/admin/analytics/dashboard
 * @desc    Get dashboard analytics
 * @access  Private/Admin
 */
router.get('/analytics/dashboard', adminController.getDashboardAnalytics);

/**
 * @route   GET /api/v1/admin/analytics/detailed
 * @desc    Get detailed analytics with date range
 * @access  Private/Admin
 */
router.get('/analytics/detailed', adminController.getDetailedAnalytics);

/**
 * @route   GET /api/v1/admin/analytics/revenue
 * @desc    Get revenue analytics
 * @access  Private/Admin
 */
router.get('/analytics/revenue', adminController.getRevenueAnalytics);

/**
 * @route   GET /api/v1/admin/analytics/bookings
 * @desc    Get booking analytics
 * @access  Private/Admin
 */
router.get('/analytics/bookings', adminController.getBookingAnalytics);

/**
 * @route   GET /api/v1/admin/analytics/users
 * @desc    Get user analytics
 * @access  Private/Admin
 */
router.get('/analytics/users', adminController.getUserAnalytics);

/**
 * @route   GET /api/v1/admin/analytics/operational
 * @desc    Get operational analytics
 * @access  Private/Admin
 */
router.get('/analytics/operational', adminController.getOperationalAnalytics);

// User Management Routes
/**
 * @route   GET /api/v1/admin/users
 * @desc    Get users management data
 * @access  Private/Admin
 */
router.get('/users', adminController.getUsersManagement);

/**
 * @route   PATCH /api/v1/admin/users/:id/toggle-status
 * @desc    Toggle user active status
 * @access  Private/Admin
 */
router.patch('/users/:id/toggle-status', adminController.toggleUserStatus);

/**
 * @route   PATCH /api/v1/admin/users/:id/role
 * @desc    Update user role
 * @access  Private/Admin
 */
router.patch('/users/:id/role', adminController.updateUserRole);

/**
 * @route   DELETE /api/v1/admin/users/:id
 * @desc    Delete user
 * @access  Private/Admin
 */
router.delete('/users/:id', adminController.deleteUser);

// Booking Management Routes
/**
 * @route   GET /api/v1/admin/bookings
 * @desc    Get all bookings (admin/staff)
 * @access  Private/Admin/Staff
 */
router.get('/bookings', adminController.getAllBookings);

/**
 * @route   GET /api/v1/admin/bookings/:id
 * @desc    Get booking details
 * @access  Private/Admin/Staff
 */
router.get('/bookings/:id', adminController.getBookingDetails);

/**
 * @route   PATCH /api/v1/admin/bookings/:id/status
 * @desc    Update booking status
 * @access  Private/Admin/Staff
 */
router.patch('/bookings/:id/status', adminController.updateBookingStatus);

// System Routes
/**
 * @route   GET /api/v1/admin/system/health
 * @desc    Get system health status
 * @access  Private/Admin
 */
router.get('/system/health', adminController.getSystemHealth);

// Staff Management Routes
/**
 * @route   POST /api/v1/admin/staff/add
 * @desc    Add new staff member
 * @access  Private/Admin
 */
router.post('/staff/add', adminController.addStaff);

/**
 * @route   GET /api/v1/admin/staff
 * @desc    Get all staff members
 * @access  Private/Admin
 */
router.get('/staff', adminController.getAllStaff);

/**
 * @route   PATCH /api/v1/admin/staff/:id/approve
 * @desc    Approve staff member
 * @access  Private/Admin
 */
router.patch('/staff/:id/approve', adminController.approveStaff);

/**
 * @route   PATCH /api/v1/admin/staff/:id/reject
 * @desc    Reject/revoke staff approval
 * @access  Private/Admin
 */
router.patch('/staff/:id/reject', adminController.rejectStaff);

/**
 * @route   PATCH /api/v1/admin/staff/:id/toggle-status
 * @desc    Toggle staff active status
 * @access  Private/Admin
 */
router.patch('/staff/:id/toggle-status', adminController.toggleStaffStatus);

/**
 * @route   DELETE /api/v1/admin/staff/:id
 * @desc    Delete staff member
 * @access  Private/Admin
 */
router.delete('/staff/:id', adminController.deleteStaff);

// Staff Registration Approval Routes
/**
 * @route   GET /api/v1/admin/staff/pending
 * @desc    Get all pending staff registrations
 * @access  Private/Admin
 */
router.get('/staff/pending', adminController.getPendingStaff);

/**
 * @route   GET /api/v1/admin/staff/pending/count
 * @desc    Get count of pending staff registrations
 * @access  Private/Admin
 */
router.get('/staff/pending/count', adminController.getPendingStaffCount);

/**
 * @route   POST /api/v1/admin/staff/:staffId/approve-registration
 * @desc    Approve staff registration
 * @access  Private/Admin
 */
router.post('/staff/:staffId/approve-registration', adminController.approveStaffRegistration);

/**
 * @route   POST /api/v1/admin/staff/:staffId/reject-registration
 * @desc    Reject staff registration
 * @access  Private/Admin
 */
router.post('/staff/:staffId/reject-registration', adminController.rejectStaffRegistration);

/**
 * @route   POST /api/v1/admin/staff/:staffId/cancel-registration
 * @desc    Cancel staff registration
 * @access  Private/Admin
 */
router.post('/staff/:staffId/cancel-registration', adminController.cancelStaffRegistration);

// Notification Routes
/**
 * @route   GET /api/v1/admin/notifications
 * @desc    Get all admin notifications
 * @access  Private/Admin
 */
router.get('/notifications', adminController.getNotifications);

/**
 * @route   GET /api/v1/admin/notifications/unread/count
 * @desc    Get count of unread notifications
 * @access  Private/Admin
 */
router.get('/notifications/unread/count', adminController.getUnreadNotificationCount);

/**
 * @route   PATCH /api/v1/admin/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private/Admin
 */
router.patch('/notifications/:id/read', adminController.markNotificationAsRead);

/**
 * @route   PATCH /api/v1/admin/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private/Admin
 */
router.patch('/notifications/read-all', adminController.markAllNotificationsAsRead);

/**
 * @route   DELETE /api/v1/admin/notifications/:id
 * @desc    Delete notification
 * @access  Private/Admin
 */
router.delete('/notifications/:id', adminController.deleteNotification);

module.exports = router;