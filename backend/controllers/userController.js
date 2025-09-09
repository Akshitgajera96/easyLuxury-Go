// backend/controllers/userController.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS || 10);

/**
 * Helper: safe parse page/limit
 */
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.max(1, Math.min(100, parseInt(query.limit || '10', 10)));
  return { page, limit };
}

/**
 * GET /api/users/me
 * Get current user's profile
 */
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, msg: 'Authentication required' });

    const user = await User.findById(userId)
      .select('-password -__v')
      .populate({
        path: 'walletTransactions',
        options: { sort: { createdAt: -1 }, limit: 5 },
        select: 'amount type description createdAt status balanceAfter'
      });

    if (!user) return res.status(404).json({ success: false, msg: 'User not found' });

    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, msg: 'Invalid user ID format' });
    }
    return res.status(500).json({ success: false, msg: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};

/**
 * PUT /api/users/me
 * Update user profile
 */
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, msg: 'Authentication required' });

    const { name, phone, address } = req.body || {};
    if (!name && !phone && !address) {
      return res.status(400).json({ success: false, msg: 'At least one field is required for update' });
    }

    const updateData = {};
    if (typeof name === 'string' && name.trim().length) updateData.name = name.trim();
    if (typeof phone === 'string' && phone.trim().length) updateData.phone = phone.trim();
    if (typeof address === 'string' && address.trim().length) updateData.address = address.trim();

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select('-password -__v');
    if (!user) return res.status(404).json({ success: false, msg: 'User not found' });

    return res.status(200).json({ success: true, msg: 'Profile updated successfully', user });
  } catch (err) {
    console.error('Error updating user profile:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, msg: 'Validation error', error: err.message });
    }
    return res.status(500).json({ success: false, msg: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};

/**
 * POST /api/users/wallet
 * Update wallet balance (deposit/withdrawal/refund/payment)
 */
exports.updateWallet = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.user?.id;
    if (!userId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(401).json({ success: false, msg: 'Authentication required' });
    }

    const { amount, type = 'deposit', description } = req.body || {};
    if (amount == null || isNaN(amount) || Number(amount) <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, msg: 'Valid positive amount is required' });
    }

    const numericAmount = Number(amount);
    const validTypes = ['deposit', 'withdrawal', 'refund', 'payment'];
    if (!validTypes.includes(type)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, msg: 'Invalid transaction type' });
    }

    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    if ((type === 'withdrawal' || type === 'payment') && (user.walletBalance || 0) < numericAmount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, msg: 'Insufficient wallet balance' });
    }

    // Compute new balance
    let newBalance = Number(user.walletBalance || 0);
    if (type === 'deposit' || type === 'refund') newBalance += numericAmount;
    else newBalance -= numericAmount;

    // Save transaction
    const transaction = new WalletTransaction({
      user: userId,
      amount: numericAmount,
      type,
      description: description || `${type} transaction`,
      balanceAfter: newBalance,
      status: 'completed',
      processedAt: new Date()
    });

    await transaction.save({ session });

    // Update user's wallet and push transaction id
    user.walletBalance = newBalance;
    // ensure walletTransactions is an array
    if (!Array.isArray(user.walletTransactions)) user.walletTransactions = [];
    user.walletTransactions.push(transaction._id);
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      msg: 'Wallet updated successfully',
      balance: newBalance,
      transactionId: transaction._id,
      transactionType: type
    });
  } catch (err) {
    try { await session.abortTransaction(); } catch (e) { /* ignore */ }
    session.endSession();
    console.error('Error updating wallet:', err);
    return res.status(500).json({ success: false, msg: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};

/**
 * GET /api/users/wallet/transactions
 * Get wallet transactions for current user (pagination + filter)
 */
exports.getWalletTransactions = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, msg: 'Authentication required' });

    const { page, limit } = parsePagination(req.query);
    const { type } = req.query;

    const filter = { user: userId };
    if (type && ['deposit', 'withdrawal', 'refund', 'payment'].includes(type)) filter.type = type;

    const [transactions, total, user] = await Promise.all([
      WalletTransaction.find(filter).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).select('-__v'),
      WalletTransaction.countDocuments(filter),
      User.findById(userId).select('walletBalance')
    ]);

    return res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      transactions,
      currentBalance: user?.walletBalance ?? 0
    });
  } catch (err) {
    console.error('Error fetching wallet transactions:', err);
    return res.status(500).json({ success: false, msg: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};

/**
 * GET /api/users/:id
 * Get any user by id (admin or same user)
 */
exports.getUserDetails = async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ success: false, msg: 'Authentication required' });

    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, msg: 'User ID is required' });

    const isAdmin = requester.role === 'admin';
    const isSameUser = String(requester.id) === String(id);
    if (!isAdmin && !isSameUser) return res.status(403).json({ success: false, msg: 'Access denied' });

    const user = await User.findById(id)
      .select('-password -__v')
      .populate({
        path: 'walletTransactions',
        options: { sort: { createdAt: -1 }, limit: 3 },
        select: 'amount type createdAt status balanceAfter'
      });

    if (!user) return res.status(404).json({ success: false, msg: 'User not found' });

    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('Error getting user details:', err);
    if (err.name === 'CastError') return res.status(400).json({ success: false, msg: 'Invalid user ID format' });
    return res.status(500).json({ success: false, msg: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};

/**
 * GET /api/users
 * Get all users (admin only)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const requester = req.user;
    if (!requester || requester.role !== 'admin') return res.status(403).json({ success: false, msg: 'Access denied. Admin required.' });

    const { page, limit } = parsePagination(req.query);
    const { search, role } = req.query;

    const filter = {};
    if (search) {
      const s = String(search).trim();
      filter.$or = [{ name: { $regex: s, $options: 'i' } }, { email: { $regex: s, $options: 'i' } }];
    }
    if (role && ['user', 'admin', 'captain'].includes(role)) filter.role = role;

    const [users, total] = await Promise.all([
      User.find(filter).select('-password -__v').sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit),
      User.countDocuments(filter)
    ]);

    return res.status(200).json({ success: true, total, page, pages: Math.ceil(total / limit), users });
  } catch (err) {
    console.error('Error getting all users:', err);
    return res.status(500).json({ success: false, msg: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};

/**
 * DELETE /api/users/:id
 * Delete user account (admin or self)
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const requester = req.user;
    if (!requester) return res.status(401).json({ success: false, msg: 'Authentication required' });

    if (!id) return res.status(400).json({ success: false, msg: 'User ID is required' });

    const isSelfDelete = String(id) === String(requester.id);
    const isAdmin = requester.role === 'admin';
    if (!isSelfDelete && !isAdmin) return res.status(403).json({ success: false, msg: 'Access denied' });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, msg: 'User not found' });

    // Prevent deleting last admin
    if (isSelfDelete && isAdmin) {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) return res.status(400).json({ success: false, msg: 'Cannot delete the only admin account' });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({ success: true, msg: 'User account deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    if (err.name === 'CastError') return res.status(400).json({ success: false, msg: 'Invalid user ID format' });
    return res.status(500).json({ success: false, msg: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};

/**
 * POST /api/users/change-password
 * Change password for current user (requires currentPassword, newPassword)
 */
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, msg: 'Authentication required' });

    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, msg: 'currentPassword and newPassword are required' });

    const user = await User.findById(userId).select('+password');
    if (!user) return res.status(404).json({ success: false, msg: 'User not found' });

    // Use model comparePassword if available, otherwise bcrypt.compare
    const isMatch = typeof user.comparePassword === 'function' ? await user.comparePassword(currentPassword) : await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, msg: 'Current password is incorrect' });

    // Validate new password strength (simple example)
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ success: false, msg: 'New password must be at least 6 characters long' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({ success: true, msg: 'Password updated successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    return res.status(500).json({ success: false, msg: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};

/**
 * PATCH /api/users/preferences
 * Update preferences
 */
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, msg: 'Authentication required' });

    const preferences = req.body.preferences || {};
    const user = await User.findByIdAndUpdate(userId, { preferences }, { new: true, runValidators: true }).select('-password -__v');
    if (!user) return res.status(404).json({ success: false, msg: 'User not found' });

    return res.status(200).json({ success: true, msg: 'Preferences updated successfully', preferences: user.preferences });
  } catch (err) {
    console.error('Error updating preferences:', err);
    return res.status(500).json({ success: false, msg: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};

/**
 * GET /api/users/stats
 * Get user stats (admin only)
 */
exports.getUserStats = async (req, res) => {
  try {
    const requester = req.user;
    if (!requester || requester.role !== 'admin') return res.status(403).json({ success: false, msg: 'Admin access required' });

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const suspendedUsers = await User.countDocuments({ status: 'suspended' });

    return res.status(200).json({ success: true, totalUsers, activeUsers, suspendedUsers });
  } catch (err) {
    console.error('Error fetching user stats:', err);
    return res.status(500).json({ success: false, msg: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};
