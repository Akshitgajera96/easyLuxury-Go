// FILE: backend/middleware/authMiddleware.js
/**
 * Authentication and authorization middleware
 * Verifies JWT tokens and checks user roles for protected routes
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const Staff = require('../models/staffModel');
const MESSAGES = require('../constants/messages');
const { ROLES, hasRequiredRole } = require('../constants/roles');

// Verify JWT token - works with all user types (user, admin, staff)
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: MESSAGES.AUTH.TOKEN_REQUIRED
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Handle different token types
      if (decoded.role === 'admin') {
        // Admin token from environment
        req.user = {
          email: decoded.email,
          role: 'admin',
          name: 'Admin',
          _id: 'admin'
        };
        next();
      } else if (decoded.role === 'staff') {
        // Staff token from database
        const staff = await Staff.findById(decoded.id).select('-password');
        
        if (!staff) {
          console.log('❌ Staff auth: Staff not found for token');
          return res.status(401).json({
            success: false,
            message: MESSAGES.AUTH.TOKEN_INVALID
          });
        }

        if (!staff.approved || !staff.isActive) {
          return res.status(403).json({
            success: false,
            message: 'Your staff account is not active. Please contact admin.'
          });
        }

        req.user = staff;
        next();
      } else {
        // Regular user token from database
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
          console.log('❌ User auth: User not found for token');
          return res.status(401).json({
            success: false,
            message: MESSAGES.AUTH.TOKEN_INVALID
          });
        }

        if (user.isActive === false) {
          console.log('❌ User auth: User account is deactivated');
          return res.status(403).json({
            success: false,
            message: 'Your account has been deactivated. Please contact support.'
          });
        }

        req.user = user;
        next();
      }
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: MESSAGES.AUTH.TOKEN_EXPIRED,
          expired: true
        });
      }
      
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: MESSAGES.AUTH.TOKEN_INVALID
        });
      }
      
      console.error('❌ Auth: JWT verification error:', jwtError.message);
      return res.status(401).json({
        success: false,
        message: MESSAGES.AUTH.TOKEN_INVALID
      });
    }
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: MESSAGES.GENERAL.SERVER_ERROR
    });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: MESSAGES.AUTH.UNAUTHORIZED
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: MESSAGES.GENERAL.FORBIDDEN
      });
    }

    next();
  };
};

// Optional auth - doesn't fail if no token, but sets user if available
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without user for optional auth
    next();
  }
};

// Admin-only middleware - Verifies admin from environment variables
const verifyAdmin = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      console.log('❌ Admin auth: No token provided');
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required. Please provide a valid token.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      console.log('🔑 Admin auth: Token decoded successfully');
      console.log('  Role:', decoded.role);
      console.log('  Email:', decoded.email);
      
      // Check if role is admin
      if (decoded.role !== 'admin') {
        console.log('❌ Admin auth: Invalid role -', decoded.role);
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      // Verify email matches admin email from environment (case-insensitive)
      if (!process.env.ADMIN_EMAIL || decoded.email.toLowerCase() !== process.env.ADMIN_EMAIL.toLowerCase()) {
        console.log('❌ Admin auth: Email mismatch or not configured');
        return res.status(403).json({
          success: false,
          message: 'Unauthorized admin access'
        });
      }

      // Attach admin info to request
      req.admin = {
        email: decoded.email,
        role: decoded.role,
        name: 'Admin'
      };
      
      console.log('✅ Admin auth: Verification successful');
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        console.log('❌ Admin auth: Token expired');
        return res.status(401).json({
          success: false,
          message: 'Admin session expired. Please login again.',
          expired: true
        });
      }
      
      if (jwtError.name === 'JsonWebTokenError') {
        console.log('❌ Admin auth: Invalid token format');
        return res.status(401).json({
          success: false,
          message: 'Invalid admin token. Please login again.'
        });
      }
      
      console.error('❌ Admin auth: JWT verification error:', jwtError.message);
      return res.status(401).json({
        success: false,
        message: 'Token verification failed'
      });
    }
  } catch (error) {
    console.error('❌ Admin auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during admin authentication'
    });
  }
};

// Staff-only middleware - Verifies approved staff
const verifyStaff = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Staff authentication required'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      console.log('🔑 Staff auth: Token decoded successfully');
      console.log('  Role:', decoded.role);
      console.log('  Email:', decoded.email);
      
      // Check if role is staff
      if (decoded.role !== 'staff') {
        console.log('❌ Staff auth: Invalid role -', decoded.role);
        return res.status(403).json({
          success: false,
          message: 'Access denied. Staff privileges required.'
        });
      }

      // Get staff from database to verify approval status
      const staff = await Staff.findById(decoded.id).select('-password');
      
      if (!staff) {
        console.log('❌ Staff auth: Staff account not found');
        return res.status(401).json({
          success: false,
          message: 'Staff account not found'
        });
      }

      // Check if staff is approved
      if (!staff.approved) {
        console.log('❌ Staff auth: Staff not approved');
        return res.status(403).json({
          success: false,
          message: 'Your account is pending admin approval. Please contact administrator.'
        });
      }

      // Check if staff is active
      if (!staff.isActive) {
        console.log('❌ Staff auth: Staff account deactivated');
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please contact administrator.'
        });
      }

      // Check if account is locked
      if (staff.isLocked()) {
        const lockTime = Math.ceil((staff.lockUntil - Date.now()) / 60000);
        console.log('❌ Staff auth: Account locked');
        return res.status(403).json({
          success: false,
          message: `Account locked due to too many failed login attempts. Try again in ${lockTime} minutes.`
        });
      }

      req.staff = staff;
      console.log('✅ Staff auth: Verification successful');
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        console.log('❌ Staff auth: Token expired');
        return res.status(401).json({
          success: false,
          message: 'Staff session expired. Please login again.',
          expired: true
        });
      }
      
      if (jwtError.name === 'JsonWebTokenError') {
        console.log('❌ Staff auth: Invalid token format');
        return res.status(401).json({
          success: false,
          message: 'Invalid staff token. Please login again.'
        });
      }
      
      console.error('❌ Staff auth: JWT verification error:', jwtError.message);
      return res.status(401).json({
        success: false,
        message: 'Token verification failed'
      });
    }
  } catch (error) {
    console.error('Staff auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during staff authentication'
    });
  }
};

module.exports = {
  protect,
  authorize,
  optionalAuth,
  verifyAdmin,
  verifyStaff
};