// backend/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Helpers
 */
const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_with_a_strong_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'; // adjust as needed

function signToken(user) {
  const payload = {
    id: user._id,
    role: user.role || 'user',
    email: user.email,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function sanitizeUser(userDoc) {
  if (!userDoc) return null;
  const user = userDoc.toObject ? userDoc.toObject() : userDoc;
  delete user.password;
  return user;
}

/**
 * Register a new user
 * POST /auth/register
 * body: { name, email, password, phone? }
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // check if user exists
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = new User({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashed,
      phone: phone ? String(phone).trim() : undefined,
    });

    await user.save();

    const token = signToken(user);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Login
 * POST /auth/login
 * body: { email, password }
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = signToken(user);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get profile
 * GET /auth/profile
 * Assumes authMiddleware sets req.userId or req.user; if not, falls back to verifying token
 */
exports.getProfile = async (req, res, next) => {
  try {
    let userId = null;

    // Prefer auth middleware (req.user or req.userId)
    if (req.user && req.user.id) userId = req.user.id;
    if (!userId && req.userId) userId = req.userId;

    // Fallback: verify Authorization header
    if (!userId) {
      const auth = req.headers.authorization || req.headers.Authorization;
      if (auth && auth.startsWith('Bearer ')) {
        const token = auth.split(' ')[1];
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          userId = decoded.id || decoded._id;
        } catch (e) {
          return res.status(401).json({ success: false, message: 'Invalid token.' });
        }
      }
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
};

/**
 * Logout
 * POST /auth/logout
 * NOTE: With stateless JWTs this is mostly handled client-side by deleting token.
 * Implement token blacklist here if your system supports it.
 */
exports.logout = async (req, res, next) => {
  try {
    // If you maintain a token blacklist or refresh tokens, handle invalidation here.
    // For now, just respond success and let the client remove the token.
    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Change password
 * POST /auth/change-password
 * body: { oldPassword, newPassword }
 * Protected route: user must be authenticated.
 */
exports.changePassword = async (req, res, next) => {
  try {
    const userId = (req.user && req.user.id) || req.userId || (req.body && req.body.userId);
    const { oldPassword, newPassword } = req.body || {};

    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required.' });
    if (!oldPassword || !newPassword) return res.status(400).json({ success: false, message: 'Old and new password required.' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return res.status(400).json({ success: false, message: 'Old password is incorrect.' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
};
