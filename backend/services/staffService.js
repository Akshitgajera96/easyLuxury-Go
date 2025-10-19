// FILE: backend/services/staffService.js
/**
 * Staff service handling CRUD operations for staff management
 * Business logic for staff operations
 */

const Staff = require('../models/staffModel');
const { generateToken } = require('../utils/generateToken');
const MESSAGES = require('../constants/messages');

/**
 * Create a new staff member
 * @param {object} staffData - Staff data
 * @returns {object} Created staff and token
 */
const createStaff = async (staffData) => {
  const {
    name,
    email,
    password,
    phone,
    designation,
    department,
    employeeId,
    address,
    dateOfJoining,
    emergencyContact,
    documents
  } = staffData;

  // Check if staff already exists
  const existingStaff = await Staff.findOne({ 
    $or: [
      { email },
      { employeeId }
    ]
  });

  if (existingStaff) {
    throw new Error('Staff with this email or employee ID already exists');
  }

  // Create staff
  const staff = new Staff({
    name,
    email,
    password,
    phone,
    designation,
    department,
    employeeId,
    address: address || {},
    dateOfJoining,
    emergencyContact: emergencyContact || {},
    documents: documents || {}
  });

  await staff.save();

  // Generate token
  const token = generateToken(staff._id, staff.role);

  // Return staff without password
  const staffResponse = await Staff.findById(staff._id).select('-password');

  return {
    staff: staffResponse,
    token
  };
};

/**
 * Get all staff with filtering and pagination
 * @param {object} filters - Filter criteria
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {object} Staff and pagination info
 */
const getAllStaff = async (filters = {}, page = 1, limit = 10) => {
  const query = {};

  // Apply filters
  if (filters.department) {
    query.department = { $regex: filters.department, $options: 'i' };
  }
  if (filters.designation) {
    query.designation = { $regex: filters.designation, $options: 'i' };
  }
  if (filters.role) {
    query.role = filters.role;
  }
  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive;
  }

  const skip = (page - 1) * limit;

  const staff = await Staff.find(query)
    .populate('assignedBus')
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Staff.countDocuments(query);

  return {
    staff,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get staff by ID
 * @param {string} staffId - Staff ID
 * @returns {object} Staff data
 */
const getStaffById = async (staffId) => {
  const staff = await Staff.findById(staffId)
    .populate('assignedBus')
    .select('-password');
  
  if (!staff) {
    throw new Error('Staff not found');
  }

  return staff;
};

/**
 * Update staff by ID
 * @param {string} staffId - Staff ID
 * @param {object} updateData - Data to update
 * @returns {object} Updated staff
 */
const updateStaff = async (staffId, updateData) => {
  const staff = await Staff.findById(staffId);
  
  if (!staff) {
    throw new Error('Staff not found');
  }

  // Prevent updating email/employeeId to existing ones
  if (updateData.email && updateData.email !== staff.email) {
    const existingStaff = await Staff.findOne({ email: updateData.email });
    if (existingStaff) {
      throw new Error('Staff with this email already exists');
    }
  }

  if (updateData.employeeId && updateData.employeeId !== staff.employeeId) {
    const existingStaff = await Staff.findOne({ employeeId: updateData.employeeId });
    if (existingStaff) {
      throw new Error('Staff with this employee ID already exists');
    }
  }

  // Remove password from update data (handle separately if needed)
  const { password, ...safeUpdateData } = updateData;

  // Update staff
  Object.keys(safeUpdateData).forEach(key => {
    if (safeUpdateData[key] !== undefined) {
      staff[key] = safeUpdateData[key];
    }
  });

  await staff.save();
  
  // Return staff without password
  return await Staff.findById(staffId)
    .populate('assignedBus')
    .select('-password');
};

/**
 * Delete staff by ID
 * @param {string} staffId - Staff ID
 * @returns {object} Deletion result
 */
const deleteStaff = async (staffId) => {
  const staff = await Staff.findById(staffId);
  
  if (!staff) {
    throw new Error('Staff not found');
  }

  // Check if staff is assigned to any active trips
  const Trip = require('../models/tripModel');
  const activeTrips = await Trip.findOne({
    $or: [
      { 'driver._id': staffId },
      { 'conductor._id': staffId }
    ],
    status: { $in: ['scheduled', 'departed'] }
  });

  if (activeTrips) {
    throw new Error('Cannot delete staff assigned to active trips');
  }

  await Staff.findByIdAndDelete(staffId);
  
  return { message: 'Staff deleted successfully' };
};

/**
 * Toggle staff active status
 * @param {string} staffId - Staff ID
 * @returns {object} Updated staff
 */
const toggleStaffStatus = async (staffId) => {
  const staff = await Staff.findById(staffId);
  
  if (!staff) {
    throw new Error('Staff not found');
  }

  staff.isActive = !staff.isActive;
  await staff.save();

  return await Staff.findById(staffId).select('-password');
};

/**
 * Get available drivers
 * @returns {array} Available drivers
 */
const getAvailableDrivers = async () => {
  const drivers = await Staff.findAvailableDrivers()
    .populate('assignedBus')
    .select('-password');

  return drivers;
};

/**
 * Assign bus to staff
 * @param {string} staffId - Staff ID
 * @param {string} busId - Bus ID
 * @returns {object} Updated staff
 */
const assignBusToStaff = async (staffId, busId) => {
  const staff = await Staff.findById(staffId);
  
  if (!staff) {
    throw new Error('Staff not found');
  }

  // Check if bus exists
  const Bus = require('../models/busModel');
  const bus = await Bus.findById(busId);
  if (!bus) {
    throw new Error('Bus not found');
  }

  staff.assignedBus = busId;
  await staff.save();

  return await Staff.findById(staffId)
    .populate('assignedBus')
    .select('-password');
};

module.exports = {
  createStaff,
  // loginStaff - REMOVED: Use authController.staffLogin instead for proper security
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  toggleStaffStatus,
  getAvailableDrivers,
  assignBusToStaff
};