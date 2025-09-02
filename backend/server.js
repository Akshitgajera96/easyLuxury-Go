const express = require('express');
const http = require('http');
const https = require('https');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const fs = require('fs');
const path = require('path');

const connectDB = require('./config/db');
const { Server } = require('socket.io');

// Import routes
const authRoutes = require('./routes/authRoutes');
const busRoutes = require('./routes/busRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const userRoutes = require('./routes/userRoutes');
const refundRoutes = require('./routes/refundRoutes');
const captainRoutes = require('./routes/captainRoutes');

// Import middleware
const { errorHandler } = require('./middlewares/errorHandler');
const { initializeSocket } = require('./socket');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// More aggressive rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  }
});

app.use('/api/auth/', authLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

// Compression middleware
app.use(compression());

// Static files serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/tickets', express.static(path.join(__dirname, 'public/tickets')));
app.use('/receipts', express.static(path.join(__dirname, 'public/receipts')));

// Request logging middleware
if (process.env.NODE_ENV === 'development') {
  const morgan = require('morgan');
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/captains', captainRoutes);

// API documentation route
app.get('/api/docs', (req, res) => {
  res.json({
    message: 'EasyLuxury Go API Documentation',
    endpoints: {
      auth: '/api/auth',
      buses: '/api/buses',
      bookings: '/api/bookings',
      users: '/api/users',
      refunds: '/api/refunds',
      captains: '/api/captains'
    },
    version: '1.0.0'
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error Handling Middleware (must be last)
app.use(errorHandler);

// Create HTTP/HTTPS server
let server;
if (process.env.NODE_ENV === 'production' && process.env.SSL_KEY && process.env.SSL_CERT) {
  const privateKey = fs.readFileSync(process.env.SSL_KEY, 'utf8');
  const certificate = fs.readFileSync(process.env.SSL_CERT, 'utf8');
  const credentials = { key: privateKey, cert: certificate };
  
  server = https.createServer(credentials, app);
  console.log('🔒 HTTPS server enabled');
} else {
  server = http.createServer(app);
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️  Running in production without HTTPS. Consider enabling SSL.');
  }
}

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Initialize socket handlers
initializeSocket(io);

// Graceful shutdown handling
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  console.log('Received shutdown signal. Gracefully shutting down...');
  
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Start the Server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
    🚀 EasyLuxury Go Server running!
    📍 Port: ${PORT}
    🌍 Environment: ${process.env.NODE_ENV || 'development'}
    🗄️  Database: ${process.env.MONGO_URI ? 'Connected' : 'Not configured'}
    ⏰ Started at: ${new Date().toISOString()}
    
    📋 Available Routes:
    🔐 Auth: http://localhost:${PORT}/api/auth
    🚌 Buses: http://localhost:${PORT}/api/buses
    🎫 Bookings: http://localhost:${PORT}/api/bookings
    👤 Users: http://localhost:${PORT}/api/users
    💰 Refunds: http://localhost:${PORT}/api/refunds
    🚗 Captains: http://localhost:${PORT}/api/captains
    ❤️ Health: http://localhost:${PORT}/health
  `);
});

// Export for testing
module.exports = { app, server };