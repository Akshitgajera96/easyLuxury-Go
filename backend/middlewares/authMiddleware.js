// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'replace_with_strong_secret';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

/**
 * Helper - extract token from headers, cookies or query param
 */
function getTokenFromRequest(req) {
  // Authorization header
  const auth = req.headers?.authorization || req.headers?.Authorization;
  if (auth && typeof auth === 'string') {
    const parts = auth.split(' ');
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) return parts[1];
    // support "Token <token>" or direct token
    return parts[1] || parts[0];
  }

  // x-access-token header
  if (req.headers && req.headers['x-access-token']) return req.headers['x-access-token'];

  // cookie (if you use cookie-based token)
  if (req.cookies && req.cookies.token) return req.cookies.token;

  // query param ?token=...
  if (req.query && req.query.token) return req.query.token;

  return null;
}

/**
 * Verify token and attach user id+role to req.user (used by protect and optionalAuth)
 */
async function verifyAndAttachUser(req, token) {
  try {
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.id) return null;

    const user = await User.findById(decoded.id).select('_id role isActive');
    if (!user || !user.isActive) return null;

    // attach minimal user info
    req.user = { id: user._id.toString(), role: user.role };
    return req.user;
  } catch (err) {
    // propagate JWT errors up to caller (so caller can decide behavior)
    throw err;
  }
}

/**
 * Protect middleware - require a valid token
 */
const protect = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    try {
      await verifyAndAttachUser(req, token);
      return next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: 'Invalid token.' });
      }
      throw err;
    }
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    return res.status(500).json({ success: false, message: 'Server error during authentication.' });
  }
};

/**
 * optionalAuth - does NOT block request if token missing/invalid.
 * If token valid, attaches req.user.
 */
const optionalAuth = async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) return next();
  try {
    await verifyAndAttachUser(req, token);
  } catch (err) {
    console.warn('optionalAuth token error:', err.message);
    // intentionally ignore token errors for optional auth
  }
  return next();
};

/**
 * Generic role-checking middleware: requireRole('admin'), requireRole('captain','admin')
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    const role = req.user.role;
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Insufficient privileges.' });
    }
    return next();
  };
};

/**
 * authorizeResourceOwner(resourceField)
 * resourceField can be:
 *   - 'params' to check req.params.userId or req.params.id
 *   - a field name (e.g., 'user') to check req.body.user or req.query.user or req.params.user
 *   - or a dot path like 'body.booking.user'
 */
const authorizeResourceOwner = (resourceField = 'user') => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' });

    // Admins bypass ownership check
    if (req.user.role === 'admin') return next();

    // Helper to read nested fields safely
    const readField = (obj, path) => {
      if (!obj || !path) return undefined;
      const parts = path.split('.');
      let cur = obj;
      for (const p of parts) {
        if (cur == null) return undefined;
        cur = cur[p];
      }
      return cur;
    };

    let ownerId;

    if (resourceField === 'params') {
      ownerId = req.params?.userId || req.params?.id || req.params?.ownerId;
    } else {
      // check in body, params, query in that order
      ownerId = readField(req.body, resourceField) || readField(req.params, resourceField) || readField(req.query, resourceField);
    }

    if (!ownerId) {
      return res.status(403).json({ success: false, message: 'Access denied. Resource ownership could not be verified.' });
    }

    if (ownerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only access your own resources.' });
    }

    return next();
  };
};

/**
 * Helper for sockets or other non-express contexts
 * returns user object {id, role} or null
 */
const verifyTokenForSocket = async (token) => {
  try {
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.id) return null;
    const user = await User.findById(decoded.id).select('_id role isActive');
    if (!user || !user.isActive) return null;
    return { id: user._id.toString(), role: user.role };
  } catch (err) {
    return null;
  }
};

/**
 * Rate limiter factory - to use with express-rate-limit
 * Example in route:
 *   const rateLimit = require('express-rate-limit');
 *   router.post('/login', rateLimit(authRateLimiter()), loginHandler);
 */
const authRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15m
  const max = options.max || 5;
  return {
    windowMs,
    max,
    message: {
      success: false,
      message: options.message || 'Too many authentication attempts. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
  };
};

/**
 * JWT utilities
 */
const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

module.exports = {
  protect,
  optionalAuth,
  requireRole,            // usage: requireRole('admin') or requireRole('captain','admin')
  authorizeResourceOwner, // usage: authorizeResourceOwner('params') or authorizeResourceOwner('user')
  authRateLimiter,
  generateToken,
  verifyTokenForSocket,
  // backward-compat helpers (if you prefer explicit named ones)
  admin: requireRole('admin'),
  captain: requireRole('captain', 'admin')
};
