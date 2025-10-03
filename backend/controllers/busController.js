const mongoose = require("mongoose");
const Bus = require("../models/Bus");

// Helper for consistent responses
const sendResponse = (res, statusCode, success, message, data = null) => {
  return res.status(statusCode).json({ success, message, data });
};

// -------------------- BUS FUNCTIONS --------------------

// Create a new bus (admin only)
const createBus = async (req, res, next) => {
  try {
    const { busNumber, busName, operator, totalSeats, route, schedule, basePrice, amenities = [], features = {} } = req.body;

    if (!busNumber || !busName || !operator || !totalSeats || !route || !schedule || basePrice == null) {
      return sendResponse(res, 400, false, "Missing required fields.");
    }

    const seats = Array.from({ length: totalSeats }, (_, i) => ({
      number: i + 1,
      isBooked: false
    }));

    const bus = new Bus({
      busNumber,
      busName,
      operator,
      totalSeats,
      seats,
      route,
      schedule,
      basePrice,
      amenities,
      features,
      availableSeats: totalSeats,
    });

    await bus.save();
    return sendResponse(res, 201, true, "Bus created successfully.", bus);
  } catch (error) {
    return next(error);
  }
};

// Get all buses with optional pagination/filtering
const getAllBuses = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", busType, city } = req.query;
    const query = {};
    if (busType) query["features.type"] = busType;
    if (city) query.city = { $regex: city, $options: "i" };

    const totalCount = await Bus.countDocuments(query);
    const buses = await Bus.find(query)
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return sendResponse(res, 200, true, "Buses fetched successfully.", {
      data: buses,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
      totalBuses: totalCount,
    });
  } catch (error) {
    return next(error);
  }
};

// Get bus by ID
const getBusById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return sendResponse(res, 400, false, "Invalid bus ID.");

    const bus = await Bus.findById(id);
    if (!bus) return sendResponse(res, 404, false, "Bus not found.");

    return sendResponse(res, 200, true, "Bus fetched successfully.", bus);
  } catch (error) {
    return next(error);
  }
};

// Update bus
const updateBus = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return sendResponse(res, 400, false, "Invalid bus ID.");

    const updated = await Bus.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!updated) return sendResponse(res, 404, false, "Bus not found.");

    return sendResponse(res, 200, true, "Bus updated successfully.", updated);
  } catch (error) {
    return next(error);
  }
};

// Delete bus
const deleteBus = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return sendResponse(res, 400, false, "Invalid bus ID.");

    const deleted = await Bus.findByIdAndDelete(id);
    if (!deleted) return sendResponse(res, 404, false, "Bus not found.");

    return sendResponse(res, 200, true, "Bus deleted successfully.");
  } catch (error) {
    return next(error);
  }
};

// Get most popular routes
const getPopularRoutes = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const popularRoutes = await Bus.aggregate([
            { $group: { _id: { from: "$route.from", to: "$route.to" }, bookings: { $sum: "$totalSeats" } } }, // Example logic
            { $sort: { bookings: -1 } },
            { $limit: limit },
            { $project: { from: "$_id.from", to: "$_id.to", bookings: "$bookings", _id: 0 } }
        ]);
        return sendResponse(res, 200, true, "Popular routes fetched", popularRoutes);
    } catch (error) {
        return next(error);
    }
};

// Search buses by from, to, date
const searchBuses = async (req, res) => {
  try {
    const { from, to, date } = req.query;

    if (!from || !to) {
      return res.status(400).json({ success: false, message: "From and To are required" });
    }

    // Example query: match route.from & route.to
    const buses = await Bus.find({
      'route.from': { $regex: new RegExp(from, 'i') },
      'route.to': { $regex: new RegExp(to, 'i') }
    });

    return res.status(200).json({ success: true, data: buses });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


// Featured buses
const getFeaturedBuses = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const buses = await Bus.find({ "features.isFeatured": true }).limit(limit);
    return sendResponse(res, 200, true, "Featured buses fetched successfully.", buses);
  } catch (error) {
    return next(error);
  }
};

// Popular buses
const getPopularBuses = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const buses = await Bus.find().sort({ "features.rating": -1 }).limit(limit);
    return sendResponse(res, 200, true, "Popular buses fetched successfully.", buses);
  } catch (error) {
    return next(error);
  }
};

// Get bus availability by date
const getBusAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    if (!mongoose.Types.ObjectId.isValid(id)) return sendResponse(res, 400, false, "Invalid bus ID.");

    const bus = await Bus.findById(id);
    if (!bus) return sendResponse(res, 404, false, "Bus not found.");

    // Filter booked seats for the date
    const bookedSeats = bus.bookings?.filter(b => b.date === date)?.map(s => s.seatNumbers).flat() || [];
    const availableSeats = bus.seats.filter(s => !bookedSeats.includes(s.number));

    return sendResponse(res, 200, true, "Bus availability fetched.", { availableSeats });
  } catch (error) {
    return next(error);
  }
};

// Update bus status (admin)
const updateBusStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) return sendResponse(res, 400, false, "Invalid bus ID.");

    const bus = await Bus.findById(id);
    if (!bus) return sendResponse(res, 404, false, "Bus not found.");

    bus.status = status;
    if (reason) bus.statusReason = reason;
    await bus.save();

    return sendResponse(res, 200, true, "Bus status updated.", bus);
  } catch (error) {
    return next(error);
  }
};

// Bus analytics
const getBusAnalytics = async (req, res) => {
  try {
    const totalBuses = await Bus.countDocuments();
    const activeBuses = await Bus.countDocuments({ status: "active" });
    const inactiveBuses = await Bus.countDocuments({ status: "inactive" });

    res.status(200).json({
      success: true,
      data: { totalBuses, activeBuses, inactiveBuses },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


// Export buses
const exportBuses = async (req, res, next) => {
  try {
    const buses = await Bus.find();
    return sendResponse(res, 200, true, "Buses export ready.", buses);
  } catch (error) {
    return next(error);
  }
};

// module.exports = {
//   createBus,
//   getAllBuses,
//   getBusById,
//   updateBus,
//   deleteBus,
//   searchBuses,
//   getFeaturedBuses,
//   getPopularBuses,
//   getBusAvailability,
//   updateBusStatus,
//   getBusAnalytics,
//   exportBuses,
// };


module.exports = {
  createBus,
  getAllBuses,
  getBusById,
  updateBus,
  deleteBus,
  searchBuses,
  getFeaturedBuses,
  getPopularBuses,
  getBusAvailability,
  updateBusStatus,
  getBusAnalytics,
  exportBuses,
  getPopularRoutes
}