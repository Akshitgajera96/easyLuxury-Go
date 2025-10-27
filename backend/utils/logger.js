// FILE: backend/utils/logger.js
/**
 * Structured logging utility using Winston
 * Environment-aware logging with proper levels and formats
 */

const winston = require('winston');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Format for development (colorized console output)
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(info => `${info.timestamp} [${info.level}]: ${info.message}`)
);

// Format for production (JSON for easier parsing)
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Determine which transports to use based on environment
const transports = [];

if (process.env.NODE_ENV !== 'production') {
  // Console transport for development
  transports.push(
    new winston.transports.Console({
      format: devFormat,
    })
  );
} else {
  // Console transport for production (JSON format for log aggregation)
  transports.push(
    new winston.transports.Console({
      format: prodFormat,
    })
  );
}

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Create a stream object for Morgan HTTP logger
logger.stream = {
  write: message => {
    logger.http(message.trim());
  },
};

module.exports = logger;
