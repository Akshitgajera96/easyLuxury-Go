// FILE: backend/config/db.js
/**
 * MongoDB database configuration and connection setup
 * Environment dependencies: MONGO_URI
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('❌ CRITICAL: MONGO_URI is not defined in environment variables');
      console.error('📝 Please set MONGO_URI in your Render dashboard');
      if (process.env.NODE_ENV === 'production') {
        throw new Error('MONGO_URI is required in production');
      }
      console.warn('⚠️ Using fallback local MongoDB connection for development');
    }

    const conn = await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/easyluxury',
      {
        serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        maxPoolSize: process.env.NODE_ENV === 'production' ? 50 : 10, // Connection pool size
        minPoolSize: process.env.NODE_ENV === 'production' ? 5 : 2, // Minimum connections
        maxIdleTimeMS: 10000, // Remove idle connections after 10 seconds
        retryWrites: true, // Retry failed writes
        retryReads: true, // Retry failed reads
      }
    );

    console.log(`MongoDB Connected: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('Database connection error:', error.message);
    
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    throw error;
  }
};

// MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = connectDB;