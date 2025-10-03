const User = require("../models/User");
const Captain = require("../models/Captain");
const { verifyToken } = require("../utils/jwtUtils");
const { validationResult, check } = require("express-validator");

/**
 * Extract JWT token from request
 */
const getTokenFromRequest = (req) => {
  if (req.headers.authorization?.startsWith("Bearer ")) {
    return req.headers.authorization.split(" ")[1];
  }
  if (req.cookies?.token) return req.cookies.token;
  if (req.query?.token) return req.query.token;
  return null;
};

/**
 * Verify token and attach user or captain to request
 */
const verifyAndAttachUser = async (req, token, requireAuth = true) => {
  if (!token) {
    if (!requireAuth) return;
    const err = new Error("Token missing");
    err.statusCode = 401;
    throw err;
  }

  const { valid, payload, error } = verifyToken(token);

  if (!valid) {
    if (!requireAuth) return;
    const err = new Error(error || "Invalid token");
    err.statusCode = 401;
    throw err;
  }

  // Try to find user first, then captain
  let account = await User.findById(payload.id);
  // let role = "user";  // <-- આ લાઈન કાઢી નાખો

  if (!account) {
    account = await Captain.findById(payload.id);
    if (account) {
        req.user = account;
        req.role = "captain"; // Captain role
    }
  } else {
    req.user = account;
    // The role should come from the user object in the database
    req.role = account.role || "user"; // <-- આ લાઈન ઉમેરો (assuming user model has a 'role' field)
  }

  if (!account) {
    const err = new Error("Account not found");
    err.statusCode = 404;
    throw err;
  }

  if (account.isActive === false) {
    const err = new Error("Account disabled");
    err.statusCode = 403;
    throw err;
  }

  req.user = account;
  req.role = role;
};

/**
 * Protect routes (require authentication)
 */
const protect = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ success: false, msg: "Not authorized, no token" });
    }

    await verifyAndAttachUser(req, token, true);
    next();
  } catch (err) {
    res
      .status(err.statusCode || 500)
      .json({ success: false, msg: err.message || "Authentication failed" });
  }
};

/**
 * Optional authentication (attach user/captain if token exists, otherwise continue)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (token) {
      await verifyAndAttachUser(req, token, false);
    }
    next();
  } catch (err) {
    res
      .status(err.statusCode || 500)
      .json({ success: false, msg: err.message || "Optional authentication failed" });
  }
};

/**
 * Role-based access control
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, msg: "Not authenticated" });
    }
    if (!roles.includes(req.role)) {
      return res.status(403).json({ success: false, msg: "Access denied" });
    }
    next();
  };
};

/**
 * Shortcut for admin routes
 */
const admin = requireRole("admin");

/**
 * Ensure the user is the owner of the resource
 */
const authorizeResourceOwner = (getOwnerIdFn) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, msg: "Not authenticated" });
    }
    const ownerId = getOwnerIdFn(req);
    if (req.user._id.toString() !== ownerId.toString()) {
      return res.status(403).json({ success: false, msg: "Not authorized for this resource" });
    }
    next();
  };
};

/**
 * Validate request body using express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      msg: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

/**
 * Predefined validation schemas
 */
const validators = {
  registerUser: [
    check("name").notEmpty().withMessage("Name is required"),
    check("email").isEmail().withMessage("Valid email is required"),
    check("phone").isMobilePhone().withMessage("Valid phone number is required"),
    check("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  loginUser: [
    check("email").isEmail().withMessage("Valid email is required"),
    check("password").notEmpty().withMessage("Password is required"),
  ],
  registerCaptain: [
    check("fullName").notEmpty().withMessage("Full name is required"),
    check("email").isEmail().withMessage("Valid email is required"),
    check("phone").isMobilePhone().withMessage("Valid phone number is required"),
    check("licenseNumber").notEmpty().withMessage("License number is required"),
    check("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  loginCaptain: [
    check("email").isEmail().withMessage("Valid email is required"),
    check("password").notEmpty().withMessage("Password is required"),
  ],
  changePassword: [
    check("oldPassword").notEmpty().withMessage("Old password is required"),
    check("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
  ],
};

module.exports = {
  protect,
  optionalAuth,
  requireRole,
  admin, // now available for routes
  authorizeResourceOwner,
  validate,
  validators,
};
