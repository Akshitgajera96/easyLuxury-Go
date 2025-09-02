const { getSocketIdByUserId, sendMessageToSocketId, getIO, getUserRooms } = require('../socket');
const Booking = require('../models/Booking');
const Bus = require('../models/Bus');
const User = require('../models/User');

// Notify user about booking confirmation
async function notifyBookingConfirmation(userId, bookingDetails) {
  try {
    const socketId = getSocketIdByUserId(userId);
    if (socketId) {
      // Populate booking details if not already populated
      const populatedBooking = await Booking.findById(bookingDetails._id || bookingDetails)
        .populate('user', 'name email')
        .populate('bus', 'busNumber route from to departureTime');
      
      sendMessageToSocketId(socketId, 'bookingConfirmed', {
        success: true,
        booking: populatedBooking,
        message: 'Booking confirmed successfully!',
        timestamp: new Date()
      });
    }
    
    // Also send push notification (if implemented)
    await sendPushNotification(userId, {
      title: 'Booking Confirmed',
      body: `Your booking for ${populatedBooking?.bus?.route} has been confirmed.`,
      data: { bookingId: populatedBooking?._id.toString() }
    });
  } catch (error) {
    console.error('Error in notifyBookingConfirmation:', error);
  }
}

// Notify user about booking cancellation
async function notifyCancellation(userId, cancellationDetails) {
  try {
    const socketId = getSocketIdByUserId(userId);
    if (socketId) {
      sendMessageToSocketId(socketId, 'bookingCancelled', {
        success: true,
        ...cancellationDetails,
        message: 'Booking cancelled successfully',
        timestamp: new Date()
      });
    }
    
    // Send push notification
    await sendPushNotification(userId, {
      title: 'Booking Cancelled',
      body: `Your booking has been cancelled. Refund: $${cancellationDetails.refundAmount || 0}`,
      data: { bookingId: cancellationDetails.bookingId }
    });
  } catch (error) {
    console.error('Error in notifyCancellation:', error);
  }
}

// Real-time seat locking during selection
function broadcastSeatLock(busId, seatNumbers, userId, duration = 300000) { // 5 minutes default
  try {
    const io = getIO();
    if (io && busId && seatNumbers?.length > 0) {
      io.to(`bus_${busId}`).emit('seatLocked', {
        seatNumbers,
        lockedBy: userId,
        expiresAt: new Date(Date.now() + duration),
        duration: duration
      });
      
      // Set timeout to automatically release seats
      setTimeout(() => {
        broadcastSeatRelease(busId, seatNumbers);
      }, duration);
    }
  } catch (error) {
    console.error('Error in broadcastSeatLock:', error);
  }
}

