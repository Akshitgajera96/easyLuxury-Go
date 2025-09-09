// backend/controllers/bookingController.js
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Bus = require('../models/Bus');
const User = require('../models/User');
const { sendBookingSocketUpdate } = require('../sockets/bookingSocket');

/**
 * Config
 */
const CANCEL_WINDOW_HOURS = Number(process.env.CANCEL_WINDOW_HOURS || 2);

/**
 * Utility helpers
 */
function parseDateTime(dateStr, timeStr) {
  // Attempt to create a Date from date + time strings. If timeStr is already a full ISO, pass through.
  // dateStr expected in 'YYYY-MM-DD' (or any ISO date-like). timeStr may be 'HH:mm' or full 'HH:mm:ss'.
  try {
    if (!dateStr) return null;
    if (!timeStr) return new Date(dateStr);
    // If timeStr contains 'T' or full ISO, try Date(timeStr)
    if (timeStr.includes('T') || timeStr.includes('Z')) {
      const d = new Date(timeStr);
      if (!isNaN(d)) return d;
    }
    const combined = `${dateStr}T${timeStr}`;
    const d = new Date(combined);
    if (!isNaN(d)) return d;
    // fallback: new Date(dateStr)
    const df = new Date(dateStr);
    return isNaN(df) ? null : df;
  } catch (e) {
    return null;
  }
}

/**
 * Create a new booking (atomic)
 * POST /booking
 */
exports.createBooking = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      userId: bodyUserId,
      busId,
      seatNumbers,
      price,
      date,
      time,
      meta = {}
    } = req.body || {};

    // Allow authenticated user to omit userId
    const userId = (req.user && req.user.id) || bodyUserId;
    if (!userId || !busId || !Array.isArray(seatNumbers) || seatNumbers.length === 0 || price == null || !date) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Missing required fields: userId (or authenticated), busId, seatNumbers[], price and date are required.' });
    }

    // Basic check types
    if (!Array.isArray(seatNumbers)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'seatNumbers must be an array.' });
    }

    // Ensure user exists
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Load bus within session (for transactional safety)
    const bus = await Bus.findById(busId).session(session);
    if (!bus) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Bus not found.' });
    }

    // Validate seat numbers exist
    const validSeatNumbers = bus.seats.map(s => s.number);
    const invalidSeats = seatNumbers.filter(s => !validSeatNumbers.includes(s));
    if (invalidSeats.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Invalid seat numbers selected.', invalidSeats });
    }

    // Check seat availability for the seats requested
    const bookedSeats = bus.seats.filter(s => s.isBooked).map(s => s.number);
    const unavailableSeats = seatNumbers.filter(s => bookedSeats.includes(s));
    if (unavailableSeats.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({ success: false, message: 'One or more seats are already booked.', unavailableSeats });
    }

    // Safety: ensure availableSeats is sufficient
    if (typeof bus.availableSeats === 'number' && bus.availableSeats < seatNumbers.length) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({ success: false, message: 'Not enough available seats.' });
    }

    // Mark seats as booked on bus document
    const now = new Date();
    bus.seats = bus.seats.map(seat => {
      if (seatNumbers.includes(seat.number)) {
        // convert subdoc to plain object then update fields to avoid mongoose nested path issues
        const updated = Object.assign({}, seat.toObject ? seat.toObject() : seat);
        updated.isBooked = true;
        updated.bookedBy = mongoose.Types.ObjectId(userId);
        updated.bookingType = 'online';
        updated.bookedAt = now;
        return updated;
      }
      return seat.toObject ? seat.toObject() : seat;
    });

    // Decrement availableSeats (never go below 0)
    if (typeof bus.availableSeats === 'number') {
      bus.availableSeats = Math.max(0, bus.availableSeats - seatNumbers.length);
    }

    // Save bus within session
    await bus.save({ session });

    // Create booking record
    const bookingDoc = new Booking({
      user: mongoose.Types.ObjectId(userId),
      bus: mongoose.Types.ObjectId(busId),
      seatNumbers,
      price,
      date,
      time,
      status: 'confirmed',
      meta
    });

    await bookingDoc.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Populate booking for response & socket (outside transaction)
    const populatedBooking = await Booking.findById(bookingDoc._id)
      .populate('user', 'name email phone')
      .populate('bus', 'busNumber route departureTime arrivalTime price');

    // Emit socket update
    try {
      sendBookingSocketUpdate('bookingCreated', populatedBooking);
    } catch (emitErr) {
      console.warn('Socket emit failed after booking creation', emitErr);
    }

    return res.status(201).json({ success: true, message: 'Booking successful', booking: populatedBooking });
  } catch (error) {
    try {
      await session.abortTransaction();
    } catch (e) { /* ignore */ }
    session.endSession();
    console.error('Booking creation error:', error);
    return next(error);
  }
};

