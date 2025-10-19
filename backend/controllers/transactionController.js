// FILE: backend/controllers/transactionController.js
/**
 * Transaction controller handling HTTP requests for transaction operations
 * Routes: /api/v1/transactions/*
 */

const transactionService = require('../services/transactionService');

/**
 * Get user's transactions
 * GET /api/v1/transactions
 */
const getUserTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await transactionService.getUserTransactions(
      req.user._id,
      parseInt(page),
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Transactions fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add funds to wallet
 * POST /api/v1/transactions/wallet/topup
 */
const addToWallet = async (req, res, next) => {
  try {
    const { amount, paymentMethod, referenceId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    const result = await transactionService.addToWallet(
      req.user._id,
      amount,
      paymentMethod,
      referenceId
    );

    res.status(200).json({
      success: true,
      data: result,
      message: `₹${amount} added to wallet successfully`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get wallet balance
 * GET /api/v1/transactions/wallet/balance
 */
const getWalletBalance = async (req, res, next) => {
  try {
    const result = await transactionService.getWalletBalance(req.user._id);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Wallet balance fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get transaction by ID
 * GET /api/v1/transactions/:id
 */
const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await transactionService.getTransactionById(
      req.params.id,
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: { transaction },
      message: 'Transaction fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all transactions (admin)
 * GET /api/v1/transactions/admin/all
 */
const getAllTransactions = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      userId, 
      type, 
      paymentMethod, 
      status, 
      startDate, 
      endDate 
    } = req.query;
    
    const filters = {};
    if (userId) filters.userId = userId;
    if (type) filters.type = type;
    if (paymentMethod) filters.paymentMethod = paymentMethod;
    if (status) filters.status = status;
    if (startDate && endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    }

    const result = await transactionService.getAllTransactions(
      filters, 
      parseInt(page), 
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'All transactions fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserTransactions,
  addToWallet,
  getWalletBalance,
  getTransactionById,
  getAllTransactions
};