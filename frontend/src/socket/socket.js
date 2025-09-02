// src/socket/socket.js
import { io } from "socket.io-client";
import { getStoredToken, refreshToken } from "../services/authService";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

// Create the socket connection instance
let socket = null;

// Socket connection status
let isConnected = false;
let connectionListeners = [];

// Initialize socket connection
export const initializeSocket = () => {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: false,
    auth: (cb) => {
      const token = getStoredToken();
      cb({ token });
    }
  });

  setupSocketEvents();
  return socket;
};

// Setup socket event listeners
const setupSocketEvents = () => {
  if (!socket) return;

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
    isConnected = true;
    notifyConnectionListeners(true);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
    isConnected = false;
    notifyConnectionListeners(false);
  });

  socket.on("connect_error", async (error) => {
    console.error("Socket connection error:", error.message);
    
    // Try to refresh token on authentication errors
    if (error.message.includes("auth") || error.message.includes("token")) {
      try {
        const refreshTokenValue = localStorage.getItem('refreshToken');
        if (refreshTokenValue) {
          await refreshToken(refreshTokenValue);
          // Reconnect with new token
          setTimeout(() => socket.connect(), 1000);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
      }
    }
  });

  socket.on("reconnect", (attemptNumber) => {
    console.log("Socket reconnected after", attemptNumber, "attempts");
  });

  socket.on("reconnect_attempt", (attemptNumber) => {
    console.log("Socket reconnection attempt:", attemptNumber);
  });

  socket.on("reconnect_failed", () => {
    console.error("Socket reconnection failed");
  });
};

// Connect socket with automatic token handling
export const connectSocket = async () => {
  if (!socket) initializeSocket();
  
  if (socket.connected) {
    console.log("Socket already connected");
    return true;
  }

  try {
    const token = getStoredToken();
    if (!token) {
      console.warn("No authentication token available");
      return false;
    }

    socket.auth = { token };
    socket.connect();
    return true;
  } catch (error) {
    console.error("Failed to connect socket:", error);
    return false;
  }
};

// Disconnect socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    isConnected = false;
  }
};

// Get socket connection status
export const isSocketConnected = () => isConnected;

// Add connection status listener
export const onConnectionChange = (callback) => {
  connectionListeners.push(callback);
  return () => {
    connectionListeners = connectionListeners.filter(listener => listener !== callback);
  };
};

// Notify all connection listeners
const notifyConnectionListeners = (connected) => {
  connectionListeners.forEach(listener => listener(connected));
};

// 🎫 Booking Events
export const emitBookingRequest = (bookingData) => {
  if (!isConnected) {
    console.warn("Socket not connected - cannot emit booking request");
    return false;
  }
  socket.emit("booking:create", bookingData);
  return true;
};

export const emitBookingUpdate = (bookingId, updateData) => {
  if (!isConnected) return false;
  socket.emit("booking:update", { bookingId, ...updateData });
  return true;
};

export const emitBookingCancel = (bookingId, reason) => {
  if (!isConnected) return false;
  socket.emit("booking:cancel", { bookingId, reason });
  return true;
};

export const onBookingConfirmed = (callback) => {
  socket.on("booking:confirmed", callback);
  return () => socket.off("booking:confirmed", callback);
};

export const onBookingUpdated = (callback) => {
  socket.on("booking:updated", callback);
  return () => socket.off("booking:updated", callback);
};

export const onBookingCancelled = (callback) => {
  socket.on("booking:cancelled", callback);
  return () => socket.off("booking:cancelled", callback);
};

// 💺 Seat Events
export const emitSeatUpdate = (busId, seatNumbers, status) => {
  if (!isConnected) return false;
  socket.emit("seats:update", { busId, seatNumbers, status });
  return true;
};

export const emitSeatLock = (busId, seatNumbers, duration = 300) => {
  if (!isConnected) return false;
  socket.emit("seats:lock", { busId, seatNumbers, duration });
  return true;
};

export const emitSeatRelease = (busId, seatNumbers) => {
  if (!isConnected) return false;
  socket.emit("seats:release", { busId, seatNumbers });
  return true;
};

export const onSeatUpdate = (callback) => {
  socket.on("seats:updated", callback);
  return () => socket.off("seats:updated", callback);
};

export const onSeatLocked = (callback) => {
  socket.on("seats:locked", callback);
  return () => socket.off("seats:locked", callback);
};

export const onSeatReleased = (callback) => {
  socket.on("seats:released", callback);
  return () => socket.off("seats:released", callback);
};

// 💰 Refund Events
export const emitRefundRequest = (bookingId, reason) => {
  if (!isConnected) return false;
  socket.emit("refund:request", { bookingId, reason });
  return true;
};

export const emitRefundStatusUpdate = (refundId, status, notes) => {
  if (!isConnected) return false;
  socket.emit("refund:status:update", { refundId, status, notes });
  return true;
};

export const onRefundStatus = (callback) => {
  socket.on("refund:status", callback);
  return () => socket.off("refund:status", callback);
};

export const onRefundCreated = (callback) => {
  socket.on("refund:created", callback);
  return () => socket.off("refund:created", callback);
};

// 💳 Wallet Events
export const emitWalletTransaction = (amount, type, description) => {
  if (!isConnected) return false;
  socket.emit("wallet:transaction", { amount, type, description });
  return true;
};

export const onWalletUpdate = (callback) => {
  socket.on("wallet:updated", callback);
  return () => socket.off("wallet:updated", callback);
};

export const onWalletTransaction = (callback) => {
  socket.on("wallet:transaction", callback);
  return () => socket.off("wallet:transaction", callback);
};

// 🚌 Bus Events
export const emitBusStatusUpdate = (busId, status, reason) => {
  if (!isConnected) return false;
  socket.emit("bus:status:update", { busId, status, reason });
  return true;
};

export const onBusStatusUpdate = (callback) => {
  socket.on("bus:status:updated", callback);
  return () => socket.off("bus:status:updated", callback);
};

export const onBusLocationUpdate = (callback) => {
  socket.on("bus:location:updated", callback);
  return () => socket.off("bus:location:updated", callback);
};

// 👤 User Events
export const emitUserPresence = (status) => {
  if (!isConnected) return false;
  socket.emit("user:presence", { status });
  return true;
};

export const onUserNotification = (callback) => {
  socket.on("user:notification", callback);
  return () => socket.off("user:notification", callback);
};

// 🔄 Generic Event Helpers
export const emitEvent = (eventName, data) => {
  if (!isConnected) return false;
  socket.emit(eventName, data);
  return true;
};

export const listenToEvent = (eventName, callback) => {
  socket.on(eventName, callback);
  return () => socket.off(eventName, callback);
};

export const removeAllListeners = (eventName) => {
  if (socket) {
    socket.removeAllListeners(eventName);
  }
};

export const getSocketId = () => {
  return socket?.id || null;
};

// Cleanup function
export const cleanupSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    disconnectSocket();
  }
  connectionListeners = [];
};

// Auto-reconnect on token refresh
let reconnectTimeout = null;
export const scheduleReconnect = (delay = 2000) => {
  if (reconnectTimeout) clearTimeout(reconnectTimeout);
  reconnectTimeout = setTimeout(() => {
    if (!isConnected) {
      connectSocket();
    }
  }, delay);
};

export default initializeSocket;