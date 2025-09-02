const Booking = require('../models/Booking');
const Bus = require('../models/Bus');
const User = require('../models/User');
const { sendBookingSocketUpdate } = require('../sockets/bookingSocket');

// Create a new booking
exports.createBooking = async (req, res, next) => {
  try {
    const { userId, busId, seatNumbers, price, date, time } = req.body;

    // Input validation
    if (!userId || !busId || !seatNumbers || !seatNumbers.length || !price || !date || !time) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!Array.isArray(seatNumbers)) {
      return res.status(400).json({ message: 'seatNumbers must be an array' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ message: 'Bus not found' });

    // Validate seat numbers exist on the bus
    const validSeatNumbers = bus.seats.map(seat => seat.number);
    const invalidSeats = seatNumbers.filter(seat => !validSeatNumbers.includes(seat));
    
    if (invalidSeats.length > 0) {
      return res.status(400).json({ 
        message: 'Invalid seat numbers selected', 
        invalidSeats 
      });
    }

    // Check seat availability
    const alreadyBookedSeats = bus.seats
      .filter(seat => seat.isBooked)
      .map(seat => seat.number);

    const unavailableSeats = seatNumbers.filter(seat => alreadyBookedSeats.includes(seat));
    
    if (unavailableSeats.length > 0) {
      return res.status(400).json({ 
        message: 'One or more selected seats are already booked', 
        unavailableSeats 
      });
    }

    // Mark seats as booked
    bus.seats = bus.seats.map(seat => {
      if (seatNumbers.includes(seat.number)) {
        return {
          ...seat.toObject(),
          isBooked: true,
          bookedBy: userId,
          bookingType: 'online',
          bookedAt: new Date()
        };
      }
      return seat;
    });

    bus.availableSeats -= seatNumbers.length;
    await bus.save();

    const booking = new Booking({
      user: userId,
      bus: busId,
      seatNumbers,
      price,
      date,
      time,
      status: 'confirmed',
    });

    await booking.save();

    // Populate booking details before sending socket update
    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email')
      .populate('bus', 'busNumber route');

    sendBookingSocketUpdate('bookingCreated', populatedBooking);

    res.status(201).json({ 
      message: 'Booking successful', 
      booking: populatedBooking 
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    next(error);
  }
};

// Get bookings by user
exports.getBookingsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const bookings = await Booking.find({ user: userId })
      .populate('bus', 'busNumber route departureTime arrivalTime')
      .sort({ createdAt: -1 });

    res.json({
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    next(error);
  }
};

// Get all bookings (Admin)
exports.getAllBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filter = {};
    if (status && ['confirmed', 'cancelled', 'completed'].includes(status)) {
      filter.status = status;
    }

    const bookings = await Booking.find(filter)
      .populate('user', 'name email')
      .populate('bus', 'busNumber route')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(filter);

    res.json({
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      bookings
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    next(error);
  }
};

// Cancel a booking
exports.cancelBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    
    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking already cancelled' });
    }

    // Check if cancellation is allowed (e.g., not too close to departure)
    const bus = await Bus.findById(booking.bus);
    const departureTime = new Date(`${booking.date}T${bus.departureTime}`);
    const currentTime = new Date();
    const timeDifference = departureTime - currentTime;
    const hoursDifference = timeDifference / (1000 * 60 * 60);

    if (hoursDifference < 2) { // 2 hours before departure
      return res.status(400).json({ 
        message: 'Cancellation not allowed within 2 hours of departure' 
      });
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();

    if (bus) {
      bus.seats = bus.seats.map(seat => {
        if (booking.seatNumbers.includes(seat.number)) {
          return {
            ...seat.toObject(),
            isBooked: false,
            bookedBy: null,
            bookingType: null,
            bookedAt: null
          };
        }
        return seat;
      });

      bus.availableSeats += booking.seatNumbers.length;
      await bus.save();
    }

    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email')
      .populate('bus', 'busNumber route');

    sendBookingSocketUpdate('bookingCancelled', populatedBooking);

    res.json({ 
      message: 'Booking cancelled successfully', 
      booking: populatedBooking 
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    next(error);
  }
};

// Check seat availability for specific seats
exports.checkSeatAvailability = async (req, res, next) => {
  try {
    const { busId, seats } = req.body;

    if (!busId || !seats || !Array.isArray(seats)) {
      return res.status(400).json({ message: 'busId and seats array are required' });
    }

    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ message: 'Bus not found' });

    const validSeatNumbers = bus.seats.map(seat => seat.number);
    const invalidSeats = seats.filter(seat => !validSeatNumbers.includes(seat));
    
    if (invalidSeats.length > 0) {
      return res.status(400).json({ 
        message: 'Invalid seat numbers requested', 
        invalidSeats 
      });
    }

    const bookedSeatNumbers = bus.seats
      .filter(seat => seat.isBooked)
      .map(seat => seat.number);

    const availability = seats.map(seat => ({
      seat,
      available: !bookedSeatNumbers.includes(seat),
    }));

    const allAvailable = availability.every(item => item.available);

    res.json({ 
      busId,
      allAvailable,
      availability 
    });
  } catch (error) {
    console.error('Check seat availability error:', error);
    next(error);
  }
};

// Get booking by ID
exports.getBookingById = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    
    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }

    const booking = await Booking.findById(bookingId)
      .populate('user', 'name email phone')
      .populate('bus', 'busNumber route departureTime arrivalTime price');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Get booking by ID error:', error);
    next(error);
  }
};

// Update booking (Admin only)
exports.updateBooking = async (req, res, next) => {
  try {
    res.json({ message: "Update booking not implemented yet" });
  } catch (error) {
    next(error);
  }
};

// Booking analytics (Admin only)
exports.getBookingAnalytics = async (req, res, next) => {
  try {
    res.json({ message: "Booking analytics not implemented yet" });
  } catch (error) {
    next(error);
  }
};

// Export bookings (Admin only)
exports.exportBookings = async (req, res, next) => {
  try {
    res.json({ message: "Export bookings not implemented yet" });
  } catch (error) {
    next(error);
  }
};
