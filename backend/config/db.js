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
      }
    );

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('💡 Common issues:');
    console.error('   - Check MONGO_URI is set correctly in environment variables');
    console.error('   - Verify MongoDB Atlas network access (whitelist 0.0.0.0/0 for Render)');
    console.error('   - Ensure database user has correct permissions');
    
    if (process.env.NODE_ENV === 'production') {
      console.error('🛑 Cannot start server without database connection in production');
      process.exit(1);
    }
    throw error;
  }
};

// MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('📊 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('📤 MongoDB connection closed through app termination');
  process.exit(0);
});

module.exports = connectDB;