// backend/socket.js
const { Server } = require('socket.io');
const { verifyToken } = require('./utils/jwtUtils'); // uses your existing util

let io;

// Maps
const userSocketMap = new Map(); // userId -> socketId
const socketUserMap = new Map(); // socketId -> userId
const userRooms = new Map();     // userId -> Set(roomIds)

// Connection stats
const connectionStats = {
  totalConnections: 0,
  activeConnections: 0,
  peakConnections: 0,
  disconnectedCount: 0
};

// Rate limiting
const connectionAttempts = new Map();
const MAX_CONNECTION_ATTEMPTS = 5;
const CONNECTION_WINDOW_MS = 60_000; // 1 minute

function initializeSocket(ioInstance) {
  io = ioInstance;

  io.on('connection', (socket) => {
    const clientIp = getClientIp(socket);
    const userAgent = socket.handshake?.headers?.['user-agent'];

    // Rate limit per IP
    if (!checkConnectionRateLimit(clientIp)) {
      socket.emit('error', { message: 'Connection rate limit exceeded. Please try again later.' });
      safeDisconnect(socket);
      return;
    }

    // track stats
    connectionStats.totalConnections += 1;
    connectionStats.activeConnections += 1;
    if (connectionStats.activeConnections > connectionStats.peakConnections) {
      connectionStats.peakConnections = connectionStats.activeConnections;
    }

    console.log(`⚡ New socket connected: ${socket.id} | IP: ${clientIp} | UA: ${userAgent || 'n/a'}`);
    logConnectionStats(true); // event-based log

    // Event-level auth middleware
    socket.use((packet, next) => {
      const eventName = packet?.[0];

      // Allow these public events without auth
      const publicEvents = ['register', 'disconnect', 'ping', 'auth'];
      if (publicEvents.includes(eventName)) return next();

      // For everything else, require authenticated socket
      if (!socketUserMap.has(socket.id)) {
        return next(new Error('Authentication required'));
      }
      next();
    });

    // ---- Events ----

    // Authenticate via JWT
    socket.on('auth', (token, callback) => {
      try {
        const decoded = verifyToken(token); // your util should throw/return falsy on bad token
        if (decoded && decoded.userId) {
          registerUserSocket(decoded.userId, socket.id);
          // Join a personal room
          socket.join(`user_${decoded.userId}`);
          addUserRoom(decoded.userId, `user_${decoded.userId}`);
          if (callback) callback({ success: true, userId: decoded.userId });
        } else {
          if (callback) callback({ success: false, error: 'Invalid token' });
        }
      } catch (err) {
        if (callback) callback({ success: false, error: 'Authentication failed' });
      }
    });

    // Manual register (fallback when you already know userId)
    socket.on('register', (userId) => {
      if (!userId) {
        socket.emit('error', { message: 'User ID is required' });
        return;
      }
      registerUserSocket(userId, socket.id);
      socket.join(`user_${userId}`);
      addUserRoom(userId, `user_${userId}`);
      console.log(`✅ User ${userId} registered with socket ${socket.id}`);
    });

    // Rooms
    socket.on('join_room', (roomId) => {
      if (typeof roomId !== 'string' || !roomId.trim()) {
        socket.emit('error', { message: 'Invalid room ID' });
        return;
      }
      socket.join(roomId);
      const userId = socketUserMap.get(socket.id);
      if (userId) addUserRoom(userId, roomId);
      console.log(`➡️  ${socket.id} joined room: ${roomId}`);
    });

    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      const userId = socketUserMap.get(socket.id);
      if (userId) removeUserRoom(userId, roomId);
      console.log(`⬅️  ${socket.id} left room: ${roomId}`);
    });

    // Bus tracking (captains)
    socket.on('bus_location_update', (data) => {
      const userId = socketUserMap.get(socket.id);
      if (!userId) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }
      if (!isValidLocationData(data)) {
        socket.emit('error', { message: 'Invalid location data' });
        return;
      }
      const busId = data.busId;
      if (busId) {
        io.to(`bus_${busId}_tracking`).emit('bus_location_updated', {
          ...data,
          userId,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Seat selection
    // data = { busId, seatNumbers: number[], action: 'lock'|'release' }
    socket.on('seat_selection', (data) => {
      const { busId, seatNumbers, action } = data || {};
      const userId = socketUserMap.get(socket.id);

      if (!busId || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
        socket.emit('error', { message: 'Invalid seat selection data' });
        return;
      }

      if (action === 'lock') {
        io.to(`bus_${busId}`).emit('seats_locked', {
          seatNumbers,
          lockedBy: userId || null,
          expiresAt: Date.now() + 300_000, // 5 minutes
          timestamp: new Date().toISOString()
        });
      } else if (action === 'release') {
        io.to(`bus_${busId}`).emit('seats_released', {
          seatNumbers,
          timestamp: new Date().toISOString()
        });
      } else {
        socket.emit('error', { message: 'Invalid action for seat_selection' });
      }
    });

    // Health
    socket.on('ping', (callback) => {
      if (callback) callback('pong');
    });

    // Disconnection
    socket.on('disconnect', (reason) => {
      handleDisconnection(socket.id, reason);
    });

    // Errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error?.message || error);
    });

    // Acknowledge connection
    socket.emit('connected', {
      socketId: socket.id,
      message: 'Successfully connected to server',
      timestamp: new Date().toISOString()
    });
  });

  // Optional periodic maintenance
  setInterval(cleanupStaleConnections, 300_000); // every 5 minutes

  // Optional periodic stats (gated to avoid spam)
  setInterval(() => {
    if (connectionStats.activeConnections > 0) logConnectionStats(false);
  }, 60_000);
}

/* ----------------- Helpers ----------------- */

