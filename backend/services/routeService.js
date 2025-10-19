// FILE: backend/services/routeService.js
/**
 * Route service handling CRUD operations for routes
 * Business logic for route management
 */

const Route = require('../models/routeModel');
const MESSAGES = require('../constants/messages');

/**
 * Create a new route
 * @param {object} routeData - Route data
 * @returns {object} Created route
 */
const createRoute = async (routeData) => {
  const {
    routeNumber,
    sourceCity,
    destinationCity,
    distance,
    estimatedDuration,
    baseFare,
    stops,
    dynamicPricing
  } = routeData;

  // Validate required fields
  if (!sourceCity || !destinationCity) {
    throw new Error('Source city and destination city are required');
  }
  if (!distance || distance <= 0) {
    throw new Error('Valid distance is required');
  }
  if (!estimatedDuration || estimatedDuration <= 0) {
    throw new Error('Valid estimated duration is required');
  }
  if (!baseFare || baseFare <= 0) {
    throw new Error('Valid base fare is required');
  }

  // Check if route already exists for same cities
  const existingRoute = await Route.findOne({ 
    sourceCity: sourceCity,
    destinationCity: destinationCity 
  });
  if (existingRoute) {
    throw new Error(`Route from ${sourceCity} to ${destinationCity} already exists`);
  }

  // Auto-generate route number if not provided
  const generatedRouteNumber = routeNumber || `RT${Date.now().toString().slice(-8)}`;

  const route = new Route({
    routeNumber: generatedRouteNumber,
    sourceCity,
    destinationCity,
    distance: Number(distance),
    estimatedDuration: Number(estimatedDuration),
    baseFare: Number(baseFare),
    stops: stops || [],
    dynamicPricing: dynamicPricing || { isEnabled: false }
  });

  await route.save();
  return route;
};

/**
 * Get all routes with filtering and pagination
 * @param {object} filters - Filter criteria
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {object} Routes and pagination info
 */
const getAllRoutes = async (filters = {}, page = 1, limit = 10) => {
  const query = {};

  // Apply filters
  if (filters.sourceCity) {
    query.sourceCity = { $regex: filters.sourceCity, $options: 'i' };
  }
  if (filters.destinationCity) {
    query.destinationCity = { $regex: filters.destinationCity, $options: 'i' };
  }
  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive;
  }

  const skip = (page - 1) * limit;

  const routes = await Route.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Route.countDocuments(query);

  return {
    routes,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get route by ID
 * @param {string} routeId - Route ID
 * @returns {object} Route data
 */
const getRouteById = async (routeId) => {
  const route = await Route.findById(routeId);
  
  if (!route) {
    throw new Error('Route not found');
  }

  return route;
};

/**
 * Update route by ID
 * @param {string} routeId - Route ID
 * @param {object} updateData - Data to update
 * @returns {object} Updated route
 */
const updateRoute = async (routeId, updateData) => {
  const route = await Route.findById(routeId);
  
  if (!route) {
    throw new Error('Route not found');
  }

  // Prevent updating route number to an existing one
  if (updateData.routeNumber && updateData.routeNumber !== route.routeNumber) {
    const existingRoute = await Route.findOne({ routeNumber: updateData.routeNumber });
    if (existingRoute) {
      throw new Error('Route number already exists');
    }
  }

  // Update route
  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== undefined) {
      route[key] = updateData[key];
    }
  });

  await route.save();
  return route;
};

/**
 * Delete route by ID
 * @param {string} routeId - Route ID
 * @returns {object} Deletion result
 */
const deleteRoute = async (routeId) => {
  const route = await Route.findById(routeId);
  
  if (!route) {
    throw new Error('Route not found');
  }

  // Check if route is used in any active trips
  const Trip = require('../models/tripModel');
  const activeTrips = await Trip.findOne({ 
    route: routeId, 
    status: { $in: ['scheduled', 'departed'] } 
  });

  if (activeTrips) {
    throw new Error('Cannot delete route with active trips');
  }

  await Route.findByIdAndDelete(routeId);
  
  return { message: 'Route deleted successfully' };
};

/**
 * Search routes by source and destination
 * @param {string} sourceCity - Source city
 * @param {string} destinationCity - Destination city
 * @returns {array} Matching routes
 */
const searchRoutes = async (sourceCity, destinationCity) => {
  const routes = await Route.find({
    sourceCity: { $regex: sourceCity, $options: 'i' },
    destinationCity: { $regex: destinationCity, $options: 'i' },
    isActive: true
  });

  return routes;
};

/**
 * Toggle dynamic pricing for a route
 * @param {string} routeId - Route ID
 * @param {boolean} enable - Enable/disable dynamic pricing
 * @returns {object} Updated route
 */
const toggleDynamicPricing = async (routeId, enable) => {
  const route = await Route.findById(routeId);
  
  if (!route) {
    throw new Error('Route not found');
  }

  route.dynamicPricing.isEnabled = enable;
  await route.save();

  return route;
};

module.exports = {
  createRoute,
  getAllRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
  searchRoutes,
  toggleDynamicPricing
};