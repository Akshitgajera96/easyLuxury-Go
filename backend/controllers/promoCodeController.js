// FILE: backend/controllers/promoCodeController.js
/**
 * Promo code controller handling HTTP requests for promo code operations
 * Routes: /api/v1/promocodes/*
 */

const promoCodeService = require('../services/promoCodeService');

/**
 * Create a new promo code
 * POST /api/v1/promocodes
 */
const createPromoCode = async (req, res, next) => {
  try {
    const promoCode = await promoCodeService.createPromoCode(req.body);

    res.status(201).json({
      success: true,
      data: { promoCode },
      message: 'Promo code created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all promo codes
 * GET /api/v1/promocodes
 */
const getAllPromoCodes = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, code, discountType, isActive, isAvailable } = req.query;
    
    const filters = {};
    if (code) filters.code = code;
    if (discountType) filters.discountType = discountType;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (isAvailable !== undefined) filters.isAvailable = isAvailable === 'true';

    const result = await promoCodeService.getAllPromoCodes(
      filters, 
      parseInt(page), 
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Promo codes fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get promo code by ID
 * GET /api/v1/promocodes/:id
 */
const getPromoCodeById = async (req, res, next) => {
  try {
    const promoCode = await promoCodeService.getPromoCodeById(req.params.id);

    res.status(200).json({
      success: true,
      data: { promoCode },
      message: 'Promo code fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validate and apply promo code
 * POST /api/v1/promocodes/validate
 */
const validatePromoCode = async (req, res, next) => {
  try {
    const { code, bookingAmount, routeId } = req.body;

    if (!code || !bookingAmount) {
      return res.status(400).json({
        success: false,
        message: 'Promo code and booking amount are required'
      });
    }

    const result = await promoCodeService.validateAndApplyPromoCode(
      code,
      bookingAmount,
      req.user,
      routeId
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Promo code applied successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update promo code
 * PUT /api/v1/promocodes/:id
 */
const updatePromoCode = async (req, res, next) => {
  try {
    const promoCode = await promoCodeService.updatePromoCode(req.params.id, req.body);

    res.status(200).json({
      success: true,
      data: { promoCode },
      message: 'Promo code updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete promo code
 * DELETE /api/v1/promocodes/:id
 */
const deletePromoCode = async (req, res, next) => {
  try {
    const result = await promoCodeService.deletePromoCode(req.params.id);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Promo code deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle promo code status
 * PATCH /api/v1/promocodes/:id/toggle-status
 */
const togglePromoCodeStatus = async (req, res, next) => {
  try {
    const promoCode = await promoCodeService.togglePromoCodeStatus(req.params.id);

    res.status(200).json({
      success: true,
      data: { promoCode },
      message: `Promo code ${promoCode.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available promo codes for user
 * GET /api/v1/promocodes/available
 */
const getAvailablePromoCodes = async (req, res, next) => {
  try {
    const { routeId, bookingAmount = 0 } = req.query;

    const promoCodes = await promoCodeService.getAvailablePromoCodes(
      req.user,
      routeId,
      parseFloat(bookingAmount)
    );

    res.status(200).json({
      success: true,
      data: { promoCodes },
      message: 'Available promo codes fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPromoCode,
  getAllPromoCodes,
  getPromoCodeById,
  validatePromoCode,
  updatePromoCode,
  deletePromoCode,
  togglePromoCodeStatus,
  getAvailablePromoCodes
};