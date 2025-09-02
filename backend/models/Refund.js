const mongoose = require("mongoose");

const refundSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking reference is required"],
      index: true,
      validate: {
        validator: async function(bookingId) {
          const booking = await mongoose.model("Booking").findById(bookingId);
          return booking && booking.user.toString() === this.user.toString();
        },
        message: "Booking must belong to the specified user"
      }
    },
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: [true, "Ticket reference is required"],
      index: true,
      validate: {
        validator: async function(ticketId) {
          const ticket = await mongoose.model("Ticket").findById(ticketId);
          return ticket && ticket.user.toString() === this.user.toString();
        },
        message: "Ticket must belong to the specified user"
      }
    },
    amount: {
      type: Number,
      required: [true, "Refund amount is required"],
      min: [0.01, "Refund amount must be greater than 0"],
      set: val => Math.round(val * 100) / 100 // Store with 2 decimal precision
    },
    originalAmount: {
      type: Number,
      required: [true, "Original amount is required"],
      min: [0.01, "Original amount must be greater than 0"],
      set: val => Math.round(val * 100) / 100
    },
    refundPercentage: {
      type: Number,
      min: [0, "Refund percentage cannot be negative"],
      max: [100, "Refund percentage cannot exceed 100"],
      default: 0
    },
    reason: {
      type: String,
      required: [true, "Refund reason is required"],
      trim: true,
      maxlength: [500, "Reason cannot exceed 500 characters"],
      enum: {
        values: [
          "user_cancelled",
          "bus_cancelled",
          "service_issue",
          "duplicate_booking",
          "payment_error",
          "schedule_change",
          "other"
        ],
        message: "Invalid refund reason"
      }
    },
    reasonDetails: {
      type: String,
      trim: true,
      maxlength: [1000, "Reason details cannot exceed 1000 characters"]
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "under_review", "approved", "rejected", "processing", "refunded", "failed"],
        message: "Invalid refund status"
      },
      default: "pending",
      index: true
    },
    statusHistory: [{
      status: {
        type: String,
        required: true
      },
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      changedAt: {
        type: Date,
        default: Date.now
      },
      notes: {
        type: String,
        trim: true,
        maxlength: [500, "Status notes cannot exceed 500 characters"]
      }
    }],
    paymentMethod: {
      type: String,
      enum: {
        values: ["original", "wallet", "bank_transfer", "card_refund"],
        message: "Invalid refund method"
      },
      default: "original"
    },
    paymentReference: {
      type: String,
      trim: true,
      index: true
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    processedAt: {
      type: Date,
      default: null
    },
    estimatedProcessingTime: {
      type: Number, // in days
      min: [0, "Processing time cannot be negative"],
      default: 7
    },
    actualProcessingTime: {
      type: Number, // in days
      min: [0, "Processing time cannot be negative"]
    },
    cancellationFee: {
      type: Number,
      min: [0, "Cancellation fee cannot be negative"],
      default: 0,
      set: val => Math.round(val * 100) / 100
    },
    taxRefund: {
      type: Number,
      min: [0, "Tax refund cannot be negative"],
      default: 0,
      set: val => Math.round(val * 100) / 100
    },
    walletTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WalletTransaction"
    },
    bankDetails: {
      accountNumber: {
        type: String,
        trim: true
      },
      accountHolder: {
        type: String,
        trim: true
      },
      bankName: {
        type: String,
        trim: true
      },
      ifscCode: {
        type: String,
        trim: true,
        uppercase: true
      }
    },
    refundPolicy: {
      type: String,
      enum: ["standard", "premium", "flexible"],
      default: "standard"
    },
    communication: [{
      type: {
        type: String,
        enum: ["email", "sms", "notification", "admin_note"],
        required: true
      },
      message: {
        type: String,
        required: true,
        trim: true
      },
      sentAt: {
        type: Date,
        default: Date.now
      },
      sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      read: {
        type: Boolean,
        default: false
      }
    }],
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

// Virtual for refund ID formatted as reference number
refundSchema.virtual("refundReference").get(function() {
  return `REF-${this._id.toString().slice(-8).toUpperCase()}`;
});

// Virtual for user-friendly status
refundSchema.virtual("statusDisplay").get(function() {
  const statusMap = {
    pending: "Pending Review",
    under_review: "Under Review",
    approved: "Approved",
    rejected: "Rejected",
    processing: "Processing",
    refunded: "Refund Completed",
    failed: "Refund Failed"
  };
  return statusMap[this.status] || this.status;
});

