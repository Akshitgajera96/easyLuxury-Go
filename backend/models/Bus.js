const mongoose = require("mongoose");

// Individual seat structure
const seatSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: [true, "Seat number is required"],
    min: [1, "Seat number must be at least 1"]
  },
  isBooked: {
    type: Boolean,
    default: false
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  bookingType: {
    type: String,
    enum: {
      values: ["online", "offline", null],
      message: "Booking type must be either 'online', 'offline', or null"
    },
    default: null
  },
  bookedAt: {
    type: Date,
    default: null
  },
  seatType: {
    type: String,
    enum: ["standard", "premium", "sleeper"],
    default: "standard"
  },
  priceMultiplier: {
    type: Number,
    default: 1.0,
    min: [0.5, "Price multiplier cannot be less than 0.5"],
    max: [2.0, "Price multiplier cannot exceed 2.0"]
  }
});

// Route stop structure
const routeStopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Stop name is required"],
    trim: true,
    maxlength: [100, "Stop name cannot exceed 100 characters"]
  },
  time: {
    type: String,
    required: [true, "Stop time is required"],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please provide a valid time format (HH:MM)"]
  },
  order: {
    type: Number,
    required: [true, "Stop order is required"],
    min: [1, "Stop order must be at least 1"]
  },
  distanceFromStart: {
    type: Number,
    min: [0, "Distance cannot be negative"],
    default: 0
  }
});

// Amenities structure
const amenitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  available: {
    type: Boolean,
    default: true
  },
  icon: {
    type: String,
    default: ""
  }
});

// Main Bus schema
const busSchema = new mongoose.Schema(
  {
    busNumber: {
      type: String,
      required: [true, "Bus number is required"],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9\-]+$/, "Bus number can only contain letters, numbers, and hyphens"]
    },
    busName: {
      type: String,
      required: [true, "Bus name is required"],
      trim: true,
      maxlength: [100, "Bus name cannot exceed 100 characters"]
    },
    operator: {
      type: String,
      required: [true, "Bus operator is required"],
      trim: true
    },
    totalSeats: {
      type: Number,
      required: [true, "Total seats is required"],
      min: [1, "Bus must have at least 1 seat"],
      max: [100, "Bus cannot have more than 100 seats"]
    },
    availableSeats: {
      type: Number,
      required: [true, "Available seats is required"],
      min: [0, "Available seats cannot be negative"],
      validate: {
        validator: function(val) {
          return val <= this.totalSeats;
        },
        message: "Available seats cannot exceed total seats"
      }
    },
    seats: [seatSchema],
    route: {
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
      stops: [routeStopSchema],
      distance: {
        type: Number,
        required: [true, "Distance is required"],
        min: [1, "Distance must be at least 1 km"]
      },
      duration: {
        type: Number, // Duration in minutes
        required: [true, "Duration is required"],
        min: [1, "Duration must be at least 1 minute"]
      },
      type: {
        type: String,
        enum: ["intercity", "intracity", "express", "luxury"],
        default: "intercity"
      }
    },
    schedule: {
      departure: {
        type: Date,
        required: [true, "Departure time is required"],
        index: true
      },
      arrival: {
        type: Date,
        required: [true, "Arrival time is required"]
      },
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "one-time"],
        default: "daily"
      }
    },
    basePrice: {
      type: Number,
      required: [true, "Base price is required"],
      min: [0, "Price cannot be negative"],
      set: val => Math.round(val * 100) / 100 // Store with 2 decimal precision
    },
    amenities: [amenitySchema],
    photos: [{
      type: String,
      validate: {
        validator: function(url) {
          return /^https?:\/\/.+\..+$/.test(url);
        },
        message: "Please provide a valid URL for photos"
      }
    }],
    features: {
      ac: {
        type: Boolean,
        default: false
      },
      wifi: {
        type: Boolean,
        default: false
      },
      chargingPoints: {
        type: Boolean,
        default: false
      },
      entertainment: {
        type: Boolean,
        default: false
      },
      toilet: {
        type: Boolean,
        default: false
      }
    },
    status: {
      type: String,
      enum: ["active", "maintenance", "out_of_service", "scheduled"],
      default: "active",
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    captain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Captain",
      default: null
    },
    statusReason: {
      type: String,
      maxlength: [500, "Status reason cannot exceed 500 characters"],
      default: ""
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for formatted duration
busSchema.virtual("route.formattedDuration").get(function() {
  const hours = Math.floor(this.route.duration / 60);
  const minutes = this.route.duration % 60;
  return `${hours}h ${minutes}m`;
});

// Virtual for formatted distance
busSchema.virtual("route.formattedDistance").get(function() {
  return `${this.route.distance} km`;
});

// Virtual for departure date (without time)
busSchema.virtual("departureDate").get(function() {
  return this.schedule.departure.toISOString().split('T')[0];
});

// Virtual for available seat percentages
busSchema.virtual("occupancyPercentage").get(function() {
  return Math.round(((this.totalSeats - this.availableSeats) / this.totalSeats) * 100);
});

// Indexes for better query performance
busSchema.index({ "route.from": 1, "route.to": 1 });
busSchema.index({ "schedule.departure": 1, status: 1 });
busSchema.index({ isActive: 1, status: 1 });
busSchema.index({ busNumber: 1 });
busSchema.index({ operator: 1 });

// Pre-save middleware to sync available seats with actual bookings
busSchema.pre("save", function(next) {
  if (this.isModified("seats")) {
    const bookedSeats = this.seats.filter(seat => seat.isBooked).length;
    this.availableSeats = this.totalSeats - bookedSeats;
    
    // Validate available seats doesn't exceed total
    if (this.availableSeats < 0) {
      return next(new Error("Available seats cannot be negative"));
    }
  }
  next();
});

// Static method to find buses by route and date
busSchema.statics.findByRouteAndDate = function(from, to, date) {
  const startDate = new Date(date);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);
  
  return this.find({
    "route.from": new RegExp(from, "i"),
    "route.to": new RegExp(to, "i"),
    "schedule.departure": {
      $gte: startDate,
      $lt: endDate
    },
    isActive: true,
    status: "active"
  });
};

