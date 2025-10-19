// FILE: backend/models/busModel.js
/**
 * Bus model for MongoDB
 * Defines bus schema with amenities and seat configuration
 */

const mongoose = require('mongoose');
const { SEAT_TYPES, AMENITIES } = require('../constants/enums');

const busSchema = new mongoose.Schema({
  busNumber: {
    type: String,
    required: [true, 'Bus number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  busName: {
    type: String,
    required: [true, 'Bus name is required'],
    trim: true,
    maxlength: [100, 'Bus name cannot exceed 100 characters']
  },
  operator: {
    type: String,
    required: [true, 'Operator name is required'],
    trim: true
  },
  totalSeats: {
    type: Number,
    required: [true, 'Total seats is required'],
    min: [1, 'Bus must have at least 1 seat'],
    max: [100, 'Bus cannot have more than 100 seats']
  },
  seatType: {
    type: String,
    enum: Object.values(SEAT_TYPES),
    required: [true, 'Seat type is required']
  },
  amenities: [{
    type: String,
    enum: Object.values(AMENITIES)
  }],
  seatLayout: {
    // Old structure (for backward compatibility)
    lowerDeck: {
      rows: {
        type: Number,
        default: 0
      },
      seatsPerRow: {
        type: Number,
        default: 0
      },
      seats: [{
        seatNumber: String,
        seatType: {
          type: String,
          enum: ['single', 'double', 'sleeper-lower', 'sleeper-upper']
        },
        position: {
          row: Number,
          column: Number
        }
      }]
    },
    upperDeck: {
      rows: {
        type: Number,
        default: 0
      },
      seatsPerRow: {
        type: Number,
        default: 0
      },
      seats: [{
        seatNumber: String,
        seatType: {
          type: String,
          enum: ['single', 'double', 'sleeper-lower', 'sleeper-upper']
        },
        position: {
          row: Number,
          column: Number
        }
      }]
    },
    // New structure (left/right with upper/lower)
    left: {
      upper: [{
        seatNumber: String,
        seatType: String,
        position: {
          row: Number,
          side: String,
          level: String,
          seat: Number
        }
      }],
      lower: [{
        seatNumber: String,
        seatType: String,
        position: {
          row: Number,
          side: String,
          level: String,
          seat: Number
        }
      }]
    },
    right: {
      upper: [{
        seatNumber: String,
        seatType: String,
        position: {
          row: Number,
          side: String,
          level: String,
          seat: Number
        }
      }],
      lower: [{
        seatNumber: String,
        seatType: String,
        position: {
          row: Number,
          side: String,
          level: String,
          seat: Number
        }
      }]
    },
    totalRows: {
      type: Number,
      default: 0
    }
  },
  hasAC: {
    type: Boolean,
    default: false
  },
  hasWifi: {
    type: Boolean,
    default: false
  },
  hasCharging: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
busSchema.index({ busNumber: 1 });
busSchema.index({ operator: 1 });
busSchema.index({ seatType: 1 });
busSchema.index({ isActive: 1 });

// Virtual for available amenities
busSchema.virtual('availableAmenities').get(function() {
  const amenities = [];
  if (this.hasAC) amenities.push(AMENITIES.AC);
  if (this.hasWifi) amenities.push(AMENITIES.WIFI);
  if (this.hasCharging) amenities.push(AMENITIES.CHARGING_POINT);
  return [...amenities, ...this.amenities];
});

// Method to check if bus has specific amenity
busSchema.methods.hasAmenity = function(amenity) {
  return this.availableAmenities.includes(amenity);
};

// Method to generate seat layout based on bus type
busSchema.methods.generateSeatLayout = function() {
  const seats = [];
  
  if (this.seatType === SEAT_TYPES.SLEEPER || this.seatType === SEAT_TYPES.SEMI_SLEEPER) {
    // Sleeper layout: 2+1 configuration
    // Left side: 2 berths (lower + upper)
    // Right side: 1 berth (lower + upper)
    const rows = Math.ceil(this.totalSeats / 6); // 6 seats per row (2 lower + 2 upper on left, 1 lower + 1 upper on right)
    
    for (let row = 1; row <= rows; row++) {
      // Left side - double berths
      seats.push({
        seatNumber: `L${row}-1`,
        seatType: 'sleeper-lower',
        position: { row, column: 1 }
      });
      seats.push({
        seatNumber: `U${row}-1`,
        seatType: 'sleeper-upper',
        position: { row, column: 1 }
      });
      seats.push({
        seatNumber: `L${row}-2`,
        seatType: 'sleeper-lower',
        position: { row, column: 2 }
      });
      seats.push({
        seatNumber: `U${row}-2`,
        seatType: 'sleeper-upper',
        position: { row, column: 2 }
      });
      
      // Right side - single berth
      seats.push({
        seatNumber: `L${row}-3`,
        seatType: 'sleeper-lower',
        position: { row, column: 3 }
      });
      seats.push({
        seatNumber: `U${row}-3`,
        seatType: 'sleeper-upper',
        position: { row, column: 3 }
      });
    }
    
    this.seatLayout = {
      lowerDeck: {
        rows: rows,
        seatsPerRow: 6,
        seats: seats.slice(0, this.totalSeats)
      },
      upperDeck: {
        rows: 0,
        seatsPerRow: 0,
        seats: []
      }
    };
  } else {
    // Seater layout: 2+2 configuration
    const rows = Math.ceil(this.totalSeats / 4); // 4 seats per row
    
    for (let row = 1; row <= rows; row++) {
      seats.push({
        seatNumber: `${row}A`,
        seatType: 'single',
        position: { row, column: 1 }
      });
      seats.push({
        seatNumber: `${row}B`,
        seatType: 'single',
        position: { row, column: 2 }
      });
      seats.push({
        seatNumber: `${row}C`,
        seatType: 'single',
        position: { row, column: 3 }
      });
      seats.push({
        seatNumber: `${row}D`,
        seatType: 'single',
        position: { row, column: 4 }
      });
    }
    
    this.seatLayout = {
      lowerDeck: {
        rows: rows,
        seatsPerRow: 4,
        seats: seats.slice(0, this.totalSeats)
      },
      upperDeck: {
        rows: 0,
        seatsPerRow: 0,
        seats: []
      }
    };
  }

  return this.seatLayout;
};

module.exports = mongoose.model('Bus', busSchema);