// Virtual for estimated completion date
refundSchema.virtual("estimatedCompletionDate").get(function() {
  if (!this.processedAt && this.estimatedProcessingTime) {
    const date = new Date(this.createdAt);
    date.setDate(date.getDate() + this.estimatedProcessingTime);
    return date;
  }
  return null;
});

// Virtual for isProcessed
refundSchema.virtual("isProcessed").get(function() {
  return ["refunded", "failed"].includes(this.status);
});

// Indexes for better query performance
refundSchema.index({ user: 1, status: 1 });
refundSchema.index({ booking: 1 }, { unique: true }); // One refund per booking
refundSchema.index({ ticket: 1 }, { unique: true }); // One refund per ticket
refundSchema.index({ createdAt: -1 });
refundSchema.index({ status: 1, isActive: 1 });
refundSchema.index({ "bankDetails.ifscCode": 1 });
refundSchema.index({ paymentReference: 1 });

// Pre-save middleware to update status history
refundSchema.pre("save", function(next) {
  if (this.isModified("status")) {
    this.statusHistory = this.statusHistory || [];
    this.statusHistory.push({
      status: this.status,
      changedBy: this.processedBy || null,
      changedAt: new Date(),
      notes: `Status changed to ${this.status}`
    });

    // Update processedAt when refund is completed
    if (["refunded", "failed"].includes(this.status) && !this.processedAt) {
      this.processedAt = new Date();
      
      // Calculate actual processing time in days
      if (this.createdAt) {
        const processingMs = this.processedAt - this.createdAt;
        this.actualProcessingTime = Math.ceil(processingMs / (1000 * 60 * 60 * 24));
      }
    }
  }
  next();
});

// Pre-save middleware to validate amount doesn't exceed original amount
refundSchema.pre("save", function(next) {
  if (this.isModified("amount") && this.originalAmount) {
    if (this.amount > this.originalAmount) {
      return next(new Error("Refund amount cannot exceed original amount"));
    }
    this.refundPercentage = (this.amount / this.originalAmount) * 100;
  }
  next();
});

// Static method to find refunds by user with pagination
refundSchema.statics.findByUser = function(userId, page = 1, limit = 10, status = null) {
  const filter = { user: userId, isActive: true };
  if (status) filter.status = status;

  return this.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate("booking", "bookingReference date")
    .populate("ticket", "ticketNumber");
};

// Static method to get refund statistics
refundSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
        avgAmount: { $avg: "$amount" }
      }
    }
  ]);

  const total = await this.countDocuments({ isActive: true });
  const totalAmount = await this.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  return {
    total,
    totalAmount: totalAmount[0]?.total || 0,
    byStatus: stats
  };
};

// Instance method to update status with notes
refundSchema.methods.updateStatus = function(newStatus, changedBy, notes = "") {
  if (!["pending", "under_review", "approved", "rejected", "processing", "refunded", "failed"].includes(newStatus)) {
    throw new Error("Invalid refund status");
  }

  this.status = newStatus;
  this.processedBy = changedBy;

  if (notes) {
    this.statusHistory.push({
      status: newStatus,
      changedBy: changedBy,
      changedAt: new Date(),
      notes: notes
    });
  }

  return this.save();
};

// Instance method to add communication
refundSchema.methods.addCommunication = function(type, message, sentBy = null) {
  if (!["email", "sms", "notification", "admin_note"].includes(type)) {
    throw new Error("Invalid communication type");
  }

  this.communication = this.communication || [];
  this.communication.push({
    type: type,
    message: message,
    sentBy: sentBy,
    sentAt: new Date()
  });

  return this.save();
};

// Instance method to calculate refund eligibility (would integrate with business rules)
refundSchema.methods.calculateRefundAmount = function(cancellationTime, departureTime) {
  // This would implement your specific refund policy
  const timeDiff = departureTime - cancellationTime;
  const hoursDiff = timeDiff / (1000 * 60 * 60);

  let refundPercentage = 0;

  if (hoursDiff > 24) {
    refundPercentage = 90; // 90% refund if cancelled more than 24 hours before
  } else if (hoursDiff > 4) {
    refundPercentage = 50; // 50% refund if cancelled 4-24 hours before
  } else if (hoursDiff > 1) {
    refundPercentage = 25; // 25% refund if cancelled 1-4 hours before
  }
  // 0% refund if cancelled less than 1 hour before

  this.amount = Math.round((this.originalAmount * refundPercentage) / 100);
  this.refundPercentage = refundPercentage;
  this.cancellationFee = this.originalAmount - this.amount;

  return this.save();
};

module.exports = mongoose.model("Refund", refundSchema);