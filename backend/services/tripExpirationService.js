// FILE: backend/services/tripExpirationService.js
/**
 * Service for automatically marking expired trips
 * Runs on a schedule to update trip statuses based on departure date
 */

const Trip = require('../models/tripModel');
const { TRIP_STATUS } = require('../constants/enums');
const logger = require('../utils/logger');

/**
 * Mark trips as expired if their departure date has passed
 * @returns {Promise<number>} Number of trips marked as expired
 */
const markExpiredTrips = async () => {
  try {
    const now = new Date();
    
    // Find all trips with departure date in the past that are not already expired/cancelled/completed
    const result = await Trip.updateMany(
      {
        departureDateTime: { $lt: now },
        status: {
          $nin: [TRIP_STATUS.EXPIRED, TRIP_STATUS.CANCELLED, TRIP_STATUS.ARRIVED]
        }
      },
      {
        $set: {
          status: TRIP_STATUS.EXPIRED,
          isActive: false
        }
      }
    );

    if (result.modifiedCount > 0) {
      logger.info(`Marked ${result.modifiedCount} trips as expired`);
    }

    return result.modifiedCount;
  } catch (error) {
    logger.error(`Error marking expired trips: ${error.message}`);
    throw error;
  }
};

/**
 * Get all expired trips for admin review
 * @param {number} limit - Maximum number of trips to return
 * @returns {Promise<Array>} Array of expired trips
 */
const getExpiredTrips = async (limit = 50) => {
  try {
    const expiredTrips = await Trip.find({
      status: TRIP_STATUS.EXPIRED
    })
      .populate('bus')
      .populate('route')
      .sort({ departureDateTime: -1 })
      .limit(limit);

    return expiredTrips;
  } catch (error) {
    logger.error(`Error fetching expired trips: ${error.message}`);
    throw error;
  }
};

/**
 * Check if a specific trip is expired
 * @param {string} tripId - Trip ID
 * @returns {Promise<boolean>} True if trip is expired
 */
const isTripExpired = async (tripId) => {
  try {
    const trip = await Trip.findById(tripId);
    
    if (!trip) {
      return false;
    }

    const now = new Date();
    return trip.departureDateTime < now && trip.status !== TRIP_STATUS.EXPIRED;
  } catch (error) {
    logger.error(`Error checking trip expiration: ${error.message}`);
    return false;
  }
};

/**
 * Scheduler function to run periodically
 * Should be called every hour or on server startup
 */
let schedulerInterval = null;

const startExpirationScheduler = () => {
  // Run immediately on start
  markExpiredTrips();

  // Then run every hour
  schedulerInterval = setInterval(() => {
    markExpiredTrips();
  }, 60 * 60 * 1000); // 1 hour

  logger.info('Trip expiration scheduler started');
};

const stopExpirationScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    logger.info('Trip expiration scheduler stopped');
  }
};

module.exports = {
  markExpiredTrips,
  getExpiredTrips,
  isTripExpired,
  startExpirationScheduler,
  stopExpirationScheduler
};
