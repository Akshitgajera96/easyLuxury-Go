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

const corsOptions = require('./config/corsOptions');
const errorMiddleware = require('./middleware/errorMiddleware');
const connectDB = require('./config/db');
const { validateEnv } = require('./config/validateEnv');
const { startLocationScheduler, stopLocationScheduler } = require('./services/locationStatusScheduler');

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

// Basic security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Basic logging
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });
}

// Socket.IO setup
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  socket.on('error', (error) => {
    console.error('Socket.IO error:', error);
  });
});

const bookingSocket = require('./sockets/bookingSocket');
bookingSocket.initializeBookingSocket(io);

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/trips', tripRoutes);
app.use('/api/v1/bookings', bookingRoutes);
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
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/admin/location-monitor', adminLocationRoutes);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    data: { 
      message: 'easyLuxury Go API is running', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: '1.0.0'
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
  console.log(`Server running on port ${PORT} | Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Start location status monitoring scheduler
  startLocationScheduler();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  stopLocationScheduler();
  await mongoose.connection.close();
  server.close(() => {
    process.exit(0);
  });
});

module.exports = app;