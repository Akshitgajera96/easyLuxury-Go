const Captain = require("../models/captain");
const Bus = require("../models/Bus"); // ✅ Make sure to import Bus model

// ✅ Register a new captain
exports.registerCaptain = async (req, res) => {
  try {
    const { name, email, phone, licenseNumber, password, address } = req.body;

    // Validation
    if (!name || !email || !phone || !licenseNumber || !password) {
      return res.status(400).json({ 
        msg: "Please provide name, email, phone, licenseNumber, and password" 
      });
    }

    // Check if captain already exists
    const existingCaptain = await Captain.findOne({ 
      $or: [{ email }, { licenseNumber }] 
    });

    if (existingCaptain) {
      return res.status(409).json({ 
        msg: "Captain with this email or license number already exists" 
      });
    }

    const captain = new Captain({
      name,
      email,
      phone,
      licenseNumber,
      password,
      address,
      isAvailable: true
    });

    await captain.save();

    // Remove password from response
    const captainResponse = captain.toObject();
    delete captainResponse.password;
    delete captainResponse.__v;

    res.status(201).json({
      msg: "Captain created successfully",
      captain: captainResponse
    });
  } catch (error) {
    console.error("❌ Error creating captain:", error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        msg: "Validation error", 
        error: error.message 
      });
    }
    
    res.status(500).json({ 
      msg: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ✅ Get all captains with filtering and pagination
exports.getAllCaptains = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      isAvailable,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (isAvailable !== undefined) {
      filter.isAvailable = isAvailable === 'true';
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const captains = await Captain.find(filter)
      .select("-password -__v")
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Captain.countDocuments(filter);

    res.status(200).json({
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      captains
    });
  } catch (error) {
    console.error("❌ Error fetching captains:", error);
    res.status(500).json({ 
      msg: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ✅ Get a single captain
exports.getCaptainById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ msg: "Captain ID is required" });
    }

    const captain = await Captain.findById(id).select("-password -__v");
    
    if (!captain) {
      return res.status(404).json({ msg: "Captain not found" });
    }

    res.status(200).json(captain);
  } catch (error) {
    console.error("❌ Error fetching captain:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ msg: "Invalid captain ID format" });
    }
    
    res.status(500).json({ 
      msg: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ✅ Update captain profile
exports.updateCaptain = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({ msg: "Captain ID is required" });
    }

    // Prevent updating sensitive fields
    const allowedUpdates = ['name', 'phone', 'licenseNumber', 'address', 'isAvailable', 'profilePhoto'];
    const isValidOperation = Object.keys(updates).every(field => allowedUpdates.includes(field));
    
    if (!isValidOperation) {
      return res.status(400).json({ msg: "Invalid updates attempted" });
    }

    const captain = await Captain.findByIdAndUpdate(
      id, 
      updates, 
      { 
        new: true, 
        runValidators: true 
      }
    ).select("-password -__v");

    if (!captain) {
      return res.status(404).json({ msg: "Captain not found" });
    }

    res.status(200).json({ 
      msg: "Captain updated successfully", 
      captain 
    });
  } catch (error) {
    console.error("❌ Error updating captain:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ msg: "Invalid captain ID format" });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        msg: "Validation error", 
        error: error.message 
      });
    }
    
    res.status(500).json({ 
      msg: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ✅ Delete a captain
exports.deleteCaptain = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ msg: "Captain ID is required" });
    }

    const captain = await Captain.findByIdAndDelete(id);

    if (!captain) {
      return res.status(404).json({ msg: "Captain not found" });
    }

    res.status(200).json({ 
      msg: "Captain deleted successfully" 
    });
  } catch (error) {
    console.error("❌ Error deleting captain:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ msg: "Invalid captain ID format" });
    }
    
    res.status(500).json({ 
      msg: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ✅ Get captain availability status
exports.getCaptainAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ msg: "Captain ID is required" });
    }

    const captain = await Captain.findById(id).select("isAvailable name");
    
    if (!captain) {
      return res.status(404).json({ msg: "Captain not found" });
    }

    res.status(200).json({
      captainId: captain._id,
      name: captain.name,
      isAvailable: captain.isAvailable
    });
  } catch (error) {
    console.error("❌ Error fetching captain availability:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ msg: "Invalid captain ID format" });
    }
    
    res.status(500).json({ 
      msg: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ✅ Update captain availability
exports.updateCaptainAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;
    
    if (!id) {
      return res.status(400).json({ msg: "Captain ID is required" });
    }

    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({ msg: "isAvailable must be a boolean value" });
    }

    const captain = await Captain.findByIdAndUpdate(
      id,
      { isAvailable },
      { new: true }
    ).select("isAvailable name");

    if (!captain) {
      return res.status(404).json({ msg: "Captain not found" });
    }

    res.status(200).json({
      msg: "Captain availability updated",
      captainId: captain._id,
      name: captain.name,
      isAvailable: captain.isAvailable
    });
  } catch (error) {
    console.error("❌ Error updating captain availability:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ msg: "Invalid captain ID format" });
    }
    
    res.status(500).json({ 
      msg: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ✅ Get captain statistics
exports.getCaptainStats = async (req, res) => {
  try {
    const totalCaptains = await Captain.countDocuments();
    const availableCaptains = await Captain.countDocuments({ isAvailable: true });
    const unavailableCaptains = await Captain.countDocuments({ isAvailable: false });

    res.status(200).json({
      totalCaptains,
      availableCaptains,
      unavailableCaptains,
      availabilityRate: totalCaptains > 0 ? (availableCaptains / totalCaptains) * 100 : 0
    });
  } catch (error) {
    console.error("❌ Error fetching captain stats:", error);
    res.status(500).json({ 
      msg: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ✅ Assign bus to captain
exports.assignBusToCaptain = async (req, res) => {
  try {
    const { id } = req.params;
    const { busId } = req.body;

    if (!id || !busId) {
      return res.status(400).json({ msg: "Captain ID and Bus ID are required" });
    }

    // Check if captain exists
    const captain = await Captain.findById(id);
    if (!captain) {
      return res.status(404).json({ msg: "Captain not found" });
    }

    // Check if bus exists
    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({ msg: "Bus not found" });
    }

    // Check if bus is already assigned to another captain
    if (bus.assignedCaptain && bus.assignedCaptain.toString() !== id) {
      return res.status(400).json({ msg: "Bus is already assigned to another captain" });
    }

    // Update bus assignment
    bus.assignedCaptain = id;
    await bus.save();

    // Add bus to captain's assigned buses
    if (!captain.assignedBuses.includes(busId)) {
      captain.assignedBuses.push(busId);
      await captain.save();
    }

    res.status(200).json({
      msg: "Bus assigned to captain successfully",
      captain: captain.name,
      bus: bus.busNumber
    });
  } catch (error) {
    console.error("❌ Error assigning bus to captain:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ msg: "Invalid ID format" });
    }
    
    res.status(500).json({ 
      msg: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ✅ Remove bus from captain
exports.removeBusFromCaptain = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ msg: "Captain ID is required" });
    }

    const captain = await Captain.findById(id);
    if (!captain) {
      return res.status(404).json({ msg: "Captain not found" });
    }

    // Remove bus assignments from this captain
    await Bus.updateMany(
      { assignedCaptain: id },
      { $unset: { assignedCaptain: "" } }
    );

    // Clear assigned buses from captain
    captain.assignedBuses = [];
    await captain.save();

    res.status(200).json({
      msg: "All buses removed from captain successfully",
      captain: captain.name
    });
  } catch (error) {
    console.error("❌ Error removing bus from captain:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ msg: "Invalid captain ID format" });
    }
    
    res.status(500).json({ 
      msg: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};