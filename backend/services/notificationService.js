// FILE: backend/services/notificationService.js
/**
 * Notification service for sending emails and other notifications
 * Centralized service for all notification types
 */

const emailUtils = require('../utils/emailUtils');
const User = require('../models/userModel');

/**
 * Send booking confirmation notification
 * @param {string} bookingId - Booking ID
 * @returns {object} Notification result
 */
const sendBookingConfirmation = async (bookingId) => {
  try {
    const Booking = require('../models/bookingModel');
    const booking = await Booking.findById(bookingId)
      .populate('user')
      .populate('trip')
      .populate({
        path: 'trip',
        populate: [
          { path: 'bus' },
          { path: 'route' }
        ]
      });

    if (!booking) {
      throw new Error('Booking not found');
    }

    const result = await emailUtils.sendBookingConfirmation(booking, booking.user);
    
    console.log(`✅ Booking confirmation sent for PNR: ${booking.pnrNumber}`);
    return result;
  } catch (error) {
    console.error('❌ Failed to send booking confirmation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send booking cancellation notification
 * @param {string} bookingId - Booking ID
 * @returns {object} Notification result
 */
const sendCancellationNotification = async (bookingId) => {
  try {
    const Booking = require('../models/bookingModel');
    const booking = await Booking.findById(bookingId)
      .populate('user')
      .populate('trip')
      .populate({
        path: 'trip',
        populate: [
          { path: 'bus' },
          { path: 'route' }
        ]
      });

    if (!booking) {
      throw new Error('Booking not found');
    }

    const result = await emailUtils.sendCancellationConfirmation(booking, booking.user);
    
    console.log(`✅ Cancellation notification sent for PNR: ${booking.pnrNumber}`);
    return result;
  } catch (error) {
    console.error('❌ Failed to send cancellation notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send wallet transaction notification
 * @param {string} userId - User ID
 * @param {number} amount - Transaction amount
 * @param {string} type - Transaction type (add/deduct)
 * @returns {object} Notification result
 */
const sendWalletNotification = async (userId, amount, type) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    const result = await emailUtils.sendWalletNotification(user, amount, type, user.walletBalance);
    
    console.log(`✅ Wallet notification sent to ${user.email}`);
    return result;
  } catch (error) {
    console.error('❌ Failed to send wallet notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send trip reminder notification
 * @param {string} bookingId - Booking ID
 * @returns {object} Notification result
 */
const sendTripReminder = async (bookingId) => {
  try {
    const Booking = require('../models/bookingModel');
    const booking = await Booking.findById(bookingId)
      .populate('user')
      .populate('trip')
      .populate({
        path: 'trip',
        populate: [
          { path: 'bus' },
          { path: 'route' }
        ]
      });

    if (!booking) {
      throw new Error('Booking not found');
    }

    const subject = `Trip Reminder - Departure Tomorrow: ${booking.trip.route.source.city} to ${booking.trip.route.destination.city}`;
    const text = `
Dear ${booking.user.name},

This is a reminder for your upcoming trip tomorrow.

PNR: ${booking.pnrNumber}
Route: ${booking.trip.route.source.city} to ${booking.trip.route.destination.city}
Departure: ${new Date(booking.trip.departureDateTime).toLocaleString()}
Seats: ${booking.seats.map(s => s.seatNumber).join(', ')}

Please reach the boarding point 30 minutes before departure.

Have a safe journey!
    `;

    const result = await emailUtils.sendEmail({
      to: booking.user.email,
      subject,
      text
    });

    console.log(`✅ Trip reminder sent for PNR: ${booking.pnrNumber}`);
    return result;
  } catch (error) {
    console.error('❌ Failed to send trip reminder:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send generic notification
 * @param {string} userId - User ID
 * @param {string} subject - Notification subject
 * @param {string} message - Notification message
 * @returns {object} Notification result
 */
const sendGenericNotification = async (userId, subject, message) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    const result = await emailUtils.sendEmail({
      to: user.email,
      subject,
      text: message
    });

    console.log(`✅ Generic notification sent to ${user.email}`);
    return result;
  } catch (error) {
    console.error('❌ Failed to send generic notification:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendBookingConfirmation,
  sendCancellationNotification,
  sendWalletNotification,
  sendTripReminder,
  sendGenericNotification
};