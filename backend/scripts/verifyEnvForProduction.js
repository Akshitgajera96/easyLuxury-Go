// FILE: backend/scripts/verifyEnvForProduction.js
/**
 * Script to verify all required environment variables are set for production
 * Run this before deploying to Render
 */

require('dotenv').config();

const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'PORT',
  'NODE_ENV',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'ADMIN_PASSWORD_HASH',
  'FRONTEND_URL'
];

const optionalEnvVars = [
  'EMAIL_USER',
  'EMAIL_PASSWORD',
  'MAX_LOGIN_ATTEMPTS',
  'LOGIN_RATE_LIMIT_WINDOW'
];

console.log('\n🔍 Verifying Environment Variables for Production...\n');

let allRequired = true;
let missingVars = [];

// Check required variables
console.log('✅ Required Variables:');
requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`   ✓ ${varName}: Set`);
  } else {
    console.log(`   ✗ ${varName}: MISSING`);
    allRequired = false;
    missingVars.push(varName);
  }
});

console.log('\n📋 Optional Variables:');
optionalEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`   ✓ ${varName}: Set`);
  } else {
    console.log(`   ⚠ ${varName}: Not set (optional)`);
  }
});

// Check specific values
console.log('\n🔍 Value Checks:');

if (process.env.NODE_ENV !== 'production') {
  console.log(`   ⚠ NODE_ENV: "${process.env.NODE_ENV}" (should be "production" for Render)`);
}

if (process.env.PORT !== '10000' && process.env.PORT !== '4000') {
  console.log(`   ⚠ PORT: "${process.env.PORT}" (Render uses 10000, local uses 4000)`);
}

if (process.env.MONGO_URI && !process.env.MONGO_URI.includes('mongodb')) {
  console.log(`   ✗ MONGO_URI: Invalid format (should start with mongodb:// or mongodb+srv://)`);
  allRequired = false;
}

if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.includes('localhost')) {
  console.log(`   ⚠ FRONTEND_URL: Contains localhost (update to production URL after frontend deployment)`);
}

// Final result
console.log('\n' + '='.repeat(60));
if (allRequired && missingVars.length === 0) {
  console.log('✅ All required environment variables are set!');
  console.log('✅ Ready for production deployment to Render\n');
  process.exit(0);
} else {
  console.log('❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\n⚠️  Please set these variables in Render dashboard before deploying\n');
  process.exit(1);
}
