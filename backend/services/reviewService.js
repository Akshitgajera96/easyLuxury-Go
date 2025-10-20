// FILE: backend/services/reviewService.js
/**
 * Review service handling review creation and retrieval
 * Business logic for review operations
 */

const Review = require('../models/reviewModel');
const Booking = require('../models/bookingModel');
const MESSAGES = require('../constants/messages');

/**
 * Create a new review
 * @param {object} reviewData - Review data
 * @param {string} userId - User ID creating the review
 * @returns {object} Created review
 */
const createReview = async (reviewData, userId) => {
  const {
    tripId,
    bookingId,
    rating,
    comment,
    categories
  } = reviewData;

  // Validate required fields
  if (!tripId || !bookingId || !rating) {
    throw new Error('Trip ID, booking ID, and rating are required');
  }

  // Check if user has a completed booking for this trip
  const booking = await Booking.findOne({
    _id: bookingId,
    user: userId,
    trip: tripId,
    bookingStatus: 'completed'
  });

  if (!booking) {
    throw new Error('You can only review trips you have completed');
  }

  // Check if user has already reviewed this booking
  const existingReview = await Review.findOne({
    user: userId,
    booking: bookingId
  });

  if (existingReview) {
    throw new Error('You have already reviewed this trip');
  }

  // Create review
  const review = new Review({
    user: userId,
    trip: tripId,
    booking: bookingId,
    rating,
    comment,
    categories: categories || {}
  });

  await review.save();
  
  // Populate user info for response
  await review.populate('user', 'name');

  return review;
};

/**
 * Get reviews for a trip
 * @param {string} tripId - Trip ID
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {object} Reviews and pagination info
 */
const getTripReviews = async (tripId, page = 1, limit = 10) => {
  const reviews = await Review.findByTrip(tripId, page, limit);
  const total = await Review.countDocuments({ 
    trip: tripId,
    isActive: true 
  });

  // Get average rating and breakdown
  const ratingStats = await Review.getAverageRating(tripId);

  return {
    reviews,
    ratingStats,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get user's reviews
 * @param {string} userId - User ID
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {object} Reviews and pagination info
 */
const getUserReviews = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const reviews = await Review.find({ 
    user: userId,
    isActive: true 
  })
  .populate('trip')
  .populate({
    path: 'trip',
    populate: [
      { path: 'bus' },
      { path: 'route' }
    ]
  })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);

  const total = await Review.countDocuments({ 
    user: userId,
    isActive: true 
  });

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Update a review
 * @param {string} reviewId - Review ID
 * @param {string} userId - User ID
 * @param {object} updateData - Data to update
 * @returns {object} Updated review
 */
const updateReview = async (reviewId, userId, updateData) => {
  const review = await Review.findOne({
    _id: reviewId,
    user: userId
  });

  if (!review) {
    throw new Error('Review not found');
  }

  // Update allowed fields
  const allowedUpdates = ['rating', 'comment', 'categories'];
  Object.keys(updateData).forEach(key => {
    if (allowedUpdates.includes(key) && updateData[key] !== undefined) {
      review[key] = updateData[key];
    }
  });

  await review.save();
  await review.populate('user', 'name');

  return review;
};

/**
 * Delete a review (soft delete)
 * @param {string} reviewId - Review ID
 * @param {string} userId - User ID
 * @returns {object} Deletion result
 */
const deleteReview = async (reviewId, userId) => {
  const review = await Review.findOne({
    _id: reviewId,
    user: userId
  });

  if (!review) {
    throw new Error('Review not found');
  }

  review.isActive = false;
  await review.save();

  return { message: 'Review deleted successfully' };
};

module.exports = {
  createReview,
  getTripReviews,
  getUserReviews,
  updateReview,
  deleteReview
};