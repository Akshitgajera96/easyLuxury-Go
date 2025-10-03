// backend/controllers/captainController.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Captain = require('../models/Captain'); // keep path consistent with your project
const Bus = require('../models/Bus');

/**
 * Helpers
 */
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS || 10);

function sanitizeCaptain(captainDoc) {
  if (!captainDoc) return null;
  const c = captainDoc.toObject ? captainDoc.toObject() : captainDoc;
  delete c.password;
  delete c.__v;
  return c;
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(String(id));
}

/**
 * Register a new captain
 * POST /api/captains
 * Admin
 */
exports.registerCaptain = async (req, res, next) => {
  try {
    const { name, email, phone, licenseNumber, password, address } = req.body || {};

    if (!name || !email || !phone || !licenseNumber || !password) {
      return res.status(400).json({ success: false, msg: 'Please provide name, email, phone, licenseNumber, and password' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedLicense = String(licenseNumber).trim();

    const existing = await Captain.findOne({
      $or: [{ email: normalizedEmail }, { licenseNumber: normalizedLicense }]
    });

    if (existing) {
      return res.status(409).json({ success: false, msg: 'Captain with this email or license number already exists' });
    }

    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);

    const captain = new Captain({
      name: String(name).trim(),
      email: normalizedEmail,
      phone: String(phone).trim(),
      licenseNumber: normalizedLicense,
      password: hashedPassword,
      address: address ? String(address).trim() : '',
      isAvailable: true,
      assignedBuses: []
    });

    await captain.save();

    return res.status(201).json({
      success: true,
      msg: 'Captain created successfully',
      captain: sanitizeCaptain(captain)
    });
  } catch (err) {
    console.error('Error creating captain:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, msg: 'Validation error', error: err.message });
    }
    return res.status(500).json({ success: false, msg: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};

/**
 * Get all captains with filtering & pagination
 * GET /api/captains
 */
exports.getAllCaptains = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      isAvailable,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query || {};

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));

    const filter = {};

    if (search) {
      const s = String(search).trim();
      filter.$or = [
        { name: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { phone: { $regex: s, $options: 'i' } }
      ];
    }

    if (typeof isAvailable !== 'undefined') {
      // allow ?isAvailable=true/false
      filter.isAvailable = String(isAvailable) === 'true';
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [captains, total] = await Promise.all([
      Captain.find(filter).select('-password -__v').sort(sortOptions).limit(limitNum).skip((pageNum - 1) * limitNum),
      Captain.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      captains
    });
  } catch (err) {
    console.error('Error fetching captains:', err);
    return res.status(500).json({ success: false, msg: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};

/**
 * Get single captain by id
 * GET /api/captains/:id
 */
exports.getCaptainById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !isValidObjectId(id)) return res.status(400).json({ success: false, msg: 'Valid captain ID is required' });

    const captain = await Captain.findById(id).select('-password -__v');
    if (!captain) return res.status(404).json({ success: false, msg: 'Captain not found' });

    return res.status(200).json({ success: true, captain });
  } catch (err) {
    console.error('Error fetching captain:', err);
    return res.status(500).json({ success: false, msg: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};

/**
 * Update captain profile
 * PUT /api/captains/:id
 */
exports.updateCaptain = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};

    if (!id || !isValidObjectId(id)) return res.status(400).json({ success: false, msg: 'Valid captain ID is required' });

    // Allowed fields to update
    const allowedUpdates = ['name', 'phone', 'licenseNumber', 'address', 'isAvailable', 'profilePhoto'];
    const attempted = Object.keys(updates);
    const valid = attempted.every(k => allowedUpdates.includes(k));

    if (!valid) return res.status(400).json({ success: false, msg: 'Invalid updates attempted' });

    // If licenseNumber is changed, ensure uniqueness
    if (updates.licenseNumber) {
      const existing = await Captain.findOne({ licenseNumber: updates.licenseNumber, _id: { $ne: id } });
      if (existing) return res.status(409).json({ success: false, msg: 'Another captain already has this license number' });
    }

    const updatedCaptain = await Captain.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select('-password -__v');
    if (!updatedCaptain) return res.status(404).json({ success: false, msg: 'Captain not found' });

    return res.status(200).json({ success: true, msg: 'Captain updated successfully', captain: updatedCaptain });
  } catch (err) {
    console.error('Error updating captain:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, msg: 'Validation error', error: err.message });
    }
    return res.status(500).json({ success: false, msg: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};

/**
 * Delete captain
 * DELETE /api/captains/:id
 * If you prefer soft delete, change to update { isActive: false } instead.
 */
exports.deleteCaptain = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !isValidObjectId(id)) return res.status(400).json({ success: false, msg: 'Valid captain ID is required' });

    const deleted = await Captain.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, msg: 'Captain not found' });

    // Optionally unassign buses
    await Bus.updateMany({ assignedCaptain: id }, { $unset: { assignedCaptain: '' } });

    return res.status(200).json({ success: true, msg: 'Captain deleted successfully' });
  } catch (err) {
    console.error('Error deleting captain:', err);
    return res.status(500).json({ success: false, msg: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};

/**
 * Get captain availability
 * GET /api/captains/:id/availability
 */
exports.getCaptainAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !isValidObjectId(id)) return res.status(400).json({ success: false, msg: 'Valid captain ID is required' });

    const captain = await Captain.findById(id).select('isAvailable name');
    if (!captain) return res.status(404).json({ success: false, msg: 'Captain not found' });

    return res.status(200).json({ success: true, captainId: captain._id, name: captain.name, isAvailable: captain.isAvailable });
  } catch (err) {
    console.error('Error fetching captain availability:', err);
    return res.status(500).json({ success: false, msg: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};

/**
 * Update captain availability
 * PATCH /api/captains/:id/availability
 */
exports.updateCaptainAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;

    if (!id || !isValidObjectId(id)) return res.status(400).json({ success: false, msg: 'Valid captain ID is required' });
    if (typeof isAvailable !== 'boolean') return res.status(400).json({ success: false, msg: 'isAvailable must be boolean' });

    const updated = await Captain.findByIdAndUpdate(id, { isAvailable }, { new: true }).select('isAvailable name');
    if (!updated) return res.status(404).json({ success: false, msg: 'Captain not found' });

    return res.status(200).json({ success: true, msg: 'Captain availability updated', captainId: updated._id, name: updated.name, isAvailable: updated.isAvailable });
  } catch (err) {
    console.error('Error updating captain availability:', err);
    return res.status(500).json({ success: false, msg: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};

/**
 * Get captain statistics
 * GET /api/captains/stats
 */
exports.getCaptainStats = async (req, res, next) => {
  try {
    const totalCaptains = await Captain.countDocuments();
    const availableCaptains = await Captain.countDocuments({ isAvailable: true });
    const unavailableCaptains = totalCaptains - availableCaptains;

    const availabilityRate = totalCaptains > 0 ? Math.round((availableCaptains / totalCaptains) * 100) : 0;

    return res.status(200).json({ success: true, totalCaptains, availableCaptains, unavailableCaptains, availabilityRate });
  } catch (err) {
    console.error('Error fetching captain stats:', err);
    return res.status(500).json({ success: false, msg: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};

/**
 * Assign bus to captain (transactional)
 * POST /api/captains/:id/assign
 * body: { busId }
 */
exports.assignBusToCaptain = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { busId } = req.body;

    if (!id || !isValidObjectId(id) || !busId || !isValidObjectId(busId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, msg: 'Valid captain ID and busId are required' });
    }

    const captain = await Captain.findById(id).session(session);
    if (!captain) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, msg: 'Captain not found' });
    }

    const bus = await Bus.findById(busId).session(session);
    if (!bus) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, msg: 'Bus not found' });
    }

    if (bus.assignedCaptain && String(bus.assignedCaptain) !== String(id)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, msg: 'Bus is already assigned to another captain' });
    }

    // Assign
    bus.assignedCaptain = id;
    await bus.save({ session });

    if (!Array.isArray(captain.assignedBuses)) captain.assignedBuses = [];
    if (!captain.assignedBuses.map(String).includes(String(busId))) {
      captain.assignedBuses.push(busId);
      await captain.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ success: true, msg: 'Bus assigned to captain successfully', captain: sanitizeCaptain(captain), bus: { id: bus._id, busNumber: bus.busNumber } });
  } catch (err) {
    try { await session.abortTransaction(); } catch (e) { /* ignore */ }
    session.endSession();
    console.error('Error assigning bus to captain:', err);
    return res.status(500).json({ success: false, msg: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};

/**
 * Remove bus(s) from captain (transactional)
 * DELETE /api/captains/:id/remove?busId=<optional>
 * If busId provided: remove that bus from captain.
 * If not provided: remove all assigned buses from captain.
 */
exports.removeBusFromCaptain = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { busId } = req.query; // optional

    if (!id || !isValidObjectId(id)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, msg: 'Valid captain ID is required' });
    }

    const captain = await Captain.findById(id).session(session);
    if (!captain) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, msg: 'Captain not found' });
    }

    if (busId) {
      if (!isValidObjectId(busId)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, msg: 'Invalid busId' });
      }
      const bus = await Bus.findById(busId).session(session);
      if (!bus) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ success: false, msg: 'Bus not found' });
      }
      if (String(bus.assignedCaptain) === String(id)) {
        bus.assignedCaptain = undefined;
        await bus.save({ session });
      }
      captain.assignedBuses = (captain.assignedBuses || []).filter(b => String(b) !== String(busId));
      await captain.save({ session });
    } else {
      // Remove all assignments referencing this captain
      await Bus.updateMany({ assignedCaptain: id }, { $unset: { assignedCaptain: '' } }, { session });
      captain.assignedBuses = [];
      await captain.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ success: true, msg: 'Bus assignment(s) removed from captain successfully', captain: sanitizeCaptain(captain) });
  } catch (err) {
    try { await session.abortTransaction(); } catch (e) { /* ignore */ }
    session.endSession();
    console.error('Error removing bus from captain:', err);
    return res.status(500).json({ success: false, msg: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};