/**
 * Get bookings for a user
 * GET /booking/user/:userId or GET /booking/user (if authenticated)
 */
exports.getBookingsByUser = async (req, res, next) => {
  try {
    const paramUserId = req.params.userId;
    const userId = paramUserId || (req.user && req.user.id);

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required (as param or authenticated user).' });
    }

    const bookings = await Booking.find({ user: userId })
      .populate('bus', 'busNumber route departureTime arrivalTime price')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    return next(error);
  }
};

/**
 * Get all bookings (Admin)
 * GET /booking
 * query: page, limit, status
 */
exports.getAllBookings = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, parseInt(req.query.limit || '10', 10));
    const status = req.query.status;

    const filter = {};
    if (status && ['confirmed', 'cancelled', 'completed', 'pending'].includes(status)) {
      filter.status = status;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('user', 'name email')
        .populate('bus', 'busNumber route')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      Booking.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      bookings
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    return next(error);
  }
};

/**
 * Cancel booking
 * POST /booking/:bookingId/cancel
 */
exports.cancelBooking = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { bookingId } = req.params;
    if (!bookingId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'bookingId param is required.' });
    }

    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.status === 'cancelled') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Booking already cancelled.' });
    }

    // Optionally check only owner or admin can cancel (if req.user exists)
    if (req.user && req.user.role !== 'admin') {
      const uid = String(req.user.id);
      if (String(booking.user) !== uid) {
        await session.abortTransaction();
        session.endSession();
        return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking.' });
      }
    }

    // Load bus
    const bus = await Bus.findById(booking.bus).session(session);
    // compute departure time (prefer booking.date + bus.departureTime)
    const departureTime = parseDateTime(booking.date, bus ? (bus.departureTime || booking.time) : booking.time);
    const now = new Date();

    if (departureTime) {
      const diffMs = departureTime - now;
      const diffHours = diffMs / (1000 * 60 * 60);
      if (diffHours < CANCEL_WINDOW_HOURS) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: `Cancellation not allowed within ${CANCEL_WINDOW_HOURS} hours of departure.` });
      }
    }

    // Mark booking cancelled
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save({ session });

    // Unmark seats on bus (if bus exists)
    if (bus) {
      bus.seats = bus.seats.map(seat => {
        if (booking.seatNumbers.includes(seat.number)) {
          const updated = Object.assign({}, seat.toObject ? seat.toObject() : seat);
          updated.isBooked = false;
          updated.bookedBy = null;
          updated.bookingType = null;
          updated.bookedAt = null;
          return updated;
        }
        return seat.toObject ? seat.toObject() : seat;
      });

      // Increase availableSeats safely
      if (typeof bus.availableSeats === 'number') {
        bus.availableSeats = bus.availableSeats + booking.seatNumbers.length;
      }

      await bus.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email')
      .populate('bus', 'busNumber route');

    try {
      sendBookingSocketUpdate('bookingCancelled', populatedBooking);
    } catch (emitErr) {
      console.warn('Socket emit failed after cancellation', emitErr);
    }

    return res.json({ success: true, message: 'Booking cancelled successfully', booking: populatedBooking });
  } catch (error) {
    try { await session.abortTransaction(); } catch (e) {}
    session.endSession();
    console.error('Cancel booking error:', error);
    return next(error);
  }
};

