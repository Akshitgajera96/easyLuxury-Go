// FILE: backend/controllers/locationController.js
/**
 * Location controller for handling bus location updates
 * Routes: /api/v1/location/*
 */

const Trip = require('../models/tripModel');

/**
 * Update bus location for a trip
 * POST /api/v1/location/update
 */
const updateLocation = async (req, res, next) => {
  try {
    const { tripId, latitude, longitude, speed, heading } = req.body;

    if (!tripId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID, latitude, and longitude are required'
      });
    }

    const trip = await Trip.findById(tripId);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Update current location
    trip.currentLocation = {
      latitude,
      longitude,
      lastUpdated: new Date(),
      speed: speed || 0,
      heading: heading || 0
    };

    // Add to location history (limit to last 50 points)
    if (!trip.locationHistory) {
      trip.locationHistory = [];
    }
    
    trip.locationHistory.push({
      latitude,
      longitude,
      timestamp: new Date(),
      speed: speed || 0
    });

    // Keep only last 50 location points
    if (trip.locationHistory.length > 50) {
      trip.locationHistory = trip.locationHistory.slice(-50);
    }

    await trip.save();

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`trip_${tripId}`).emit('location_update', {
        tripId,
        latitude,
        longitude,
        speed: speed || 0,
        heading: heading || 0,
        timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      data: {
        tripId,
        location: trip.currentLocation
      },
      message: 'Location updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current location of a trip
 * GET /api/v1/location/:tripId
 */
const getLocation = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.tripId)
      .select('currentLocation locationHistory route bus')
      .populate('route', 'sourceCity destinationCity sourceCoordinates destinationCoordinates')
      .populate('bus', 'busNumber operator');
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        currentLocation: trip.currentLocation,
        locationHistory: trip.locationHistory || [],
        route: trip.route,
        bus: trip.bus
      },
      message: 'Location fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get location history for a trip
 * GET /api/v1/location/:tripId/history
 */
const getLocationHistory = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.tripId)
      .select('locationHistory');
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        history: trip.locationHistory || []
      },
      message: 'Location history fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all active trips with their current locations (Admin only)
 * GET /api/v1/location/all-active
 */
const getAllActiveLocations = async (req, res, next) => {
  try {
    const now = new Date();
    
    // Find all trips that are currently active (departure in past, arrival in future)
    const activeTrips = await Trip.find({
      departureDateTime: { $lte: now },
      arrivalDateTime: { $gte: now },
      isActive: true,
      'currentLocation.latitude': { $exists: true, $ne: null }
    })
      .select('currentLocation bus route departureDateTime arrivalDateTime status')
      .populate('bus', 'busNumber operator')
      .populate('route', 'sourceCity destinationCity sourceCoordinates destinationCoordinates')
      .sort({ departureDateTime: -1 });

    res.status(200).json({
      success: true,
      data: {
        activeTrips,
        count: activeTrips.length
      },
      message: 'Active trip locations fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateLocation,
  getLocation,
  getLocationHistory,
  getAllActiveLocations
};
