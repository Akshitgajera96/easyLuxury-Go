// FILE: backend/models/bookingModel.js
/**
 * Booking model for MongoDB
 * Defines booking schema with trip, passenger, and payment information
 */

const mongoose = require('mongoose');
const { BOOKING_STATUS, PAYMENT_METHODS, PAYMENT_STATUS } = require('../constants/enums');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: [true, 'Trip is required']
  },
  seats: [{
    seatNumber: {
      type: String,
      required: [true, 'Seat number is required'],
      trim: true
    },
    passengerName: {
      type: String,
      required: [true, 'Passenger name is required'],
      trim: true
    },
    passengerAge: {
      type: Number,
      required: [true, 'Passenger age is required'],
      min: [1, 'Age must be at least 1'],
      max: [120, 'Age cannot exceed 120']
    },
    passengerGender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: [true, 'Passenger gender is required']
    }
  }],
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [1, 'Total amount must be at least ₹1']
  },
  paymentMethod: {
    type: String,
    enum: Object.values(PAYMENT_METHODS),
    required: [true, 'Payment method is required']
  },
  paymentStatus: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING
  },
  bookingStatus: {
    type: String,
    enum: Object.values(BOOKING_STATUS),
    default: BOOKING_STATUS.PENDING
  },
  pnrNumber: {
    type: String,
    unique: true,
    trim: true
  },
  promoCode: {
    code: String,
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative']
    }
  },
  cancellation: {
    cancelledAt: Date,
    refundAmount: {
      type: Number,
      default: 0,
      min: [0, 'Refund amount cannot be negative']
    },
    cancellationReason: String
  },
  boardingPoint: {
    terminal: String,
    address: String,
    time: String
  },
  droppingPoint: {
    terminal: String,
    address: String,
    time: String
  }
}, {
  timestamps: true
});

// Indexes for booking queries
bookingSchema.index({ user: 1 });
bookingSchema.index({ trip: 1 });
bookingSchema.index({ pnrNumber: 1 });
bookingSchema.index({ bookingStatus: 1 });
bookingSchema.index({ createdAt: 1 });

// Pre-save middleware to generate PNR number
bookingSchema.pre('save', async function(next) {
  if (this.isNew && !this.pnrNumber) {
    const Booking = mongoose.model('Booking');
    const count = await Booking.countDocuments();
    this.pnrNumber = `PNR${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Virtual for number of passengers
bookingSchema.virtual('passengerCount').get(function() {
  return this.seats.length;
});

// Method to calculate cancellation refund
bookingSchema.methods.calculateRefund = function(hoursBeforeDeparture) {
  const baseRefundPercentage = 0.8; // 80% base refund
  
  // Reduce refund based on how close to departure
  if (hoursBeforeDeparture < 2) {
    return this.totalAmount * 0.5; // 50% refund if less than 2 hours
  } else if (hoursBeforeDeparture < 6) {
    return this.totalAmount * 0.7; // 70% refund if less than 6 hours
  } else if (hoursBeforeDeparture < 24) {
    return this.totalAmount * 0.8; // 80% refund if less than 24 hours
  }
  
  return this.totalAmount * baseRefundPercentage;
};

// Method to cancel booking
bookingSchema.methods.cancelBooking = function(reason, hoursBeforeDeparture) {
  this.bookingStatus = BOOKING_STATUS.CANCELLED;
  this.paymentStatus = PAYMENT_STATUS.REFUNDED;
  this.cancellation = {
    cancelledAt: new Date(),
    refundAmount: this.calculateRefund(hoursBeforeDeparture),
    cancellationReason: reason
  };
  
  return this.save();
};

// Static method to find bookings by user
bookingSchema.statics.findByUser = function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  return this.find({ user: userId })
    .populate('trip')
    .populate({
      path: 'trip',
      populate: [
        { path: 'bus' },
        { path: 'route' }
      ]
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

module.exports = mongoose.model('Booking', bookingSchema);