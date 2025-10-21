// FILE: backend/config/validateEnv.js
/**
 * Environment variable validation utility
 * Validates required environment variables on startup
 */

const validateEnv = () => {
  const requiredEnvVars = [
    'MONGO_URI',
    'JWT_SECRET',
    'PORT'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('\n❌ CRITICAL ERROR: Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n📝 Please set these environment variables in your Render dashboard:');
    console.error('   Settings → Environment → Add Environment Variable\n');
    console.error('Required variables:');
    console.error('   - MONGO_URI: MongoDB connection string (e.g., mongodb+srv://...)');
    console.error('   - JWT_SECRET: Secret key for JWT tokens (generate a random string)');
    console.error('   - PORT: Server port (Render sets this automatically, use 4000 for local)\n');
    
    // In production, exit immediately
    if (process.env.NODE_ENV === 'production') {
      console.error('🛑 Server cannot start without required environment variables');
      process.exit(1);
    } else {
      console.warn('⚠️ WARNING: Running in development mode with missing variables');
    }
  } else {
    console.log('✅ All required environment variables are set');
  }

  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️ WARNING: JWT_SECRET should be at least 32 characters for security');
  }

  // Check MongoDB URI format
  if (process.env.MONGO_URI) {
    const isValidMongoUri = process.env.MONGO_URI.startsWith('mongodb://') || 
                           process.env.MONGO_URI.startsWith('mongodb+srv://');
    if (!isValidMongoUri) {
      console.error('❌ ERROR: MONGO_URI must start with mongodb:// or mongodb+srv://');
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
  }

  return missingVars.length === 0;
};

module.exports = { validateEnv };
