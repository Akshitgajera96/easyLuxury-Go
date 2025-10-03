// backend/controllers/bookingController.js
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Bus = require("../models/Bus");
const User = require("../models/User");
const { sendBookingSocketUpdate } = require("../sockets/bookingSocket");

const CANCEL_WINDOW_HOURS = Number(process.env.CANCEL_WINDOW_HOURS || 2);

/**
 * Utility: Parse Date + Time into a JS Date
 */
function parseDateTime(dateStr, timeStr) {
  try {
    if (!dateStr) return null;
    if (!timeStr) return new Date(dateStr);

    if (timeStr.includes("T") || timeStr.includes("Z")) {
      const d = new Date(timeStr);
      if (!isNaN(d)) return d;
    }

    const combined = `${dateStr}T${timeStr}`;
    const d = new Date(combined);
    if (!isNaN(d)) return d;

    const df = new Date(dateStr);
    return isNaN(df) ? null : df;
  } catch {
    return null;
  }
}

/**
 * Create Booking
 */
exports.createBooking = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { userId: bodyUserId, busId, seatNumbers, price, date, time, meta = {} } = req.body || {};
    const userId = (req.user && req.user.id) || bodyUserId;

    if (!userId || !busId || !Array.isArray(seatNumbers) || seatNumbers.length === 0 || price == null || !date) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Missing required fields: userId, busId, seatNumbers[], price, date",
      });
    }

    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const bus = await Bus.findById(busId).session(session);
    if (!bus) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Bus not found" });
    }

    const validSeatNumbers = bus.seats.map((s) => s.number);
    const invalidSeats = seatNumbers.filter((s) => !validSeatNumbers.includes(s));
    if (invalidSeats.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Invalid seat numbers", invalidSeats });
    }

    const bookedSeats = bus.seats.filter((s) => s.isBooked).map((s) => s.number);
    const unavailableSeats = seatNumbers.filter((s) => bookedSeats.includes(s));
    if (unavailableSeats.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({ success: false, message: "Seats already booked", unavailableSeats });
    }

    if (bus.availableSeats < seatNumbers.length) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({ success: false, message: "Not enough available seats" });
    }

    const now = new Date();
    bus.seats = bus.seats.map((seat) => {
      if (seatNumbers.includes(seat.number)) {
        return {
          ...seat.toObject(),
          isBooked: true,
          bookedBy: mongoose.Types.ObjectId(userId),
          bookingType: "online",
          bookedAt: now,
        };
      }
      return seat.toObject();
    });
    bus.availableSeats = Math.max(0, bus.availableSeats - seatNumbers.length);

    await bus.save({ session });

    const bookingDoc = new Booking({
      user: userId,
      bus: busId,
      seatNumbers,
      price,
      date,
      time,
      status: "confirmed",
      meta,
    });

    await bookingDoc.save({ session });
    await session.commitTransaction();
    session.endSession();

    const populatedBooking = await Booking.findById(bookingDoc._id)
      .populate("user", "name email phone")
      .populate("bus", "busNumber route departureTime arrivalTime price");

    sendBookingSocketUpdate("bookingCreated", populatedBooking);

    return res.status(201).json({ success: true, message: "Booking successful", booking: populatedBooking });
  } catch (error) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    return next(error);
  }
};

/**
 * Get Bookings for a User
 */
exports.getBookingsByUser = async (req, res, next) => {
  try {
    const userId = req.params.userId || (req.user && req.user.id);
    if (!userId) return res.status(400).json({ success: false, message: "User ID required" });

    const bookings = await Booking.find({ user: userId })
      .populate("bus", "busNumber route departureTime arrivalTime price")
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get All Bookings (Admin)
 */
exports.getAllBookings = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.max(1, parseInt(req.query.limit || "10", 10));
    const filter = {};

    if (req.query.status) filter.status = req.query.status;

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate("user", "name email")
        .populate("bus", "busNumber route")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      Booking.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      bookings,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Cancel Booking
 */
exports.cancelBooking = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const booking = await Booking.findById(req.params.bookingId).session(session);
    if (!booking) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.status === "cancelled") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Already cancelled" });
    }

    if (req.user && req.user.role !== "admin" && String(booking.user) !== String(req.user.id)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const bus = await Bus.findById(booking.bus).session(session);
    const departureTime = parseDateTime(booking.date, bus ? bus.departureTime : booking.time);
    if (departureTime) {
      const diffHours = (departureTime - new Date()) / (1000 * 60 * 60);
      if (diffHours < CANCEL_WINDOW_HOURS) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: `Cannot cancel within ${CANCEL_WINDOW_HOURS} hours of departure` });
      }
    }

    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    await booking.save({ session });

    if (bus) {
      bus.seats = bus.seats.map((seat) => {
        if (booking.seatNumbers.includes(seat.number)) {
          return { ...seat.toObject(), isBooked: false, bookedBy: null, bookingType: null, bookedAt: null };
        }
        return seat.toObject();
      });
      bus.availableSeats += booking.seatNumbers.length;
      await bus.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    const populatedBooking = await Booking.findById(booking._id)
      .populate("user", "name email")
      .populate("bus", "busNumber route");

    sendBookingSocketUpdate("bookingCancelled", populatedBooking);

    return res.json({ success: true, message: "Booking cancelled", booking: populatedBooking });
  } catch (error) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    return next(error);
  }
};

