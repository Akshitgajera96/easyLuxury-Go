// FILE: backend/models/staffLoginRequestModel.js
/**
 * Staff Login Request model for MongoDB
 * Tracks staff login requests pending admin approval
 */

const mongoose = require('mongoose');

const staffLoginRequestSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'expired'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  respondedAt: {
    type: Date,
    default: null
  },
  respondedBy: {
    type: String,
    default: null
  },
  expiresAt: {
    type: Date,
    required: true,
    default: function() {
      return new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    }
  },
  rejectionReason: {
    type: String,
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
staffLoginRequestSchema.index({ email: 1 });
staffLoginRequestSchema.index({ status: 1, requestedAt: -1 });
staffLoginRequestSchema.index({ expiresAt: 1 });

// Method to check if request is expired
staffLoginRequestSchema.methods.isExpired = function() {
  return this.expiresAt < Date.now() || this.status === 'expired';
};

// Method to approve request
staffLoginRequestSchema.methods.approve = function(adminEmail) {
  this.status = 'approved';
  this.respondedAt = new Date();
  this.respondedBy = adminEmail;
  return this.save();
};

// Method to reject request
staffLoginRequestSchema.methods.reject = function(adminEmail, reason = null) {
  this.status = 'rejected';
  this.respondedAt = new Date();
  this.respondedBy = adminEmail;
  this.rejectionReason = reason;
  return this.save();
};

// Static method to find pending requests
staffLoginRequestSchema.statics.findPending = function() {
  return this.find({ 
    status: 'pending',
    expiresAt: { $gt: Date.now() }
  }).sort({ requestedAt: -1 });
};

// Static method to clean expired requests
staffLoginRequestSchema.statics.cleanExpired = async function() {
  return this.updateMany(
    { 
      status: 'pending',
      expiresAt: { $lte: Date.now() }
    },
    { 
      $set: { status: 'expired' }
    }
  );
};

module.exports = mongoose.model('StaffLoginRequest', staffLoginRequestSchema);
