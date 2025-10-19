// FILE: backend/controllers/authController.js
/**
 * Authentication controller handling HTTP requests for auth operations
 * Routes: /api/v1/auth/*
 */

const authService = require('../services/authService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Staff = require('../models/staffModel');
const User = require('../models/userModel');
const OTP = require('../models/otpModel');
const Notification = require('../models/notificationModel');
const { generateOTP, sendPasswordResetOTP } = require('../services/emailService');
const MESSAGES = require('../constants/messages');

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    const result = await authService.registerUser({
      name,
      email,
      password,
      phone
    });

    res.status(201).json({
      success: true,
      data: result,
      message: MESSAGES.AUTH.REGISTER_SUCCESS
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/v1/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      console.log('  ❌ Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const result = await authService.loginUser(email, password);

    res.status(200).json({
      success: true,
      data: result,
      message: MESSAGES.AUTH.LOGIN_SUCCESS
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/v1/users/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getUserProfile(req.user._id);

    res.status(200).json({
      success: true,
      data: { user },
      message: MESSAGES.USER.PROFILE_FETCHED
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/v1/users/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const updatedUser = await authService.updateUserProfile(req.user._id, req.body);

    res.status(200).json({
      success: true,
      data: { user: updatedUser },
      message: MESSAGES.USER.PROFILE_UPDATED
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 * POST /api/v1/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    // In a stateless JWT system, we just send success
    // The client will remove the token
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin login - Environment-based authentication
 * POST /api/v1/auth/admin/login
 */
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log('  ❌ Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check if admin credentials are configured
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD_HASH) {
      console.error('  ❌ Admin credentials not configured in environment');
      return res.status(500).json({
        success: false,
        message: 'Admin authentication not configured properly'
      });
    }

    // Check if email matches admin email from environment (case-insensitive)
    if (email.toLowerCase() !== process.env.ADMIN_EMAIL.toLowerCase()) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Verify password against environment hash
    const isPasswordValid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Generate JWT token with 8 hours expiry for better UX
    const token = jwt.sign(
      { 
        email: process.env.ADMIN_EMAIL,
        role: 'admin',
        type: 'admin',
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(200).json({
      success: true,
      data: {
        token,
        admin: {
          email: process.env.ADMIN_EMAIL,
          role: 'admin',
          name: 'Admin'
        },
        expiresIn: '8h'
      },
      message: 'Admin login successful'
    });
  } catch (error) {
    console.error('❌ Admin login error:', error);
    next(error);
  }
};

/**
 * Staff registration controller - creates account pending admin approval
 * POST /api/v1/auth/staff/register
 */
const staffRegister = async (req, res, next) => {
  try {
    const { name, email, password, phone, designation, department, employeeId, dateOfJoining } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phone || !designation || !department || !employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if staff already exists
    const existingStaff = await Staff.findOne({ 
      $or: [
        { email: { $regex: new RegExp(`^${email}$`, 'i') } },
        { employeeId: employeeId.toUpperCase() }
      ]
    });

    if (existingStaff) {
      return res.status(400).json({
        success: false,
        message: existingStaff.email.toLowerCase() === email.toLowerCase() 
          ? 'Email already registered' 
          : 'Employee ID already exists'
      });
    }

    // Create staff with pending status
    const staff = await Staff.create({
      name,
      email,
      password,
      phone,
      designation,
      department,
      employeeId: employeeId.toUpperCase(),
      dateOfJoining: dateOfJoining || new Date(),
      role: 'staff', // Explicitly set role to staff
      status: 'pending',
      approved: false,
      isActive: true
    });

    // Create notification for admin immediately
    try {
      await Notification.createStaffRegistrationNotification(staff);
      console.log('  🔔 Notification created for admin');
    } catch (notifError) {
      console.error('  ⚠️ Failed to create notification:', notifError.message);
      // Don't fail the registration if notification fails
    }

    res.status(201).json({
      success: true,
      data: {
        staff: {
          _id: staff._id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
          employeeId: staff.employeeId,
          designation: staff.designation,
          status: staff.status
        }
      },
      message: 'Registration successful! Your account is pending admin approval. You will be notified once approved.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Staff login controller - only allows approved staff
 * POST /api/v1/auth/staff/login
 */
const staffLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Staff login attempt:', email);

    // Validate input
    if (!email || !password) {
      console.log('  ❌ Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find staff by email (include password for verification) - case-insensitive
    const staff = await Staff.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } }).select('+password');
    
    if (!staff) {
      console.log('  ❌ Staff not found');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await staff.comparePassword(password);
    
    if (!isPasswordValid) {
      console.log('  ❌ Invalid password');
      // Increment failed login attempts
      await staff.incLoginAttempts();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check account status
    if (staff.status === 'pending') {
      console.log('  ⏳ Account pending approval');
      return res.status(403).json({
        success: false,
        status: 'pending',
        message: 'Your account is pending admin approval. You will be notified once approved.'
      });
    }

    if (staff.status === 'rejected') {
      console.log('  ❌ Account rejected');
      return res.status(403).json({
        success: false,
        status: 'rejected',
        message: staff.rejectionReason || 'Your registration request was rejected by the admin. Please contact support.'
      });
    }

    if (staff.status === 'cancelled') {
      console.log('  ❌ Account cancelled');
      return res.status(403).json({
        success: false,
        status: 'cancelled',
        message: 'Your account has been cancelled. Please contact administrator.'
      });
    }

    // Check if account is locked
    if (staff.isLocked()) {
      const lockTime = Math.ceil((staff.lockUntil - Date.now()) / 60000);
      console.log('  🔒 Account locked');
      return res.status(403).json({
        success: false,
        message: `Account locked due to too many failed login attempts. Try again in ${lockTime} minutes.`
      });
    }

    // Check if staff is active
    if (!staff.isActive) {
      console.log('  ❌ Staff account deactivated');
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact administrator.'
      });
    }

    // Check if approved (should be, but double check)
    if (staff.status !== 'approved') {
      console.log('  ❌ Account not approved, status:', staff.status);
      return res.status(403).json({
        success: false,
        message: 'Your account is not approved for login. Please contact administrator.'
      });
    }

    console.log('  ✅ All checks passed, generating token');

    // Reset login attempts on successful login
    if (staff.loginAttempts > 0) {
      await staff.resetLoginAttempts();
    }

    // Update last login
    await staff.updateLastLogin();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: staff._id,
        email: staff.email,
        role: staff.role,
        type: 'staff',
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('  ✅ Staff login successful');

    res.status(200).json({
      success: true,
      data: {
        token,
        staff: {
          _id: staff._id,
          name: staff.name,
          email: staff.email,
          phone: staff.phone,
          role: staff.role,
          designation: staff.designation,
          department: staff.department,
          employeeId: staff.employeeId,
          status: staff.status
        },
        expiresIn: '24h'
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('❌ Staff login error:', error);
    next(error);
  }
};

/**
 * Request password reset OTP
 * POST /api/v1/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email, type: 'password-reset' });

    // Generate new OTP
    const otp = generateOTP();

    // Save OTP to database
    await OTP.create({
      email,
      otp,
      type: 'password-reset',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    // Send OTP email
    await sendPasswordResetOTP(email, user.name, otp);

    res.status(200).json({
      success: true,
      message: 'Password reset OTP has been sent to your email',
      data: {
        email,
        expiresIn: '10 minutes'
      }
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    next(error);
  }
};

/**
 * Verify OTP for password reset
 * POST /api/v1/auth/verify-reset-otp
 */
const verifyResetOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Find OTP
    const otpRecord = await OTP.findOne({
      email,
      otp,
      type: 'password-reset',
      verified: false
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Check if expired
    if (otpRecord.isExpired()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one'
      });
    }

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        email,
        otpId: otpRecord._id
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    next(error);
  }
};

/**
 * Reset password after OTP verification
 * POST /api/v1/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required'
      });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Find verified OTP
    const otpRecord = await OTP.findOne({
      email,
      otp,
      type: 'password-reset',
      verified: true
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or unverified OTP. Please verify OTP first'
      });
    }

    // Check if expired
    if (otpRecord.isExpired()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one'
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password
    user.password = hashedPassword;
    await user.save();

    // Delete OTP after successful password reset
    await OTP.deleteOne({ _id: otpRecord._id });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  adminLogin,
  staffRegister,
  staffLogin,
  forgotPassword,
  verifyResetOTP,
  resetPassword
};