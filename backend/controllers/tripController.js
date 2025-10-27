// FILE: backend/controllers/tripController.js
/**
 * Trip controller handling HTTP requests for trip operations
 * Routes: /api/v1/trips/*
 */

const tripService = require('../services/tripService');

/**
 * Create a new trip
 * POST /api/v1/trips
 */
const createTrip = async (req, res, next) => {
  try {
    const trip = await tripService.createTrip(req.body);

    res.status(201).json({
      success: true,
      data: { trip },
      message: 'Trip created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all trips
 * GET /api/v1/trips
 */
const getAllTrips = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, bus, route, status, departureDate, isActive, includeExpired } = req.query;
    
    const filters = {};
    if (bus) filters.bus = bus;
    if (route) filters.route = route;
    if (status) filters.status = status;
    if (departureDate) filters.departureDate = departureDate;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (includeExpired !== undefined) filters.includeExpired = includeExpired === 'true';

    const result = await tripService.getAllTrips(
      filters, 
      parseInt(page), 
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Trips fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get trip by ID
 * GET /api/v1/trips/:id
 */
const getTripById = async (req, res, next) => {
  try {
    const trip = await tripService.getTripById(req.params.id);

    res.status(200).json({
      success: true,
      data: { trip },
      message: 'Trip fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search trips by source, destination, and date
 * GET /api/v1/trips/search
 */
const searchTrips = async (req, res, next) => {
  try {
    const { from, to, date, days } = req.query;

    if (!from || !to || !date) {
      return res.status(400).json({
        success: false,
        message: 'Source, destination, and date are required'
      });
    }

    // Default to 3 days if not specified
    const searchDays = days ? parseInt(days) : 3;
    const trips = await tripService.searchTrips(from, to, date, searchDays);

    res.status(200).json({
      success: true,
      data: { trips },
      message: trips.length > 0 ? 'Trips found successfully' : 'No trips found for the given criteria'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update trip
 * PUT /api/v1/trips/:id
 */
const updateTrip = async (req, res, next) => {
  try {
    const trip = await tripService.updateTrip(req.params.id, req.body);

    res.status(200).json({
      success: true,
      data: { trip },
      message: 'Trip updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update trip status
 * PATCH /api/v1/trips/:id/status
 */
const updateTripStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const trip = await tripService.updateTripStatus(req.params.id, status);

    res.status(200).json({
      success: true,
      data: { trip },
      message: 'Trip status updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTrip,
  getAllTrips,
  getTripById,
  searchTrips,
  updateTrip,
  updateTripStatus
};