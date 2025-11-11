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
    // PERFORMANCE: Optimized populate with selective fields only
    const booking = await Booking.findById(bookingId)
      .populate('user', 'name email phone') // Only needed user fields
      .populate({
        path: 'trip',
        select: 'departureDateTime arrivalDateTime bus route',
        populate: [
          { path: 'bus', select: 'busNumber type' },
          { path: 'route', select: 'sourceCity destinationCity' }
        ]
      })
      .lean(); // PERFORMANCE: Read-only operation

    if (!booking) {
      throw new Error('Booking not found');
    }

    const result = await emailUtils.sendBookingConfirmation(booking, booking.user);
    return result;
  } catch (error) {
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
    // PERFORMANCE: Optimized populate with selective fields only
    const booking = await Booking.findById(bookingId)
      .populate('user', 'name email phone') // Only needed user fields
      .populate({
        path: 'trip',
        select: 'departureDateTime arrivalDateTime bus route',
        populate: [
          { path: 'bus', select: 'busNumber type' },
          { path: 'route', select: 'sourceCity destinationCity' }
        ]
      })
      .lean(); // PERFORMANCE: Read-only operation

    if (!booking) {
      throw new Error('Booking not found');
    }

    const result = await emailUtils.sendCancellationConfirmation(booking, booking.user);
    return result;
  } catch (error) {
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
    return result;
  } catch (error) {
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
    // PERFORMANCE: Optimized populate with selective fields only
    const booking = await Booking.findById(bookingId)
      .populate('user', 'name email') // Only needed user fields
      .populate({
        path: 'trip',
        select: 'departureDateTime route',
        populate: [
          { path: 'route', select: 'source destination' }
        ]
      })
      .lean(); // PERFORMANCE: Read-only operation

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

    return result;
  } catch (error) {
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

    return result;
  } catch (error) {
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