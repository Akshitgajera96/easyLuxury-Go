// FILE: backend/services/socketService.js
/**
 * Socket.IO service for real-time communication
 * Defines socket events and handlers for real-time features
 */

const { SEAT_STATUS } = require('../constants/enums');

// Store active seat locks
const seatLocks = new Map(); // tripId -> { seatNumber: { userId, timestamp } }

/**
 * Initialize socket connection and event handlers
 * @param {object} io - Socket.IO instance
 */
const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // Join trip room for seat updates
    socket.on('join-trip', (tripId) => {
      socket.join(`trip-${tripId}`);
      console.log(`User ${socket.id} joined trip-${tripId}`);
    });

    // Leave trip room
    socket.on('leave-trip', (tripId) => {
      socket.leave(`trip-${tripId}`);
      console.log(`User ${socket.id} left trip-${tripId}`);
    });

    // Lock seats for booking
    socket.on('lock-seats', async (data) => {
      const { tripId, seatNumbers, userId } = data;
      
      try {
        const Trip = require('../models/tripModel');
        const trip = await Trip.findById(tripId).populate('bus');
        
        if (!trip) {
          socket.emit('seat-lock-error', { message: 'Trip not found' });
          return;
        }

        // Validate seat availability
        const unavailableSeats = seatNumbers.filter(seat => {
          const isBooked = trip.bookedSeats.some(booked => booked.seatNumber === seat);
          const isLocked = isSeatLocked(tripId, seat) && getSeatLock(tripId, seat).userId !== userId;
          return isBooked || isLocked;
        });

        if (unavailableSeats.length > 0) {
          socket.emit('seat-lock-error', { 
            message: `Seats ${unavailableSeats.join(', ')} are not available` 
          });
          return;
        }

        // Lock seats
        seatNumbers.forEach(seatNumber => {
          lockSeat(tripId, seatNumber, userId, socket.id);
        });

        // Notify other users in the trip room
        socket.to(`trip-${tripId}`).emit('seats-locked', {
          seatNumbers,
          lockedBy: userId
        });

        socket.emit('seats-locked-success', { seatNumbers });

        // Auto-unlock seats after 10 minutes
        setTimeout(() => {
          if (areSeatsLockedByUser(tripId, seatNumbers, userId)) {
            unlockSeats(tripId, seatNumbers);
            socket.to(`trip-${tripId}`).emit('seats-unlocked', { seatNumbers });
          }
        }, 10 * 60 * 1000); // 10 minutes

      } catch (error) {
        console.error('Seat lock error:', error);
        socket.emit('seat-lock-error', { message: 'Failed to lock seats' });
      }
    });

    // Unlock seats
    socket.on('unlock-seats', (data) => {
      const { tripId, seatNumbers, userId } = data;
      
      if (areSeatsLockedByUser(tripId, seatNumbers, userId)) {
        unlockSeats(tripId, seatNumbers);
        socket.to(`trip-${tripId}`).emit('seats-unlocked', { seatNumbers });
        socket.emit('seats-unlocked-success', { seatNumbers });
      }
    });

    // Get current seat status for a trip
    socket.on('get-seat-status', async (tripId) => {
      try {
        const Trip = require('../models/tripModel');
        const trip = await Trip.findById(tripId).populate('bus');
        
        if (!trip) {
          socket.emit('seat-status-error', { message: 'Trip not found' });
          return;
        }

        const lockedSeats = getLockedSeatsForTrip(tripId);
        const seatStatus = require('../utils/seatAllocator').getSeatStatus(trip, lockedSeats);
        
        socket.emit('seat-status-update', { tripId, seatStatus });
      } catch (error) {
        console.error('Seat status error:', error);
        socket.emit('seat-status-error', { message: 'Failed to get seat status' });
      }
    });

    // Handle booking confirmation
    socket.on('booking-confirmed', (data) => {
      const { tripId, seatNumbers } = data;
      
      // Unlock seats when booking is confirmed
      unlockSeats(tripId, seatNumbers);
      
      // Notify all users in the trip room
      socket.to(`trip-${tripId}`).emit('seats-booked', { seatNumbers });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.id}`);
      
      // Unlock all seats locked by this socket
      unlockSeatsBySocket(socket.id);
    });
  });
};

/**
 * Lock a seat for a user
 * @param {string} tripId - Trip ID
 * @param {string} seatNumber - Seat number
 * @param {string} userId - User ID
 * @param {string} socketId - Socket ID
 */
const lockSeat = (tripId, seatNumber, userId, socketId) => {
  if (!seatLocks.has(tripId)) {
    seatLocks.set(tripId, new Map());
  }
  
  const tripLocks = seatLocks.get(tripId);
  tripLocks.set(seatNumber, {
    userId,
    socketId,
    timestamp: Date.now()
  });
};

/**
 * Unlock specific seats
 * @param {string} tripId - Trip ID
 * @param {array} seatNumbers - Array of seat numbers to unlock
 */
const unlockSeats = (tripId, seatNumbers) => {
  if (!seatLocks.has(tripId)) return;
  
  const tripLocks = seatLocks.get(tripId);
  seatNumbers.forEach(seatNumber => {
    tripLocks.delete(seatNumber);
  });
};

/**
 * Unlock all seats for a socket
 * @param {string} socketId - Socket ID
 */
const unlockSeatsBySocket = (socketId) => {
  for (const [tripId, tripLocks] of seatLocks.entries()) {
    for (const [seatNumber, lock] of tripLocks.entries()) {
      if (lock.socketId === socketId) {
        tripLocks.delete(seatNumber);
      }
    }
  }
};

/**
 * Check if seat is locked
 * @param {string} tripId - Trip ID
 * @param {string} seatNumber - Seat number
 * @returns {boolean} True if seat is locked
 */
const isSeatLocked = (tripId, seatNumber) => {
  if (!seatLocks.has(tripId)) return false;
  
  const tripLocks = seatLocks.get(tripId);
  return tripLocks.has(seatNumber);
};

/**
 * Get seat lock information
 * @param {string} tripId - Trip ID
 * @param {string} seatNumber - Seat number
 * @returns {object} Lock information
 */
const getSeatLock = (tripId, seatNumber) => {
  if (!seatLocks.has(tripId)) return null;
  
  const tripLocks = seatLocks.get(tripId);
  return tripLocks.get(seatNumber) || null;
};

/**
 * Check if seats are locked by specific user
 * @param {string} tripId - Trip ID
 * @param {array} seatNumbers - Array of seat numbers
 * @param {string} userId - User ID
 * @returns {boolean} True if all seats are locked by the user
 */
const areSeatsLockedByUser = (tripId, seatNumbers, userId) => {
  if (!seatLocks.has(tripId)) return false;
  
  const tripLocks = seatLocks.get(tripId);
  return seatNumbers.every(seatNumber => {
    const lock = tripLocks.get(seatNumber);
    return lock && lock.userId === userId;
  });
};

/**
 * Get all locked seats for a trip
 * @param {string} tripId - Trip ID
 * @returns {array} Array of locked seat numbers
 */
const getLockedSeatsForTrip = (tripId) => {
  if (!seatLocks.has(tripId)) return [];
  
  const tripLocks = seatLocks.get(tripId);
  return Array.from(tripLocks.keys());
};

/**
 * Clean up expired locks (called periodically)
 */
const cleanupExpiredLocks = () => {
  const now = Date.now();
  const expiryTime = 10 * 60 * 1000; // 10 minutes
  
  for (const [tripId, tripLocks] of seatLocks.entries()) {
    for (const [seatNumber, lock] of tripLocks.entries()) {
      if (now - lock.timestamp > expiryTime) {
        tripLocks.delete(seatNumber);
      }
    }
    
    // Remove empty trip entries
    if (tripLocks.size === 0) {
      seatLocks.delete(tripId);
    }
  }
};

// Clean up expired locks every minute
setInterval(cleanupExpiredLocks, 60 * 1000);

module.exports = {
  initializeSocket,
  lockSeat,
  unlockSeats,
  isSeatLocked,
  getSeatLock,
  areSeatsLockedByUser,
  getLockedSeatsForTrip
};