// FILE: backend/services/transactionService.js
/**
 * Transaction service handling wallet and payment transactions
 * Business logic for transaction operations
 */

const Transaction = require('../models/transactionModel');
const User = require('../models/userModel');
const MESSAGES = require('../constants/messages');

/**
 * Get user's transaction history
 * @param {string} userId - User ID
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {object} Transactions and pagination info
 */
const getUserTransactions = async (userId, page = 1, limit = 10) => {
  const transactions = await Transaction.getUserTransactions(userId, page, limit);
  const total = await Transaction.countDocuments({ user: userId });

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Add funds to user wallet
 * @param {string} userId - User ID
 * @param {number} amount - Amount to add
 * @param {string} paymentMethod - Payment method
 * @param {string} referenceId - Payment reference ID
 * @returns {object} Transaction and updated user
 */
const addToWallet = async (userId, amount, paymentMethod, referenceId = null) => {
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error(MESSAGES.USER.USER_NOT_FOUND);
  }

  // Create transaction
  const transaction = await Transaction.createWalletTopUp(
    userId, 
    amount, 
    paymentMethod, 
    referenceId
  );

  // Update user wallet balance
  await user.addToWallet(amount);

  return {
    transaction,
    user: await User.findById(userId).select('-password'),
    newBalance: user.walletBalance
  };
};

/**
 * Process booking payment
 * @param {string} userId - User ID
 * @param {number} amount - Payment amount
 * @param {string} bookingId - Booking ID
 * @param {string} paymentMethod - Payment method
 * @param {string} referenceId - Payment reference ID
 * @returns {object} Transaction details
 */
const processBookingPayment = async (userId, amount, bookingId, paymentMethod, referenceId = null) => {
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error(MESSAGES.USER.USER_NOT_FOUND);
  }

  // For wallet payments, check balance
  if (paymentMethod === 'wallet' && !user.hasSufficientBalance(amount)) {
    throw new Error(MESSAGES.USER.INSUFFICIENT_BALANCE);
  }

  // Create transaction
  const transaction = await Transaction.createBookingPayment(
    userId,
    amount,
    bookingId,
    paymentMethod,
    referenceId
  );

  // Deduct from wallet if payment method is wallet
  if (paymentMethod === 'wallet') {
    await user.deductFromWallet(amount);
  }

  // For other payment methods, integrate with payment gateway here
  // This is where you would integrate with Razorpay/Stripe

  return {
    transaction,
    newBalance: user.walletBalance
  };
};

/**
 * Process refund for cancelled booking
 * @param {string} userId - User ID
 * @param {number} amount - Refund amount
 * @param {string} bookingId - Booking ID
 * @param {string} referenceId - Refund reference ID
 * @returns {object} Refund transaction and updated user
 */
const processRefund = async (userId, amount, bookingId, referenceId = null) => {
  if (amount <= 0) {
    throw new Error('Refund amount must be greater than 0');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error(MESSAGES.USER.USER_NOT_FOUND);
  }

  // Create refund transaction
  const transaction = await Transaction.createRefund(
    userId,
    amount,
    bookingId,
    referenceId
  );

  // Add refund to wallet
  await user.addToWallet(amount);

  return {
    transaction,
    user: await User.findById(userId).select('-password'),
    newBalance: user.walletBalance
  };
};

/**
 * Get wallet balance from transactions
 * @param {string} userId - User ID
 * @returns {object} Wallet balance
 */
const getWalletBalance = async (userId) => {
  const balance = await Transaction.getWalletBalance(userId);
  
  return {
    walletBalance: balance
  };
};

/**
 * Get transaction by ID
 * @param {string} transactionId - Transaction ID
 * @param {string} userId - User ID
 * @returns {object} Transaction data
 */
const getTransactionById = async (transactionId, userId) => {
  const transaction = await Transaction.findOne({
    _id: transactionId,
    user: userId
  }).populate('booking');

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  return transaction;
};

/**
 * Get all transactions with filtering (admin)
 * @param {object} filters - Filter criteria
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {object} Transactions and pagination info
 */
const getAllTransactions = async (filters = {}, page = 1, limit = 10) => {
  const query = {};

  // Apply filters
  if (filters.userId) {
    query.user = filters.userId;
  }
  if (filters.type) {
    query.type = filters.type;
  }
  if (filters.paymentMethod) {
    query.paymentMethod = filters.paymentMethod;
  }
  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.startDate && filters.endDate) {
    query.createdAt = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  }

  const skip = (page - 1) * limit;

  const transactions = await Transaction.find(query)
    .populate('user', 'name email')
    .populate('booking')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Transaction.countDocuments(query);

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

module.exports = {
  getUserTransactions,
  addToWallet,
  processBookingPayment,
  processRefund,
  getWalletBalance,
  getTransactionById,
  getAllTransactions
};