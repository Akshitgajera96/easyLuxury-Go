// FILE: backend/controllers/paymentController.js
/**
 * Payment controller handling payment operations
 * Integrates with Razorpay for processing payments
 */

const paymentService = require('../services/paymentService');
const Booking = require('../models/bookingModel');
const { sendBookingConfirmation } = require('../services/emailService');

/**
 * Create payment order
 * POST /api/v1/payment/create-order
 */
const createPaymentOrder = async (req, res, next) => {
  try {
    const { bookingId, amount } = req.body;

    if (!bookingId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID and amount are required'
      });
    }

    // Verify booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking belongs to user
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this booking'
      });
    }

    // Check if already paid
    if (booking.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already paid'
      });
    }

    // Create Razorpay order
    const order = await paymentService.createOrder(
      amount,
      'INR',
      `booking_${bookingId}`,
      {
        bookingId: bookingId,
        userId: req.user._id.toString()
      }
    );

    // Update booking with order details
    booking.razorpayOrderId = order.id;
    await booking.save();

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID
      },
      message: 'Payment order created successfully'
    });
  } catch (error) {
    console.error('Create payment order error:', error);
    next(error);
  }
};

/**
 * Verify payment and update booking
 * POST /api/v1/payment/verify
 */
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment details'
      });
    }

    // Verify payment signature
    const isValid = paymentService.verifyPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Find booking
    const booking = await Booking.findById(bookingId)
      .populate('user', 'name email')
      .populate('trip')
      .populate({
        path: 'trip',
        populate: {
          path: 'bus route'
        }
      });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking belongs to user
    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this booking'
      });
    }

    // Update booking status
    booking.paymentStatus = 'completed';
    booking.bookingStatus = 'confirmed';
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.razorpaySignature = razorpay_signature;
    booking.paidAt = new Date();
    await booking.save();

    // Send confirmation email
    try {
      await sendBookingConfirmation(
        booking.user.email,
        booking.user.name,
        {
          bookingId: booking.bookingId,
          busName: booking.trip.bus.name || 'Luxury Bus',
          route: `${booking.trip.route.sourceCity} → ${booking.trip.route.destinationCity}`,
          date: new Date(booking.trip.departureDateTime).toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          seatNumbers: booking.seats.map(s => s.seatNumber).join(', '),
          amount: booking.totalAmount,
          paymentId: razorpay_payment_id
        }
      );
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(200).json({
      success: true,
      data: {
        booking: {
          _id: booking._id,
          bookingId: booking.bookingId,
          status: booking.bookingStatus,
          paymentStatus: booking.paymentStatus,
          paymentId: razorpay_payment_id
        }
      },
      message: 'Payment verified and booking confirmed successfully'
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    next(error);
  }
};

/**
 * Handle payment failure
 * POST /api/v1/payment/failure
 */
const handlePaymentFailure = async (req, res, next) => {
  try {
    const { bookingId, error } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    // Find booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Update booking status
    booking.paymentStatus = 'failed';
    booking.bookingStatus = 'pending';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Payment failure recorded',
      data: {
        bookingId: booking._id,
        status: booking.bookingStatus
      }
    });
  } catch (error) {
    console.error('Handle payment failure error:', error);
    next(error);
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  handlePaymentFailure
};
