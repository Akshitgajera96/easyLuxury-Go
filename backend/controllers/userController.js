const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");

// ✅ Get current user's profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password -__v")
      .populate({
        path: 'walletTransactions',
        options: { sort: { createdAt: -1 }, limit: 5 },
        select: 'amount type description createdAt'
      });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("❌ Error fetching user profile:", err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ msg: "Invalid user ID format" });
    }
    
    res.status(500).json({ 
      msg: "Server error", 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

// ✅ Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const userId = req.user.id;

    // Validation
    if (!name && !phone && !address) {
      return res.status(400).json({ msg: "At least one field is required for update" });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (phone) updateData.phone = phone.trim();
    if (address) updateData.address = address.trim();

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password -__v");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.status(200).json({
      msg: "Profile updated successfully",
      user
    });
  } catch (err) {
    console.error("❌ Error updating user profile:", err);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        msg: "Validation error", 
        error: err.message 
      });
    }
    
    res.status(500).json({ 
      msg: "Server error", 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

// ✅ Update wallet balance (with transaction history)
exports.updateWallet = async (req, res) => {
  try {
    const { amount, type = 'deposit', description } = req.body;
    const userId = req.user.id;

    // Validation
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ msg: "Valid positive amount is required" });
    }

    const numericAmount = parseFloat(amount);
    const validTypes = ['deposit', 'withdrawal', 'refund', 'payment'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ msg: "Invalid transaction type" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Check for sufficient balance for withdrawals
    if (type === 'withdrawal' && user.walletBalance < numericAmount) {
      return res.status(400).json({ msg: "Insufficient wallet balance" });
    }

    // Calculate new balance
    let newBalance = user.walletBalance || 0;
    if (type === 'deposit' || type === 'refund') {
      newBalance += numericAmount;
    } else if (type === 'withdrawal' || type === 'payment') {
      newBalance -= numericAmount;
    }

    // Start transaction session for atomic operations
    const session = await User.startSession();
    session.startTransaction();

    try {
      // Update user wallet balance
      user.walletBalance = newBalance;
      await user.save({ session });

      // Create wallet transaction record
      const transaction = new WalletTransaction({
        user: userId,
        amount: numericAmount,
        type,
        description: description || `${type} transaction`,
        balanceAfter: newBalance,
        status: 'completed'
      });

      await transaction.save({ session });

      // Add transaction to user's transaction history
      user.walletTransactions.push(transaction._id);
      await user.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        msg: "Wallet updated successfully",
        balance: newBalance,
        transactionId: transaction._id,
        transactionType: type
      });

    } catch (transactionError) {
      await session.abortTransaction();
      session.endSession();
      throw transactionError;
    }

  } catch (err) {
    console.error("❌ Error updating wallet:", err);
    res.status(500).json({ 
      msg: "Server error", 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

// ✅ Get wallet transactions with pagination
exports.getWalletTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, type } = req.query;

    const filter = { user: userId };
    if (type && ['deposit', 'withdrawal', 'refund', 'payment'].includes(type)) {
      filter.type = type;
    }

    const transactions = await WalletTransaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await WalletTransaction.countDocuments(filter);

    res.status(200).json({
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      transactions,
      currentBalance: (await User.findById(userId)).walletBalance
    });
  } catch (err) {
    console.error("❌ Error fetching wallet transactions:", err);
    res.status(500).json({ 
      msg: "Server error", 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

// ✅ Get any user by ID (admin access or used in frontend /:id route)
exports.getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ msg: "User ID is required" });
    }

    const user = await User.findById(id)
      .select("-password -__v")
      .populate({
        path: 'walletTransactions',
        options: { sort: { createdAt: -1 }, limit: 3 },
        select: 'amount type createdAt'
      });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Check if requester is admin or the same user
    const isAdmin = req.user.role === 'admin';
    const isSameUser = req.user.id === id;

    if (!isAdmin && !isSameUser) {
      return res.status(403).json({ msg: "Access denied" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("❌ Error getting user details:", err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ msg: "Invalid user ID format" });
    }
    
    res.status(500).json({ 
      msg: "Server error", 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

// ✅ Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: "Access denied. Admin required." });
    }

    const { page = 1, limit = 10, search, role } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role && ['user', 'admin', 'captain'].includes(role)) {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select("-password -__v")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.status(200).json({
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      users
    });
  } catch (err) {
    console.error("❌ Error getting all users:", err);
    res.status(500).json({ 
      msg: "Server error", 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

// ✅ Delete user account (admin or self)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const requesterId = req.user.id;
    const requesterRole = req.user.role;

    if (!id) {
      return res.status(400).json({ msg: "User ID is required" });
    }

    // Check if user is trying to delete themselves or is admin
    const isSelfDelete = id === requesterId;
    const isAdmin = requesterRole === 'admin';

    if (!isSelfDelete && !isAdmin) {
      return res.status(403).json({ msg: "Access denied" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Prevent admin from deleting themselves if they're the only admin
    if (isSelfDelete && isAdmin) {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ msg: "Cannot delete the only admin account" });
      }
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({ 
      msg: "User account deleted successfully" 
    });
  } catch (err) {
    console.error("❌ Error deleting user:", err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ msg: "Invalid user ID format" });
    }
    
    res.status(500).json({ 
      msg: "Server error", 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

// controllers/userController.js

// Change password
exports.changePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("+password");
    const { currentPassword, newPassword } = req.body;

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ msg: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ msg: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Update preferences
exports.updatePreferences = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { preferences: req.body.preferences },
      { new: true, runValidators: true }
    ).select("-password -__v");

    res.status(200).json({
      msg: "Preferences updated successfully",
      preferences: user.preferences,
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Get user stats (admin only)
exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: "active" });
    const suspendedUsers = await User.countDocuments({ status: "suspended" });

    res.status(200).json({ totalUsers, activeUsers, suspendedUsers });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
