// backend/utils/jwtUtils.js
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret";

if (!process.env.JWT_SECRET) {
  console.warn(
    "⚠️ Warning: JWT_SECRET is not set. Using fallback secret. Do NOT use this in production!"
  );
}

/**
 * Generate JWT token
 * @param {Object} payload - Data to include in token (e.g., { id: userId })
 * @param {Object} [opts] - Options { expiresIn } (default: "7d")
 * @returns {String} Signed JWT token
 */
const generateToken = (payload, opts = {}) => {
  const expiresIn = opts.expiresIn || "7d";
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

/**
 * Verify JWT token safely
 * @param {String} token - JWT token string
 * @returns {Object} { valid: Boolean, payload: Object|null, error: String|null }
 *
 * This does NOT throw — instead returns a structured object.
 */
const verifyToken = (token) => {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return { valid: true, payload, error: null };
  } catch (err) {
    let message = "Invalid token";
    if (err.name === "TokenExpiredError") message = "Token expired";
    if (err.name === "JsonWebTokenError") message = "Malformed token";
    return { valid: false, payload: null, error: message };
  }
};

/**
 * Decode JWT without verifying
 * ⚠️ Use only for non-sensitive cases (e.g., UI prefill)
 * @param {String} token
 * @returns {Object|null} Decoded payload or null
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
};

/**
 * (Optional) Check if token is blacklisted
 * For logout token invalidation if you store blacklisted tokens
 * @param {String} token
 * @param {Set} blacklist
 * @returns {Boolean}
 */
const isTokenBlacklisted = (token, blacklist = new Set()) => {
  return blacklist.has(token);
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  isTokenBlacklisted,
};
