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
  
  if (!trip || !trip.isActive) {
    throw new Error('Trip not found or inactive');
  }

  // Check if trip is in future
  if (new Date(trip.departureDateTime) <= new Date()) {
    throw new Error('Cannot book a trip that has already departed');
  }

  // Validate seats availability
  const unavailableSeats = seats.filter(seat => 
    !trip.isSeatAvailable(seat)
  );

  if (unavailableSeats.length > 0) {
    throw new Error(`Seats ${unavailableSeats.join(', ')} are not available`);
  }

  // Validate user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new Error(MESSAGES.USER.USER_NOT_FOUND);
  }

  // Calculate total amount
  const seatCount = seats.length;
  const baseAmount = trip.currentFare * seatCount;
  let discountAmount = 0;

  // Apply promo code discount if provided
  if (promoCode) {
    // Mock promo code validation - in real app, validate against promo code model
    discountAmount = Math.min(baseAmount * 0.1, 200); // 10% discount, max ₹200
  }

  const totalAmount = baseAmount - discountAmount;

  // Check wallet balance if payment method is wallet
  if (paymentMethod === PAYMENT_METHODS.WALLET && !user.hasSufficientBalance(totalAmount)) {
    throw new Error(MESSAGES.USER.INSUFFICIENT_BALANCE);
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
      terminal: trip.route.source.terminal,
      address: `${trip.route.source.city}, ${trip.route.source.state}`,
      time: trip.departureDateTime.toTimeString().split(' ')[0]
    },
    droppingPoint: {
      terminal: trip.route.destination.terminal,
      address: `${trip.route.destination.city}, ${trip.route.destination.state}`,
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

  await booking.save();

  // Book seats in trip
  await trip.bookSeats(seats, passengerInfo, booking._id);

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
    throw new Error('Booking not found');
  }

  if (booking.bookingStatus === BOOKING_STATUS.CANCELLED) {
    throw new Error('Booking is already cancelled');
  }

  if (booking.bookingStatus === BOOKING_STATUS.COMPLETED) {
    throw new Error('Cannot cancel a completed trip');
  }

  // Calculate hours before departure
  const departureTime = new Date(booking.trip.departureDateTime);
  const now = new Date();
  const hoursBeforeDeparture = (departureTime - now) / (1000 * 60 * 60);

  if (hoursBeforeDeparture < 0) {
    throw new Error('Cannot cancel a trip that has already departed');
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
    throw new Error('Booking not found');
  }

  return booking;
};

module.exports = {
  createBooking,
  getUserBookings,
  cancelBooking,
  getBookingById
};