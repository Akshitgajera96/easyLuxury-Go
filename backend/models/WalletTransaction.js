const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: [true, "User reference is required"],
      index: true
    },
    type: {
      type: String,
      enum: {
        values: ['credit', 'debit'],
        message: "Transaction type must be either 'credit' or 'debit'"
      },
      required: [true, "Transaction type is required"],
      index: true
    },
    amount: { 
      type: Number, 
      required: [true, "Transaction amount is required"],
      min: [0.01, "Transaction amount must be greater than 0"],
      set: val => Math.round(val * 100) / 100 // Store with 2 decimal precision
    },
    balanceAfter: {
      type: Number,
      required: [true, "Balance after transaction is required"],
      set: val => Math.round(val * 100) / 100
    },
    balanceBefore: {
      type: Number,
      required: [true, "Balance before transaction is required"],
      set: val => Math.round(val * 100) / 100
    },
    description: { 
      type: String,
      required: [true, "Transaction description is required"],
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"]
    },
    category: {
      type: String,
      enum: {
        values: [
          'deposit',
          'withdrawal',
          'payment',
          'refund',
          'cashback',
          'reward',
          'transfer',
          'adjustment',
          'fee',
          'other'
        ],
        message: "Invalid transaction category"
      },
      required: [true, "Transaction category is required"],
      index: true
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'completed', 'failed', 'cancelled', 'reversed'],
        message: "Status must be pending, completed, failed, cancelled, or reversed"
      },
      default: 'pending',
      index: true
    },
    transactionId: {
      type: String,
      unique: true,
      required: [true, "Transaction ID is required"],
      trim: true,
      uppercase: true
    },
    reference: {
      type: String,
      trim: true
    },
    referenceType: {
      type: String,
      enum: {
        values: ['booking', 'refund', 'transfer', 'admin', 'system', 'other'],
        message: "Invalid reference type"
      },
      default: 'other'
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'referenceType'
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ['wallet', 'card', 'bank_transfer', 'upi', 'cash', 'other'],
        message: "Invalid payment method"
      },
      default: 'wallet'
    },
    paymentGateway: {
      name: {
        type: String,
        trim: true
      },
      transactionId: {
        type: String,
        trim: true
      },
      response: {
        type: mongoose.Schema.Types.Mixed
      }
    },
    metadata: {
      ip: {
        type: String,
        trim: true
      },
      userAgent: {
        type: String,
        trim: true
      },
      device: {
        type: String,
        trim: true
      },
      location: {
        latitude: Number,
        longitude: Number
      }
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    processedAt: {
      type: Date,
      default: null
    },
    reversal: {
      originalTransaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WalletTransaction'
      },
      reason: {
        type: String,
        trim: true,
      },
      reversedAt: {
        type: Date,
        default: null
      },
      reversedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"]
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for formatted transaction ID
walletTransactionSchema.virtual('formattedTransactionId').get(function() {
  return `TXN-${this.transactionId}`;
});

// Virtual for user-friendly status
walletTransactionSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    pending: 'Pending',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
    reversed: 'Reversed'
  };
  return statusMap[this.status] || this.status;
});

// Virtual for isSuccessful
walletTransactionSchema.virtual('isSuccessful').get(function() {
  return this.status === 'completed';
});

// Virtual for isReversible
walletTransactionSchema.virtual('isReversible').get(function() {
  return this.status === 'completed' && 
         !this.reversal.originalTransaction &&
         this.type === 'credit' &&
         new Date() - this.createdAt < 30 * 24 * 60 * 60 * 1000; // Within 30 days
});

// Indexes for better query performance
walletTransactionSchema.index({ user: 1, createdAt: -1 });
walletTransactionSchema.index({ category: 1, status: 1 });
walletTransactionSchema.index({ createdAt: 1 });
walletTransactionSchema.index({ 'paymentGateway.transactionId': 1 });

// Pre-save middleware to generate transaction ID if not provided
walletTransactionSchema.pre('save', function(next) {
  if (!this.transactionId) {
    this.transactionId = this._id.toString().slice(-8).toUpperCase();
  }
  
  if (this.isModified('status') && this.status === 'completed' && !this.processedAt) {
    this.processedAt = new Date();
  }
  
  next();
});

// Static method to get wallet balance for a user
walletTransactionSchema.statics.getBalance = async function(userId) {
  const result = await this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        status: 'completed',
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        totalCredits: {
          $sum: {
            $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0]
          }
        },
        totalDebits: {
          $sum: {
            $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0]
          }
        }
      }
    }
  ]);

  if (result.length === 0) {
    return 0;
  }

  return result[0].totalCredits - result[0].totalDebits;
};

// Static method to find transactions by user with pagination
walletTransactionSchema.statics.findByUser = function(userId, page = 1, limit = 10, filters = {}) {
  const query = { user: userId, isActive: true, ...filters };
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('referenceId', 'name email')
    .populate('processedBy', 'name email');
};

// Static method to get transaction statistics
walletTransactionSchema.statics.getStatistics = async function(userId, startDate, endDate) {
  const matchStage = {
    user: mongoose.Types.ObjectId(userId),
    status: 'completed',
    isActive: true,
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        credits: {
          $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0] }
        },
        debits: {
          $sum: { $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0] }
        }
      }
    }
  ]);

  const total = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalCredits: { $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0] } },
        totalDebits: { $sum: { $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0] } },
        transactionCount: { $sum: 1 }
      }
    }
  ]);

  return {
    byCategory: stats,
    summary: total[0] || { totalCredits: 0, totalDebits: 0, transactionCount: 0 }
  };
};

// Instance method to update transaction status
walletTransactionSchema.methods.updateStatus = function(newStatus, processedBy = null, notes = '') {
  if (!['pending', 'completed', 'failed', 'cancelled', 'reversed'].includes(newStatus)) {
    throw new Error('Invalid transaction status');
  }

  this.status = newStatus;
  
  if (processedBy) {
    this.processedBy = processedBy;
  }

  if (newStatus === 'completed' && !this.processedAt) {
    this.processedAt = new Date();
  }

  if (notes) {
    this.notes = notes;
  }

  return this.save();
};

// Instance method to reverse transaction
walletTransactionSchema.methods.reverse = function(reason, reversedBy) {
  if (this.status !== 'completed') {
    throw new Error('Only completed transactions can be reversed');
  }

  if (this.reversal.originalTransaction) {
    throw new Error('Transaction has already been reversed');
  }

  if (this.type !== 'credit') {
    throw new Error('Only credit transactions can be reversed');
  }

  // Check if reversal is within allowed timeframe (30 days)
  const reversalPeriod = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  if (Date.now() - this.createdAt > reversalPeriod) {
    throw new Error('Transaction reversal period has expired');
  }

  this.status = 'reversed';
  this.reversal = {
    originalTransaction: this._id,
    reason: reason,
    reversedAt: new Date(),
    reversedBy: reversedBy
  };

  return this.save();
};

// Instance method to add payment gateway response
walletTransactionSchema.methods.addGatewayResponse = function(gatewayName, gatewayTransactionId, response) {
  this.paymentGateway = {
    name: gatewayName,
    transactionId: gatewayTransactionId,
    response: response
  };

  return this.save();
};

// Query helper to filter by date range
walletTransactionSchema.query.byDateRange = function(startDate, endDate) {
  return this.find({
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  });
};

// Query helper to filter by amount range
walletTransactionSchema.query.byAmountRange = function(minAmount, maxAmount) {
  return this.find({
    amount: {
      $gte: minAmount || 0,
      $lte: maxAmount || Number.MAX_SAFE_INTEGER
    }
  });
};

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);