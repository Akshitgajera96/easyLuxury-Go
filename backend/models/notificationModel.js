// FILE: backend/models/notificationModel.js
/**
 * Notification model for MongoDB
 * Manages admin notifications for staff registrations and other events
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['staff_registration', 'staff_approved', 'staff_rejected', 'system'],
    required: true,
    default: 'staff_registration'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  recipientRole: {
    type: String,
    enum: ['admin', 'staff', 'user'],
    required: true,
    default: 'admin'
  },
  recipientId: {
    type: String,
    default: null // null for admin (since admin is from env)
  },
  relatedStaffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    default: null
  },
  staffName: {
    type: String,
    default: null
  },
  staffEmail: {
    type: String,
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  actionRequired: {
    type: Boolean,
    default: true
  },
  actionTaken: {
    type: Boolean,
    default: false
  },
  actionTakenAt: {
    type: Date,
    default: null
  },
  actionTakenBy: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ recipientRole: 1, isRead: 1 });
notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ relatedStaffId: 1 });

// Method to mark notification as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Method to mark action as taken
notificationSchema.methods.markActionTaken = function(takenBy) {
  this.actionTaken = true;
  this.actionTakenAt = new Date();
  this.actionTakenBy = takenBy;
  return this.save();
};

// Static method to get unread notifications for admin
notificationSchema.statics.getAdminUnread = function() {
  return this.find({ 
    recipientRole: 'admin',
    isRead: false
  }).sort({ createdAt: -1 });
};

// Static method to get all admin notifications
notificationSchema.statics.getAdminNotifications = function(limit = 50) {
  return this.find({ 
    recipientRole: 'admin'
  })
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Static method to get pending action notifications
notificationSchema.statics.getPendingActions = function() {
  return this.find({
    recipientRole: 'admin',
    actionRequired: true,
    actionTaken: false
  }).sort({ createdAt: -1 });
};

// Static method to count unread for admin
notificationSchema.statics.countAdminUnread = function() {
  return this.countDocuments({
    recipientRole: 'admin',
    isRead: false
  });
};

// Static method to create staff registration notification
notificationSchema.statics.createStaffRegistrationNotification = async function(staff) {
  return this.create({
    type: 'staff_registration',
    title: 'New Staff Registration Request',
    message: `New staff registration request from ${staff.name} (${staff.designation})`,
    recipientRole: 'admin',
    relatedStaffId: staff._id,
    staffName: staff.name,
    staffEmail: staff.email,
    actionRequired: true,
    metadata: {
      staffId: staff._id,
      designation: staff.designation,
      department: staff.department,
      employeeId: staff.employeeId
    }
  });
};

// Static method to clean old read notifications (optional maintenance)
notificationSchema.statics.cleanOldNotifications = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    isRead: true,
    readAt: { $lt: cutoffDate }
  });
};

module.exports = mongoose.model('Notification', notificationSchema);
