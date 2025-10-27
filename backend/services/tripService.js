// FILE: backend/services/tripService.js
/**
 * Trip service handling CRUD operations and search for trips
 * Business logic for trip management
 */

const Trip = require('../models/tripModel');
const Bus = require('../models/busModel');
const Route = require('../models/routeModel');
const MESSAGES = require('../constants/messages');
const { TRIP_STATUS } = require('../constants/enums');

/**
 * Update expired trips automatically
 * Marks trips as 'expired' if their departure date has passed and status is still 'scheduled'
 */
const updateExpiredTrips = async () => {
  const now = new Date();
  
  await Trip.updateMany(
    {
      departureDateTime: { $lt: now },
      status: { $in: [TRIP_STATUS.SCHEDULED, TRIP_STATUS.BOARDING] }
    },
    {
      $set: { status: TRIP_STATUS.EXPIRED }
    }
  );
};

/**
 * Create a new trip
 * @param {object} tripData - Trip data
 * @returns {object} Created trip
 */
const createTrip = async (tripData) => {
  const {
    bus,
    route,
    departureDateTime,
    arrivalDateTime,
    baseFare,
    driver,
    conductor
  } = tripData;

  // Check if bus exists and is active
  const busExists = await Bus.findById(bus);
  if (!busExists || !busExists.isActive) {
    throw new Error('Bus not found or inactive');
  }

  // Check if route exists and is active
  const routeExists = await Route.findById(route);
  if (!routeExists || !routeExists.isActive) {
    throw new Error('Route not found or inactive');
  }

  // Check for overlapping trips for the same bus
  const overlappingTrip = await Trip.findOne({
    bus,
    departureDateTime: { $lt: arrivalDateTime },
    arrivalDateTime: { $gt: departureDateTime },
    status: { $in: ['scheduled', 'departed'] }
  });

  if (overlappingTrip) {
    throw new Error('Bus is already scheduled for another trip during this time');
  }

  const trip = new Trip({
    bus,
    route,
    departureDateTime,
    arrivalDateTime,
    baseFare,
    availableSeats: busExists.totalSeats,
    driver: driver || {},
    conductor: conductor || {}
  });

  await trip.save();
  
  // Populate references for response
  await trip.populate('bus');
  await trip.populate('route');

  return trip;
};

/**
 * Get all trips with filtering and pagination
 * @param {object} filters - Filter criteria
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {object} Trips and pagination info
 */
const getAllTrips = async (filters = {}, page = 1, limit = 10) => {
  // Auto-update expired trips before fetching
  await updateExpiredTrips();
  
  const query = {};

  // Apply filters
  if (filters.bus) {
    query.bus = filters.bus;
  }
  if (filters.route) {
    query.route = filters.route;
  }
  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.departureDate) {
    const startDate = new Date(filters.departureDate);
    const endDate = new Date(filters.departureDate);
    endDate.setDate(endDate.getDate() + 1);
    
    query.departureDateTime = {
      $gte: startDate,
      $lt: endDate
    };
  }
  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive;
  }
  
  // By default, INCLUDE expired trips in admin view (for transparency)
  // Only exclude if explicitly requested with includeExpired=false
  if (filters.includeExpired === false) {
    query.status = query.status || { $ne: TRIP_STATUS.EXPIRED };
  }

  const skip = (page - 1) * limit;

  const trips = await Trip.find(query)
    .populate('bus')
    .populate('route')
    .sort({ departureDateTime: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Trip.countDocuments(query);

  return {
    trips,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get trip by ID
 * @param {string} tripId - Trip ID
 * @returns {object} Trip data
 */
const getTripById = async (tripId) => {
  const trip = await Trip.findById(tripId)
    .populate('bus')
    .populate('route');
  
  if (!trip) {
    throw new Error('Trip not found');
  }

  return trip;
};

/**
 * Search trips by source, destination, and date
 * @param {string} from - Source city
 * @param {string} to - Destination city
 * @param {string} date - Departure date (YYYY-MM-DD)
 * @param {number} days - Number of days to search (default: 1, max: 7)
 * @returns {array} Matching trips
 */
const searchTrips = async (from, to, date, days = 1) => {
  if (!from || !to || !date) {
    throw new Error('Source, destination, and date are required');
  }

  // Auto-update expired trips before searching
  await updateExpiredTrips();

  // Limit days to maximum of 7
  const searchDays = Math.min(Math.max(1, days), 7);

  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + searchDays);
  endDate.setHours(23, 59, 59, 999);

  const trips = await Trip.find({
    departureDateTime: {
      $gte: startDate,
      $lt: endDate
    },
    status: { $in: [TRIP_STATUS.SCHEDULED, TRIP_STATUS.BOARDING] },
    isActive: true
  })
  .populate({
    path: 'route',
    match: {
      sourceCity: { $regex: from, $options: 'i' },
      destinationCity: { $regex: to, $options: 'i' },
      isActive: true
    }
  })
  .populate('bus')
  .sort({ departureDateTime: 1 });

  // Filter out trips where route didn't match
  const filteredTrips = trips.filter(trip => trip.route !== null);

  return filteredTrips;
};

/**
 * Update trip by ID
 * @param {string} tripId - Trip ID
 * @param {object} updateData - Data to update
 * @returns {object} Updated trip
 */
const updateTrip = async (tripId, updateData) => {
  const trip = await Trip.findById(tripId);
  
  if (!trip) {
    throw new Error('Trip not found');
  }

  // Check for overlapping trips if timing is being updated
  if (updateData.departureDateTime || updateData.arrivalDateTime) {
    const departureDateTime = updateData.departureDateTime || trip.departureDateTime;
    const arrivalDateTime = updateData.arrivalDateTime || trip.arrivalDateTime;

    const overlappingTrip = await Trip.findOne({
      bus: trip.bus,
      _id: { $ne: tripId },
      departureDateTime: { $lt: arrivalDateTime },
      arrivalDateTime: { $gt: departureDateTime },
      status: { $in: ['scheduled', 'departed'] }
    });

    if (overlappingTrip) {
      throw new Error('Bus is already scheduled for another trip during this time');
    }
  }

  // Update trip
  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== undefined) {
      trip[key] = updateData[key];
    }
  });

  await trip.save();
  await trip.populate('bus');
  await trip.populate('route');

  return trip;
};

/**
 * Update trip status
 * @param {string} tripId - Trip ID
 * @param {string} status - New status
 * @returns {object} Updated trip
 */
const updateTripStatus = async (tripId, status) => {
  const trip = await Trip.findById(tripId);
  
  if (!trip) {
    throw new Error('Trip not found');
  }

  trip.status = status;
  await trip.save();

  return trip;
};

module.exports = {
  createTrip,
  getAllTrips,
  getTripById,
  searchTrips,
  updateTrip,
  updateTripStatus
};