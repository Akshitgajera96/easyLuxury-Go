// FILE: backend/services/bookingService.js
/**
 * Booking service handling booking creation, cancellation, and management
 * Business logic for booking operations
 */

const Booking = require('../models/bookingModel');
const Trip = require('../models/tripModel');
const User = require('../models/userModel');
const { BOOKING_STATUS, PAYMENT_STATUS, PAYMENT_METHODS } = require('../constants/enums');
const MESSAGES = require('../constants/messages');
const AppError = require('../utils/AppError');

/**
 * Create a new booking
 * @param {object} bookingData - Booking data
 * @param {string} userId - User ID making the booking
 * @returns {object} Created booking
 */
const createBooking = async (bookingData, userId) => {
  const {
    tripId,
    seats,
    passengerInfo,
    paymentMethod,
    promoCode
  } = bookingData;

  // Validate trip exists and is active
  const trip = await Trip.findById(tripId)
    .populate('bus')
    .populate('route');
  
  if (!trip) {
    throw new AppError('Trip not found', 404);
  }

  if (!trip.isActive) {
    throw new AppError('Trip is inactive', 400);
  }

  // Check if trip is in future
  if (new Date(trip.departureDateTime) <= new Date()) {
    throw new AppError('Cannot book a trip that has already departed', 400);
  }

  // Validate seats availability
  const unavailableSeats = seats.filter(seat => 
    !trip.isSeatAvailable(seat)
  );

  if (unavailableSeats.length > 0) {
    throw new AppError(`Seats ${unavailableSeats.join(', ')} are not available`, 400);
  }

  // Validate user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(MESSAGES.USER.USER_NOT_FOUND, 404);
  }

  // Calculate total amount
  const seatCount = seats.length;
  const baseAmount = trip.baseFare * seatCount;
  let discountAmount = 0;

  // Apply promo code discount if provided
  if (promoCode) {
    // Mock promo code validation - in real app, validate against promo code model
    discountAmount = Math.min(baseAmount * 0.1, 200); // 10% discount, max ₹200
  }

  // Calculate GST (18%) and convenience fee
  const gstAmount = Math.round(baseAmount * 0.18); // 18% GST
  const convenienceFee = 30; // Fixed convenience fee

  // Total = Base - Discount + GST + Convenience Fee
  const totalAmount = baseAmount - discountAmount + gstAmount + convenienceFee;

  // Check wallet balance if payment method is wallet
  if (paymentMethod === PAYMENT_METHODS.WALLET) {
    if (!user.hasSufficientBalance(totalAmount)) {
      throw new AppError(
        `Insufficient wallet balance. Available: ₹${user.walletBalance}, Required: ₹${totalAmount}`,
        400
      );
    }
  }

  // Create booking - map passenger info correctly from array
  const booking = new Booking({
    user: userId,
    trip: tripId,
    seats: passengerInfo.map(passenger => ({
      seatNumber: passenger.seatNumber,
      passengerName: passenger.name,
      passengerAge: parseInt(passenger.age),
      passengerGender: passenger.gender
    })),
    totalAmount,
    paymentMethod,
    promoCode: promoCode ? {
      code: promoCode,
      discountAmount
    } : undefined,
    boardingPoint: {
      terminal: trip.route.sourceCity,
      address: trip.route.sourceCity,
      time: trip.departureDateTime.toTimeString().split(' ')[0]
    },
    droppingPoint: {
      terminal: trip.route.destinationCity,
      address: trip.route.destinationCity,
      time: trip.arrivalDateTime.toTimeString().split(' ')[0]
    }
  });

  // Process payment based on method
  if (paymentMethod === PAYMENT_METHODS.WALLET) {
    await user.deductFromWallet(totalAmount);
    booking.paymentStatus = PAYMENT_STATUS.SUCCESS;
    booking.bookingStatus = BOOKING_STATUS.CONFIRMED;
  } else {
    // For other payment methods, mark as pending
    // In real app, integrate with payment gateway
    booking.paymentStatus = PAYMENT_STATUS.PENDING;
    booking.bookingStatus = BOOKING_STATUS.PENDING;
  }

  // Save booking
  try {
    await booking.save();
  } catch (error) {
    console.error('❌ Error saving booking:', error.message);
    throw new AppError(`Failed to create booking: ${error.message}`, 400);
  }

  // Book seats in trip
  try {
    await trip.bookSeats(seats, passengerInfo, booking._id);
  } catch (error) {
    console.error('❌ Error booking seats in trip:', error.message);
    // Rollback: delete the booking if seat booking fails
    await Booking.findByIdAndDelete(booking._id);
    throw new AppError(`Failed to book seats: ${error.message}`, 400);
  }

  // Populate references for response
  await booking.populate('trip');
  await booking.populate({
    path: 'trip',
    populate: [
      { path: 'bus' },
      { path: 'route' }
    ]
  });

  return booking;
};

/**
 * Get user's bookings
 * @param {string} userId - User ID
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {object} Bookings and pagination info
 */
const getUserBookings = async (userId, page = 1, limit = 10) => {
  const bookings = await Booking.findByUser(userId, page, limit);
  const total = await Booking.countDocuments({ user: userId });

  return {
    bookings,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Cancel a booking
 * @param {string} bookingId - Booking ID
 * @param {string} userId - User ID
 * @param {string} reason - Cancellation reason
 * @returns {object} Cancelled booking
 */
const cancelBooking = async (bookingId, userId, reason) => {
  const booking = await Booking.findOne({
    _id: bookingId,
    user: userId
  }).populate('trip');

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  if (booking.bookingStatus === BOOKING_STATUS.CANCELLED) {
    throw new AppError('Booking is already cancelled', 400);
  }

  if (booking.bookingStatus === BOOKING_STATUS.COMPLETED) {
    throw new AppError('Cannot cancel a completed trip', 400);
  }

  // Calculate hours before departure
  const departureTime = new Date(booking.trip.departureDateTime);
  const now = new Date();
  const hoursBeforeDeparture = (departureTime - now) / (1000 * 60 * 60);

  if (hoursBeforeDeparture < 0) {
    throw new AppError('Cannot cancel a trip that has already departed', 400);
  }

  // Cancel booking and process refund
  await booking.cancelBooking(reason, hoursBeforeDeparture);

  // Release seats in trip
  await Trip.findByIdAndUpdate(
    booking.trip._id,
    { $pull: { bookedSeats: { bookingId: booking._id } } }
  );

  // Refund to wallet if payment was successful
  if (booking.paymentStatus === PAYMENT_STATUS.SUCCESS && booking.cancellation.refundAmount > 0) {
    const user = await User.findById(userId);
    await user.addToWallet(booking.cancellation.refundAmount);
  }

  await booking.populate({
    path: 'trip',
    populate: [
      { path: 'bus' },
      { path: 'route' }
    ]
  });

  return booking;
};

/**
 * Get booking by ID
 * @param {string} bookingId - Booking ID
 * @param {string} userId - User ID
 * @returns {object} Booking data
 */
const getBookingById = async (bookingId, userId) => {
  const booking = await Booking.findOne({
    _id: bookingId,
    user: userId
  })
  .populate('trip')
  .populate({
    path: 'trip',
    populate: [
      { path: 'bus' },
      { path: 'route' }
    ]
  });

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  return booking;
};

module.exports = {
  createBooking,
  getUserBookings,
  cancelBooking,
  getBookingById
};