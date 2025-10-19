// FILE: backend/models/tripModel.js
/**
 * Trip model for MongoDB
 * Defines scheduled trips with bus, route, and booking information
 */

const mongoose = require('mongoose');
const { TRIP_STATUS } = require('../constants/enums');

const tripSchema = new mongoose.Schema({
  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: [true, 'Bus is required']
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: [true, 'Route is required']
  },
  departureDateTime: {
    type: Date,
    required: [true, 'Departure date and time is required']
  },
  arrivalDateTime: {
    type: Date,
    required: [true, 'Arrival date and time is required']
  },
  baseFare: {
    type: Number,
    required: [true, 'Base fare is required'],
    min: [1, 'Fare must be at least ₹1']
  },
  seatPricing: {
    single: {
      type: Number,
      default: 0
    },
    double: {
      type: Number,
      default: 0
    },
    sleeperLower: {
      type: Number,
      default: 0
    },
    sleeperUpper: {
      type: Number,
      default: 0
    }
  },
  bookedSeats: [{
    seatNumber: {
      type: String,
      required: true,
      trim: true
    },
    seatType: {
      type: String,
      enum: ['single', 'double', 'sleeper-lower', 'sleeper-upper']
    },
    fare: {
      type: Number,
      required: true
    },
    passengerName: {
      type: String,
      required: true,
      trim: true
    },
    passengerAge: {
      type: Number,
      required: true,
      min: 1,
      max: 120
    },
    passengerGender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    }
  }],
  availableSeats: {
    type: Number,
    required: [true, 'Available seats count is required'],
    min: [0, 'Available seats cannot be negative']
  },
  status: {
    type: String,
    enum: Object.values(TRIP_STATUS),
    default: TRIP_STATUS.SCHEDULED
  },
  driver: {
    name: String,
    phone: String,
    licenseNumber: String
  },
  conductor: {
    name: String,
    phone: String
  },
  currentLocation: {
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    },
    lastUpdated: {
      type: Date,
      default: null
    },
    speed: {
      type: Number,
      default: 0 // km/h
    },
    heading: {
      type: Number,
      default: 0 // degrees
    }
  },
  locationHistory: [{
    latitude: Number,
    longitude: Number,
    timestamp: Date,
    speed: Number
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for trip queries
tripSchema.index({ bus: 1 });
tripSchema.index({ route: 1 });
tripSchema.index({ departureDateTime: 1 });
tripSchema.index({ status: 1 });
tripSchema.index({ 'bookedSeats.seatNumber': 1 });

// Virtual for occupancy percentage
tripSchema.virtual('occupancy').get(function() {
  const bus = this.bus;
  if (bus && bus.totalSeats) {
    return (this.bookedSeats.length / bus.totalSeats) * 100;
  }
  return 0;
});

// Method to check if seat is available
tripSchema.methods.isSeatAvailable = function(seatNumber) {
  return !this.bookedSeats.some(seat => seat.seatNumber === seatNumber);
};

// Method to book seats
tripSchema.methods.bookSeats = function(seats, passengerInfo, bookingId) {
  const bookedSeats = passengerInfo.map(passenger => ({
    seatNumber: passenger.seatNumber,
    passengerName: passenger.name,
    passengerAge: passenger.age,
    passengerGender: passenger.gender,
    bookingId: bookingId
  }));

  this.bookedSeats.push(...bookedSeats);
  this.availableSeats -= seats.length;
  
  return this.save();
};

// Method to cancel seat booking
tripSchema.methods.cancelSeats = function(bookingId) {
  const seatsToRemove = this.bookedSeats.filter(seat => 
    seat.bookingId.toString() === bookingId.toString()
  );
  
  this.bookedSeats = this.bookedSeats.filter(seat => 
    seat.bookingId.toString() !== bookingId.toString()
  );
  
  this.availableSeats += seatsToRemove.length;
  
  return this.save();
};

// Pre-save middleware to calculate available seats
tripSchema.pre('save', async function(next) {
  if (this.isModified('bus') && this.bus) {
    const Bus = mongoose.model('Bus');
    const bus = await Bus.findById(this.bus);
    if (bus) {
      this.availableSeats = bus.totalSeats - this.bookedSeats.length;
    }
  }
  next();
});

module.exports = mongoose.model('Trip', tripSchema);