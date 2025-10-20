// FILE: backend/controllers/busController.js
/**
 * Bus controller handling HTTP requests for bus operations
 * Routes: /api/v1/buses/*
 */

const busService = require('../services/busService');

/**
 * Create a new bus
 * POST /api/v1/buses
 */
const createBus = async (req, res, next) => {
  try {
    const bus = await busService.createBus(req.body);

    res.status(201).json({
      success: true,
      data: { bus },
      message: 'Bus created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all buses
 * GET /api/v1/buses
 */
const getAllBuses = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, operator, seatType, hasAC, isActive } = req.query;
    
    const filters = {};
    if (operator) filters.operator = operator;
    if (seatType) filters.seatType = seatType;
    if (hasAC !== undefined) filters.hasAC = hasAC === 'true';
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const result = await busService.getAllBuses(
      filters, 
      parseInt(page), 
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Buses fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get bus by ID
 * GET /api/v1/buses/:id
 */
const getBusById = async (req, res, next) => {
  try {
    const bus = await busService.getBusById(req.params.id);

    res.status(200).json({
      success: true,
      data: { bus },
      message: 'Bus fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update bus
 * PUT /api/v1/buses/:id
 */
const updateBus = async (req, res, next) => {
  try {
    const bus = await busService.updateBus(req.params.id, req.body);

    res.status(200).json({
      success: true,
      data: { bus },
      message: 'Bus updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete bus
 * DELETE /api/v1/buses/:id
 */
const deleteBus = async (req, res, next) => {
  try {
    const result = await busService.deleteBus(req.params.id);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Bus deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle bus status
 * PATCH /api/v1/buses/:id/toggle-status
 */
const toggleBusStatus = async (req, res, next) => {
  try {
    const bus = await busService.toggleBusStatus(req.params.id);

    res.status(200).json({
      success: true,
      data: { bus },
      message: `Bus ${bus.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBus,
  getAllBuses,
  getBusById,
  updateBus,
  deleteBus,
  toggleBusStatus
};