// FILE: backend/models/rentalInquiryModel.js
/**
 * Rental inquiry model for MongoDB
 * Defines schema for bus rental/charter inquiries
 */

const mongoose = require('mongoose');

const rentalInquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  tripType: {
    type: String,
    enum: ['one-way', 'round-trip', 'multi-city', 'hourly'],
    required: [true, 'Trip type is required']
  },
  fromCity: {
    type: String,
    required: [true, 'From city is required'],
    trim: true
  },
  toCity: {
    type: String,
    required: [true, 'To city is required'],
    trim: true
  },
  departureDate: {
    type: Date,
    required: [true, 'Departure date is required']
  },
  returnDate: {
    type: Date
  },
  passengers: {
    type: Number,
    required: [true, 'Number of passengers is required'],
    min: [1, 'At least 1 passenger is required'],
    max: [100, 'Cannot exceed 100 passengers']
  },
  busType: {
    type: String,
    enum: ['sleeper', 'semi_sleeper', 'seater', 'luxury', 'mini'],
    required: [true, 'Bus type is required']
  },
  amenities: [{
    type: String,
    enum: ['ac', 'wifi', 'charging_point', 'blanket', 'water_bottle', 'snacks', 'entertainment']
  }],
  budget: {
    type: Number,
    min: [0, 'Budget cannot be negative']
  },
  specialRequirements: {
    type: String,
    trim: true,
    maxlength: [500, 'Special requirements cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'quoted', 'confirmed', 'cancelled'],
    default: 'new'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  quoteAmount: {
    type: Number,
    min: [0, 'Quote amount cannot be negative']
  },
  followUpDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for rental inquiry queries
rentalInquirySchema.index({ email: 1 });
rentalInquirySchema.index({ status: 1 });
rentalInquirySchema.index({ departureDate: 1 });
rentalInquirySchema.index({ fromCity: 1, toCity: 1 });
rentalInquirySchema.index({ createdAt: -1 });

// Virtual for trip duration in days
rentalInquirySchema.virtual('tripDuration').get(function() {
  if (this.tripType === 'one-way' || !this.returnDate) {
    return 1;
  }
  
  const duration = Math.ceil((this.returnDate - this.departureDate) / (1000 * 60 * 60 * 24));
  return Math.max(1, duration);
});

// Virtual for formatted trip route
rentalInquirySchema.virtual('formattedRoute').get(function() {
  return `${this.fromCity} to ${this.toCity}`;
});

// Method to update status
rentalInquirySchema.methods.updateStatus = function(status, notes = '') {
  this.status = status;
  if (notes) {
    this.notes = notes;
  }
  return this.save();
};

// Method to assign to staff
rentalInquirySchema.methods.assignToStaff = function(staffId) {
  this.assignedTo = staffId;
  return this.save();
};

// Method to set quote
rentalInquirySchema.methods.setQuote = function(amount, notes = '') {
  this.quoteAmount = amount;
  this.status = 'quoted';
  if (notes) {
    this.notes = notes;
  }
  return this.save();
};

// Static method to find inquiries by status
rentalInquirySchema.statics.findByStatus = function(status, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  return this.find({ status })
    .populate('assignedTo')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to find upcoming inquiries
rentalInquirySchema.statics.findUpcomingInquiries = function(days = 7) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);
  
  return this.find({
    departureDate: {
      $gte: startDate,
      $lte: endDate
    },
    status: { $in: ['new', 'contacted', 'quoted', 'confirmed'] }
  }).populate('assignedTo');
};

// Pre-save validation for return date
rentalInquirySchema.pre('save', function(next) {
  if (this.tripType === 'round-trip' && !this.returnDate) {
    return next(new Error('Return date is required for round trips'));
  }
  
  if (this.returnDate && this.returnDate <= this.departureDate) {
    return next(new Error('Return date must be after departure date'));
  }
  
  next();
});

module.exports = mongoose.model('RentalInquiry', rentalInquirySchema);