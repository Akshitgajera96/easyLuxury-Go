// FILE: backend/controllers/rentalInquiryController.js
/**
 * Rental inquiry controller handling HTTP requests for rental operations
 * Routes: /api/v1/rentals/*
 */

const rentalInquiryService = require('../services/rentalInquiryService');

/**
 * Create a new rental inquiry
 * POST /api/v1/rentals/inquiry
 */
const createRentalInquiry = async (req, res, next) => {
  try {
    const inquiry = await rentalInquiryService.createRentalInquiry(req.body);

    res.status(201).json({
      success: true,
      data: { inquiry },
      message: 'Rental inquiry submitted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all rental inquiries
 * GET /api/v1/rentals/inquiries
 */
const getAllRentalInquiries = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      fromCity, 
      toCity, 
      busType, 
      startDate, 
      endDate, 
      isActive 
    } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (fromCity) filters.fromCity = fromCity;
    if (toCity) filters.toCity = toCity;
    if (busType) filters.busType = busType;
    if (startDate && endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    }
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const result = await rentalInquiryService.getAllRentalInquiries(
      filters, 
      parseInt(page), 
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Rental inquiries fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get rental inquiry by ID
 * GET /api/v1/rentals/inquiries/:id
 */
const getRentalInquiryById = async (req, res, next) => {
  try {
    const inquiry = await rentalInquiryService.getRentalInquiryById(req.params.id);

    res.status(200).json({
      success: true,
      data: { inquiry },
      message: 'Rental inquiry fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update rental inquiry status
 * PATCH /api/v1/rentals/inquiries/:id/status
 */
const updateInquiryStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const inquiry = await rentalInquiryService.updateInquiryStatus(
      req.params.id,
      status,
      notes
    );

    res.status(200).json({
      success: true,
      data: { inquiry },
      message: 'Rental inquiry status updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign staff to rental inquiry
 * PATCH /api/v1/rentals/inquiries/:id/assign-staff
 */
const assignStaffToInquiry = async (req, res, next) => {
  try {
    const { staffId } = req.body;

    if (!staffId) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID is required'
      });
    }

    const inquiry = await rentalInquiryService.assignStaffToInquiry(
      req.params.id,
      staffId
    );

    res.status(200).json({
      success: true,
      data: { inquiry },
      message: 'Staff assigned to rental inquiry successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Set quote for rental inquiry
 * PATCH /api/v1/rentals/inquiries/:id/quote
 */
const setInquiryQuote = async (req, res, next) => {
  try {
    const { amount, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quote amount is required'
      });
    }

    const inquiry = await rentalInquiryService.setInquiryQuote(
      req.params.id,
      amount,
      notes
    );

    res.status(200).json({
      success: true,
      data: { inquiry },
      message: 'Quote set for rental inquiry successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete rental inquiry
 * DELETE /api/v1/rentals/inquiries/:id
 */
const deleteRentalInquiry = async (req, res, next) => {
  try {
    const result = await rentalInquiryService.deleteRentalInquiry(req.params.id);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Rental inquiry deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get upcoming rental inquiries
 * GET /api/v1/rentals/inquiries/upcoming
 */
const getUpcomingInquiries = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;

    const inquiries = await rentalInquiryService.getUpcomingInquiries(parseInt(days));

    res.status(200).json({
      success: true,
      data: { inquiries },
      message: 'Upcoming rental inquiries fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get rental inquiry statistics
 * GET /api/v1/rentals/inquiries/statistics
 */
const getInquiryStatistics = async (req, res, next) => {
  try {
    const statistics = await rentalInquiryService.getInquiryStatistics();

    res.status(200).json({
      success: true,
      data: statistics,
      message: 'Rental inquiry statistics fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRentalInquiry,
  getAllRentalInquiries,
  getRentalInquiryById,
  updateInquiryStatus,
  assignStaffToInquiry,
  setInquiryQuote,
  deleteRentalInquiry,
  getUpcomingInquiries,
  getInquiryStatistics
};