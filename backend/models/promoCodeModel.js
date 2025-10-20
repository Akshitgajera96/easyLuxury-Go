// FILE: backend/models/promoCodeModel.js
/**
 * Promo code model for MongoDB
 * Defines promo code schema for discounts and promotions
 */

const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Promo code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: [true, 'Discount type is required']
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0, 'Discount value cannot be negative']
  },
  maxDiscount: {
    type: Number,
    min: [0, 'Max discount cannot be negative']
  },
  minBookingAmount: {
    type: Number,
    min: [0, 'Minimum booking amount cannot be negative'],
    default: 0
  },
  validFrom: {
    type: Date,
    required: [true, 'Valid from date is required']
  },
  validUntil: {
    type: Date,
    required: [true, 'Valid until date is required']
  },
  maxUsage: {
    type: Number,
    min: [1, 'Max usage must be at least 1'],
    default: 1000
  },
  usedCount: {
    type: Number,
    default: 0,
    min: [0, 'Used count cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applicableRoutes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  }],
  userRestrictions: {
    firstTimeUser: {
      type: Boolean,
      default: false
    },
    minTripsCompleted: {
      type: Number,
      default: 0,
      min: 0
    },
    specificUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }
}, {
  timestamps: true
});

// Indexes for promo code queries
promoCodeSchema.index({ code: 1 });
promoCodeSchema.index({ validFrom: 1, validUntil: 1 });
promoCodeSchema.index({ isActive: 1 });
promoCodeSchema.index({ discountType: 1 });

// Virtual for remaining usage
promoCodeSchema.virtual('remainingUsage').get(function() {
  return Math.max(0, this.maxUsage - this.usedCount);
});

// Virtual for isExpired
promoCodeSchema.virtual('isExpired').get(function() {
  const now = new Date();
  return now < this.validFrom || now > this.validUntil;
});

// Virtual for isAvailable
promoCodeSchema.virtual('isAvailable').get(function() {
  return this.isActive && 
         !this.isExpired && 
         this.remainingUsage > 0;
});

// Method to validate promo code
promoCodeSchema.methods.validatePromoCode = function(bookingAmount, user, routeId) {
  const now = new Date();
  
  // Check basic validity
  if (!this.isAvailable) {
    return { isValid: false, message: 'Promo code is not available' };
  }

  // Check date validity
  if (now < this.validFrom || now > this.validUntil) {
    return { isValid: false, message: 'Promo code is expired' };
  }

  // Check usage limit
  if (this.usedCount >= this.maxUsage) {
    return { isValid: false, message: 'Promo code usage limit reached' };
  }

  // Check minimum booking amount
  if (bookingAmount < this.minBookingAmount) {
    return { 
      isValid: false, 
      message: `Minimum booking amount of ₹${this.minBookingAmount} required` 
    };
  }

  // Check route applicability
  if (this.applicableRoutes.length > 0 && routeId) {
    const isRouteApplicable = this.applicableRoutes.some(route => 
      route.toString() === routeId.toString()
    );
    if (!isRouteApplicable) {
      return { isValid: false, message: 'Promo code not applicable for this route' };
    }
  }

  // Check user restrictions
  if (this.userRestrictions.firstTimeUser && user.tripsCompleted > 0) {
    return { isValid: false, message: 'Promo code only for first-time users' };
  }

  if (this.userRestrictions.minTripsCompleted > 0 && 
      user.tripsCompleted < this.userRestrictions.minTripsCompleted) {
    return { 
      isValid: false, 
      message: `Minimum ${this.userRestrictions.minTripsCompleted} completed trips required` 
    };
  }

  if (this.userRestrictions.specificUsers.length > 0) {
    const isUserAllowed = this.userRestrictions.specificUsers.some(userId => 
      userId.toString() === user._id.toString()
    );
    if (!isUserAllowed) {
      return { isValid: false, message: 'Promo code not applicable for this user' };
    }
  }

  return { isValid: true, message: 'Promo code is valid' };
};

// Method to calculate discount amount
promoCodeSchema.methods.calculateDiscount = function(bookingAmount) {
  let discountAmount = 0;

  if (this.discountType === 'percentage') {
    discountAmount = (bookingAmount * this.discountValue) / 100;
  } else {
    discountAmount = this.discountValue;
  }

  // Apply max discount limit
  if (this.maxDiscount && discountAmount > this.maxDiscount) {
    discountAmount = this.maxDiscount;
  }

  // Ensure discount doesn't exceed booking amount
  discountAmount = Math.min(discountAmount, bookingAmount);

  return Math.round(discountAmount);
};

// Method to apply promo code
promoCodeSchema.methods.applyPromoCode = function(bookingAmount, user, routeId) {
  const validation = this.validatePromoCode(bookingAmount, user, routeId);
  
  if (!validation.isValid) {
    throw new Error(validation.message);
  }

  const discountAmount = this.calculateDiscount(bookingAmount);
  
  // Increment usage count
  this.usedCount += 1;
  
  return {
    discountAmount,
    finalAmount: bookingAmount - discountAmount,
    promoCode: this.code
  };
};

// Static method to find valid promo codes
promoCodeSchema.statics.findValidPromoCodes = function() {
  const now = new Date();
  
  return this.find({
    isActive: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now },
    $expr: { $lt: ['$usedCount', '$maxUsage'] }
  });
};

module.exports = mongoose.model('PromoCode', promoCodeSchema);