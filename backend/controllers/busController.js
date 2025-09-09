// backend/controllers/busController.js
const mongoose = require('mongoose');
const Bus = require('../models/Bus');
const Booking = require('../models/Booking');

/**
 * Create a new bus
 * POST /api/buses
 * Admin
 */
const createBus = async (req, res, next) => {
  try {
    const {
      busNumber,
      busName,
      operator,
      totalSeats,
      route,
      stops = [],
      photos = [],
      amenities = [],
      schedule,
      basePrice,
      features = {}
    } = req.body || {};

    // Required fields
    if (!busNumber || !busName || !operator || !totalSeats || !route || !schedule || !schedule.departure || !schedule.arrival || basePrice == null) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: busNumber, busName, operator, totalSeats, route, schedule.departure, schedule.arrival, basePrice'
      });
    }

    if (!Array.isArray(stops)) {
      return res.status(400).json({ success: false, message: 'Stops must be an array' });
    }

    if (photos && !Array.isArray(photos)) {
      return res.status(400).json({ success: false, message: 'Photos must be an array' });
    }

    const normalizedBusNumber = String(busNumber).trim().toUpperCase();

    // Prevent duplicate busNumber
    const existingBus = await Bus.findOne({ busNumber: normalizedBusNumber });
    if (existingBus) {
      return res.status(409).json({ success: false, message: 'Bus with this number already exists' });
    }

    // Seat count validation
    const seatsCount = parseInt(totalSeats, 10);
    if (isNaN(seatsCount) || seatsCount <= 0 || seatsCount > 200) {
      return res.status(400).json({ success: false, message: 'totalSeats must be a number between 1 and 200' });
    }

    // Build seats array (numbers as strings)
    const seats = Array.from({ length: seatsCount }, (_, i) => ({
      number: String(i + 1),
      isBooked: false,
      bookedBy: null,
      bookingType: null,
      bookedAt: null,
      seatType: 'standard',
      priceMultiplier: 1.0
    }));

    const newBus = new Bus({
      busNumber: normalizedBusNumber,
      busName: String(busName).trim(),
      operator: String(operator).trim(),
      totalSeats: seatsCount,
      seats,
      availableSeats: seatsCount,
      route: {
        from: route.from?.trim() || '',
        to: route.to?.trim() || '',
        distance: route.distance || 0,
        duration: route.duration || '',
        stops: Array.isArray(stops) ? stops.map(s => ({
          name: s.name?.trim() || '',
          time: s.time || null,
          order: s.order || null,
          distanceFromStart: s.distanceFromStart || 0
        })) : []
      },
      schedule: {
        departure: schedule.departure,
        arrival: schedule.arrival,
        frequency: schedule.frequency || 'daily'
      },
      basePrice,
      photos,
      amenities,
      features: {
        ac: !!features.ac,
        wifi: !!features.wifi,
        chargingPoints: !!features.chargingPoints,
        entertainment: !!features.entertainment,
        toilet: !!features.toilet,
        ...features
      },
      status: 'active',
      isActive: true
    });

    await newBus.save();

    return res.status(201).json({ success: true, message: 'Bus added successfully', bus: newBus });
  } catch (err) {
    console.error('Create Bus Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

/**
 * Get all buses with filtering and pagination
 * GET /api/buses
 * Public
 */
const getAllBuses = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      routeFrom,
      routeTo,
      minSeats,
      maxSeats,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query || {};

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10))); // cap limit to 100

    const filter = {};
    // default only active buses (but allow admin to override by passing status)
    filter.isActive = true;

    if (search) {
      const s = String(search).trim();
      filter.$or = [
        { busName: { $regex: s, $options: 'i' } },
        { busNumber: { $regex: s, $options: 'i' } },
        { operator: { $regex: s, $options: 'i' } }
      ];
    }

    if (routeFrom) {
      filter['route.from'] = { $regex: String(routeFrom).trim(), $options: 'i' };
    }
    if (routeTo) {
      filter['route.to'] = { $regex: String(routeTo).trim(), $options: 'i' };
    }

    // Seat filters: use numeric comparison on availableSeats
    if (minSeats != null || maxSeats != null) {
      filter.availableSeats = {};
      if (minSeats != null) filter.availableSeats.$gte = parseInt(minSeats, 10);
      if (maxSeats != null) filter.availableSeats.$lte = parseInt(maxSeats, 10);
      // If object is empty, delete it
      if (Object.keys(filter.availableSeats).length === 0) delete filter.availableSeats;
    }

    if (status) {
      filter.status = status;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [buses, total] = await Promise.all([
      Bus.find(filter).sort(sortOptions).limit(limitNum).skip((pageNum - 1) * limitNum),
      Bus.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      buses
    });
  } catch (err) {
    console.error('Get All Buses Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

/**
 * Get bus by ID
 * GET /api/buses/:id
 * Public
 */
const getBusById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'Bus id is required' });

    const bus = await Bus.findById(id);
    if (!bus) return res.status(404).json({ success: false, message: 'Bus not found' });
    if (!bus.isActive) return res.status(404).json({ success: false, message: 'Bus is not active' });

    return res.status(200).json({ success: true, bus });
  } catch (err) {
    console.error('Get Bus By ID Error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid bus ID format' });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

