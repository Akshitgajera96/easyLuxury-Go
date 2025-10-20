// FILE: backend/controllers/userController.js
/**
 * User controller handling HTTP requests for wallet and passenger operations
 * Routes: /api/v1/users/*
 */

const userService = require('../services/userService');
const MESSAGES = require('../constants/messages');

/**
 * Add funds to user wallet
 * POST /api/v1/users/wallet/add
 */
const addToWallet = async (req, res, next) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    const updatedUser = await userService.addToWallet(req.user._id, amount);

    res.status(200).json({
      success: true,
      data: { 
        user: updatedUser,
        addedAmount: amount
      },
      message: `₹${amount} added to wallet successfully`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user wallet balance
 * GET /api/v1/users/wallet/balance
 */
const getWalletBalance = async (req, res, next) => {
  try {
    const walletData = await userService.getWalletBalance(req.user._id);

    res.status(200).json({
      success: true,
      data: walletData,
      message: 'Wallet balance fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add saved passenger to user profile
 * POST /api/v1/users/passengers
 */
const addSavedPassenger = async (req, res, next) => {
  try {
    const { name, age, gender } = req.body;

    if (!name || !age || !gender) {
      return res.status(400).json({
        success: false,
        message: 'Name, age, and gender are required'
      });
    }

    const updatedUser = await userService.addSavedPassenger(req.user._id, {
      name,
      age,
      gender
    });

    res.status(201).json({
      success: true,
      data: { user: updatedUser },
      message: 'Passenger saved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's saved passengers
 * GET /api/v1/users/passengers
 */
const getSavedPassengers = async (req, res, next) => {
  try {
    const passengers = await userService.getSavedPassengers(req.user._id);

    res.status(200).json({
      success: true,
      data: { passengers },
      message: 'Saved passengers fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update saved passenger
 * PUT /api/v1/users/passengers/:id
 */
const updateSavedPassenger = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedUser = await userService.updateSavedPassenger(req.user._id, id, updateData);

    res.status(200).json({
      success: true,
      data: { user: updatedUser },
      message: 'Passenger updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete saved passenger
 * DELETE /api/v1/users/passengers/:id
 */
const deleteSavedPassenger = async (req, res, next) => {
  try {
    const { id } = req.params;

    const updatedUser = await userService.deleteSavedPassenger(req.user._id, id);

    res.status(200).json({
      success: true,
      data: { user: updatedUser },
      message: 'Passenger deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addToWallet,
  getWalletBalance,
  addSavedPassenger,
  getSavedPassengers,
  updateSavedPassenger,
  deleteSavedPassenger
};