/**
 * Check seat availability for specific seats
 * POST /booking/check-availability
 * body: { busId, seats: [] }
 */
exports.checkSeatAvailability = async (req, res, next) => {
  try {
    const { busId, seats } = req.body || {};
    if (!busId || !Array.isArray(seats)) {
      return res.status(400).json({ success: false, message: 'busId and seats array are required.' });
    }

    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ success: false, message: 'Bus not found.' });

    const validSeatNumbers = bus.seats.map(s => s.number);
    const invalidSeats = seats.filter(s => !validSeatNumbers.includes(s));
    if (invalidSeats.length > 0) {
      return res.status(400).json({ success: false, message: 'Invalid seat numbers requested.', invalidSeats });
    }

    const bookedSeatNumbers = bus.seats.filter(s => s.isBooked).map(s => s.number);
    const availability = seats.map(seat => ({ seat, available: !bookedSeatNumbers.includes(seat) }));
    const allAvailable = availability.every(item => item.available);

    return res.json({ success: true, busId, allAvailable, availability });
  } catch (error) {
    console.error('Check seat availability error:', error);
    return next(error);
  }
};

/**
 * Get booking by ID
 * GET /booking/:bookingId
 */
exports.getBookingById = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    if (!bookingId) return res.status(400).json({ success: false, message: 'bookingId param is required.' });

    const booking = await Booking.findById(bookingId)
      .populate('user', 'name email phone')
      .populate('bus', 'busNumber route departureTime arrivalTime price');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    return res.json({ success: true, booking });
  } catch (error) {
    console.error('Get booking by ID error:', error);
    return next(error);
  }
};

/**
 * Update booking (Admin)
 * PUT /booking/:bookingId
 */
exports.updateBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const payload = req.body || {};

    if (!bookingId) return res.status(400).json({ success: false, message: 'bookingId param is required.' });

    // Only allow certain fields to be updated (status, meta)
    const allowed = ['status', 'meta'];
    const update = {};
    allowed.forEach(k => { if (payload[k] !== undefined) update[k] = payload[k]; });

    const updated = await Booking.findByIdAndUpdate(bookingId, update, { new: true })
      .populate('user', 'name email')
      .populate('bus', 'busNumber route');

    if (!updated) return res.status(404).json({ success: false, message: 'Booking not found.' });

    // Emit update
    try { sendBookingSocketUpdate('bookingUpdated', updated); } catch (e) { console.warn(e); }

    return res.json({ success: true, message: 'Booking updated', booking: updated });
  } catch (error) {
    return next(error);
  }
};

/**
 * Booking analytics (Admin) - lightweight example
 * GET /booking/analytics
 */
exports.getBookingAnalytics = async (req, res, next) => {
  try {
    // example: total bookings, bookings per day (last 7 days)
    const total = await Booking.countDocuments();
    const last7 = await Booking.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    return res.json({ success: true, total, last7Days: last7 });
  } catch (error) {
    return next(error);
  }
};

/**
 * Export bookings (Admin) - placeholder that returns CSV string
 * GET /booking/export
 */
exports.exportBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find().populate('user', 'name email').populate('bus', 'busNumber route');
    // Simple CSV header + rows
    const rows = [
      ['BookingId', 'User', 'Email', 'Bus', 'Route', 'Seats', 'Price', 'Date', 'Status']
    ];
    bookings.forEach(b => {
      rows.push([
        b._id,
        b.user?.name || '',
        b.user?.email || '',
        b.bus?.busNumber || '',
        b.bus?.route || '',
        (b.seatNumbers || []).join('|'),
        b.price,
        b.date,
        b.status
      ]);
    });
    const csv = rows.map(r => r.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment('bookings_export.csv');
    return res.send(csv);
  } catch (error) {
    return next(error);
  }
};