exports.getBookingStats = async (req, res, next) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });
    const totalRevenue = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Revenue Trends Analytics (Admin)
 */
exports.getRevenueTrends = async (req, res, next) => {
    try {
        const { period = 'month' } = req.query; // Default to month
        
        let groupByFormat = "%Y-%m-%d"; // Daily for a month
        let matchDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        if (period === 'year') {
            groupByFormat = "%Y-%m"; // Monthly for a year
            matchDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        }

        const revenue = await Booking.aggregate([
            { $match: { status: 'confirmed', createdAt: { $gte: matchDate } } },
            { 
                $group: { 
                    _id: { $dateToString: { format: groupByFormat, date: "$createdAt" } }, 
                    dailyRevenue: { $sum: "$price" } 
                } 
            },
            { $sort: { _id: 1 } }
        ]);
        
        res.status(200).json({ success: true, data: revenue });
    } catch (error) {
        next(error);
    }
};


/**
 * Check Seat Availability
 */
exports.checkSeatAvailability = async (req, res, next) => {
  try {
    const { busId, seats } = req.body;
    if (!busId || !Array.isArray(seats)) {
      return res.status(400).json({ success: false, message: "busId and seats[] required" });
    }

    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ success: false, message: "Bus not found" });

    const bookedSeats = bus.seats.filter((s) => s.isBooked).map((s) => s.number);
    const availability = seats.map((seat) => ({ seat, available: !bookedSeats.includes(seat) }));

    return res.json({ success: true, busId, allAvailable: availability.every((a) => a.available), availability });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get Booking by ID
 */
exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate("user", "name email phone")
      .populate("bus", "busNumber route departureTime arrivalTime price");

    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    return res.json({ success: true, booking });
  } catch (error) {
    return next(error);
  }
};

/**
 * Update Booking (Admin)
 */
exports.updateBooking = async (req, res, next) => {
  try {
    const allowed = ["status", "meta", "seatNumbers", "price"];
    const update = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    });

    const updated = await Booking.findByIdAndUpdate(req.params.bookingId, update, { new: true })
      .populate("user", "name email")
      .populate("bus", "busNumber route");

    if (!updated) return res.status(404).json({ success: false, message: "Booking not found" });

    sendBookingSocketUpdate("bookingUpdated", updated);

    return res.json({ success: true, message: "Booking updated", booking: updated });
  } catch (error) {
    return next(error);
  }
};

/**
 * Booking Analytics
 */
exports.getBookingAnalytics = async (req, res, next) => {
  try {
    const total = await Booking.countDocuments();
    const last7 = await Booking.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    return res.json({ success: true, total, last7Days: last7 });
  } catch (error) {
    return next(error);
  }
};

/**
 * Export Bookings as CSV
 */
exports.exportBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find().populate("user", "name email").populate("bus", "busNumber route");
    const rows = [["BookingId", "User", "Email", "Bus", "Route", "Seats", "Price", "Date", "Status"]];

    bookings.forEach((b) => {
      rows.push([
        b._id,
        b.user?.name || "",
        b.user?.email || "",
        b.bus?.busNumber || "",
        b.bus?.route || "",
        (b.seatNumbers || []).join("|"),
        b.price,
        b.date,
        b.status,
      ]);
    });

    const csv = rows.map((r) => r.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    res.header("Content-Type", "text/csv");
    res.attachment("bookings_export.csv");
    return res.send(csv);
  } catch (error) {
    return next(error);
  }
};
