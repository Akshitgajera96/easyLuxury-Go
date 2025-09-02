const Bus = require("../models/Bus");

// @desc    Create a new bus
// @route   POST /api/buses
// @access  Admin
const createBus = async (req, res) => {
  try {
    const {
      busNumber,
      busName,
      operator,
      totalSeats,
      route,
      stops,
      photos,
      amenities,
      schedule,
      basePrice,
      features
    } = req.body;

    // Enhanced validation
    if (!busNumber || !busName || !operator || !totalSeats || !route || 
        !schedule || !schedule.departure || !schedule.arrival || !basePrice) {
      return res.status(400).json({ 
        message: "Missing required fields: busNumber, busName, operator, totalSeats, route, schedule.departure, schedule.arrival, basePrice" 
      });
    }

    if (!Array.isArray(stops)) {
      return res.status(400).json({ message: "Stops must be an array" });
    }

    if (photos && !Array.isArray(photos)) {
      return res.status(400).json({ message: "Photos must be an array" });
    }

    // Check if bus with same number plate already exists
    const existingBus = await Bus.findOne({ busNumber });
    if (existingBus) {
      return res.status(409).json({ message: "Bus with this number already exists" });
    }

    // Validate seat numbers
    if (totalSeats <= 0 || totalSeats > 100) {
      return res.status(400).json({ message: "Total seats must be between 1 and 100" });
    }

    // Create seats array
    const seats = Array.from({ length: totalSeats }, (_, i) => ({
      number: i + 1,
      isBooked: false,
      bookedBy: null,
      bookingType: null,
      bookedAt: null,
      seatType: "standard",
      priceMultiplier: 1.0
    }));

    const newBus = new Bus({
      busNumber: busNumber.trim().toUpperCase(),
      busName: busName.trim(),
      operator: operator.trim(),
      totalSeats,
      seats,
      availableSeats: totalSeats,
      route: {
        from: route.from?.trim(),
        to: route.to?.trim(),
        distance: route.distance,
        duration: route.duration,
        stops: stops.map(stop => ({
          name: stop.name?.trim(),
          time: stop.time,
          order: stop.order,
          distanceFromStart: stop.distanceFromStart || 0
        })),
        type: route.type || "intercity"
      },
      schedule: {
        departure: schedule.departure,
        arrival: schedule.arrival,
        frequency: schedule.frequency || "daily"
      },
      basePrice,
      photos: photos || [],
      amenities: amenities || [],
      features: features || {
        ac: false,
        wifi: false,
        chargingPoints: false,
        entertainment: false,
        toilet: false
      },
      status: "active",
      isActive: true
    });

    await newBus.save();
    
    res.status(201).json({ 
      message: "Bus added successfully", 
      bus: newBus 
    });
  } catch (error) {
    console.error("Create Bus Error:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get all buses with filtering and pagination
// @route   GET /api/buses
// @access  Public
const getAllBuses = async (req, res) => {
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
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    
    if (search) {
      filter.$or = [
        { busName: { $regex: search, $options: 'i' } },
        { busNumber: { $regex: search, $options: 'i' } },
        { operator: { $regex: search, $options: 'i' } }
      ];
    }

    if (routeFrom) {
      filter['route.from'] = { $regex: routeFrom, $options: 'i' };
    }

    if (routeTo) {
      filter['route.to'] = { $regex: routeTo, $options: 'i' };
    }

    if (minSeats) {
      filter.availableSeats = { ...filter.availableSeats, $gte: parseInt(minSeats) };
    }

    if (maxSeats) {
      filter.availableSeats = { ...filter.availableSeats, $lte: parseInt(maxSeats) };
    }

    if (status) {
      filter.status = status;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const buses = await Bus.find(filter)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Bus.countDocuments(filter);

    res.status(200).json({
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      buses
    });
  } catch (error) {
    console.error("Get All Buses Error:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get bus by ID
// @route   GET /api/buses/:id
// @access  Public
const getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    if (!bus.isActive) {
      return res.status(404).json({ message: "Bus is not active" });
    }

    res.status(200).json(bus);
  } catch (error) {
    console.error("Get Bus By ID Error:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid bus ID format" });
    }
    
    res.status(500).json({ 
      message: "Server error", 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update a bus
// @route   PUT /api/buses/:id
// @access  Admin
const updateBus = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Prevent certain fields from being updated
    delete updateData.busNumber;
    delete updateData._id;
    delete updateData.createdAt;

    // If seats are being updated, recalculate available seats
    if (updateData.seats) {
      const bookedSeats = updateData.seats.filter(seat => seat.isBooked).length;
      updateData.availableSeats = updateData.totalSeats - bookedSeats;
    }

    const updatedBus = await Bus.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!updatedBus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    res.status(200).json({ 
      message: "Bus updated successfully", 
      bus: updatedBus 
    });
  } catch (error) {
    console.error("Update Bus Error:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid bus ID format" });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation error", 
        error: error.message 
      });
    }
    
    res.status(500).json({ 
      message: "Failed to update bus", 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Delete a bus (soft delete)
// @route   DELETE /api/buses/:id
// @access  Admin
const deleteBus = async (req, res) => {
  try {
    const deletedBus = await Bus.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!deletedBus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    res.status(200).json({ 
      message: "Bus deleted successfully",
      bus: deletedBus
    });
  } catch (error) {
    console.error("Delete Bus Error:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid bus ID format" });
    }
    
    res.status(500).json({ 
      message: "Failed to delete bus", 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get buses by route
// @route   GET /api/buses/route
// @access  Public
const getBusesByRoute = async (req, res) => {
  try {
    const { from, to, date } = req.query;

    if (!from || !to) {
      return res.status(400).json({ message: "From and to parameters are required" });
    }

    let filter = {
      'route.from': { $regex: from, $options: 'i' },
      'route.to': { $regex: to, $options: 'i' },
      isActive: true,
      status: "active"
    };

    // If date is provided, filter by date
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      filter['schedule.departure'] = {
        $gte: startDate,
        $lt: endDate
      };
    }

    const buses = await Bus.find(filter).sort({ 'schedule.departure': 1 });

    res.status(200).json({
      count: buses.length,
      buses
    });
  } catch (error) {
    console.error("Get Buses By Route Error:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get bus availability for specific date
// @route   GET /api/buses/availability/:id
// @access  Public
const getBusAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date parameter is required" });
    }

    const bus = await Bus.findById(id);
    
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    // In a real application, you would check bookings for this specific date
    // For now, we'll return the current seat status
    const availableSeats = bus.seats.filter(seat => !seat.isBooked).map(seat => seat.number);

    res.status(200).json({
      busId: id,
      date,
      totalSeats: bus.totalSeats,
      availableSeats: bus.availableSeats,
      availableSeatsList: availableSeats,
      occupancyPercentage: bus.occupancyPercentage
    });
  } catch (error) {
    console.error("Get Bus Availability Error:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid bus ID format" });
    }
    
    res.status(500).json({ 
      message: "Server error", 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update bus status
// @route   PATCH /api/buses/:id/status
// @access  Private (Admin, Captain)
const updateBusStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const validStatuses = ["active", "maintenance", "out_of_service", "scheduled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const updateData = { status };
    if (reason) {
      updateData.statusReason = reason;
    }

    const updatedBus = await Bus.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedBus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    res.status(200).json({ 
      message: "Bus status updated successfully", 
      bus: updatedBus 
    });
  } catch (error) {
    console.error("Update Bus Status Error:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid bus ID format" });
    }
    
    res.status(500).json({ 
      message: "Failed to update bus status", 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get bus analytics and statistics
// @route   GET /api/buses/admin/analytics
// @access  Private (Admin)
const getBusAnalytics = async (req, res) => {
  try {
    // Basic analytics - you can expand this with more complex queries
    const totalBuses = await Bus.countDocuments();
    const activeBuses = await Bus.countDocuments({ isActive: true, status: "active" });
    const maintenanceBuses = await Bus.countDocuments({ status: "maintenance" });
    const outOfServiceBuses = await Bus.countDocuments({ status: "out_of_service" });

    // Get average occupancy
    const buses = await Bus.find({ isActive: true });
    const totalOccupancy = buses.reduce((sum, bus) => sum + bus.occupancyPercentage, 0);
    const avgOccupancy = totalOccupancy / (buses.length || 1);

    res.status(200).json({
      totalBuses,
      activeBuses,
      maintenanceBuses,
      outOfServiceBuses,
      avgOccupancy: Math.round(avgOccupancy),
      busesByStatus: {
        active: activeBuses,
        maintenance: maintenanceBuses,
        out_of_service: outOfServiceBuses,
        scheduled: await Bus.countDocuments({ status: "scheduled" })
      }
    });
  } catch (error) {
    console.error("Get Bus Analytics Error:", error);
    res.status(500).json({ 
      message: "Failed to fetch bus analytics", 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Export buses data
// @route   GET /api/buses/admin/export
// @access  Private (Admin)
const exportBuses = async (req, res) => {
  try {
    const buses = await Bus.find().sort({ createdAt: -1 });

    // Simple CSV export - you might want to use a library like json2csv for production
    const csvData = buses.map(bus => ({
      'Bus Number': bus.busNumber,
      'Bus Name': bus.busName,
      'Operator': bus.operator,
      'Total Seats': bus.totalSeats,
      'Available Seats': bus.availableSeats,
      'Route': `${bus.route.from} to ${bus.route.to}`,
      'Status': bus.status,
      'Base Price': bus.basePrice,
      'Created At': bus.createdAt.toISOString().split('T')[0]
    }));

    res.status(200).json({
      message: "Export successful",
      data: csvData,
      total: buses.length
    });
  } catch (error) {
    console.error("Export Buses Error:", error);
    res.status(500).json({ 
      message: "Failed to export buses data", 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
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
  exportBuses
};