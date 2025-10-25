// FILE: backend/sockets/bookingSocket.js
/**
 * Booking-specific socket event handlers
 * Handles real-time booking-related socket events
 */

const socketService = require('../services/socketService');

/**
 * Initialize booking socket handlers
 * @param {object} io - Socket.IO instance
 */
const initializeBookingSocket = (io) => {
  // Use the main socket service initialization
  socketService.initializeSocket(io);

  // Additional booking-specific handlers
  io.on('connection', (socket) => {
    
    // Handle joining trip room for live tracking
    socket.on('join_trip', (tripId) => {
      socket.join(`trip_${tripId}`);
    });

    // Handle leaving trip room
    socket.on('leave_trip', (tripId) => {
      socket.leave(`trip_${tripId}`);
    });

    // Handle live tracking updates
    socket.on('update-bus-location', (data) => {
      const { tripId, location } = data;
      
      // Broadcast location update to all users tracking this trip
      socket.to(`trip_${tripId}`).emit('bus-location-updated', {
        tripId,
        location,
        timestamp: new Date().toISOString()
      });
    });

    // Handle trip status updates
    socket.on('trip-status-update', (data) => {
      const { tripId, status, message } = data;
      
      // Broadcast status update to all users in the trip
      socket.to(`trip-${tripId}`).emit('trip-status-changed', {
        tripId,
        status,
        message,
        timestamp: new Date().toISOString()
      });
    });

    // Handle booking creation (admin notifications)
    socket.on('new-booking-created', (data) => {
      const { bookingId, tripId } = data;
      
      // Notify admin users about new booking
      socket.to('admin-room').emit('new-booking-notification', {
        bookingId,
        tripId,
        timestamp: new Date().toISOString()
      });
    });

    // Join admin room for admin notifications
    socket.on('join-admin-room', (userId) => {
      // In real app, verify user is admin
      socket.join('admin-room');
    });

    // Leave admin room
    socket.on('leave-admin-room', (userId) => {
      socket.leave('admin-room');
    });

    // Handle real-time chat for customer support
    socket.on('join-support-chat', (data) => {
      const { userId, bookingId } = data;
      const roomId = `support-${bookingId || userId}`;
      socket.join(roomId);
    });

    socket.on('support-message', (data) => {
      const { userId, bookingId, message } = data;
      const roomId = `support-${bookingId || userId}`;
      
      // Broadcast message to support agents and other participants
      socket.to(roomId).emit('support-message-received', {
        userId,
        message,
        timestamp: new Date().toISOString(),
        isAgent: false
      });
    });

    // Handle payment status updates
    socket.on('payment-status-update', (data) => {
      const { bookingId, status, message } = data;
      
      // Notify user about payment status change
      socket.to(`user-${data.userId}`).emit('payment-status-changed', {
        bookingId,
        status,
        message,
        timestamp: new Date().toISOString()
      });
    });

    // Join user-specific room for personal notifications
    socket.on('join-user-room', (userId) => {
      socket.join(`user-${userId}`);
    });
  });
};

/**
 * Emit booking confirmation to user
 * @param {object} io - Socket.IO instance
 * @param {string} userId - User ID
 * @param {object} booking - Booking data
 */
const emitBookingConfirmation = (io, userId, booking) => {
  io.to(`user-${userId}`).emit('booking-confirmed', {
    bookingId: booking._id,
    pnrNumber: booking.pnrNumber,
    tripId: booking.trip._id,
    status: booking.bookingStatus,
    timestamp: new Date().toISOString()
  });
};

/**
 * Emit booking cancellation to user
 * @param {object} io - Socket.IO instance
 * @param {string} userId - User ID
 * @param {object} booking - Booking data
 */
const emitBookingCancellation = (io, userId, booking) => {
  io.to(`user-${userId}`).emit('booking-cancelled', {
    bookingId: booking._id,
    pnrNumber: booking.pnrNumber,
    refundAmount: booking.cancellation.refundAmount,
    timestamp: new Date().toISOString()
  });
};

/**
 * Emit seat status update for a trip
 * @param {object} io - Socket.IO instance
 * @param {string} tripId - Trip ID
 * @param {object} seatStatus - Updated seat status
 */
const emitSeatStatusUpdate = async (io, tripId, seatStatus) => {
  io.to(`trip-${tripId}`).emit('seat-status-update', {
    tripId,
    seatStatus,
    timestamp: new Date().toISOString()
  });
};

/**
 * Emit trip status update
 * @param {object} io - Socket.IO instance
 * @param {string} tripId - Trip ID
 * @param {string} status - New trip status
 * @param {string} message - Status message
 */
const emitTripStatusUpdate = (io, tripId, status, message) => {
  io.to(`trip-${tripId}`).emit('trip-status-changed', {
    tripId,
    status,
    message,
    timestamp: new Date().toISOString()
  });
};

/**
 * Emit bus location update
 * @param {object} io - Socket.IO instance
 * @param {string} tripId - Trip ID
 * @param {object} location - Location data { lat, lng, speed, etc. }
 */
const emitBusLocationUpdate = (io, tripId, location) => {
  io.to(`trip-${tripId}`).emit('bus-location-updated', {
    tripId,
    location,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  initializeBookingSocket,
  emitBookingConfirmation,
  emitBookingCancellation,
  emitSeatStatusUpdate,
  emitTripStatusUpdate,
  emitBusLocationUpdate
};