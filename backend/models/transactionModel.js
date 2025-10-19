// FILE: backend/models/transactionModel.js
/**
 * Transaction model for MongoDB
 * Defines transaction schema for wallet and payment transactions
 */

const mongoose = require('mongoose');
const { PAYMENT_METHODS, PAYMENT_STATUS } = require('../constants/enums');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: [true, 'Transaction type is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  paymentMethod: {
    type: String,
    enum: Object.values(PAYMENT_METHODS),
    required: [true, 'Payment method is required']
  },
  status: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  referenceId: {
    type: String,
    unique: true,
    sparse: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for transaction queries
transactionSchema.index({ user: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ referenceId: 1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  const sign = this.type === 'credit' ? '+' : '-';
  return `${sign}₹${this.amount}`;
});

// Static method to get user's transaction history
transactionSchema.statics.getUserTransactions = function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  return this.find({ user: userId })
    .populate('booking')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get wallet balance from transactions
transactionSchema.statics.getWalletBalance = async function(userId) {
  const result = await this.aggregate([
    {
      $match: { 
        user: mongoose.Types.ObjectId(userId),
        status: PAYMENT_STATUS.SUCCESS
      }
    },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' }
      }
    }
  ]);

  let balance = 0;
  result.forEach(item => {
    if (item._id === 'credit') {
      balance += item.total;
    } else {
      balance -= item.total;
    }
  });

  return Math.max(0, balance);
};

// Static method to create wallet top-up transaction
transactionSchema.statics.createWalletTopUp = async function(userId, amount, paymentMethod, referenceId = null) {
  const Transaction = mongoose.model('Transaction');
  
  const transaction = new Transaction({
    user: userId,
    type: 'credit',
    amount: amount,
    paymentMethod: paymentMethod,
    status: PAYMENT_STATUS.SUCCESS,
    description: `Wallet top-up via ${paymentMethod}`,
    referenceId: referenceId
  });

  await transaction.save();
  return transaction;
};

// Static method to create booking payment transaction
transactionSchema.statics.createBookingPayment = async function(userId, amount, bookingId, paymentMethod, referenceId = null) {
  const Transaction = mongoose.model('Transaction');
  
  const transaction = new Transaction({
    user: userId,
    type: 'debit',
    amount: amount,
    paymentMethod: paymentMethod,
    status: PAYMENT_STATUS.SUCCESS,
    description: `Booking payment for ${bookingId}`,
    referenceId: referenceId,
    booking: bookingId
  });

  await transaction.save();
  return transaction;
};

// Static method to create refund transaction
transactionSchema.statics.createRefund = async function(userId, amount, bookingId, referenceId = null) {
  const Transaction = mongoose.model('Transaction');
  
  const transaction = new Transaction({
    user: userId,
    type: 'credit',
    amount: amount,
    paymentMethod: PAYMENT_METHODS.WALLET,
    status: PAYMENT_STATUS.SUCCESS,
    description: `Refund for cancelled booking ${bookingId}`,
    referenceId: referenceId,
    booking: bookingId
  });

  await transaction.save();
  return transaction;
};

module.exports = mongoose.model('Transaction', transactionSchema);