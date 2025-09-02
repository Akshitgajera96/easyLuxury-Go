const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

// Generate a secure secret key if not provided
const secretKey = process.env.JWT_SECRET || (() => {
  console.warn('⚠️  JWT_SECRET not found in environment variables. Generating temporary secret.');
  return crypto.randomBytes(64).toString('hex');
})();

const refreshSecretKey = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString('hex');
const algorithm = process.env.JWT_ALGORITHM || 'HS256';
const issuer = process.env.JWT_ISSUER || 'easyluxury-go-api';
const audience = process.env.JWT_AUDIENCE || 'easyluxury-go-client';

// Token types for different purposes
const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  VERIFICATION: 'verification',
  PASSWORD_RESET: 'password_reset',
  API_KEY: 'api_key'
};

// Default expiration times
const EXPIRATION_TIMES = {
  ACCESS: process.env.JWT_ACCESS_EXPIRY || '15m',
  REFRESH: process.env.JWT_REFRESH_EXPIRY || '7d',
  VERIFICATION: process.env.JWT_VERIFICATION_EXPIRY || '24h',
  PASSWORD_RESET: process.env.JWT_PASSWORD_RESET_EXPIRY || '1h'
};

/**
 * Generate JWT token with enhanced security features
 */
const generateToken = (payload, options = {}) => {
  const {
    type = TOKEN_TYPES.ACCESS,
    expiresIn = EXPIRATION_TIMES[type.toUpperCase()] || EXPIRATION_TIMES.ACCESS,
    secret = type === TOKEN_TYPES.REFRESH ? refreshSecretKey : secretKey,
    issuer: customIssuer = issuer,
    audience: customAudience = audience
  } = options;

  const tokenPayload = {
    ...payload,
    type,
    jti: crypto.randomBytes(16).toString('hex') // Unique token identifier
  };

  const tokenOptions = {
    expiresIn,
    issuer: customIssuer,
    audience: customAudience,
    algorithm
  };

  try {
    return jwt.sign(tokenPayload, secret, tokenOptions);
  } catch (error) {
    console.error('❌ Token generation error:', error);
    throw new Error('Failed to generate token');
  }
};

/**
 * Verify JWT token with comprehensive error handling
 */
const verifyToken = (token, options = {}) => {
  const {
    type = TOKEN_TYPES.ACCESS,
    secret = type === TOKEN_TYPES.REFRESH ? refreshSecretKey : secretKey,
    issuer: expectedIssuer = issuer,
    audience: expectedAudience = audience
  } = options;

  const verifyOptions = {
    issuer: expectedIssuer,
    audience: expectedAudience,
    algorithms: [algorithm]
  };

  try {
    const decoded = jwt.verify(token, secret, verifyOptions);
    
    // Validate token type if specified
    if (type && decoded.type !== type) {
      throw new Error(`Invalid token type. Expected: ${type}, Got: ${decoded.type}`);
    }

    return {
      valid: true,
      payload: decoded,
      expired: false
    };
  } catch (error) {
    return {
      valid: false,
      payload: null,
      expired: error.name === 'TokenExpiredError',
      error: error.message
    };
  }
};

/**
 * Decode token without verification (for informational purposes only)
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token, { complete: true });
  } catch (error) {
    console.error('❌ Token decoding error:', error);
    return null;
  }
};

/**
 * Refresh access token using refresh token
 */
const refreshAccessToken = (refreshToken, newExpiry = EXPIRATION_TIMES.ACCESS) => {
  try {
    // Verify the refresh token first
    const verification = verifyToken(refreshToken, { type: TOKEN_TYPES.REFRESH });
    
    if (!verification.valid) {
      throw new Error('Invalid refresh token');
    }

    if (verification.expired) {
      throw new Error('Refresh token expired');
    }

    // Extract payload and remove token-specific fields
    const { iat, exp, jti, type, ...cleanPayload } = verification.payload;

    // Generate new access token
    return generateToken(cleanPayload, {
      type: TOKEN_TYPES.ACCESS,
      expiresIn: newExpiry
    });

  } catch (error) {
    console.error('❌ Token refresh error:', error);
    throw new Error(`Failed to refresh token: ${error.message}`);
  }
};

