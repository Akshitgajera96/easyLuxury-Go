// FILE: backend/config/db.js
/**
 * MongoDB database configuration and connection setup
 * Environment dependencies: MONGO_URI
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      logger.error('CRITICAL: MONGO_URI is not defined in environment variables');
      logger.error('Please set MONGO_URI in your Render dashboard');
      if (process.env.NODE_ENV === 'production') {
        throw new Error('MONGO_URI is required in production');
      }
      logger.warn('Using fallback local MongoDB connection for development');
    }

    const conn = await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/easyluxury',
      {
        // Connection timeouts - increased for network issues
        serverSelectionTimeoutMS: 30000, // Increased to 30 seconds for DNS resolution
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        connectTimeoutMS: 30000, // Connection timeout increased
        
        // Connection pooling - optimized for Render free tier
        maxPoolSize: process.env.NODE_ENV === 'production' ? 10 : 5, // Reduced for free tier
        minPoolSize: process.env.NODE_ENV === 'production' ? 3 : 1, // Keep minimum connections alive
        maxIdleTimeMS: 60000, // Keep idle connections for 60 seconds (prevent reconnection overhead)
        
        // Retry settings
        retryWrites: true, // Retry failed writes
        retryReads: true, // Retry failed reads
        
        // Write concern for better performance
        w: 'majority',
        wtimeoutMS: 5000,
      }
    );

    logger.info(`MongoDB Connected: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    logger.error(`Database connection error: ${error.message}`);
    
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    throw error;
  }
};

// MongoDB connection events
mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection error: ${err.message}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = connectDB;