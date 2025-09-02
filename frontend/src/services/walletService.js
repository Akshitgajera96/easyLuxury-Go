// src/services/walletService.js
import { apiCall, USER_API } from './api';

// 💰 Get wallet balance
export const getWalletBalance = async () => {
  try {
    return await apiCall('get', USER_API.WALLET);
  } catch (error) {
    throw error || { message: 'Failed to fetch wallet balance' };
  }
};

// ➕ Add funds to wallet
export const addFundsToWallet = async (amount, paymentMethod = 'card') => {
  try {
    return await apiCall('put', USER_API.WALLET, {
      amount,
      type: 'deposit',
      description: `Wallet deposit via ${paymentMethod}`,
      paymentMethod
    });
  } catch (error) {
    throw error || { message: 'Failed to add funds to wallet' };
  }
};

// 📋 Get wallet transactions with pagination
export const getWalletTransactions = async (params = {}) => {
  try {
    return await apiCall('get', USER_API.WALLET_TRANSACTIONS, null, { params });
  } catch (error) {
    throw error || { message: 'Failed to fetch wallet transactions' };
  }
};

// 💳 Process payment using wallet
export const processPaymentWithWallet = async (amount, bookingId, description = '') => {
  try {
    return await apiCall('put', USER_API.WALLET, {
      amount: -amount, // Negative amount for deduction
      type: 'payment',
      description: description || `Payment for booking ${bookingId}`,
      bookingId
    });
  } catch (error) {
    throw error || { message: 'Failed to process payment' };
  }
};

// 💸 Process refund to wallet
export const processRefundToWallet = async (amount, refundId, description = '') => {
  try {
    return await apiCall('put', USER_API.WALLET, {
      amount,
      type: 'refund',
      description: description || `Refund for ${refundId}`,
      refundId
    });
  } catch (error) {
    throw error || { message: 'Failed to process refund' };
  }
};

// 🏧 Withdraw funds from wallet
export const withdrawFromWallet = async (amount, bankAccountDetails) => {
  try {
    return await apiCall('put', USER_API.WALLET, {
      amount: -amount, // Negative amount for withdrawal
      type: 'withdrawal',
      description: 'Funds withdrawal to bank account',
      bankAccountDetails
    });
  } catch (error) {
    throw error || { message: 'Failed to withdraw funds' };
  }
};

// 📊 Get wallet statistics
export const getWalletStats = async (period = 'month') => {
  try {
    const transactions = await getWalletTransactions({ limit: 1000 });
    
    if (!transactions || !transactions.data) {
      return {
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalPayments: 0,
        totalRefunds: 0,
        netFlow: 0
      };
    }

    const stats = transactions.data.reduce((acc, transaction) => {
      if (transaction.type === 'deposit') acc.totalDeposits += transaction.amount;
      if (transaction.type === 'withdrawal') acc.totalWithdrawals += Math.abs(transaction.amount);
      if (transaction.type === 'payment') acc.totalPayments += Math.abs(transaction.amount);
      if (transaction.type === 'refund') acc.totalRefunds += transaction.amount;
      return acc;
    }, {
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalPayments: 0,
      totalRefunds: 0
    });

    stats.netFlow = stats.totalDeposits + stats.totalRefunds - stats.totalWithdrawals - stats.totalPayments;

    return stats;
  } catch (error) {
    throw error || { message: 'Failed to calculate wallet statistics' };
  }
};

// 🔍 Filter transactions by type
export const filterTransactionsByType = async (type, params = {}) => {
  try {
    return await apiCall('get', USER_API.WALLET_TRANSACTIONS, null, {
      params: { type, ...params }
    });
  } catch (error) {
    throw error || { message: 'Failed to filter transactions' };
  }
};

// 📅 Get transactions by date range
export const getTransactionsByDateRange = async (startDate, endDate, params = {}) => {
  try {
    return await apiCall('get', USER_API.WALLET_TRANSACTIONS, null, {
      params: { startDate, endDate, ...params }
    });
  } catch (error) {
    throw error || { message: 'Failed to fetch transactions by date range' };
  }
};

// 💰 Check if sufficient balance exists
export const hasSufficientBalance = async (amount) => {
  try {
    const balance = await getWalletBalance();
    return balance.currentBalance >= amount;
  } catch (error) {
    throw error || { message: 'Failed to check balance' };
  }
};

// 🎯 Get recent transactions
export const getRecentTransactions = async (limit = 10) => {
  try {
    return await getWalletTransactions({
      page: 1,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  } catch (error) {
    throw error || { message: 'Failed to fetch recent transactions' };
  }
};

// 💵 Format currency for display
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// 📈 Calculate wallet health score
export const calculateWalletHealth = async () => {
  try {
    const [balance, transactions] = await Promise.all([
      getWalletBalance(),
      getRecentTransactions(50)
    ]);

    if (!transactions.data || transactions.data.length === 0) {
      return 100; // Perfect score for new wallets
    }

    let score = 100;
    
    // Deduct points for negative balance
    if (balance.currentBalance < 0) score -= 50;
    
    // Check transaction frequency (healthy wallets have regular activity)
    const transactionCount = transactions.data.length;
    if (transactionCount < 3) score -= 10;
    
    // Check for large withdrawals relative to balance
    const largeWithdrawals = transactions.data.filter(t => 
      t.type === 'withdrawal' && Math.abs(t.amount) > balance.currentBalance * 0.5
    ).length;
    
    score -= largeWithdrawals * 5;

    return Math.max(0, Math.min(100, score));
  } catch (error) {
    console.error('Error calculating wallet health:', error);
    return 50; // Neutral score if calculation fails
  }
};

// 🔄 Sync wallet balance with server
export const syncWalletBalance = async () => {
  try {
    const balance = await getWalletBalance();
    // You could store this in context or local storage if needed
    return balance;
  } catch (error) {
    throw error || { message: 'Failed to sync wallet balance' };
  }
};