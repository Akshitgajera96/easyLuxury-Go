// FILE: backend/utils/generateToken.js
/**
 * JWT token generation utility
 * Environment dependencies: JWT_SECRET
 */

const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for user authentication
 * @param {string} userId - User ID to encode in token
 * @param {string} role - User role for authorization
 * @param {string} email - User email to encode in token
 * @returns {string} JWT token
 */
const generateToken = (userId, role, email = null) => {
  const payload = { 
    id: userId, 
    role: role 
  };
  
  // Add email to payload if provided
  if (email) {
    payload.email = email;
  }
  
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { 
      expiresIn: '30d' // Token expires in 30 days
    }
  );
};

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  generateToken,
  verifyToken
};