// FILE: backend/controllers/staffController.js
/**
 * Staff controller handling HTTP requests for staff operations
 * Routes: /api/v1/staff/*
 */

const staffService = require('../services/staffService');

/**
 * Create a new staff member
 * POST /api/v1/staff
 */
const createStaff = async (req, res, next) => {
  try {
    const result = await staffService.createStaff(req.body);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Staff created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all staff
 * GET /api/v1/staff
 */
const getAllStaff = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, department, designation, role, isActive } = req.query;
    
    const filters = {};
    if (department) filters.department = department;
    if (designation) filters.designation = designation;
    if (role) filters.role = role;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const result = await staffService.getAllStaff(
      filters, 
      parseInt(page), 
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Staff fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get staff by ID
 * GET /api/v1/staff/:id
 */
const getStaffById = async (req, res, next) => {
  try {
    const staff = await staffService.getStaffById(req.params.id);

    res.status(200).json({
      success: true,
      data: { staff },
      message: 'Staff fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update staff
 * PUT /api/v1/staff/:id
 */
const updateStaff = async (req, res, next) => {
  try {
    const staff = await staffService.updateStaff(req.params.id, req.body);

    res.status(200).json({
      success: true,
      data: { staff },
      message: 'Staff updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete staff
 * DELETE /api/v1/staff/:id
 */
const deleteStaff = async (req, res, next) => {
  try {
    const result = await staffService.deleteStaff(req.params.id);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Staff deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle staff status
 * PATCH /api/v1/staff/:id/toggle-status
 */
const toggleStaffStatus = async (req, res, next) => {
  try {
    const staff = await staffService.toggleStaffStatus(req.params.id);

    res.status(200).json({
      success: true,
      data: { staff },
      message: `Staff ${staff.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available drivers
 * GET /api/v1/staff/drivers/available
 */
const getAvailableDrivers = async (req, res, next) => {
  try {
    const drivers = await staffService.getAvailableDrivers();

    res.status(200).json({
      success: true,
      data: { drivers },
      message: 'Available drivers fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign bus to staff
 * PATCH /api/v1/staff/:id/assign-bus
 */
const assignBusToStaff = async (req, res, next) => {
  try {
    const { busId } = req.body;

    if (!busId) {
      return res.status(400).json({
        success: false,
        message: 'Bus ID is required'
      });
    }

    const staff = await staffService.assignBusToStaff(req.params.id, busId);

    res.status(200).json({
      success: true,
      data: { staff },
      message: 'Bus assigned to staff successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current logged-in staff member's details
 * GET /api/v1/staff/me
 */
const getCurrentStaff = async (req, res, next) => {
  try {
    // req.user is set by protect middleware
    const staff = await staffService.getStaffById(req.user._id);

    res.status(200).json({
      success: true,
      data: { staff },
      message: 'Staff profile fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStaff,
  // loginStaff - REMOVED: Use authController.staffLogin instead
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  toggleStaffStatus,
  getAvailableDrivers,
  assignBusToStaff,
  getCurrentStaff
};