// FILE: backend/models/reviewModel.js
/**
 * Review model for MongoDB
 * Defines review schema for trip ratings and feedback
 */

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: [true, 'Trip is required']
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: [true, 'Booking is required']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  categories: {
    cleanliness: {
      type: Number,
      min: 1,
      max: 5
    },
    comfort: {
      type: Number,
      min: 1,
      max: 5
    },
    staff: {
      type: Number,
      min: 1,
      max: 5
    },
    punctuality: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  isVerified: {
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

// Compound index to ensure one review per booking per user
reviewSchema.index({ user: 1, booking: 1 }, { unique: true });
reviewSchema.index({ trip: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });

// Static method to get average rating for a trip
reviewSchema.statics.getAverageRating = async function(tripId) {
  const result = await this.aggregate([
    {
      $match: { 
        trip: mongoose.Types.ObjectId(tripId),
        isActive: true 
      }
    },
    {
      $group: {
        _id: '$trip',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingBreakdown: {
          $push: '$rating'
        }
      }
    }
  ]);

  if (result.length > 0) {
    const ratings = result[0].ratingBreakdown;
    const breakdown = {
      1: ratings.filter(r => r === 1).length,
      2: ratings.filter(r => r === 2).length,
      3: ratings.filter(r => r === 3).length,
      4: ratings.filter(r => r === 4).length,
      5: ratings.filter(r => r === 5).length
    };

    return {
      averageRating: Math.round(result[0].averageRating * 10) / 10,
      totalReviews: result[0].totalReviews,
      breakdown
    };
  }

  return {
    averageRating: 0,
    totalReviews: 0,
    breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  };
};

// Static method to get reviews for a trip with pagination
reviewSchema.statics.findByTrip = function(tripId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  return this.find({ 
    trip: tripId,
    isActive: true 
  })
  .populate('user', 'name')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);
};

// Pre-save middleware to verify if user actually took the trip
reviewSchema.pre('save', async function(next) {
  const Booking = mongoose.model('Booking');
  
  // Check if the user has a completed booking for this trip
  const booking = await Booking.findOne({
    user: this.user,
    trip: this.trip,
    bookingStatus: 'completed'
  });

  this.isVerified = !!booking;
  next();
});

module.exports = mongoose.model('Review', reviewSchema);