/**
 * Update bus
 * PUT /api/buses/:id
 * Admin
 */
const updateBus = async (req, res, next) => {
  try {
    const { id } = req.params;
    let updateData = { ...(req.body || {}) };

    // Prevent changing identifiers
    delete updateData.busNumber;
    delete updateData._id;
    delete updateData.createdAt;

    // If totalSeats changes, adjust seats and availableSeats carefully
    if (updateData.totalSeats != null) {
      const newTotal = parseInt(updateData.totalSeats, 10);
      if (isNaN(newTotal) || newTotal <= 0) {
        return res.status(400).json({ success: false, message: 'totalSeats must be a positive integer' });
      }

      const bus = await Bus.findById(id);
      if (!bus) return res.status(404).json({ success: false, message: 'Bus not found' });

      // If seats array not provided, we will expand or shrink seats accordingly
      if (!updateData.seats) {
        const currentSeats = bus.seats || [];
        const currentTotal = currentSeats.length;
        if (newTotal > currentTotal) {
          // append new seats
          const add = [];
          for (let i = currentTotal; i < newTotal; i++) {
            add.push({
              number: String(i + 1),
              isBooked: false,
              bookedBy: null,
              bookingType: null,
              bookedAt: null,
              seatType: 'standard',
              priceMultiplier: 1.0
            });
          }
          updateData.seats = [...currentSeats.map(s => s.toObject ? s.toObject() : s), ...add];
        } else if (newTotal < currentTotal) {
          // shrinking: ensure we are not removing booked seats
          const toRemove = [];
          for (let i = newTotal; i < currentTotal; i++) {
            const seatNum = String(i + 1);
            const seatObj = currentSeats.find(s => String(s.number) === seatNum);
            if (seatObj && seatObj.isBooked) {
              return res.status(400).json({ success: false, message: 'Cannot reduce totalSeats because some trailing seats are booked' });
            }
            toRemove.push(seatNum);
          }
          // filter seats
          updateData.seats = currentSeats.filter(s => !toRemove.includes(String(s.number))).map(s => s.toObject ? s.toObject() : s);
        } else {
          // same size, nothing to change
        }
      }

      // set availableSeats correctly: count seats not booked
      if (updateData.seats) {
        const bookedCount = updateData.seats.filter(s => !!s.isBooked).length;
        updateData.availableSeats = updateData.seats.length - bookedCount;
      }
    } else if (updateData.seats) {
      // If seats array provided directly, recalc availableSeats
      const bookedCount = updateData.seats.filter(s => !!s.isBooked).length;
      updateData.availableSeats = updateData.seats.length - bookedCount;
      updateData.totalSeats = updateData.seats.length;
    }

    const updatedBus = await Bus.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!updatedBus) return res.status(404).json({ success: false, message: 'Bus not found' });

    return res.status(200).json({ success: true, message: 'Bus updated successfully', bus: updatedBus });
  } catch (err) {
    console.error('Update Bus Error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid bus ID format' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Validation error', error: err.message });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to update bus',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

/**
 * Soft delete bus
 * DELETE /api/buses/:id
 * Admin
 */
const deleteBus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedBus = await Bus.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!deletedBus) return res.status(404).json({ success: false, message: 'Bus not found' });
    return res.status(200).json({ success: true, message: 'Bus deleted (soft)', bus: deletedBus });
  } catch (err) {
    console.error('Delete Bus Error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid bus ID format' });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to delete bus',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

