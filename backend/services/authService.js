// FILE: backend/services/authService.js
/**
 * Authentication service handling user registration and login
 * Business logic for auth operations
 */

const User = require('../models/userModel');
const { generateToken } = require('../utils/generateToken');
const MESSAGES = require('../constants/messages');

/**
 * Register a new user
 * @param {object} userData - User registration data
 * @returns {object} User and token
 */
const registerUser = async (userData) => {
  const { name, email, password, phone, role } = userData;

  // Check if user already exists (case-insensitive)
  const existingUser = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
  if (existingUser) {
    throw new Error(MESSAGES.AUTH.EMAIL_EXISTS);
  }

  // Create new user with role (defaults to 'customer' if not provided)
  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: role || 'customer'
  });

  // Return user without password (no token on registration)
  const userResponse = await User.findById(user._id).select('-password');

  return {
    user: userResponse
  };
};

/**
 * Authenticate user login
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {object} User and token
 */
const loginUser = async (email, password) => {
  // Find user and include password for comparison (case-insensitive)
  const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } }).select('+password');
  
  if (!user) {
    throw new Error(MESSAGES.AUTH.INVALID_CREDENTIALS);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new Error('Account has been deactivated');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new Error(MESSAGES.AUTH.INVALID_CREDENTIALS);
  }

  // Generate token with email
  const token = generateToken(user._id, user.role, user.email);

  // Return user without password
  const userResponse = await User.findById(user._id).select('-password');

  return {
    user: userResponse,
    token
  };
};

/**
 * Get user profile
 * @param {string} userId - User ID
 * @returns {object} User profile
 */
const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select('-password');
  
  if (!user) {
    throw new Error(MESSAGES.USER.USER_NOT_FOUND);
  }

  return user;
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {object} updateData - Data to update
 * @returns {object} Updated user
 */
const updateUserProfile = async (userId, updateData) => {
  // Remove fields that shouldn't be updated directly
  const { password, walletBalance, role, ...safeUpdateData } = updateData;

  const user = await User.findByIdAndUpdate(
    userId,
    safeUpdateData,
    { 
      new: true,
      runValidators: true 
    }
  ).select('-password');

  if (!user) {
    throw new Error(MESSAGES.USER.USER_NOT_FOUND);
  }

  return user;
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile
};