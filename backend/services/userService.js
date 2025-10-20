// FILE: backend/services/userService.js
/**
 * User service handling wallet operations and user management
 * Business logic for user-related operations
 */

const User = require('../models/userModel');
const MESSAGES = require('../constants/messages');

/**
 * Add funds to user wallet
 * @param {string} userId - User ID
 * @param {number} amount - Amount to add
 * @returns {object} Updated user
 */
const addToWallet = async (userId, amount) => {
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error(MESSAGES.USER.USER_NOT_FOUND);
  }

  // Add to wallet
  await user.addToWallet(amount);

  // Return updated user without password
  return await User.findById(userId).select('-password');
};

/**
 * Get user wallet balance
 * @param {string} userId - User ID
 * @returns {object} Wallet balance
 */
const getWalletBalance = async (userId) => {
  const user = await User.findById(userId).select('walletBalance');
  
  if (!user) {
    throw new Error(MESSAGES.USER.USER_NOT_FOUND);
  }

  return {
    walletBalance: user.walletBalance
  };
};

/**
 * Deduct from user wallet
 * @param {string} userId - User ID
 * @param {number} amount - Amount to deduct
 * @returns {object} Updated user
 */
const deductFromWallet = async (userId, amount) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error(MESSAGES.USER.USER_NOT_FOUND);
  }

  // Deduct from wallet
  await user.deductFromWallet(amount);

  // Return updated user without password
  return await User.findById(userId).select('-password');
};

/**
 * Add saved passenger to user profile
 * @param {string} userId - User ID
 * @param {object} passengerData - Passenger details
 * @returns {object} Updated user
 */
const addSavedPassenger = async (userId, passengerData) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error(MESSAGES.USER.USER_NOT_FOUND);
  }

  user.savedPassengers.push(passengerData);
  await user.save();

  return await User.findById(userId).select('-password');
};

/**
 * Get user's saved passengers
 * @param {string} userId - User ID
 * @returns {array} Saved passengers
 */
const getSavedPassengers = async (userId) => {
  const user = await User.findById(userId).select('savedPassengers');
  
  if (!user) {
    throw new Error(MESSAGES.USER.USER_NOT_FOUND);
  }

  return user.savedPassengers;
};

/**
 * Update saved passenger
 * @param {string} userId - User ID
 * @param {string} passengerId - Passenger ID
 * @param {object} updateData - Updated passenger data
 * @returns {object} Updated user
 */
const updateSavedPassenger = async (userId, passengerId, updateData) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error(MESSAGES.USER.USER_NOT_FOUND);
  }

  const passenger = user.savedPassengers.id(passengerId);
  if (!passenger) {
    throw new Error('Passenger not found');
  }

  // Update passenger fields
  if (updateData.name !== undefined) passenger.name = updateData.name;
  if (updateData.age !== undefined) passenger.age = updateData.age;
  if (updateData.gender !== undefined) passenger.gender = updateData.gender;

  await user.save();

  return await User.findById(userId).select('-password');
};

/**
 * Delete saved passenger
 * @param {string} userId - User ID
 * @param {string} passengerId - Passenger ID
 * @returns {object} Updated user
 */
const deleteSavedPassenger = async (userId, passengerId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error(MESSAGES.USER.USER_NOT_FOUND);
  }

  const passenger = user.savedPassengers.id(passengerId);
  if (!passenger) {
    throw new Error('Passenger not found');
  }

  passenger.remove();
  await user.save();

  return await User.findById(userId).select('-password');
};

module.exports = {
  addToWallet,
  getWalletBalance,
  deductFromWallet,
  addSavedPassenger,
  getSavedPassengers,
  updateSavedPassenger,
  deleteSavedPassenger
};