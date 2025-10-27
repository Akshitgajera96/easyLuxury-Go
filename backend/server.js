// FILE: backend/server.js
/**
 * Main server entry point for easyLuxury Go API
 * Environment dependencies: PORT, MONGO_URI, JWT_SECRET, NODE_ENV
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const compression = require('compression');
const helmet = require('helmet');

const corsOptions = require('./config/corsOptions');
const errorMiddleware = require('./middleware/errorMiddleware');
const connectDB = require('./config/db');
const { validateEnv } = require('./config/validateEnv');
const { startLocationScheduler, stopLocationScheduler } = require('./services/locationStatusScheduler');
const { startExpirationScheduler, stopExpirationScheduler } = require('./services/tripExpirationService');
const { authLimiter, bookingLimiter, paymentLimiter } = require('./middleware/rateLimitMiddleware');
const logger = require('./utils/logger');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const tripRoutes = require('./routes/tripRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const busRoutes = require('./routes/busRoutes');
const routeRoutes = require('./routes/routeRoutes');
const promoCodeRoutes = require('./routes/promoCodeRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const staffRoutes = require('./routes/staffRoutes');
const rentalInquiryRoutes = require('./routes/rentalInquiryRoutes');
const locationRoutes = require('./routes/locationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminLocationRoutes = require('./routes/adminLocationRoutes');

require('dotenv').config();

// Validate environment variables before starting server
validateEnv();

const app = express();
const server = http.createServer(app);

// Socket.IO configuration with proper CORS for WebSocket
const io = socketIo(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      process.env.FRONTEND_URL
    ].filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: true,
    allowEIO3: true // Allow older Engine.IO clients
  },
  transports: ['websocket', 'polling'], // Enable both transports
  allowUpgrades: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Connect to MongoDB
connectDB();

// Helmet security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", process.env.FRONTEND_URL],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests

// Compression middleware - reduces response size by ~70%
app.use(compression({
  level: 6, // Balanced compression level
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress responses with this header
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression for all other requests
    return compression.filter(req, res);
  }
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    logger.http(`${req.method} ${req.url}`);
    next();
  });
}

// Socket.IO setup
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.debug(`Socket.IO client connected: ${socket.id}`);
  
  socket.on('error', (error) => {
    // Only log non-connection errors to avoid spam
    if (!error.message.includes('transport') && !error.message.includes('polling')) {
      logger.error(`Socket.IO error: ${error.message}`);
    }
  });
  
  socket.on('disconnect', (reason) => {
    // Only log unexpected disconnections
    if (reason !== 'client namespace disconnect' && reason !== 'transport close') {
      logger.debug(`Socket.IO client disconnected: ${socket.id} - Reason: ${reason}`);
    }
  });
  
  socket.on('connect_error', (error) => {
    // Suppress expected connection errors during initial handshake
    if (!error.message.includes('unauthorized')) {
      logger.debug(`Socket.IO connection error (expected during handshake): ${error.message}`);
    }
  });
});

const bookingSocket = require('./sockets/bookingSocket');
bookingSocket.initializeBookingSocket(io);

// API Routes with rate limiting
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/trips', tripRoutes);
app.use('/api/v1/bookings', bookingLimiter, bookingRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/buses', busRoutes);
app.use('/api/v1/routes', routeRoutes);
app.use('/api/v1/promocodes', promoCodeRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/rentals', rentalInquiryRoutes);
app.use('/api/v1/location', locationRoutes);
app.use('/api/v1/payment', paymentLimiter, paymentRoutes);
app.use('/api/v1/admin/location-monitor', adminLocationRoutes);

// Lightweight ping endpoint for keep-alive (no DB check for fast response)
app.get('/ping', (req, res) => {
  res.status(200).json({ ok: true, timestamp: Date.now() });
});

// Health check endpoint with DB status
app.get('/api/v1/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({ 
    success: true, 
    data: { 
      message: 'easyLuxury Go API is running', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: '1.0.0',
      database: dbStatus
    } 
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'Welcome to easyLuxury Go API',
      version: '1.0.0',
      documentation: 'Available at /api/v1/health',
      health: '/api/v1/health'
    }
  });
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

// Handle undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} | Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Start location status monitoring scheduler
  startLocationScheduler();
  
  // Start trip expiration scheduler
  startExpirationScheduler();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  stopLocationScheduler();
  stopExpirationScheduler();
  await mongoose.connection.close();
  server.close(() => {
    process.exit(0);
  });
});

module.exports = app;