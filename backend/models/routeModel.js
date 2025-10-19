// FILE: backend/models/routeModel.js
/**
 * Route model for MongoDB
 * Defines bus routes with source, destination, and fare information
 */

const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  routeNumber: {
    type: String,
    trim: true
  },
  sourceCity: {
    type: String,
    required: [true, 'Source city is required'],
    trim: true
  },
  destinationCity: {
    type: String,
    required: [true, 'Destination city is required'],
    trim: true
  },
  stops: [{
    type: String,
    trim: true
  }],
  distance: {
    type: Number,
    required: [true, 'Distance is required'],
    min: [1, 'Distance must be at least 1 km']
  },
  estimatedDuration: {
    type: Number,
    required: [true, 'Estimated duration is required'],
    min: [0.5, 'Duration must be at least 0.5 hours']
  },
  baseFare: {
    type: Number,
    required: [true, 'Base fare is required'],
    min: [1, 'Base fare must be at least ₹1']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  dynamicPricing: {
    isEnabled: {
      type: Boolean,
      default: false
    },
    peakMultiplier: {
      type: Number,
      default: 1.2,
      min: [1, 'Peak multiplier must be at least 1'],
      max: [3, 'Peak multiplier cannot exceed 3']
    },
    lastMinuteMultiplier: {
      type: Number,
      default: 1.1,
      min: [1, 'Last minute multiplier must be at least 1'],
      max: [2, 'Last minute multiplier cannot exceed 2']
    }
  }
}, {
  timestamps: true
});

// Index for route queries
routeSchema.index({ routeNumber: 1 });
routeSchema.index({ sourceCity: 1, destinationCity: 1 });
routeSchema.index({ isActive: 1 });

// Virtual for formatted duration
routeSchema.virtual('formattedDuration').get(function() {
  const hours = Math.floor(this.estimatedDuration);
  const minutes = Math.round((this.estimatedDuration - hours) * 60);
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
});

// Virtual for route name
routeSchema.virtual('routeName').get(function() {
  return `${this.sourceCity} to ${this.destinationCity}`;
});

// Method to calculate dynamic fare
routeSchema.methods.calculateDynamicFare = function(occupancy = 0.5, hoursToDeparture = 24) {
  let fare = this.baseFare;
  
  if (this.dynamicPricing.isEnabled) {
    // Peak time multiplier (evening 6-10 PM)
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 18 && hour <= 22) {
      fare *= this.dynamicPricing.peakMultiplier;
    }
    
    // Last minute booking multiplier
    if (hoursToDeparture < 6) {
      fare *= this.dynamicPricing.lastMinuteMultiplier;
    }
    
    // Occupancy based pricing
    if (occupancy > 0.8) {
      fare *= 1.3; // High demand
    } else if (occupancy < 0.3) {
      fare *= 0.8; // Low demand discount
    }
  }
  
  return Math.round(fare);
};

module.exports = mongoose.model('Route', routeSchema);