// Static method to get available seats for a bus
busSchema.statics.getAvailableSeats = function(busId) {
  return this.findById(busId).then(bus => {
    if (!bus) return [];
    return bus.seats.filter(seat => !seat.isBooked).map(seat => seat.number);
  });
};

// Instance method to book a seat
busSchema.methods.bookSeat = function(seatNumber, userId, bookingType = "online") {
  const seat = this.seats.find(s => s.number === seatNumber);
  
  if (!seat) {
    throw new Error(`Seat ${seatNumber} not found`);
  }
  
  if (seat.isBooked) {
    throw new Error(`Seat ${seatNumber} is already booked`);
  }
  
  seat.isBooked = true;
  seat.bookedBy = userId;
  seat.bookingType = bookingType;
  seat.bookedAt = new Date();
  
  this.availableSeats--;
  
  return this.save();
};

// Instance method to release a seat
busSchema.methods.releaseSeat = function(seatNumber) {
  const seat = this.seats.find(s => s.number === seatNumber);
  
  if (!seat) {
    throw new Error(`Seat ${seatNumber} not found`);
  }
  
  if (!seat.isBooked) {
    throw new Error(`Seat ${seatNumber} is not booked`);
  }
  
  seat.isBooked = false;
  seat.bookedBy = null;
  seat.bookingType = null;
  seat.bookedAt = null;
  
  this.availableSeats++;
  
  return this.save();
};

// Instance method to calculate seat price
busSchema.methods.getSeatPrice = function(seatNumber) {
  const seat = this.seats.find(s => s.number === seatNumber);
  if (!seat) throw new Error(`Seat ${seatNumber} not found`);
  
  return this.basePrice * seat.priceMultiplier;
};

module.exports = mongoose.model("Bus", busSchema);