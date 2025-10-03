const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
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
    ticketNumber: {
      type: String,
      required: [true, "Ticket number is required"],
      unique: true,
      uppercase: true,
      match: [/^[A-Z0-9\-]+$/, "Ticket number can only contain letters, numbers, and hyphens"]
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
    passengerDetails: {
      name: {
        type: String,
        required: [true, "Passenger name is required"],
        trim: true,
        maxlength: [100, "Passenger name cannot exceed 100 characters"]
      },
      age: {
        type: Number,
        min: [1, "Age must be at least 1"],
        max: [120, "Age cannot exceed 120"]
      },
     
      idType: {
        type: String,
        enum: ["aadhaar", "passport", "driving_license", "voter_id", "other"]
      },
      idNumber: {
        type: String,
        trim: true,
        uppercase: true
      }
    },
    journeyDetails: {
      date: {
        type: Date,
        required: [true, "Journey date is required"],
        index: true
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
      from: {
        type: String,
        required: [true, "Departure location is required"],
        trim: true
      },
      to: {
        type: String,
        required: [true, "Destination location is required"],
        trim: true
      },
      distance: {
        type: Number,
        min: [1, "Distance must be at least 1 km"]
      },
      duration: {
        type: Number, // in minutes
        min: [1, "Duration must be at least 1 minute"]
      }
    },
    fareDetails: {
      baseFare: {
        type: Number,
        required: [true, "Base fare is required"],
        min: [0, "Base fare cannot be negative"],
        set: val => Math.round(val * 100) / 100
      },
      tax: {
        type: Number,
        default: 0,
        min: [0, "Tax cannot be negative"],
        set: val => Math.round(val * 100) / 100
      },
      serviceCharge: {
        type: Number,
        default: 0,
        min: [0, "Service charge cannot be negative"],
        set: val => Math.round(val * 100) / 100
      },
      totalAmount: {
        type: Number,
        required: [true, "Total amount is required"],
        min: [0, "Total amount cannot be negative"],
        set: val => Math.round(val * 100) / 100
      },
      currency: {
        type: String,
        default: "INR",
        uppercase: true
      }
    },
    qrCode: {
      data: {
        type: String, // base64 encoded QR code
        default: null
      },
      url: {
        type: String, // URL to QR code image
        default: null,
        validate: {
          validator: function(url) {
            return !url || /^https?:\/\/.+\..+$/.test(url);
          },
          message: "Please provide a valid URL for QR code"
        }
      },
      expiresAt: {
        type: Date,
        default: function() {
          const expiry = new Date(this.journeyDetails.date);
          expiry.setDate(expiry.getDate() + 1); // Expire 1 day after journey
          return expiry;
        }
      }
    },
    barcode: {
      type: String, // barcode data
      default: null
    },
    status: {
      type: String,
      enum: {
        values: ["active", "cancelled", "used", "expired", "refunded"],
        message: "Status must be active, cancelled, used, expired, or refunded"
      },
      default: "active",
      index: true
    },
    boardingPoint: {
      name: {
        type: String,
        trim: true
      },
      time: {
        type: String,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please provide a valid time format (HH:MM)"]
      },
      address: {
        type: String,
        trim: true
      }
    },
    dropPoint: {
      name: {
        type: String,
        trim: true
      },
      time: {
        type: String,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please provide a valid time format (HH:MM)"]
      },
      address: {
        type: String,
        trim: true
      }
    },
    cancellation: {
      cancelledAt: {
        type: Date,
        default: null
      },
      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      reason: {
        type: String,
        trim: true,
        maxlength: [500, "Cancellation reason cannot exceed 500 characters"]
      },
      refundAmount: {
        type: Number,
        min: [0, "Refund amount cannot be negative"],
        set: val => Math.round(val * 100) / 100
      }
    },
    checkIn: {
      checkedIn: {
        type: Boolean,
        default: false
      },
      checkedInAt: {
        type: Date,
        default: null
      },
      checkedInBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      location: {
        latitude: Number,
        longitude: Number
      }
    },
    generatedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      default: function() {
        const expiry = new Date(this.journeyDetails.date);
        expiry.setDate(expiry.getDate() + 1); // Expire 1 day after journey
        return expiry;
      },
      index: true
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

// Virtual for formatted ticket number
ticketSchema.virtual("formattedTicketNumber").get(function() {
  return `TKT-${this.ticketNumber}`;
});

// Virtual for journey duration
ticketSchema.virtual("journeyDetails.formattedDuration").get(function() {
  if (!this.journeyDetails.duration) return null;
  const hours = Math.floor(this.journeyDetails.duration / 60);
  const minutes = this.journeyDetails.duration % 60;
  return `${hours}h ${minutes}m`;
});

// Virtual for formatted date
ticketSchema.virtual("journeyDetails.formattedDate").get(function() {
  return this.journeyDetails.date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
});

// Virtual for isExpired
ticketSchema.virtual("isExpired").get(function() {
  return new Date() > this.expiresAt;
});

// Virtual for isCancellable
ticketSchema.virtual("isCancellable").get(function() {
  if (this.status !== "active") return false;
  
  const now = new Date();
  const departureDateTime = new Date(this.journeyDetails.date);
  const [hours, minutes] = this.journeyDetails.departureTime.split(':').map(Number);
  departureDateTime.setHours(hours, minutes, 0, 0);
  
  const timeDifference = departureDateTime - now;
  const hoursDifference = timeDifference / (1000 * 60 * 60);
  
  return hoursDifference > 2; // Cancellable if more than 2 hours before departure
});

// Virtual for total passengers
ticketSchema.virtual("passengerCount").get(function() {
  return this.seatNumbers.length;
});

// Indexes for better query performance
ticketSchema.index({ user: 1, status: 1 });
ticketSchema.index({ bus: 1, "journeyDetails.date": 1 });
ticketSchema.index({ "journeyDetails.date": 1, status: 1 });
ticketSchema.index({ isActive: 1, status: 1 });
ticketSchema.index({ "journeyDetails.from": 1, "journeyDetails.to": 1 });

// Pre-save middleware to generate ticket number if not provided
ticketSchema.pre("save", function(next) {
  if (!this.ticketNumber) {
    this.ticketNumber = this._id.toString().slice(-8).toUpperCase();
  }
  
  if (this.isModified("fareDetails")) {
    const { baseFare, tax, serviceCharge } = this.fareDetails;
    this.fareDetails.totalAmount = baseFare + tax + serviceCharge;
  }
  
  next();
});

// Pre-save middleware to update status if expired
ticketSchema.pre("save", function(next) {
  if (this.isModified("expiresAt") || this.isNew) {
    if (new Date() > this.expiresAt && this.status === "active") {
      this.status = "expired";
    }
  }
  next();
});

// Static method to find active tickets by user
ticketSchema.statics.findActiveByUser = function(userId) {
  return this.find({
    user: userId,
    status: "active",
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).populate("bus", "busNumber busName operator");
};

// Static method to find tickets by journey date
ticketSchema.statics.findByJourneyDate = function(date, page = 1, limit = 50) {
  const startDate = new Date(date);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);
  
  return this.find({
    "journeyDetails.date": {
      $gte: startDate,
      $lt: endDate
    },
    isActive: true
  })
  .sort({ "journeyDetails.departureTime": 1 })
  .limit(limit * 1)
  .skip((page - 1) * limit);
};

// Static method to check seat availability
ticketSchema.statics.checkSeatAvailability = async function(busId, date, seatNumbers) {
  const existingTickets = await this.find({
    bus: busId,
    "journeyDetails.date": date,
    status: "active",
    seatNumbers: { $in: seatNumbers }
  });

  return seatNumbers.map(seat => ({
    seat,
    available: !existingTickets.some(ticket => ticket.seatNumbers.includes(seat))
  }));
};

// Instance method to cancel ticket
ticketSchema.methods.cancel = function(userId, reason = "User requested cancellation", refundAmount = 0) {
  if (this.status !== "active") {
    throw new Error("Only active tickets can be cancelled");
  }
  
  if (!this.isCancellable) {
    throw new Error("Ticket is no longer cancellable");
  }
  
  this.status = "cancelled";
  this.cancellation = {
    cancelledAt: new Date(),
    cancelledBy: userId,
    reason: reason,
    refundAmount: refundAmount
  };
  
  return this.save();
};

// Instance method to mark as used
ticketSchema.methods.markAsUsed = function(userId, location = null) {
  if (this.status !== "active") {
    throw new Error("Only active tickets can be marked as used");
  }
  
  this.status = "used";
  this.checkIn = {
    checkedIn: true,
    checkedInAt: new Date(),
    checkedInBy: userId,
    location: location
  };
  
  return this.save();
};

// Instance method to generate QR code data (would integrate with QR service)
ticketSchema.methods.generateQRData = function() {
  return JSON.stringify({
    ticketId: this._id.toString(),
    ticketNumber: this.ticketNumber,
    userId: this.user.toString(),
    busId: this.bus.toString(),
    seatNumbers: this.seatNumbers,
    date: this.journeyDetails.date,
    from: this.journeyDetails.from,
    to: this.journeyDetails.to
  });
};

module.exports = mongoose.model("Ticket", ticketSchema);