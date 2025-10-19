// FILE: backend/routes/transactionRoutes.js
/**
 * Transaction management routes
 * Defines endpoints for transaction operations
 */

const express = require('express');
const transactionController = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// All routes are protected
router.use(protect);

/**
 * @route   GET /api/v1/transactions
 * @desc    Get user's transactions
 * @access  Private
 */
router.get('/', transactionController.getUserTransactions);

/**
 * @route   POST /api/v1/transactions/wallet/topup
 * @desc    Add funds to wallet
 * @access  Private
 */
router.post('/wallet/topup', transactionController.addToWallet);

/**
 * @route   GET /api/v1/transactions/wallet/balance
 * @desc    Get wallet balance
 * @access  Private
 */
router.get('/wallet/balance', transactionController.getWalletBalance);

/**
 * @route   GET /api/v1/transactions/:id
 * @desc    Get transaction by ID
 * @access  Private
 */
router.get('/:id', transactionController.getTransactionById);

// Admin only routes
router.use(authorize(ROLES.ADMIN));

/**
 * @route   GET /api/v1/transactions/admin/all
 * @desc    Get all transactions with filtering (admin)
 * @access  Private/Admin
 */
router.get('/admin/all', transactionController.getAllTransactions);

module.exports = router;