function registerUserSocket(userId, socketId) {
  // If user already connected somewhere else, end that session
  const oldSocketId = userSocketMap.get(userId);
  if (oldSocketId && oldSocketId !== socketId) {
    const oldSocket = io?.sockets?.sockets?.get(oldSocketId);
    if (oldSocket) {
      oldSocket.emit('session_ended', {
        message: 'New session started elsewhere',
        timestamp: new Date().toISOString()
      });
      safeDisconnect(oldSocket);
    }
    cleanupUserSocket(oldSocketId);
  }

  userSocketMap.set(userId, socketId);
  socketUserMap.set(socketId, userId);
}

function cleanupUserSocket(socketId) {
  const userId = socketUserMap.get(socketId);
  if (userId) {
    userSocketMap.delete(userId);
    const rooms = userRooms.get(userId);
    if (rooms && rooms.size > 0) {
      // leave rooms for this socket only if available
      const sock = io?.sockets?.sockets?.get(socketId);
      if (sock) {
        for (const room of rooms) {
          try { sock.leave(room); } catch {}
        }
      }
      userRooms.delete(userId);
    }
  }
  socketUserMap.delete(socketId);
}

function handleDisconnection(socketId, reason) {
  const userId = socketUserMap.get(socketId) || 'Unknown';
  console.log(`🔌 Socket disconnected: ${socketId}, Reason: ${reason}, User: ${userId}`);

  cleanupUserSocket(socketId);

  connectionStats.activeConnections = Math.max(0, connectionStats.activeConnections - 1);
  connectionStats.disconnectedCount += 1;

  logConnectionStats(true);
}

function addUserRoom(userId, roomId) {
  if (!userRooms.has(userId)) userRooms.set(userId, new Set());
  userRooms.get(userId).add(roomId);
}

function removeUserRoom(userId, roomId) {
  if (!userRooms.has(userId)) return;
  const set = userRooms.get(userId);
  set.delete(roomId);
  if (set.size === 0) userRooms.delete(userId);
}

function getClientIp(socket) {
  const xfwd = socket?.handshake?.headers?.['x-forwarded-for'];
  if (xfwd) return String(xfwd).split(',')[0].trim();
  return socket?.handshake?.address || 'unknown';
}

function checkConnectionRateLimit(clientIp) {
  const now = Date.now();
  const attempts = connectionAttempts.get(clientIp) || [];

  const recent = attempts.filter(t => now - t < CONNECTION_WINDOW_MS);
  if (recent.length >= MAX_CONNECTION_ATTEMPTS) return false;

  recent.push(now);
  connectionAttempts.set(clientIp, recent);
  return true;
}

function cleanupStaleConnections() {
  // Remove stale sockets from maps
  for (const [socketId] of socketUserMap.entries()) {
    const sock = io?.sockets?.sockets?.get(socketId);
    if (!sock || !sock.connected) {
      cleanupUserSocket(socketId);
    }
  }

  // Cleanup old connection attempts
  const now = Date.now();
  for (const [ip, attempts] of connectionAttempts.entries()) {
    const recent = attempts.filter(t => now - t < CONNECTION_WINDOW_MS);
    if (recent.length === 0) connectionAttempts.delete(ip);
    else connectionAttempts.set(ip, recent);
  }
}

function logConnectionStats(isEventLog) {
  const prefix = isEventLog ? '📊 Socket Connection Statistics (event):' : '📊 Socket Connection Statistics:';
  console.log(prefix);
  console.log(`   Total Connections: ${connectionStats.totalConnections}`);
  console.log(`   Active Connections: ${connectionStats.activeConnections}`);
  console.log(`   Peak Connections: ${connectionStats.peakConnections}`);
  console.log(`   Disconnected Count: ${connectionStats.disconnectedCount}`);
  console.log(`   Unique Users: ${userSocketMap.size}`);
}

function isValidLocationData(data) {
  return (
    data &&
    typeof data.latitude === 'number' &&
    typeof data.longitude === 'number' &&
    data.latitude >= -90 &&
    data.latitude <= 90 &&
    data.longitude >= -180 &&
    data.longitude <= 180
  );
}

function safeDisconnect(socket) {
  try { socket.disconnect(true); } catch {}
}

/* --------------- Public API --------------- */

function sendMessageToSocketId(socketId, event, payload) {
  if (!io || !socketId) return false;
  try {
    io.to(socketId).emit(event, { ...payload, timestamp: new Date().toISOString() });
    return true;
  } catch (error) {
    console.error(`Error sending message to socket ${socketId}:`, error);
    return false;
  }
}

function sendMessageToUserId(userId, event, payload) {
  const socketId = getSocketIdByUserId(userId);
  if (!socketId) return false;
  return sendMessageToSocketId(socketId, event, payload);
}

function broadcastToRoom(roomId, event, payload) {
  if (!io || !roomId) return false;
  try {
    io.to(roomId).emit(event, { ...payload, timestamp: new Date().toISOString() });
    return true;
  } catch (error) {
    console.error(`Error broadcasting to room ${roomId}:`, error);
    return false;
  }
}

function getSocketIdByUserId(userId) {
  return userSocketMap.get(userId);
}

function getUserIdBySocketId(socketId) {
  return socketUserMap.get(socketId);
}

function getUserRooms(userId) {
  return Array.from(userRooms.get(userId) || []);
}

function getConnectionStats() {
  return { ...connectionStats, uniqueUsers: userSocketMap.size };
}

module.exports = {
  initializeSocket,
  sendMessageToSocketId,
  sendMessageToUserId,
  broadcastToRoom,
  getSocketIdByUserId,
  getUserIdBySocketId,
  getUserRooms,
  getConnectionStats
};
