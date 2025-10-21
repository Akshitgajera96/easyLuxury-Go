// FILE: backend/models/busLocationStatusModel.js
/**
 * BusLocationStatus model for MongoDB
 * Tracks real-time status of bus location tracking with staff info
 */

const mongoose = require('mongoose');

const busLocationStatusSchema = new mongoose.Schema({
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
    unique: true
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
  lastLocation: {
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    },
    speed: {
      type: Number,
      default: 0
    },
    heading: {
      type: Number,
      default: 0
    }
  },
  lastUpdated: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'sleep', 'offline', 'not_started'],
    default: 'not_started'
  },
  connectivityIssue: {
    type: Boolean,
    default: false
  },
  remindersSent: {
    type: Number,
    default: 0
  },
  lastReminderSent: {
    type: Date,
    default: null
  },
  tripStarted: {
    type: Boolean,
    default: false
  },
  tripCompleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
busLocationStatusSchema.index({ trip: 1 });
busLocationStatusSchema.index({ bus: 1 });
busLocationStatusSchema.index({ staff: 1 });
busLocationStatusSchema.index({ status: 1 });
busLocationStatusSchema.index({ lastUpdated: 1 });

// Method to calculate status based on lastUpdated time
busLocationStatusSchema.methods.calculateStatus = function() {
  if (!this.lastUpdated || !this.tripStarted || this.tripCompleted) {
    return this.tripCompleted ? 'offline' : 'not_started';
  }

  const now = new Date();
  const diffMinutes = (now - this.lastUpdated) / (1000 * 60);

  if (diffMinutes < 2) {
    this.connectivityIssue = false;
    return 'active';
  } else if (diffMinutes >= 2 && diffMinutes <= 6) {
    return 'sleep';
  } else {
    this.connectivityIssue = true;
    return 'offline';
  }
};

// Method to update status
busLocationStatusSchema.methods.updateStatus = async function() {
  const newStatus = this.calculateStatus();
  const statusChanged = this.status !== newStatus;
  
  this.status = newStatus;
  await this.save();
  
  return { statusChanged, newStatus };
};

// Static method to get all monitored trips
busLocationStatusSchema.statics.getAllMonitored = function() {
  return this.find({ tripStarted: true, tripCompleted: false })
    .populate('trip', 'departureDateTime arrivalDateTime status')
    .populate('bus', 'busNumber operator')
    .populate('staff', 'name email phone designation')
    .sort({ lastUpdated: -1 });
};

// Static method to get buses needing reminders
busLocationStatusSchema.statics.getNeedingReminders = function() {
  return this.find({
    tripStarted: true,
    tripCompleted: false,
    status: { $in: ['sleep', 'offline'] },
    connectivityIssue: true
  })
    .populate('staff', 'name email phone')
    .populate('bus', 'busNumber')
    .populate('trip', 'route');
};

module.exports = mongoose.model('BusLocationStatus', busLocationStatusSchema);
