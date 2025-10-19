// FILE: backend/services/rentalInquiryService.js
/**
 * Rental inquiry service handling CRUD operations for bus rental inquiries
 * Business logic for rental inquiry operations
 */

const RentalInquiry = require('../models/rentalInquiryModel');
const MESSAGES = require('../constants/messages');

/**
 * Create a new rental inquiry
 * @param {object} inquiryData - Inquiry data
 * @returns {object} Created inquiry
 */
const createRentalInquiry = async (inquiryData) => {
  const {
    name,
    email,
    phone,
    company,
    tripType,
    fromCity,
    toCity,
    departureDate,
    returnDate,
    passengers,
    busType,
    amenities,
    budget,
    specialRequirements
  } = inquiryData;

  // Validate dates for round trips
  if (tripType === 'round-trip' && !returnDate) {
    throw new Error('Return date is required for round trips');
  }

  if (returnDate && new Date(returnDate) <= new Date(departureDate)) {
    throw new Error('Return date must be after departure date');
  }

  const inquiry = new RentalInquiry({
    name,
    email,
    phone,
    company,
    tripType,
    fromCity,
    toCity,
    departureDate,
    returnDate,
    passengers,
    busType,
    amenities: amenities || [],
    budget: budget || 0,
    specialRequirements: specialRequirements || ''
  });

  await inquiry.save();
  return inquiry;
};

/**
 * Get all rental inquiries with filtering and pagination
 * @param {object} filters - Filter criteria
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {object} Inquiries and pagination info
 */
const getAllRentalInquiries = async (filters = {}, page = 1, limit = 10) => {
  const query = {};

  // Apply filters
  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.fromCity) {
    query.fromCity = { $regex: filters.fromCity, $options: 'i' };
  }
  if (filters.toCity) {
    query.toCity = { $regex: filters.toCity, $options: 'i' };
  }
  if (filters.busType) {
    query.busType = filters.busType;
  }
  if (filters.startDate && filters.endDate) {
    query.departureDate = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  }
  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive;
  }

  const skip = (page - 1) * limit;

  const inquiries = await RentalInquiry.find(query)
    .populate('assignedTo')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await RentalInquiry.countDocuments(query);

  return {
    inquiries,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get rental inquiry by ID
 * @param {string} inquiryId - Inquiry ID
 * @returns {object} Inquiry data
 */
const getRentalInquiryById = async (inquiryId) => {
  const inquiry = await RentalInquiry.findById(inquiryId)
    .populate('assignedTo');
  
  if (!inquiry) {
    throw new Error('Rental inquiry not found');
  }

  return inquiry;
};

/**
 * Update rental inquiry status
 * @param {string} inquiryId - Inquiry ID
 * @param {string} status - New status
 * @param {string} notes - Status notes
 * @returns {object} Updated inquiry
 */
const updateInquiryStatus = async (inquiryId, status, notes = '') => {
  const inquiry = await RentalInquiry.findById(inquiryId);
  
  if (!inquiry) {
    throw new Error('Rental inquiry not found');
  }

  await inquiry.updateStatus(status, notes);

  return await RentalInquiry.findById(inquiryId).populate('assignedTo');
};

/**
 * Assign staff to rental inquiry
 * @param {string} inquiryId - Inquiry ID
 * @param {string} staffId - Staff ID
 * @returns {object} Updated inquiry
 */
const assignStaffToInquiry = async (inquiryId, staffId) => {
  const inquiry = await RentalInquiry.findById(inquiryId);
  
  if (!inquiry) {
    throw new Error('Rental inquiry not found');
  }

  // Check if staff exists
  const Staff = require('../models/staffModel');
  const staff = await Staff.findById(staffId);
  if (!staff) {
    throw new Error('Staff not found');
  }

  await inquiry.assignToStaff(staffId);

  return await RentalInquiry.findById(inquiryId).populate('assignedTo');
};

/**
 * Set quote for rental inquiry
 * @param {string} inquiryId - Inquiry ID
 * @param {number} amount - Quote amount
 * @param {string} notes - Quote notes
 * @returns {object} Updated inquiry
 */
const setInquiryQuote = async (inquiryId, amount, notes = '') => {
  const inquiry = await RentalInquiry.findById(inquiryId);
  
  if (!inquiry) {
    throw new Error('Rental inquiry not found');
  }

  if (amount <= 0) {
    throw new Error('Quote amount must be greater than 0');
  }

  await inquiry.setQuote(amount, notes);

  return await RentalInquiry.findById(inquiryId).populate('assignedTo');
};

/**
 * Delete rental inquiry
 * @param {string} inquiryId - Inquiry ID
 * @returns {object} Deletion result
 */
const deleteRentalInquiry = async (inquiryId) => {
  const inquiry = await RentalInquiry.findById(inquiryId);
  
  if (!inquiry) {
    throw new Error('Rental inquiry not found');
  }

  await RentalInquiry.findByIdAndDelete(inquiryId);
  
  return { message: 'Rental inquiry deleted successfully' };
};

/**
 * Get upcoming rental inquiries
 * @param {number} days - Number of days to look ahead
 * @returns {array} Upcoming inquiries
 */
const getUpcomingInquiries = async (days = 7) => {
  const inquiries = await RentalInquiry.findUpcomingInquiries(days);
  return inquiries;
};

/**
 * Get rental inquiry statistics
 * @returns {object} Inquiry statistics
 */
const getInquiryStatistics = async () => {
  const stats = await RentalInquiry.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalBudget: { $sum: '$budget' },
        avgPassengers: { $avg: '$passengers' }
      }
    }
  ]);

  const totalInquiries = await RentalInquiry.countDocuments();
  const confirmedInquiries = await RentalInquiry.countDocuments({ status: 'confirmed' });
  const conversionRate = totalInquiries > 0 ? (confirmedInquiries / totalInquiries) * 100 : 0;

  return {
    byStatus: stats,
    totalInquiries,
    confirmedInquiries,
    conversionRate: Math.round(conversionRate * 100) / 100
  };
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