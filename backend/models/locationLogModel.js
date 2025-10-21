// FILE: backend/models/locationLogModel.js
/**
 * LocationLog model for MongoDB
 * Tracks all location-related events and admin actions
 */

const mongoose = require('mongoose');

const locationLogSchema = new mongoose.Schema({
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: true
  },
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  eventType: {
    type: String,
    enum: [
      'status_change',
      'reminder_sent',
      'tracking_started',
      'tracking_stopped',
      'trip_started',
      'trip_completed',
      'manual_update'
    ],
    required: true
  },
  previousStatus: {
    type: String,
    enum: ['active', 'sleep', 'offline', 'not_started']
  },
  newStatus: {
    type: String,
    enum: ['active', 'sleep', 'offline', 'not_started']
  },
  location: {
    latitude: Number,
    longitude: Number
  },
  reminderSentTo: {
    name: String,
    email: String,
    phone: String
  },
  performedBy: {
    type: String, // Admin email or 'system'
    default: 'system'
  },
  notes: {
    type: String,
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
locationLogSchema.index({ trip: 1, createdAt: -1 });
locationLogSchema.index({ bus: 1, createdAt: -1 });
locationLogSchema.index({ staff: 1, createdAt: -1 });
locationLogSchema.index({ eventType: 1 });
locationLogSchema.index({ createdAt: -1 });

// Static method to log status change
locationLogSchema.statics.logStatusChange = async function(tripId, busId, staffId, previousStatus, newStatus, location = null) {
  return this.create({
    trip: tripId,
    bus: busId,
    staff: staffId,
    eventType: 'status_change',
    previousStatus,
    newStatus,
    location,
    performedBy: 'system',
    notes: `Status changed from ${previousStatus} to ${newStatus}`
  });
};

// Static method to log reminder sent
locationLogSchema.statics.logReminderSent = async function(tripId, busId, staffId, staffInfo) {
  return this.create({
    trip: tripId,
    bus: busId,
    staff: staffId,
    eventType: 'reminder_sent',
    reminderSentTo: staffInfo,
    performedBy: 'admin',
    notes: `Location update reminder sent to ${staffInfo.name}`
  });
};

// Static method to get logs for a trip
locationLogSchema.statics.getLogsForTrip = function(tripId, limit = 50) {
  return this.find({ trip: tripId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('staff', 'name email')
    .populate('bus', 'busNumber');
};

// Static method to get recent activity
locationLogSchema.statics.getRecentActivity = function(limit = 100) {
  return this.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('trip', 'route')
    .populate('bus', 'busNumber')
    .populate('staff', 'name');
};

module.exports = mongoose.model('LocationLog', locationLogSchema);