/**
 * Get buses by route
 * GET /api/buses/route
 * Public
 */
const getBusesByRoute = async (req, res, next) => {
  try {
    const { from, to, date } = req.query || {};

    if (!from || !to) {
      return res.status(400).json({ success: false, message: 'From and to parameters are required' });
    }

    const filter = {
      'route.from': { $regex: String(from).trim(), $options: 'i' },
      'route.to': { $regex: String(to).trim(), $options: 'i' },
      isActive: true,
      status: 'active'
    };

    // If date is provided and schedule.departure is a date, try to match day
    if (date) {
      // We will look for buses whose schedule.departure falls on the given date OR frequency includes that day.
      // This is a simple approach; adjust per your schedule schema.
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      filter['schedule.departure'] = { $gte: start, $lt: end };
    }

    const buses = await Bus.find(filter).sort({ 'schedule.departure': 1 });

    return res.status(200).json({ success: true, count: buses.length, buses });
  } catch (err) {
    console.error('Get Buses By Route Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

/**
 * Get bus availability for a specific date
 * GET /api/buses/availability/:id?date=YYYY-MM-DD
 * Public
 */
const getBusAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) return res.status(400).json({ success: false, message: 'Date parameter is required' });

    const bus = await Bus.findById(id);
    if (!bus) return res.status(404).json({ success: false, message: 'Bus not found' });

    // Collect seats booked for this bus on the given date (exclude cancelled)
    const bookings = await Booking.find({
      bus: mongoose.Types.ObjectId(id),
      date: String(date),
      status: { $ne: 'cancelled' }
    }, 'seatNumbers');

    const bookedSeatSet = new Set();
    bookings.forEach(b => (b.seatNumbers || []).forEach(s => bookedSeatSet.add(String(s))));

    const availableSeatsList = bus.seats.filter(s => !bookedSeatSet.has(String(s.number))).map(s => s.number);
    const totalSeats = bus.totalSeats || bus.seats.length || 0;
    const availableSeats = availableSeatsList.length;
    const occupancyPercentage = totalSeats > 0 ? Math.round(((totalSeats - availableSeats) / totalSeats) * 100) : 0;

    return res.status(200).json({
      success: true,
      busId: id,
      date,
      totalSeats,
      availableSeats,
      availableSeatsList,
      occupancyPercentage
    });
  } catch (err) {
    console.error('Get Bus Availability Error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid bus ID format' });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

/**
 * Update bus status
 * PATCH /api/buses/:id/status
 * Private (Admin/Captain)
 */
const updateBusStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const validStatuses = ['active', 'maintenance', 'out_of_service', 'scheduled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const updateData = { status };
    if (reason) updateData.statusReason = reason;
    updateData.statusUpdatedAt = new Date();

    const updatedBus = await Bus.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!updatedBus) return res.status(404).json({ success: false, message: 'Bus not found' });

    return res.status(200).json({ success: true, message: 'Bus status updated successfully', bus: updatedBus });
  } catch (err) {
    console.error('Update Bus Status Error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid bus ID format' });
    }
    return res.status(500).json({ success: false, message: 'Failed to update bus status', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};

/**
 * Get bus analytics & statistics (Admin)
 * GET /api/buses/admin/analytics
 */
const getBusAnalytics = async (req, res, next) => {
  try {
    const totalBuses = await Bus.countDocuments();
    const activeBuses = await Bus.countDocuments({ isActive: true, status: 'active' });
    const maintenanceBuses = await Bus.countDocuments({ status: 'maintenance' });
    const outOfServiceBuses = await Bus.countDocuments({ status: 'out_of_service' });
    const scheduledBuses = await Bus.countDocuments({ status: 'scheduled' });

    // Average occupancy - use availableSeats if present
    const buses = await Bus.find({ isActive: true }, 'availableSeats totalSeats seats');
    const avgOccupancy = buses.length === 0 ? 0 : Math.round(buses.reduce((sum, b) => {
      const total = b.totalSeats || (b.seats && b.seats.length) || 0;
      const avail = (typeof b.availableSeats === 'number') ? b.availableSeats : (b.seats ? b.seats.filter(s => !s.isBooked).length : 0);
      const occ = total > 0 ? ((total - avail) / total) * 100 : 0;
      return sum + occ;
    }, 0) / buses.length);

    return res.status(200).json({
      success: true,
      totalBuses,
      activeBuses,
      maintenanceBuses,
      outOfServiceBuses,
      scheduledBuses,
      avgOccupancy,
      busesByStatus: { active: activeBuses, maintenance: maintenanceBuses, out_of_service: outOfServiceBuses, scheduled: scheduledBuses }
    });
  } catch (err) {
    console.error('Get Bus Analytics Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch bus analytics', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};

/**
 * Export buses
 * GET /api/buses/admin/export?format=csv
 * Admin
 */
const exportBuses = async (req, res, next) => {
  try {
    const { format = 'json' } = req.query;
    const buses = await Bus.find().sort({ createdAt: -1 });

    if (format === 'csv') {
      const rows = [['Bus Number', 'Bus Name', 'Operator', 'Total Seats', 'Available Seats', 'Route', 'Status', 'Base Price', 'Created At']];
      buses.forEach(b => {
        rows.push([
          b.busNumber || '',
          b.busName || '',
          b.operator || '',
          b.totalSeats || '',
          b.availableSeats || '',
          `${b.route?.from || ''} to ${b.route?.to || ''}`,
          b.status || '',
          b.basePrice || '',
          b.createdAt ? b.createdAt.toISOString().split('T')[0] : ''
        ]);
      });
      const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      res.header('Content-Type', 'text/csv');
      res.attachment('buses_export.csv');
      return res.send(csv);
    }

    // default JSON
    return res.status(200).json({ success: true, total: buses.length, data: buses });
  } catch (err) {
    console.error('Export Buses Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to export buses data', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};

/**
 * Get featured routes
 * GET /api/buses/route/featured
 * Public
 */
const getFeaturedRoutes = async (req, res, next) => {
  try {
    const buses = await Bus.find({ isActive: true, isFeatured: true }).sort({ createdAt: -1 }).limit(6);
    return res.status(200).json({ success: true, count: buses.length, buses });
  } catch (err) {
    console.error('Get Featured Routes Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch featured routes', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};

/**
 * Get popular routes
 * GET /api/buses/route/popular?limit=6
 * Public
 * Uses booking counts to determine popularity if possible, otherwise falls back to isPopular flag.
 */
const getPopularRoutes = async (req, res, next) => {
  try {
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit || '6', 10)));

    // Prefer computing by booking counts
    const popularByBookings = await Booking.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: '$bus', bookings: { $sum: 1 } } },
      { $sort: { bookings: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'buses',
          localField: '_id',
          foreignField: '_id',
          as: 'bus'
        }
      },
      { $unwind: { path: '$bus', preserveNullAndEmptyArrays: false } },
      { $replaceRoot: { newRoot: { bus: '$bus', bookings: '$bookings' } } }
    ]);

    if (popularByBookings && popularByBookings.length > 0) {
      const buses = popularByBookings.map(p => ({ ...p.bus.toObject ? p.bus.toObject() : p.bus, bookings: p.bookings }));
      return res.status(200).json({ success: true, count: buses.length, buses });
    }

    // Fallback to isPopular flag
    const fallback = await Bus.find({ isActive: true, isPopular: true }).sort({ createdAt: -1 }).limit(limit);
    return res.status(200).json({ success: true, count: fallback.length, buses: fallback });
  } catch (err) {
    console.error('Get Popular Routes Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch popular routes', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};

module.exports = {
  createBus,
  getAllBuses,
  getBusById,
  updateBus,
  deleteBus,
  getBusesByRoute,
  getBusAvailability,
  updateBusStatus,
  getBusAnalytics,
  exportBuses,
  getFeaturedRoutes,
  getPopularRoutes
};
