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
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
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

// Virtual for busType (alias for seatType for frontend compatibility)
busSchema.virtual('busType').get(function() {
  return this.seatType;
});

// Method to check if bus has specific amenity
busSchema.methods.hasAmenity = function(amenity) {
  return this.availableAmenities.includes(amenity);
};

// Method to generate seat layout based on bus type
busSchema.methods.generateSeatLayout = function() {
  if (this.seatType === SEAT_TYPES.SLEEPER || this.seatType === SEAT_TYPES.SEMI_SLEEPER) {
    // Sleeper layout: 2+1 configuration (NEW FORMAT: left/right)
    // Right side: 2 berths (upper + lower) per row
    // Left side: 1 berth (upper + lower) per row
    const rows = Math.ceil(this.totalSeats / 6); // 6 seats per row
    
    const leftUpper = [];
    const leftLower = [];
    const rightUpper = [];
    const rightLower = [];
    
    let seatCount = 0;
    for (let row = 1; row <= rows && seatCount < this.totalSeats; row++) {
      // Right side - 2 seats (column 1 and 2)
      if (seatCount < this.totalSeats) {
        rightUpper.push({
          seatNumber: `U${row}-1`,
          seatType: 'upper',
          position: { row, side: 'right', level: 'upper', seat: 1 }
        });
        seatCount++;
      }
      if (seatCount < this.totalSeats) {
        rightLower.push({
          seatNumber: `L${row}-1`,
          seatType: 'lower',
          position: { row, side: 'right', level: 'lower', seat: 1 }
        });
        seatCount++;
      }
      if (seatCount < this.totalSeats) {
        rightUpper.push({
          seatNumber: `U${row}-2`,
          seatType: 'upper',
          position: { row, side: 'right', level: 'upper', seat: 2 }
        });
        seatCount++;
      }
      if (seatCount < this.totalSeats) {
        rightLower.push({
          seatNumber: `L${row}-2`,
          seatType: 'lower',
          position: { row, side: 'right', level: 'lower', seat: 2 }
        });
        seatCount++;
      }
      
      // Left side - 1 seat (column 3)
      if (seatCount < this.totalSeats) {
        leftUpper.push({
          seatNumber: `U${row}-3`,
          seatType: 'upper',
          position: { row, side: 'left', level: 'upper', seat: 1 }
        });
        seatCount++;
      }
      if (seatCount < this.totalSeats) {
        leftLower.push({
          seatNumber: `L${row}-3`,
          seatType: 'lower',
          position: { row, side: 'left', level: 'lower', seat: 1 }
        });
        seatCount++;
      }
    }
    
    this.seatLayout = {
      left: { upper: leftUpper, lower: leftLower },
      right: { upper: rightUpper, lower: rightLower },
      totalRows: rows,
      // Keep old format for backward compatibility
      lowerDeck: { rows: 0, seatsPerRow: 0, seats: [] },
      upperDeck: { rows: 0, seatsPerRow: 0, seats: [] }
    };
  } else {
    // Seater layout: 2+2 configuration (NEW FORMAT: left/right)
    const rows = Math.ceil(this.totalSeats / 4); // 4 seats per row
    
    const leftLower = [];
    const rightLower = [];
    
    let seatCount = 0;
    for (let row = 1; row <= rows && seatCount < this.totalSeats; row++) {
      // Left side - 2 seats
      if (seatCount < this.totalSeats) {
        leftLower.push({
          seatNumber: `${row}A`,
          seatType: 'single',
          position: { row, side: 'left', level: 'lower', seat: 1 }
        });
        seatCount++;
      }
      if (seatCount < this.totalSeats) {
        leftLower.push({
          seatNumber: `${row}B`,
          seatType: 'single',
          position: { row, side: 'left', level: 'lower', seat: 2 }
        });
        seatCount++;
      }
      
      // Right side - 2 seats
      if (seatCount < this.totalSeats) {
        rightLower.push({
          seatNumber: `${row}C`,
          seatType: 'single',
          position: { row, side: 'right', level: 'lower', seat: 1 }
        });
        seatCount++;
      }
      if (seatCount < this.totalSeats) {
        rightLower.push({
          seatNumber: `${row}D`,
          seatType: 'single',
          position: { row, side: 'right', level: 'lower', seat: 2 }
        });
        seatCount++;
      }
    }
    
    this.seatLayout = {
      left: { upper: [], lower: leftLower },
      right: { upper: [], lower: rightLower },
      totalRows: rows,
      // Keep old format for backward compatibility
      lowerDeck: { rows: 0, seatsPerRow: 0, seats: [] },
      upperDeck: { rows: 0, seatsPerRow: 0, seats: [] }
    };
  }

  return this.seatLayout;
};

module.exports = mongoose.model('Bus', busSchema);