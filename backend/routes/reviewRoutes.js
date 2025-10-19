// FILE: backend/routes/reviewRoutes.js
/**
 * Review management routes
 * Defines endpoints for review operations
 */

const express = require('express');
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

/**
 * @route   POST /api/v1/reviews
 * @desc    Create a new review
 * @access  Private
 */
router.post('/', reviewController.createReview);

/**
 * @route   GET /api/v1/reviews/trip/:tripId
 * @desc    Get reviews for a trip
 * @access  Private
 */
router.get('/trip/:tripId', reviewController.getTripReviews);

/**
 * @route   GET /api/v1/reviews/my-reviews
 * @desc    Get user's reviews
 * @access  Private
 */
router.get('/my-reviews', reviewController.getMyReviews);

/**
 * @route   PUT /api/v1/reviews/:id
 * @desc    Update a review
 * @access  Private
 */
router.put('/:id', reviewController.updateReview);

/**
 * @route   DELETE /api/v1/reviews/:id
 * @desc    Delete a review
 * @access  Private
 */
router.delete('/:id', reviewController.deleteReview);

module.exports = router;