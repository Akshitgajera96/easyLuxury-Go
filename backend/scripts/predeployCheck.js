// FILE: backend/scripts/predeployCheck.js
/**
 * Pre-deployment checks for backend
 * Validates critical configurations before deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Running pre-deployment checks...\n');

let hasErrors = false;
let hasWarnings = false;

// Check 1: Required environment variables
console.log('📋 Checking environment variables...');
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'NODE_ENV'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  hasErrors = true;
} else {
  console.log('✅ All required environment variables are set');
}

// Check 2: Node version
console.log('\n📦 Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));

if (majorVersion < 16) {
  console.error(`❌ Node.js version ${nodeVersion} is too old. Minimum required: 16.x`);
  hasErrors = true;
} else {
  console.log(`✅ Node.js version ${nodeVersion} is compatible`);
}

// Check 3: Critical files exist
console.log('\n📁 Checking critical files...');
const criticalFiles = [
  'package.json',
  'server.js',
  'config/db.js',
  'utils/logger.js',
  'middleware/errorMiddleware.js'
];

const missingFiles = criticalFiles.filter(file => !fs.existsSync(path.join(__dirname, '..', file)));

if (missingFiles.length > 0) {
  console.error(`❌ Missing critical files: ${missingFiles.join(', ')}`);
  hasErrors = true;
} else {
  console.log('✅ All critical files present');
}

// Check 4: Dependencies installed
console.log('\n📦 Checking dependencies...');
if (!fs.existsSync(path.join(__dirname, '..', 'node_modules'))) {
  console.error('❌ node_modules not found. Run npm install');
  hasErrors = true;
} else {
  console.log('✅ Dependencies installed');
}

// Check 5: Security packages
console.log('\n🔒 Checking security packages...');
const packageJson = require('../package.json');
const securityPackages = ['helmet', 'express-rate-limit', 'cors'];
const missingSecurityPackages = securityPackages.filter(pkg => !packageJson.dependencies[pkg]);

if (missingSecurityPackages.length > 0) {
  console.warn(`⚠️  Missing security packages: ${missingSecurityPackages.join(', ')}`);
  hasWarnings = true;
} else {
  console.log('✅ Security packages installed');
}

// Check 6: Production readiness
console.log('\n🚀 Checking production configuration...');
if (process.env.NODE_ENV === 'production') {
  // Check MongoDB URI format
  if (process.env.MONGO_URI && !process.env.MONGO_URI.startsWith('mongodb')) {
    console.error('❌ Invalid MONGO_URI format');
    hasErrors = true;
  }
  
  // Check JWT secret strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  JWT_SECRET should be at least 32 characters for production');
    hasWarnings = true;
  }
  
  if (!hasErrors && !hasWarnings) {
    console.log('✅ Production configuration looks good');
  }
} else {
  console.log('ℹ️  Not running in production mode');
}

// Final summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.error('❌ PRE-DEPLOYMENT CHECKS FAILED');
  console.error('Please fix the errors above before deploying');
  process.exit(1);
} else if (hasWarnings) {
  console.warn('⚠️  PRE-DEPLOYMENT CHECKS PASSED WITH WARNINGS');
  console.warn('Consider addressing the warnings above');
  process.exit(0);
} else {
  console.log('✅ ALL PRE-DEPLOYMENT CHECKS PASSED');
  console.log('Ready for deployment! 🚀');
  process.exit(0);
}
