const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true
    },
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bus",
      required: [true, "Bus reference is required"],
      index: true
    },
    seatNumbers: {
      type: [Number],
      required: [true, "Seat numbers are required"],
      validate: {
        validator: function(val) {
          return val.length > 0 && val.every(seat => seat > 0);
        },
        message: "At least one valid seat number must be selected"
      }
    },
    bookingType: {
      type: String,
      enum: {
        values: ["online", "offline"],
        message: "Booking type must be either 'online' or 'offline'"
      },
      default: "online",
      index: true
    },
    status: {
      type: String,
      enum: {
        values: ["confirmed", "cancelled", "refunded", "completed"],
        message: "Status must be one of: confirmed, cancelled, refunded, completed"
      },
      default: "confirmed",
      index: true
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price must be a positive number"],
      set: val => Math.round(val * 100) / 100 // Store with 2 decimal precision
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount must be positive"],
      set: val => Math.round(val * 100) / 100
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: [0, "Tax amount cannot be negative"],
      set: val => Math.round(val * 100) / 100
    },
    date: {
      type: Date,
      required: [true, "Booking date is required"],
      index: true,
      validate: {
        validator: function(date) {
          return date > new Date();
        },
        message: "Booking date must be in the future"
      }
    },
    departureTime: {
      type: String,
      required: [true, "Departure time is required"],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please provide a valid time format (HH:MM)"]
    },
    arrivalTime: {
      type: String,
      required: [true, "Arrival time is required"],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please provide a valid time format (HH:MM)"]
    },
    paymentId: {
      type: String,
      default: null,
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
      index: true
    },
    paymentMethod: {
      type: String,
      enum: ["card", "wallet", "cash", "bank_transfer"],
      default: "card"
    },
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      default: null
    },
    refund: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Refund",
      default: null
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [500, "Cancellation reason cannot exceed 500 characters"]
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
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

// Virtual for formatted booking date
bookingSchema.virtual("formattedDate").get(function() {
  return this.date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
});

// Virtual for journey duration
bookingSchema.virtual("duration").get(function() {
  if (!this.departureTime || !this.arrivalTime) return null;
  
  const [depHours, depMinutes] = this.departureTime.split(':').map(Number);
  const [arrHours, arrMinutes] = this.arrivalTime.split(':').map(Number);
  
  const depTotalMinutes = depHours * 60 + depMinutes;
  const arrTotalMinutes = arrHours * 60 + arrMinutes;
  
  let durationMinutes = arrTotalMinutes - depTotalMinutes;
  if (durationMinutes < 0) durationMinutes += 24 * 60; // Handle overnight journeys
  
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  return `${hours}h ${minutes}m`;
});

// Virtual for isCancellable
bookingSchema.virtual("isCancellable").get(function() {
  if (this.status !== "confirmed") return false;
  
  const now = new Date();
  const bookingDateTime = new Date(this.date);
  const [hours, minutes] = this.departureTime.split(':').map(Number);
  bookingDateTime.setHours(hours, minutes, 0, 0);
  
  const timeDifference = bookingDateTime - now;
  const hoursDifference = timeDifference / (1000 * 60 * 60);
  
  return hoursDifference > 2; // Cancellable if more than 2 hours before departure
});

// Index for better query performance
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ bus: 1, date: 1, status: 1 });
bookingSchema.index({ date: 1, status: 1 });
bookingSchema.index({ status: 1, isActive: 1 });

// Pre-save middleware to calculate total amount
bookingSchema.pre("save", function(next) {
  if (this.isModified("price") || this.isModified("taxAmount")) {
    this.totalAmount = this.price + this.taxAmount;
  }
  next();
});

// Static method to find active bookings
bookingSchema.statics.findActive = function() {
  return this.find({ isActive: true, status: "confirmed" });
};

// Static method to find bookings by user with pagination
bookingSchema.statics.findByUser = function(userId, page = 1, limit = 10) {
  return this.find({ user: userId, isActive: true })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate("bus", "busNumber route from to");
};

// Static method to check seat availability
bookingSchema.statics.checkSeatAvailability = async function(busId, date, seatNumbers) {
  const conflictingBookings = await this.find({
    bus: busId,
    date: date,
    status: "confirmed",
    seatNumbers: { $in: seatNumbers }
  });

  return seatNumbers.map(seat => ({
    seat,
    available: !conflictingBookings.some(booking => booking.seatNumbers.includes(seat))
  }));
};

// Instance method to cancel booking
bookingSchema.methods.cancel = function(reason = "User requested cancellation") {
  this.status = "cancelled";
  this.cancellationReason = reason;
  this.cancelledAt = new Date();
  return this.save();
};

// Instance method to mark as completed
bookingSchema.methods.complete = function() {
  this.status = "completed";
  this.completedAt = new Date();
  return this.save();
};

// Query helper to filter by date range
bookingSchema.query.byDateRange = function(startDate, endDate) {
  return this.find({
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  });
};

// Query helper to filter by status
bookingSchema.query.byStatus = function(status) {
  return this.find({ status });
};

module.exports = mongoose.model("Booking", bookingSchema);