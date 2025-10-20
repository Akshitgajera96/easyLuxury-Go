// FILE: backend/services/busService.js
/**
 * Bus service handling CRUD operations for buses
 * Business logic for bus management
 */

const Bus = require('../models/busModel');
const MESSAGES = require('../constants/messages');

/**
 * Create a new bus
 * @param {object} busData - Bus data
 * @returns {object} Created bus
 */
const createBus = async (busData) => {
  const {
    busNumber,
    busName,
    operator,
    totalSeats,
    seatType,
    amenities,
    hasAC,
    hasWifi,
    hasCharging
  } = busData;

  // Check if bus number already exists
  const existingBus = await Bus.findOne({ busNumber });
  if (existingBus) {
    throw new Error('Bus number already exists');
  }

  const bus = new Bus({
    busNumber,
    busName,
    operator,
    totalSeats,
    seatType,
    amenities: amenities || [],
    hasAC: hasAC || false,
    hasWifi: hasWifi || false,
    hasCharging: hasCharging || false
  });

  // Generate seat layout
  bus.generateSeatLayout();

  await bus.save();
  return bus;
};

/**
 * Get all buses with filtering and pagination
 * @param {object} filters - Filter criteria
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {object} Buses and pagination info
 */
const getAllBuses = async (filters = {}, page = 1, limit = 10) => {
  const query = {};

  // Apply filters
  if (filters.operator) {
    query.operator = { $regex: filters.operator, $options: 'i' };
  }
  if (filters.seatType) {
    query.seatType = filters.seatType;
  }
  if (filters.hasAC !== undefined) {
    query.hasAC = filters.hasAC;
  }
  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive;
  }

  const skip = (page - 1) * limit;

  const buses = await Bus.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Bus.countDocuments(query);

  return {
    buses,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get bus by ID
 * @param {string} busId - Bus ID
 * @returns {object} Bus data
 */
const getBusById = async (busId) => {
  const bus = await Bus.findById(busId);
  
  if (!bus) {
    throw new Error('Bus not found');
  }

  return bus;
};

/**
 * Update bus by ID
 * @param {string} busId - Bus ID
 * @param {object} updateData - Data to update
 * @returns {object} Updated bus
 */
const updateBus = async (busId, updateData) => {
  const bus = await Bus.findById(busId);
  
  if (!bus) {
    throw new Error('Bus not found');
  }

  // Prevent updating bus number to an existing one
  if (updateData.busNumber && updateData.busNumber !== bus.busNumber) {
    const existingBus = await Bus.findOne({ busNumber: updateData.busNumber });
    if (existingBus) {
      throw new Error('Bus number already exists');
    }
  }

  // Update bus
  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== undefined) {
      bus[key] = updateData[key];
    }
  });

  // Regenerate seat layout if total seats changed
  if (updateData.totalSeats && updateData.totalSeats !== bus.totalSeats) {
    bus.generateSeatLayout();
  }

  await bus.save();
  return bus;
};

/**
 * Delete bus by ID
 * @param {string} busId - Bus ID
 * @returns {object} Deletion result
 */
const deleteBus = async (busId) => {
  const bus = await Bus.findById(busId);
  
  if (!bus) {
    throw new Error('Bus not found');
  }

  // Check if bus is used in any active trips
  const Trip = require('../models/tripModel');
  const activeTrips = await Trip.findOne({ 
    bus: busId, 
    status: { $in: ['scheduled', 'departed'] } 
  });

  if (activeTrips) {
    throw new Error('Cannot delete bus with active trips');
  }

  await Bus.findByIdAndDelete(busId);
  
  return { message: 'Bus deleted successfully' };
};

/**
 * Toggle bus active status
 * @param {string} busId - Bus ID
 * @returns {object} Updated bus
 */
const toggleBusStatus = async (busId) => {
  const bus = await Bus.findById(busId);
  
  if (!bus) {
    throw new Error('Bus not found');
  }

  bus.isActive = !bus.isActive;
  await bus.save();

  return bus;
};

module.exports = {
  createBus,
  getAllBuses,
  getBusById,
  updateBus,
  deleteBus,
  toggleBusStatus
};