/**
 * Generate token pair (access + refresh tokens)
 */
const generateTokenPair = (payload, options = {}) => {
  const {
    accessExpiresIn = EXPIRATION_TIMES.ACCESS,
    refreshExpiresIn = EXPIRATION_TIMES.REFRESH
  } = options;

  const accessToken = generateToken(payload, {
    type: TOKEN_TYPES.ACCESS,
    expiresIn: accessExpiresIn
  });

  const refreshToken = generateToken(payload, {
    type: TOKEN_TYPES.REFRESH,
    expiresIn: refreshExpiresIn
  });

  return { accessToken, refreshToken };
};

/**
 * Generate email verification token
 */
const generateVerificationToken = (userId, email) => {
  return generateToken(
    { userId, email, purpose: 'email_verification' },
    { type: TOKEN_TYPES.VERIFICATION }
  );
};

/**
 * Generate password reset token
 */
const generatePasswordResetToken = (userId) => {
  return generateToken(
    { userId, purpose: 'password_reset' },
    { type: TOKEN_TYPES.PASSWORD_RESET }
  );
};

/**
 * Verify password reset token
 */
const verifyPasswordResetToken = (token) => {
  return verifyToken(token, { type: TOKEN_TYPES.PASSWORD_RESET });
};

/**
 * Check if token is about to expire (for proactive renewal)
 */
const isTokenExpiringSoon = (token, thresholdMinutes = 5) => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.payload.exp) return false;

    const expirationTime = decoded.payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const thresholdMs = thresholdMinutes * 60 * 1000;

    return (expirationTime - currentTime) <= thresholdMs;
  } catch (error) {
    return false;
  }
};

/**
 * Get token expiration time
 */
const getTokenExpiration = (token) => {
  try {
    const decoded = decodeToken(token);
    return decoded?.payload.exp ? new Date(decoded.payload.exp * 1000) : null;
  } catch (error) {
    return null;
  }
};

/**
 * Blacklist token (basic implementation - for production use Redis)
 */
const tokenBlacklist = new Set();
const blacklistToken = (token, expirySeconds = 3600) => {
  const decoded = decodeToken(token);
  if (decoded && decoded.payload.exp) {
    const expiresAt = decoded.payload.exp * 1000;
    const now = Date.now();
    
    // Only add if token hasn't expired yet
    if (expiresAt > now) {
      tokenBlacklist.add(token);
      
      // Auto-remove from blacklist after token expiration
      setTimeout(() => {
        tokenBlacklist.delete(token);
      }, expiresAt - now);
    }
  }
};

const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

/**
 * Validate token structure without verification
 */
const validateTokenStructure = (token) => {
  if (typeof token !== 'string') return false;
  
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  try {
    // Check if parts are valid base64
    parts.forEach(part => {
      Buffer.from(part, 'base64').toString('base64') === part;
    });
    return true;
  } catch {
    return false;
  }
};

/**
 * Security check: Rotate secrets (for security incidents)
 */
const rotateSecrets = () => {
  console.warn('⚠️  Rotating JWT secrets. This will invalidate all existing tokens!');
  secretKey = crypto.randomBytes(64).toString('hex');
  refreshSecretKey = crypto.randomBytes(64).toString('hex');
};

module.exports = {
  // Core functions
  generateToken,
  verifyToken,
  decodeToken,
  refreshAccessToken,
  generateTokenPair,
  
  // Specialized token generators
  generateVerificationToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  
  // Utility functions
  isTokenExpiringSoon,
  getTokenExpiration,
  blacklistToken,
  isTokenBlacklisted,
  validateTokenStructure,
  rotateSecrets,
  
  // Constants
  TOKEN_TYPES,
  EXPIRATION_TIMES,
  
  // Configuration (read-only)
  getConfig: () => ({
    algorithm,
    issuer,
    audience,
    hasCustomSecret: !!process.env.JWT_SECRET
  })
};