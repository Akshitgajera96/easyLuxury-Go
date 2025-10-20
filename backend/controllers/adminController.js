// FILE: backend/controllers/adminController.js
/**
 * Admin controller handling HTTP requests for admin operations
 * Routes: /api/v1/admin/*
 */

const adminService = require('../services/adminService');
const analyticsService = require('../services/analyticsService');
const Staff = require('../models/staffModel');
const Notification = require('../models/notificationModel');
const { sendStaffApprovalEmail } = require('../services/emailService');

/**
 * Get dashboard analytics
 * GET /api/v1/admin/analytics/dashboard
 */
const getDashboardAnalytics = async (req, res, next) => {
  try {
    const analytics = await adminService.getDashboardAnalytics();

    res.status(200).json({
      success: true,
      data: analytics,
      message: 'Dashboard analytics fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get detailed analytics
 * GET /api/v1/admin/analytics/detailed
 */
const getDetailedAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const analytics = await adminService.getDetailedAnalytics(startDate, endDate);

    res.status(200).json({
      success: true,
      data: analytics,
      message: 'Detailed analytics fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get revenue analytics
 * GET /api/v1/admin/analytics/revenue
 */
const getRevenueAnalytics = async (req, res, next) => {
  try {
    const { period, startDate, endDate } = req.query;

    const analytics = await analyticsService.getRevenueAnalytics(period, startDate, endDate);

    res.status(200).json({
      success: true,
      data: analytics,
      message: 'Revenue analytics fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get booking analytics
 * GET /api/v1/admin/analytics/bookings
 */
const getBookingAnalytics = async (req, res, next) => {
  try {
    const { period } = req.query;

    const analytics = await analyticsService.getBookingAnalytics(period);

    res.status(200).json({
      success: true,
      data: analytics,
      message: 'Booking analytics fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user analytics
 * GET /api/v1/admin/analytics/users
 */
const getUserAnalytics = async (req, res, next) => {
  try {
    const analytics = await analyticsService.getUserAnalytics();

    res.status(200).json({
      success: true,
      data: analytics,
      message: 'User analytics fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get operational analytics
 * GET /api/v1/admin/analytics/operational
 */
const getOperationalAnalytics = async (req, res, next) => {
  try {
    const analytics = await analyticsService.getOperationalAnalytics();

    res.status(200).json({
      success: true,
      data: analytics,
      message: 'Operational analytics fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get users management data
 * GET /api/v1/admin/users
 */
const getUsersManagement = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await adminService.getUsersManagement(
      parseInt(page),
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Users management data fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle user active status
 * PATCH /api/v1/admin/users/:id/toggle-status
 */
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await adminService.toggleUserStatus(req.params.id);

    res.status(200).json({
      success: true,
      data: { user },
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get system health
 * GET /api/v1/admin/system/health
 */
const getSystemHealth = async (req, res, next) => {
  try {
    const health = await adminService.getSystemHealth();

    res.status(200).json({
      success: true,
      data: health,
      message: 'System health fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all bookings for admin/staff management
 * GET /api/v1/admin/bookings
 */
const getAllBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, paymentStatus, tripId, userId, startDate, endDate } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (paymentStatus) filters.paymentStatus = paymentStatus;
    if (tripId) filters.tripId = tripId;
    if (userId) filters.userId = userId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const result = await adminService.getAllBookings(
      filters,
      parseInt(page),
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Bookings fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update booking status
 * PATCH /api/v1/admin/bookings/:id/status
 */
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Booking status is required'
      });
    }

    const booking = await adminService.updateBookingStatus(req.params.id, status);

    res.status(200).json({
      success: true,
      data: { booking },
      message: 'Booking status updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get booking details
 * GET /api/v1/admin/bookings/:id
 */
const getBookingDetails = async (req, res, next) => {
  try {
    const booking = await adminService.getBookingDetails(req.params.id);

    res.status(200).json({
      success: true,
      data: { booking },
      message: 'Booking details fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add new staff member (Admin only)
 * POST /api/v1/admin/staff/add
 */
const addStaff = async (req, res, next) => {
  try {
    const { name, email, password, phone, designation, department, employeeId, dateOfJoining } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phone || !designation || !department || !employeeId || !dateOfJoining) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Check if staff with email already exists
    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) {
      return res.status(400).json({
        success: false,
        message: 'Staff member with this email already exists'
      });
    }

    // Check if employee ID already exists
    const existingEmployeeId = await Staff.findOne({ employeeId: employeeId.toUpperCase() });
    if (existingEmployeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID already exists'
      });
    }

    // Create new staff member (password will be hashed by model middleware)
    const staff = await Staff.create({
      name,
      email,
      password,
      phone,
      designation,
      department,
      employeeId: employeeId.toUpperCase(),
      dateOfJoining,
      role: 'staff',
      approved: false, // Default to unapproved
      isActive: true,
      approvedBy: null,
      approvedAt: null
    });

    // Remove password from response
    const staffData = staff.toObject();
    delete staffData.password;

    res.status(201).json({
      success: true,
      data: { staff: staffData },
      message: 'Staff member added successfully. Pending approval.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all staff members (Admin only)
 * GET /api/v1/admin/staff
 */
const getAllStaff = async (req, res, next) => {
  try {
    const { approved, isActive, department } = req.query;

    const filter = {};
    if (approved !== undefined) filter.approved = approved === 'true';
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (department) filter.department = { $regex: department, $options: 'i' };

    const staff = await Staff.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    const stats = {
      total: staff.length,
      approved: staff.filter(s => s.approved).length,
      pending: staff.filter(s => !s.approved).length,
      active: staff.filter(s => s.isActive).length,
      inactive: staff.filter(s => !s.isActive).length
    };

    res.status(200).json({
      success: true,
      data: {
        staff,
        stats
      },
      message: 'Staff members fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve staff member (Admin only)
 * PATCH /api/v1/admin/staff/:id/approve
 */
const approveStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    if (staff.approved) {
      return res.status(400).json({
        success: false,
        message: 'Staff member is already approved'
      });
    }

    // Approve staff
    staff.approved = true;
    staff.approvedBy = req.admin.email; // From verifyAdmin middleware
    staff.approvedAt = new Date();
    await staff.save();

    // Remove password from response
    const staffData = staff.toObject();
    delete staffData.password;

    res.status(200).json({
      success: true,
      data: { staff: staffData },
      message: 'Staff member approved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject/Remove staff approval (Admin only)
 * PATCH /api/v1/admin/staff/:id/reject
 */
const rejectStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Unapprove staff
    staff.approved = false;
    staff.approvedBy = null;
    staff.approvedAt = null;
    await staff.save();

    // Remove password from response
    const staffData = staff.toObject();
    delete staffData.password;

    res.status(200).json({
      success: true,
      data: { staff: staffData },
      message: 'Staff approval revoked successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle staff active status (Admin only)
 * PATCH /api/v1/admin/staff/:id/toggle-status
 */
const toggleStaffStatus = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Toggle active status
    staff.isActive = !staff.isActive;
    await staff.save();

    // Remove password from response
    const staffData = staff.toObject();
    delete staffData.password;

    res.status(200).json({
      success: true,
      data: { staff: staffData },
      message: `Staff member ${staff.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete staff member (Admin only)
 * DELETE /api/v1/admin/staff/:id
 */
const deleteStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    await Staff.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Staff member deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all pending staff registrations
 * GET /api/v1/admin/staff/pending
 */
const getPendingStaff = async (req, res, next) => {
  try {
    console.log('📋 Fetching pending staff registrations');

    const pendingStaff = await Staff.findPending();

    console.log(`  ✅ Found ${pendingStaff.length} pending staff`);

    res.status(200).json({
      success: true,
      data: {
        staff: pendingStaff,
        count: pendingStaff.length
      },
      message: 'Pending staff fetched successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching pending staff:', error);
    next(error);
  }
};

/**
 * Get count of pending staff registrations
 * GET /api/v1/admin/staff/pending/count
 */
const getPendingStaffCount = async (req, res, next) => {
  try {
    const count = await Staff.countPending();

    res.status(200).json({
      success: true,
      data: { count },
      message: 'Pending staff count fetched successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching pending staff count:', error);
    next(error);
  }
};

/**
 * Approve staff registration
 * POST /api/v1/admin/staff/:staffId/approve
 */
const approveStaffRegistration = async (req, res, next) => {
  try {
    const { staffId } = req.params;
    const { reason } = req.body;
    const adminEmail = req.admin?.email || req.user?.email || 'admin@easyLuxuryGo.com';

    console.log('✅ Approving staff registration:', staffId);

    const staff = await Staff.findById(staffId);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    if (staff.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve ${staff.status} staff`
      });
    }

    // Approve the staff
    await staff.approve(adminEmail, reason);

    console.log('  ✅ Staff approved:', staff.email);

    // Send approval email to staff
    try {
      const loginUrl = `${process.env.FRONTEND_URL}/staff/login`;
      await sendStaffApprovalEmail(staff.email, staff.name, { loginUrl, adminName: adminEmail });
      console.log('  📧 Approval email sent to staff');
    } catch (emailError) {
      console.error('  ⚠️ Failed to send approval email:', emailError.message);
      // Don't fail the approval if email fails
    }

    // Mark related notification as actioned
    try {
      const notification = await Notification.findOne({ 
        relatedStaffId: staff._id, 
        type: 'staff_registration',
        actionTaken: false
      });
      
      if (notification) {
        await notification.markActionTaken(adminEmail);
        console.log('  🔔 Notification marked as actioned');
      }
    } catch (notifError) {
      console.error('  ⚠️ Failed to update notification:', notifError.message);
    }

    res.status(200).json({
      success: true,
      data: { staff },
      message: 'Staff approved successfully. They can now login.'
    });
  } catch (error) {
    console.error('❌ Error approving staff:', error);
    next(error);
  }
};

/**
 * Reject staff registration
 * POST /api/v1/admin/staff/:staffId/reject
 */
const rejectStaffRegistration = async (req, res, next) => {
  try {
    const { staffId } = req.params;
    const { reason } = req.body;
    const adminEmail = req.admin?.email || req.user?.email || 'admin@easyLuxuryGo.com';

    console.log('❌ Rejecting staff registration:', staffId);

    const staff = await Staff.findById(staffId);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    if (staff.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject ${staff.status} staff`
      });
    }

    // Reject the staff
    await staff.reject(adminEmail, reason || 'Registration rejected by admin');

    console.log('  ✅ Staff rejected:', staff.email);

    // Mark related notification as actioned
    try {
      const notification = await Notification.findOne({ 
        relatedStaffId: staff._id, 
        type: 'staff_registration',
        actionTaken: false
      });
      
      if (notification) {
        await notification.markActionTaken(adminEmail);
        console.log('  🔔 Notification marked as actioned');
      }
    } catch (notifError) {
      console.error('  ⚠️ Failed to update notification:', notifError.message);
    }

    res.status(200).json({
      success: true,
      data: { staff },
      message: 'Staff registration rejected'
    });
  } catch (error) {
    console.error('❌ Error rejecting staff:', error);
    next(error);
  }
};

/**
 * Cancel staff registration
 * POST /api/v1/admin/staff/:staffId/cancel
 */
const cancelStaffRegistration = async (req, res, next) => {
  try {
    const { staffId } = req.params;
    const { reason } = req.body;
    const adminEmail = req.admin?.email || req.user?.email || 'admin@easyLuxuryGo.com';

    console.log('🚫 Cancelling staff registration:', staffId);

    const staff = await Staff.findById(staffId);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    // Can cancel from any status except already cancelled
    if (staff.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Staff registration already cancelled'
      });
    }

    // Cancel the staff
    await staff.cancel(adminEmail, reason || 'Registration cancelled by admin');

    console.log('  ✅ Staff cancelled:', staff.email);

    // Mark related notification as actioned
    try {
      const notification = await Notification.findOne({ 
        relatedStaffId: staff._id, 
        type: 'staff_registration',
        actionTaken: false
      });
      
      if (notification) {
        await notification.markActionTaken(adminEmail);
        console.log('  🔔 Notification marked as actioned');
      }
    } catch (notifError) {
      console.error('  ⚠️ Failed to update notification:', notifError.message);
    }

    res.status(200).json({
      success: true,
      data: { staff },
      message: 'Staff registration cancelled'
    });
  } catch (error) {
    console.error('❌ Error cancelling staff:', error);
    next(error);
  }
};

/**
 * Get all admin notifications
 * GET /api/v1/admin/notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const { limit = 50, unreadOnly = false } = req.query;

    console.log('📬 Fetching admin notifications');

    let notifications;
    if (unreadOnly === 'true') {
      notifications = await Notification.getAdminUnread();
    } else {
      notifications = await Notification.getAdminNotifications(parseInt(limit));
    }

    const unreadCount = await Notification.countAdminUnread();

    console.log(`  ✅ Found ${notifications.length} notifications (${unreadCount} unread)`);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        total: notifications.length
      },
      message: 'Notifications fetched successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    next(error);
  }
};

/**
 * Get unread notification count
 * GET /api/v1/admin/notifications/unread/count
 */
const getUnreadNotificationCount = async (req, res, next) => {
  try {
    const count = await Notification.countAdminUnread();

    res.status(200).json({
      success: true,
      data: { count },
      message: 'Unread count fetched successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching unread count:', error);
    next(error);
  }
};

/**
 * Mark notification as read
 * PATCH /api/v1/admin/notifications/:id/read
 */
const markNotificationAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.markAsRead();

    res.status(200).json({
      success: true,
      data: { notification },
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    next(error);
  }
};

/**
 * Mark all notifications as read
 * PATCH /api/v1/admin/notifications/read-all
 */
const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipientRole: 'admin', isRead: false },
      { isRead: true, readAt: new Date() }
    );

    const unreadCount = await Notification.countAdminUnread();

    res.status(200).json({
      success: true,
      data: { unreadCount },
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('❌ Error marking all as read:', error);
    next(error);
  }
};

/**
 * Delete notification
 * DELETE /api/v1/admin/notifications/:id
 */
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    next(error);
  }
};

module.exports = {
  getDashboardAnalytics,
  getDetailedAnalytics,
  getRevenueAnalytics,
  getBookingAnalytics,
  getUserAnalytics,
  getOperationalAnalytics,
  getUsersManagement,
  toggleUserStatus,
  getSystemHealth,
  getAllBookings,
  updateBookingStatus,
  getBookingDetails,
  addStaff,
  getAllStaff,
  approveStaff,
  rejectStaff,
  toggleStaffStatus,
  deleteStaff,
  getPendingStaff,
  getPendingStaffCount,
  approveStaffRegistration,
  rejectStaffRegistration,
  cancelStaffRegistration,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
};