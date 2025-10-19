// FILE: backend/models/otpModel.js
/**
 * OTP model for storing temporary OTPs
 * Used for password reset and booking confirmation
 */

const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['password-reset', 'booking-confirmation'],
    required: true
  },
  bookingData: {
    type: Object,
    default: null
  },
  verified: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    index: { expires: 0 } // TTL index - auto-delete after expiry
  }
}, {
  timestamps: true
});

// Index for faster lookups
otpSchema.index({ email: 1, type: 1 });

// Method to check if OTP is expired
otpSchema.methods.isExpired = function() {
  return Date.now() > this.expiresAt;
};

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
