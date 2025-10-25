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
    console.error('Missing required environment variables:', missingVars.join(', '));
    
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  // Check MongoDB URI format
  if (process.env.MONGO_URI) {
    const isValidMongoUri = process.env.MONGO_URI.startsWith('mongodb://') || 
                           process.env.MONGO_URI.startsWith('mongodb+srv://');
    if (!isValidMongoUri) {
      console.error('Invalid MONGO_URI format');
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
  }

  return missingVars.length === 0;
};

module.exports = { validateEnv };
