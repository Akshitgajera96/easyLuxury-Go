// FILE: backend/controllers/reviewController.js
/**
 * Review controller handling HTTP requests for review operations
 * Routes: /api/v1/reviews/*
 */

const reviewService = require('../services/reviewService');

/**
 * Create a new review
 * POST /api/v1/reviews
 */
const createReview = async (req, res, next) => {
  try {
    const {
      tripId,
      bookingId,
      rating,
      comment,
      categories
    } = req.body;

    // Basic validation
    if (!tripId || !bookingId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID, booking ID, and rating are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const review = await reviewService.createReview(
      {
        tripId,
        bookingId,
        rating,
        comment,
        categories
      },
      req.user._id
    );

    res.status(201).json({
      success: true,
      data: { review },
      message: 'Review created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get reviews for a trip
 * GET /api/v1/reviews/trip/:tripId
 */
const getTripReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await reviewService.getTripReviews(
      req.params.tripId,
      parseInt(page),
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Reviews fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's reviews
 * GET /api/v1/reviews/my-reviews
 */
const getMyReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await reviewService.getUserReviews(
      req.user._id,
      parseInt(page),
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Your reviews fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a review
 * PUT /api/v1/reviews/:id
 */
const updateReview = async (req, res, next) => {
  try {
    const { rating, comment, categories } = req.body;

    const review = await reviewService.updateReview(
      req.params.id,
      req.user._id,
      { rating, comment, categories }
    );

    res.status(200).json({
      success: true,
      data: { review },
      message: 'Review updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a review
 * DELETE /api/v1/reviews/:id
 */
const deleteReview = async (req, res, next) => {
  try {
    const result = await reviewService.deleteReview(
      req.params.id,
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getTripReviews,
  getMyReviews,
  updateReview,
  deleteReview
};