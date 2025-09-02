const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const captainSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Captain name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
      minlength: [2, "Name must be at least 2 characters long"]
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      match: [/^\+?[1-9]\d{1,14}$/, "Please provide a valid phone number with country code"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email address"]
    },
    licenseNumber: {
      type: String,
      required: [true, "License number is required"],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9\-]+$/, "License number can only contain letters, numbers, and hyphens"]
    },
    licenseType: {
      type: String,
      required: [true, "License type is required"],
      enum: {
        values: ["commercial", "private", "commercial_with_passenger"],
        message: "License type must be commercial, private, or commercial_with_passenger"
      }
    },
    licenseExpiry: {
      type: Date,
      required: [true, "License expiry date is required"],
      validate: {
        validator: function(date) {
          return date > new Date();
        },
        message: "License must not be expired"
      }
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
      minlength: [8, "Password must be at least 8 characters long"],
      validate: {
        validator: function(password) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password);
        },
        message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      }
    },
    address: {
      street: {
        type: String,
        trim: true,
        maxlength: [200, "Street address cannot exceed 200 characters"]
      },
      city: {
        type: String,
        trim: true,
        required: [true, "City is required"]
      },
      state: {
        type: String,
        trim: true,
        required: [true, "State is required"]
      },
      zipCode: {
        type: String,
        trim: true,
        match: [/^\d{5,10}(?:[-\s]\d{4})?$/, "Please provide a valid zip code"]
      },
      country: {
        type: String,
        trim: true,
        required: [true, "Country is required"],
        default: "India" // ✅ Changed from USA to India
      }
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
      validate: {
        validator: function(dob) {
          const age = Math.floor((new Date() - dob) / (365.25 * 24 * 60 * 60 * 1000));
          return age >= 21 && age <= 70;
        },
        message: "Captain must be between 21 and 70 years old"
      }
    },
    busAssigned: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bus",
      default: null,
      validate: {
        validator: async function(busId) {
          if (!busId) return true; // null is allowed
          const bus = await mongoose.model("Bus").findById(busId);
          return bus && bus.isActive;
        },
        message: "Assigned bus must be active"
      }
    },
    experience: {
      type: Number,
      min: [0, "Experience cannot be negative"],
      max: [50, "Experience cannot exceed 50 years"],
      default: 0
    },
    rating: {
      average: {
        type: Number,
        min: [0, "Rating cannot be less than 0"],
        max: [5, "Rating cannot exceed 5"],
        default: 0
      },
      totalReviews: {
        type: Number,
        min: 0,
        default: 0
      }
    },
    isApproved: {
      type: Boolean,
      default: false,
      index: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: {
        values: ["available", "unavailable", "on_break", "on_trip"],
        message: "Status must be available, unavailable, on_break, or on_trip"
      },
      default: "unavailable",
      index: true
    },
    lastLocation: {
      latitude: {
        type: Number,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    },
    emergencyContact: {
      name: {
        type: String,
        trim: true
      },
      phone: {
        type: String,
        trim: true,
        match: [/^\+?[1-9]\d{1,14}$/, "Please provide a valid phone number"]
      },
      relationship: {
        type: String,
        trim: true
      }
    },
    documents: [{
      type: {
        type: String,
        enum: ["license", "insurance", "medical_certificate", "background_check"],
        required: true
      },
      url: {
        type: String,
        required: true
      },
      expiryDate: Date,
      verified: {
        type: Boolean,
        default: false
      },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      verifiedAt: Date
    }],
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    lastLogin: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for captain's age
captainSchema.virtual("age").get(function() {
  return Math.floor((new Date() - this.dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000));
});

// ✅ FIXED: Virtual for license status - proper implementation
captainSchema.virtual("licenseStatus").get(function() {
  if (!this.licenseExpiry) return "unknown";
  return this.licenseExpiry > new Date() ? "valid" : "expired";
});

// Virtual for total trips (would need to be populated from Trip model)
captainSchema.virtual("totalTrips", {
  ref: "Trip",
  localField: "_id",
  foreignField: "captain",
  count: true
});

// Indexes for better query performance
captainSchema.index({ email: 1 });
captainSchema.index({ phone: 1 });
captainSchema.index({ licenseNumber: 1 });
captainSchema.index({ status: 1, isActive: 1 });
captainSchema.index({ "address.city": 1 });
captainSchema.index({ rating: -1 });

// Pre-save middleware to hash password
captainSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update approval timestamp
captainSchema.pre("save", function(next) {
  if (this.isModified("isApproved") && this.isApproved && !this.approvedAt) {
    this.approvedAt = new Date();
  }
  next();
});

// Instance method to check password
captainSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to update status
captainSchema.methods.updateStatus = function(newStatus) {
  if (!["available", "unavailable", "on_break", "on_trip"].includes(newStatus)) {
    throw new Error("Invalid status");
  }
  
  this.status = newStatus;
  return this.save();
};

// Instance method to update location
captainSchema.methods.updateLocation = function(latitude, longitude) {
  this.lastLocation = {
    latitude,
    longitude,
    timestamp: new Date()
  };
  return this.save();
};

// Instance method to calculate overall rating
captainSchema.methods.calculateRating = async function(newRating) {
  const totalScore = this.rating.average * this.rating.totalReviews + newRating;
  this.rating.totalReviews += 1;
  this.rating.average = totalScore / this.rating.totalReviews;
  return this.save();
};

// ✅ FIXED: Static method to find available captains - removed virtual field reference
captainSchema.statics.findAvailable = function() {
  return this.find({
    isActive: true,
    isApproved: true,
    status: "available",
    licenseExpiry: { $gt: new Date() } // ✅ Use actual field instead of virtual
  });
};

// ✅ FIXED: Static method to find captains by location (proximity)
captainSchema.statics.findByLocation = function(latitude, longitude, maxDistance = 50) {
  return this.find({
    isActive: true,
    isApproved: true,
    status: "available",
    licenseExpiry: { $gt: new Date() }, // ✅ Use actual field
    "lastLocation.latitude": {
      $gte: latitude - 0.5,
      $lte: latitude + 0.5
    },
    "lastLocation.longitude": {
      $gte: longitude - 0.5,
      $lte: longitude + 0.5
    }
  });
};

// Query helper to filter by experience
captainSchema.query.byExperience = function(minYears, maxYears) {
  return this.find({
    experience: {
      $gte: minYears || 0,
      $lte: maxYears || 50
    }
  });
};

// Query helper to filter by rating
captainSchema.query.byRating = function(minRating) {
  return this.find({
    "rating.average": { $gte: minRating }
  });
};

module.exports = mongoose.model("Captain", captainSchema);