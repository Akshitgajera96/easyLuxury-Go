// FILE: backend/services/promoCodeService.js
/**
 * Promo code service handling CRUD operations and validation
 * Business logic for promo code management
 */

const PromoCode = require('../models/promoCodeModel');
const MESSAGES = require('../constants/messages');

/**
 * Create a new promo code
 * @param {object} promoData - Promo code data
 * @returns {object} Created promo code
 */
const createPromoCode = async (promoData) => {
  const {
    code,
    description,
    discountType,
    discountValue,
    maxDiscount,
    minBookingAmount,
    validFrom,
    validUntil,
    maxUsage,
    applicableRoutes,
    userRestrictions
  } = promoData;

  // Check if promo code already exists
  const existingPromo = await PromoCode.findOne({ code: code.toUpperCase() });
  if (existingPromo) {
    throw new Error('Promo code already exists');
  }

  // Validate dates
  if (new Date(validUntil) <= new Date(validFrom)) {
    throw new Error('Valid until date must be after valid from date');
  }

  const promoCode = new PromoCode({
    code: code.toUpperCase(),
    description,
    discountType,
    discountValue,
    maxDiscount,
    minBookingAmount: minBookingAmount || 0,
    validFrom,
    validUntil,
    maxUsage: maxUsage || 1000,
    applicableRoutes: applicableRoutes || [],
    userRestrictions: userRestrictions || {}
  });

  await promoCode.save();
  return promoCode;
};

/**
 * Get all promo codes with filtering and pagination
 * @param {object} filters - Filter criteria
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {object} Promo codes and pagination info
 */
const getAllPromoCodes = async (filters = {}, page = 1, limit = 10) => {
  const query = {};

  // Apply filters
  if (filters.code) {
    query.code = { $regex: filters.code, $options: 'i' };
  }
  if (filters.discountType) {
    query.discountType = filters.discountType;
  }
  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive;
  }
  if (filters.isAvailable !== undefined) {
    const now = new Date();
    query.validFrom = { $lte: now };
    query.validUntil = { $gte: now };
    query.$expr = { $lt: ['$usedCount', '$maxUsage'] };
  }

  const skip = (page - 1) * limit;

  const promoCodes = await PromoCode.find(query)
    .populate('applicableRoutes')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await PromoCode.countDocuments(query);

  return {
    promoCodes,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get promo code by ID
 * @param {string} promoCodeId - Promo code ID
 * @returns {object} Promo code data
 */
const getPromoCodeById = async (promoCodeId) => {
  const promoCode = await PromoCode.findById(promoCodeId)
    .populate('applicableRoutes');
  
  if (!promoCode) {
    throw new Error('Promo code not found');
  }

  return promoCode;
};

/**
 * Validate and apply promo code
 * @param {string} code - Promo code
 * @param {number} bookingAmount - Booking amount
 * @param {object} user - User object
 * @param {string} routeId - Route ID
 * @returns {object} Discount details
 */
const validateAndApplyPromoCode = async (code, bookingAmount, user, routeId) => {
  const promoCode = await PromoCode.findOne({ code: code.toUpperCase() })
    .populate('applicableRoutes');
  
  if (!promoCode) {
    throw new Error('Invalid promo code');
  }

  // Validate promo code
  const validation = promoCode.validatePromoCode(bookingAmount, user, routeId);
  if (!validation.isValid) {
    throw new Error(validation.message);
  }

  // Calculate discount
  const discountAmount = promoCode.calculateDiscount(bookingAmount);
  
  // Apply promo code (increment usage)
  await PromoCode.findByIdAndUpdate(promoCode._id, {
    $inc: { usedCount: 1 }
  });

  return {
    promoCode: promoCode.code,
    discountAmount,
    finalAmount: bookingAmount - discountAmount,
    discountType: promoCode.discountType,
    discountValue: promoCode.discountValue
  };
};

/**
 * Update promo code
 * @param {string} promoCodeId - Promo code ID
 * @param {object} updateData - Data to update
 * @returns {object} Updated promo code
 */
const updatePromoCode = async (promoCodeId, updateData) => {
  const promoCode = await PromoCode.findById(promoCodeId);
  
  if (!promoCode) {
    throw new Error('Promo code not found');
  }

  // Prevent updating code to an existing one
  if (updateData.code && updateData.code !== promoCode.code) {
    const existingPromo = await PromoCode.findOne({ code: updateData.code.toUpperCase() });
    if (existingPromo) {
      throw new Error('Promo code already exists');
    }
    updateData.code = updateData.code.toUpperCase();
  }

  // Validate dates if provided
  if (updateData.validFrom || updateData.validUntil) {
    const validFrom = updateData.validFrom || promoCode.validFrom;
    const validUntil = updateData.validUntil || promoCode.validUntil;
    
    if (new Date(validUntil) <= new Date(validFrom)) {
      throw new Error('Valid until date must be after valid from date');
    }
  }

  // Update promo code
  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== undefined) {
      promoCode[key] = updateData[key];
    }
  });

  await promoCode.save();
  await promoCode.populate('applicableRoutes');

  return promoCode;
};

/**
 * Delete promo code
 * @param {string} promoCodeId - Promo code ID
 * @returns {object} Deletion result
 */
const deletePromoCode = async (promoCodeId) => {
  const promoCode = await PromoCode.findById(promoCodeId);
  
  if (!promoCode) {
    throw new Error('Promo code not found');
  }

  await PromoCode.findByIdAndDelete(promoCodeId);
  
  return { message: 'Promo code deleted successfully' };
};

/**
 * Toggle promo code active status
 * @param {string} promoCodeId - Promo code ID
 * @returns {object} Updated promo code
 */
const togglePromoCodeStatus = async (promoCodeId) => {
  const promoCode = await PromoCode.findById(promoCodeId);
  
  if (!promoCode) {
    throw new Error('Promo code not found');
  }

  promoCode.isActive = !promoCode.isActive;
  await promoCode.save();

  return promoCode;
};

/**
 * Get available promo codes for user
 * @param {object} user - User object
 * @param {string} routeId - Route ID
 * @param {number} bookingAmount - Booking amount
 * @returns {array} Available promo codes
 */
const getAvailablePromoCodes = async (user, routeId, bookingAmount = 0) => {
  const now = new Date();
  
  const promoCodes = await PromoCode.find({
    isActive: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now },
    $expr: { $lt: ['$usedCount', '$maxUsage'] }
  }).populate('applicableRoutes');

  // Filter promo codes that are applicable for the user and route
  const availablePromoCodes = promoCodes.filter(promoCode => {
    try {
      const validation = promoCode.validatePromoCode(bookingAmount, user, routeId);
      return validation.isValid;
    } catch (error) {
      return false;
    }
  });

  return availablePromoCodes;
};

module.exports = {
  createPromoCode,
  getAllPromoCodes,
  getPromoCodeById,
  validateAndApplyPromoCode,
  updatePromoCode,
  deletePromoCode,
  togglePromoCodeStatus,
  getAvailablePromoCodes
};