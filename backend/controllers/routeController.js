// FILE: backend/controllers/routeController.js
/**
 * Route controller handling HTTP requests for route operations
 * Routes: /api/v1/routes/*
 */

const routeService = require('../services/routeService');

/**
 * Create a new route
 * POST /api/v1/routes
 */
const createRoute = async (req, res, next) => {
  try {
    const route = await routeService.createRoute(req.body);

    res.status(201).json({
      success: true,
      data: { route },
      message: 'Route created successfully'
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(e => e.message).join(', ')
      });
    }
    // Handle duplicate route error or validation errors from service
    if (error.message && (error.message.includes('already exists') || error.message.includes('required') || error.message.includes('Valid'))) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Get all routes
 * GET /api/v1/routes
 */
const getAllRoutes = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sourceCity, destinationCity, isActive } = req.query;
    
    const filters = {};
    if (sourceCity) filters.sourceCity = sourceCity;
    if (destinationCity) filters.destinationCity = destinationCity;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const result = await routeService.getAllRoutes(
      filters, 
      parseInt(page), 
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Routes fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get route by ID
 * GET /api/v1/routes/:id
 */
const getRouteById = async (req, res, next) => {
  try {
    const route = await routeService.getRouteById(req.params.id);

    res.status(200).json({
      success: true,
      data: { route },
      message: 'Route fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update route
 * PUT /api/v1/routes/:id
 */
const updateRoute = async (req, res, next) => {
  try {
    const route = await routeService.updateRoute(req.params.id, req.body);

    res.status(200).json({
      success: true,
      data: { route },
      message: 'Route updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete route
 * DELETE /api/v1/routes/:id
 */
const deleteRoute = async (req, res, next) => {
  try {
    const result = await routeService.deleteRoute(req.params.id);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Route deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search routes by source and destination
 * GET /api/v1/routes/search
 */
const searchRoutes = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Source and destination cities are required'
      });
    }

    const routes = await routeService.searchRoutes(from, to);

    res.status(200).json({
      success: true,
      data: { routes },
      message: 'Routes search completed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle dynamic pricing for a route
 * PATCH /api/v1/routes/:id/toggle-pricing
 */
const toggleDynamicPricing = async (req, res, next) => {
  try {
    const { enable } = req.body;
    
    const route = await routeService.toggleDynamicPricing(
      req.params.id, 
      enable === true || enable === 'true'
    );

    res.status(200).json({
      success: true,
      data: { route },
      message: `Dynamic pricing ${route.dynamicPricing.isEnabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    next(error);
  }
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