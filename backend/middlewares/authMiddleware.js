const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ✅ Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        success: false,
        message: "Access denied. No token provided." 
      });
    }

    const token = authHeader.split(" ")[1];

    // Check if token exists
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "Access denied. No token provided." 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const user = await User.findById(decoded.id).select("_id role isActive");

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "User not found. Token is no longer valid." 
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false,
        message: "Account is deactivated. Please contact support." 
      });
    }

    // Add user to request object
    req.user = {
      id: user._id,
      role: user.role,
    };

    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);

    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        success: false,
        message: "Invalid token." 
      });
    }

    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({ 
        success: false,
        message: "Token has expired. Please login again." 
      });
    }

    res.status(500).json({ 
      success: false,
      message: "Server error during authentication." 
    });
  }
};

// ✅ Admin authorization middleware
const admin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: "Authentication required." 
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: "Access denied. Admin privileges required." 
    });
  }

  next();
};

// ✅ Captain authorization middleware
const captain = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: "Authentication required." 
    });
  }

  if (req.user.role !== 'captain' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: "Access denied. Captain or Admin privileges required." 
    });
  }

  next();
};

// ✅ Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(); // Continue without user info
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("_id role isActive");

    if (user && user.isActive) {
      req.user = {
        id: user._id,
        role: user.role,
      };
    }

    next();
  } catch (err) {
    // For optional auth, we don't block the request on token errors
    console.warn("Optional auth token error:", err.message);
    next();
  }
};

// ✅ Rate limiting helper (to be used with express-rate-limit)
const authRateLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
};

// ✅ Generate JWT token utility function
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// ✅ Verify token without middleware (for socket connections, etc.)
const verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("_id role isActive");
    
    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user._id,
      role: user.role,
    };
  } catch (err) {
    return null;
  }
};

// ✅ Check if user owns the resource or is admin
const authorizeResourceOwner = (resourceUserIdField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication required." 
      });
    }

    // Admins can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Get the resource owner ID from the request
    let resourceOwnerId;
    
    if (resourceUserIdField === 'params') {
      resourceOwnerId = req.params.userId || req.params.id;
    } else if (req.body[resourceUserIdField]) {
      resourceOwnerId = req.body[resourceUserIdField];
    } else if (req.query[resourceUserIdField]) {
      resourceOwnerId = req.query[resourceUserIdField];
    } else {
      return res.status(403).json({ 
        success: false,
        message: "Access denied. Resource ownership could not be verified." 
      });
    }

    // Check if the authenticated user owns the resource
    if (resourceOwnerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: "Access denied. You can only access your own resources." 
      });
    }

    next();
  };
};

module.exports = {
  protect,
  admin,
  captain,
  optionalAuth,
  authRateLimiter,
  generateToken,
  verifyToken,
  authorizeResourceOwner
};