// Release locked seats
function broadcastSeatRelease(busId, seatNumbers) {
  try {
    const io = getIO();
    if (io && busId && seatNumbers?.length > 0) {
      io.to(`bus_${busId}`).emit('seatReleased', {
        seatNumbers,
        releasedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error in broadcastSeatRelease:', error);
  }
}

// Notify user about booking status update
async function notifyBookingStatusUpdate(userId, bookingId, newStatus, reason = '') {
  try {
    const socketId = getSocketIdByUserId(userId);
    if (socketId) {
      const booking = await Booking.findById(bookingId)
        .populate('bus', 'busNumber route');
      
      sendMessageToSocketId(socketId, 'bookingStatusUpdated', {
        bookingId,
        newStatus,
        reason,
        bookingDetails: booking,
        timestamp: new Date()
      });
    }
    
    // Send push notification based on status
    const statusMessages = {
      confirmed: { title: 'Booking Confirmed', body: 'Your booking has been confirmed' },
      cancelled: { title: 'Booking Cancelled', body: 'Your booking has been cancelled' },
      refunded: { title: 'Refund Processed', body: 'Your refund has been processed' },
      boarding: { title: 'Boarding Started', body: 'Boarding has started for your bus' }
    };
    
    if (statusMessages[newStatus]) {
      await sendPushNotification(userId, {
        ...statusMessages[newStatus],
        data: { bookingId, newStatus }
      });
    }
  } catch (error) {
    console.error('Error in notifyBookingStatusUpdate:', error);
  }
}

// Notify about bus schedule changes
async function notifyScheduleChange(bookingIds, changeDetails) {
  try {
    const io = getIO();
    
    for (const bookingId of bookingIds) {
      const booking = await Booking.findById(bookingId).populate('user');
      if (booking && booking.user) {
        const socketId = getSocketIdByUserId(booking.user._id);
        if (socketId) {
          sendMessageToSocketId(socketId, 'scheduleChanged', {
            bookingId,
            changeDetails,
            timestamp: new Date()
          });
        }
        
        // Send push notification
        await sendPushNotification(booking.user._id, {
          title: 'Schedule Change',
          body: `Your bus schedule has been updated: ${changeDetails.reason}`,
          data: { bookingId, changeDetails }
        });
      }
    }
  } catch (error) {
    console.error('Error in notifyScheduleChange:', error);
  }
}

// Real-time bus location updates (for captains)
function broadcastBusLocation(busId, locationData) {
  try {
    const io = getIO();
    if (io && busId) {
      io.to(`bus_${busId}_tracking`).emit('busLocationUpdate', {
        busId,
        location: locationData,
        timestamp: new Date()
      });
    }
  } catch (error) {
    console.error('Error in broadcastBusLocation:', error);
  }
}

// Notify about available seats (waitlist)
async function notifySeatAvailable(waitlistUsers, busId, seatNumbers) {
  try {
    const io = getIO();
    const bus = await Bus.findById(busId);
    
    for (const userId of waitlistUsers) {
      const socketId = getSocketIdByUserId(userId);
      if (socketId) {
        sendMessageToSocketId(socketId, 'seatAvailable', {
          busId,
          busDetails: bus,
          seatNumbers,
          availableUntil: new Date(Date.now() + 600000), // 10 minutes
          timestamp: new Date()
        });
      }
      
      await sendPushNotification(userId, {
        title: 'Seat Available!',
        body: `Seats are now available on ${bus?.busNumber} to ${bus?.route?.to}`,
        data: { busId, seatNumbers }
      });
    }
  } catch (error) {
    console.error('Error in notifySeatAvailable:', error);
  }
}

// Booking reminder notifications
async function sendBookingReminders() {
  try {
    // Find bookings happening in the next 24 hours
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const upcomingBookings = await Booking.find({
      date: { $lte: tomorrow },
      status: 'confirmed'
    }).populate('user bus');
    
    for (const booking of upcomingBookings) {
      if (booking.user) {
        const socketId = getSocketIdByUserId(booking.user._id);
        if (socketId) {
          sendMessageToSocketId(socketId, 'bookingReminder', {
            bookingId: booking._id,
            busDetails: booking.bus,
            departureTime: booking.time,
            message: 'Your trip is coming up soon!',
            timestamp: new Date()
          });
        }
        
        await sendPushNotification(booking.user._id, {
          title: 'Trip Reminder',
          body: `Your bus to ${booking.bus?.route?.to} departs tomorrow at ${booking.time}`,
          data: { bookingId: booking._id }
        });
      }
    }
  } catch (error) {
    console.error('Error in sendBookingReminders:', error);
  }
}

// Emergency notifications
function broadcastEmergency(busId, emergencyDetails) {
  try {
    const io = getIO();
    if (io && busId) {
      io.to(`bus_${busId}`).emit('emergencyAlert', {
        busId,
        emergency: emergencyDetails,
        timestamp: new Date(),
        instructions: emergencyDetails.instructions || 'Please follow crew instructions'
      });
    }
  } catch (error) {
    console.error('Error in broadcastEmergency:', error);
  }
}

// Helper function for push notifications (would integrate with your notification service)
async function sendPushNotification(userId, notification) {
  try {
    // This would integrate with Firebase Cloud Messaging, OneSignal, etc.
    const user = await User.findById(userId);
    if (user && user.notificationToken) {
      // Implementation would go here based on your notification service
      console.log('Would send push notification to:', userId, notification);
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

// Get real-time booking statistics
async function broadcastBookingStats() {
  try {
    const io = getIO();
    if (io) {
      const stats = await Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            totalRevenue: { $sum: '$price' },
            confirmedBookings: {
              $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
            }
          }
        }
      ]);
      
      io.to('admin_dashboard').emit('bookingStatsUpdate', {
        stats: stats[0] || { totalBookings: 0, totalRevenue: 0, confirmedBookings: 0 },
        timestamp: new Date()
      });
    }
  } catch (error) {
    console.error('Error in broadcastBookingStats:', error);
  }
}

module.exports = {
  notifyBookingConfirmation,
  notifyCancellation,
  broadcastSeatLock,
  broadcastSeatRelease,
  notifyBookingStatusUpdate,
  notifyScheduleChange,
  broadcastBusLocation,
  notifySeatAvailable,
  sendBookingReminders,
  broadcastEmergency,
  broadcastBookingStats
};