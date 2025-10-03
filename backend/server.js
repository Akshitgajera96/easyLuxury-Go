const express = require("express");
const http = require("http");
const https = require("https");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const compression = require("compression");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const fs = require("fs");
const path = require("path");

const connectDB = require("./config/db");
const { Server } = require("socket.io");

// Import routes
const authRoutes = require("./routes/authRoutes");
const busRoutes = require("./routes/busRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const userRoutes = require("./routes/userRoutes");
const refundRoutes = require("./routes/refundRoutes");
const captainRoutes = require("./routes/captainRoutes");

// Import middleware
const { errorHandler } = require("./middlewares/errorHandler");
const { initializeSocket } = require("./socket");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// ---------------- Security Middlewares ----------------
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(compression());

// ---------------- Static Files ----------------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/tickets", express.static(path.join(__dirname, "public/tickets")));
app.use("/receipts", express.static(path.join(__dirname, "public/receipts")));

// ---------------- Logging ----------------
if (process.env.NODE_ENV === "development") {
  const morgan = require("morgan");
  app.use(morgan("dev"));
}

// ---------------- Health Check ----------------
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// ---------------- API Routes ----------------
app.use("/auth", authRoutes);
app.use("/buses", busRoutes);
app.use("/bookings", bookingRoutes);
app.use("/users", userRoutes);
app.use("/refunds", refundRoutes);
app.use("/captains", captainRoutes);

app.get("/docs", (req, res) => {
  res.json({
    message: "EasyLuxury Go API Documentation",
    version: "1.0.0",
    endpoints: {
      auth: "/auth",
      buses: "/buses",
      bookings: "/bookings",
      users: "/users",
      refunds: "/refunds",
      captains: "/captains",
    },
  });
});

// ---------------- 404 Handler ----------------
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ---------------- Error Middleware ----------------
app.use(errorHandler);

// ---------------- Server (HTTP/HTTPS) ----------------
let server;
if (
  process.env.NODE_ENV === "production" &&
  process.env.SSL_KEY &&
  process.env.SSL_CERT
) {
  const privateKey = fs.readFileSync(process.env.SSL_KEY, "utf8");
  const certificate = fs.readFileSync(process.env.SSL_CERT, "utf8");
  const credentials = { key: privateKey, cert: certificate };
  server = https.createServer(credentials, app);
  console.log("🔒 HTTPS server enabled");
} else {
  server = http.createServer(app);
  if (process.env.NODE_ENV === "production") {
    console.warn("⚠️ Running in production without HTTPS. Consider enabling SSL.");
  }
}

// ---------------- Socket.IO ----------------
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});
initializeSocket(io);

// ---------------- Graceful Shutdown ----------------
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

function gracefulShutdown() {
  console.log("🛑 Received shutdown signal. Closing server...");
  server.close(() => {
    console.log("✅ HTTP server closed.");
    process.exit(0);
  });
  setTimeout(() => {
    console.error("❌ Force shutdown due to timeout");
    process.exit(1);
  }, 10000);
}

// ---------------- Error Handling ----------------
process.on("unhandledRejection", (err) => {
  console.error("💥 Unhandled Promise Rejection:", err);
  server.close(() => process.exit(1));
});
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
  process.exit(1);
});

// ---------------- Start Server ----------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
🚀 EasyLuxury Go Server running!
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || "development"}
🗄️  Database: ${process.env.MONGO_URI ? "Connected" : "Not configured"}
⏰ Started at: ${new Date().toISOString()}

📋 Available Routes:
🔐 Auth:     http://localhost:${PORT}/auth
🚌 Buses:    http://localhost:${PORT}/buses
🎫 Bookings: http://localhost:${PORT}/bookings
👤 Users:    http://localhost:${PORT}/users
💰 Refunds:  http://localhost:${PORT}/refunds
🚗 Captains: http://localhost:${PORT}/captains
❤️ Health:   http://localhost:${PORT}/health
  `);
});

module.exports = { app, server };
