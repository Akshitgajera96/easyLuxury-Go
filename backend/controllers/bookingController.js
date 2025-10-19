// FILE: backend/controllers/bookingController.js
/**
 * Booking controller handling HTTP requests for booking operations
 * Routes: /api/v1/bookings/*
 */

const bookingService = require('../services/bookingService');
const OTP = require('../models/otpModel');
const Trip = require('../models/tripModel');
const { generateOTP, sendBookingOTP } = require('../services/emailService');

/**
 * Create a new booking
 * POST /api/v1/bookings
 */
const createBooking = async (req, res, next) => {
  try {
    const {
      tripId,
      seats,
      passengerInfo,
      paymentMethod,
      promoCode
    } = req.body;

    // Basic validation
    if (!tripId || !seats || !seats.length || !passengerInfo || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID, seats, passenger info, and payment method are required'
      });
    }

    // Validate passengerInfo is an array and has matching length
    if (!Array.isArray(passengerInfo) || passengerInfo.length !== seats.length) {
      return res.status(400).json({
        success: false,
        message: 'Passenger info must be an array with one entry per seat'
      });
    }

    // Validate each passenger has required fields
    for (let i = 0; i < passengerInfo.length; i++) {
      const passenger = passengerInfo[i];
      if (!passenger.name || !passenger.age || !passenger.gender || !passenger.seatNumber) {
        return res.status(400).json({
          success: false,
          message: `Passenger ${i + 1}: name, age, gender, and seatNumber are required`
        });
      }
    }

    const booking = await bookingService.createBooking(
      {
        tripId,
        seats,
        passengerInfo,
        paymentMethod,
        promoCode
      },
      req.user._id
    );

    res.status(201).json({
      success: true,
      data: { booking },
      message: 'Booking created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's bookings
 * GET /api/v1/bookings/mybookings
 */
const getMyBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await bookingService.getUserBookings(
      req.user._id,
      parseInt(page),
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Bookings fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel a booking
 * PUT /api/v1/bookings/:id/cancel
 */
const cancelBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation reason is required'
      });
    }

    const booking = await bookingService.cancelBooking(
      req.params.id,
      req.user._id,
      reason
    );

    res.status(200).json({
      success: true,
      data: { booking },
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get booking by ID
 * GET /api/v1/bookings/:id
 */
const getBookingById = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(
      req.params.id,
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: { booking },
      message: 'Booking fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send OTP for booking confirmation
 * POST /api/v1/bookings/send-otp
 */
const sendBookingConfirmationOTP = async (req, res, next) => {
  try {
    const { tripId, seats } = req.body;

    if (!tripId || !seats || !seats.length) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID and seats are required'
      });
    }

    // Get user email
    const userEmail = req.user.email;
    const userName = req.user.name;

    // Get trip details
    const trip = await Trip.findById(tripId)
      .populate('bus')
      .populate('route');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Calculate amount
    const amount = seats.length * trip.fare;

    // Delete any existing OTPs for this user
    await OTP.deleteMany({ email: userEmail, type: 'booking-confirmation' });

    // Generate new OTP
    const otp = generateOTP();

    // Save OTP to database with booking data
    await OTP.create({
      email: userEmail,
      otp,
      type: 'booking-confirmation',
      bookingData: {
        tripId,
        seats,
        userId: req.user._id
      },
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    // Send OTP email
    await sendBookingOTP(userEmail, userName, otp, {
      busName: trip.bus?.name || 'Luxury Bus',
      route: `${trip.route?.sourceCity} → ${trip.route?.destinationCity}`,
      date: new Date(trip.departureDateTime).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      seatNumbers: seats.join(', '),
      amount
    });

    res.status(200).json({
      success: true,
      message: 'OTP has been sent to your registered email',
      data: {
        email: userEmail,
        expiresIn: '10 minutes'
      }
    });
  } catch (error) {
    console.error('Send booking OTP error:', error);
    next(error);
  }
};

/**
 * Verify OTP for booking
 * POST /api/v1/bookings/verify-otp
 */
const verifyBookingOTP = async (req, res, next) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required'
      });
    }

    // Find OTP
    const otpRecord = await OTP.findOne({
      email: req.user.email,
      otp,
      type: 'booking-confirmation',
      verified: false
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Check if expired
    if (otpRecord.isExpired()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one'
      });
    }

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully. You can now proceed with payment',
      data: {
        otpId: otpRecord._id,
        bookingData: otpRecord.bookingData
      }
    });
  } catch (error) {
    console.error('Verify booking OTP error:', error);
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  cancelBooking,
  getBookingById,
  sendBookingConfirmationOTP,
  verifyBookingOTP
};