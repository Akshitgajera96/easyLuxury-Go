// FILE: backend/models/staffModel.js
/**
 * Staff model for MongoDB
 * Defines staff schema for bus crew and administrative staff
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../constants/roles');

const staffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  role: {
    type: String,
    enum: [ROLES.STAFF, ROLES.ADMIN],
    default: ROLES.STAFF
  },
  designation: {
    type: String,
    required: [true, 'Designation is required'],
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  dateOfJoining: {
    type: Date,
    required: [true, 'Date of joining is required']
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  documents: {
    aadhaarNumber: String,
    panNumber: String,
    licenseNumber: String,
    licenseExpiry: Date
  },
  assignedBus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Status-based approval system
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
    required: true
  },
  // Legacy field - kept for backward compatibility
  approved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: String,
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectedBy: {
    type: String,
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  statusHistory: [{
    status: String,
    changedBy: String,
    changedAt: Date,
    reason: String
  }],
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for staff queries
staffSchema.index({ email: 1 });
staffSchema.index({ employeeId: 1 });
staffSchema.index({ role: 1 });
staffSchema.index({ department: 1 });
staffSchema.index({ isActive: 1 });

// Hash password before saving
staffSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
staffSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if staff is driver
staffSchema.methods.isDriver = function() {
  return this.designation.toLowerCase().includes('driver');
};

// Method to check if staff is conductor
staffSchema.methods.isConductor = function() {
  return this.designation.toLowerCase().includes('conductor');
};

// Method to update last login
staffSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Static method to find active staff by department
staffSchema.statics.findByDepartment = function(department, isActive = true) {
  return this.find({ 
    department: new RegExp(department, 'i'),
    isActive 
  });
};

// Static method to find available drivers
staffSchema.statics.findAvailableDrivers = function() {
  return this.find({
    designation: { $regex: 'driver', $options: 'i' },
    isActive: true
  });
};

// Static method to find staff by role
staffSchema.statics.findByRole = function(role, isActive = true) {
  return this.find({ 
    role,
    isActive 
  });
};

// Method to check if account is locked
staffSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Method to increment login attempts
staffSchema.methods.incLoginAttempts = function() {
  // If previous lock has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  // Otherwise increment attempts
  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
  
  // Lock account if max attempts reached
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 3600000 }; // Lock for 1 hour
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
staffSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

// Method to approve staff
staffSchema.methods.approve = function(adminEmail, reason = null) {
  this.status = 'approved';
  this.approved = true; // Legacy field
  this.approvedBy = adminEmail;
  this.approvedAt = new Date();
  this.statusHistory.push({
    status: 'approved',
    changedBy: adminEmail,
    changedAt: new Date(),
    reason: reason || 'Approved by admin'
  });
  return this.save();
};

// Method to reject staff
staffSchema.methods.reject = function(adminEmail, reason = 'Rejected by admin') {
  this.status = 'rejected';
  this.approved = false; // Legacy field
  this.rejectedBy = adminEmail;
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  this.statusHistory.push({
    status: 'rejected',
    changedBy: adminEmail,
    changedAt: new Date(),
    reason
  });
  return this.save();
};

// Method to cancel staff registration
staffSchema.methods.cancel = function(adminEmail, reason = 'Cancelled by admin') {
  this.status = 'cancelled';
  this.approved = false; // Legacy field
  this.statusHistory.push({
    status: 'cancelled',
    changedBy: adminEmail,
    changedAt: new Date(),
    reason
  });
  return this.save();
};

// Static method to find pending staff
staffSchema.statics.findPending = function() {
  return this.find({ status: 'pending' }).sort({ createdAt: -1 });
};

// Static method to count pending staff
staffSchema.statics.countPending = function() {
  return this.countDocuments({ status: 'pending' });
};

// Check if staff can login
staffSchema.methods.canLogin = function() {
  return this.status === 'approved' && this.isActive && !this.isLocked();
};

module.exports = mongoose.model('Staff', staffSchema);