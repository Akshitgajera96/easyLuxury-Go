const { Server } = require('socket.io');
let io;
const userSocketMap = new Map(); // userId -> socketId
const socketUserMap = new Map(); // socketId -> userId
const userRooms = new Map(); // userId -> roomIds

// Track active connections and performance
const connectionStats = {
  totalConnections: 0,
  activeConnections: 0,
  peakConnections: 0,
  disconnectedCount: 0
};

// Connection rate limiting
const connectionAttempts = new Map();
const MAX_CONNECTION_ATTEMPTS = 5;
const CONNECTION_WINDOW_MS = 60000; // 1 minute

function initializeSocket(ioInstance) {
  io = ioInstance;

  io.on('connection', (socket) => {
    const clientIp = socket.handshake.address;
    const userAgent = socket.handshake.headers['user-agent'];
    
    // Connection rate limiting
    if (!checkConnectionRateLimit(clientIp)) {
      socket.emit('error', { message: 'Connection rate limit exceeded. Please try again later.' });
      socket.disconnect(true);
      return;
    }

    connectionStats.totalConnections++;
    connectionStats.activeConnections++;
    connectionStats.peakConnections = Math.max(connectionStats.peakConnections, connectionStats.activeConnections);

    console.log(`⚡ New socket connected: ${socket.id} from IP: ${clientIp}`);

    // Authentication middleware for socket events
    socket.use((packet, next) => {
      const eventName = packet[0];
      
      // Allow these events without authentication
      const publicEvents = ['register', 'disconnect', 'ping', 'auth'];
      if (publicEvents.includes(eventName)) {
        return next();
      }

      // Check if socket is authenticated
      if (!socketUserMap.has(socket.id)) {
        return next(new Error('Authentication required'));
      }

      next();
    });

    // Handle authentication
    socket.on('auth', (token, callback) => {
      try {
        // Verify JWT token (you'll need to implement this)
        const decoded = verifyToken(token); // Implement your token verification
        if (decoded && decoded.userId) {
          registerUserSocket(decoded.userId, socket.id);
          if (callback) callback({ success: true, userId: decoded.userId });
        } else {
          if (callback) callback({ success: false, error: 'Invalid token' });
        }
      } catch (error) {
        if (callback) callback({ success: false, error: 'Authentication failed' });
      }
    });

    // User registration with socket
    socket.on('register', (userId) => {
      if (!userId) {
        socket.emit('error', { message: 'User ID is required' });
        return;
      }

      registerUserSocket(userId, socket.id);
      console.log(`User ${userId} registered with socket ${socket.id}`);
      
      // Join user to their personal room
      socket.join(`user_${userId}`);
      addUserRoom(userId, `user_${userId}`);
    });

    // Join specific rooms (for bus tracking, notifications, etc.)
    socket.on('join_room', (roomId) => {
      if (typeof roomId !== 'string') {
        socket.emit('error', { message: 'Invalid room ID' });
        return;
      }

      socket.join(roomId);
      const userId = socketUserMap.get(socket.id);
      if (userId) {
        addUserRoom(userId, roomId);
      }
      console.log(`Socket ${socket.id} joined room: ${roomId}`);
    });

    // Leave specific rooms
    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      const userId = socketUserMap.get(socket.id);
      if (userId) {
        removeUserRoom(userId, roomId);
      }
      console.log(`Socket ${socket.id} left room: ${roomId}`);
    });

    // Handle bus tracking updates (for captains)
    socket.on('bus_location_update', (data) => {
      const userId = socketUserMap.get(socket.id);
      if (!userId) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      // Validate location data
      if (!isValidLocationData(data)) {
        socket.emit('error', { message: 'Invalid location data' });
        return;
      }

      // Broadcast to relevant rooms (bus tracking, admin, etc.)
      const busId = data.busId;
      if (busId) {
        io.to(`bus_${busId}_tracking`).emit('bus_location_updated', {
          ...data,
          userId,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Handle real-time seat selection
    socket.on('seat_selection', (data) => {
      const { busId, seatNumbers, action } = data; // action: 'lock' or 'release'
      const userId = socketUserMap.get(socket.id);

      if (!busId || !seatNumbers || !Array.isArray(seatNumbers)) {
        socket.emit('error', { message: 'Invalid seat selection data' });
        return;
      }

      if (action === 'lock') {
        // Broadcast seat locking to other users viewing the same bus
        io.to(`bus_${busId}`).emit('seats_locked', {
          seatNumbers,
          lockedBy: userId,
          expiresAt: Date.now() + 300000, // 5 minutes
          timestamp: new Date().toISOString()
        });
      } else if (action === 'release') {
        // Broadcast seat release
        io.to(`bus_${busId}`).emit('seats_released', {
          seatNumbers,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Ping/pong for connection health monitoring
    socket.on('ping', (callback) => {
      if (callback) callback('pong');
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      handleDisconnection(socket.id, reason);
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });

    // Send connection acknowledged event
    socket.emit('connected', { 
      socketId: socket.id, 
      message: 'Successfully connected to server',
      timestamp: new Date().toISOString()
    });
  });

  // Periodic cleanup of disconnected users
  setInterval(cleanupStaleConnections, 300000); // Every 5 minutes

  // Monitor server performance
  setInterval(logConnectionStats, 60000); // Every minute
}

// Helper functions
function registerUserSocket(userId, socketId) {
  // Remove previous socket connection for this user
  const oldSocketId = userSocketMap.get(userId);
  if (oldSocketId && oldSocketId !== socketId) {
    const oldSocket = io.sockets.sockets.get(oldSocketId);
    if (oldSocket) {
      oldSocket.emit('session_ended', { 
        message: 'New session started elsewhere',
        timestamp: new Date().toISOString()
      });
      oldSocket.disconnect(true);
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
    const rooms = userRooms.get(userId) || [];
    rooms.forEach(room => {
      io.socketsLeave(room);
    });
    userRooms.delete(userId);
  }
  socketUserMap.delete(socketId);
}

function handleDisconnection(socketId, reason) {
  const userId = socketUserMap.get(socketId);
  
  console.log(`Socket disconnected: ${socket.id}, Reason: ${reason}, User: ${userId || 'Unknown'}`);
  
  cleanupUserSocket(socketId);
  
  connectionStats.activeConnections--;
  connectionStats.disconnectedCount++;
}

function addUserRoom(userId, roomId) {
  if (!userRooms.has(userId)) {
    userRooms.set(userId, new Set());
  }
  userRooms.get(userId).add(roomId);
}

function removeUserRoom(userId, roomId) {
  if (userRooms.has(userId)) {
    userRooms.get(userId).delete(roomId);
    if (userRooms.get(userId).size === 0) {
      userRooms.delete(userId);
    }
  }
}

function checkConnectionRateLimit(clientIp) {
  const now = Date.now();
  const attempts = connectionAttempts.get(clientIp) || [];
  
  // Remove attempts outside the time window
  const recentAttempts = attempts.filter(time => now - time < CONNECTION_WINDOW_MS);
  
  if (recentAttempts.length >= MAX_CONNECTION_ATTEMPTS) {
    return false;
  }
  
  recentAttempts.push(now);
  connectionAttempts.set(clientIp, recentAttempts);
  return true;
}

function cleanupStaleConnections() {
  const now = Date.now();
  const staleTime = 300000; // 5 minutes
  
  for (const [socketId, userId] of socketUserMap.entries()) {
    const socket = io.sockets.sockets.get(socketId);
    if (!socket || !socket.connected) {
      cleanupUserSocket(socketId);
    }
  }
  
  // Cleanup old connection attempts
  for (const [ip, attempts] of connectionAttempts.entries()) {
    const recentAttempts = attempts.filter(time => now - time < CONNECTION_WINDOW_MS);
    if (recentAttempts.length === 0) {
      connectionAttempts.delete(ip);
    } else {
      connectionAttempts.set(ip, recentAttempts);
    }
  }
}

function logConnectionStats() {
  console.log('📊 Socket Connection Statistics:');
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

// Public API functions
function sendMessageToSocketId(socketId, event, payload) {
  if (io && socketId) {
    try {
      io.to(socketId).emit(event, {
        ...payload,
        timestamp: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error(`Error sending message to socket ${socketId}:`, error);
      return false;
    }
  }
  return false;
}

function sendMessageToUserId(userId, event, payload) {
  const socketId = getSocketIdByUserId(userId);
  if (socketId) {
    return sendMessageToSocketId(socketId, event, payload);
  }
  return false;
}

function broadcastToRoom(roomId, event, payload) {
  if (io && roomId) {
    try {
      io.to(roomId).emit(event, {
        ...payload,
        timestamp: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error(`Error broadcasting to room ${roomId}:`, error);
      return false;
    }
  }
  return false;
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
  return { ...connectionStats };
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