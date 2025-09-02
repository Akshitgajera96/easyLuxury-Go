const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
      minlength: [2, "Name must be at least 2 characters long"],
      match: [/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email address"],
      index: true
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      match: [/^\+?[1-9]\d{1,14}$/, "Please provide a valid phone number with country code"],
      index: true
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
    walletBalance: {
      type: Number,
      default: 0,
      min: [0, "Wallet balance cannot be negative"],
      set: val => Math.round(val * 100) / 100 // Store with 2 decimal precision
    },
    role: {
      type: String,
      enum: {
        values: ["user", "admin", "captain"],
        message: "Role must be either user, admin, or captain"
      },
      default: "user",
      index: true
    },
    profile: {
      dateOfBirth: {
        type: Date,
        validate: {
          validator: function(dob) {
            const age = Math.floor((new Date() - dob) / (365.25 * 24 * 60 * 60 * 1000));
            return age >= 13 && age <= 120;
          },
          message: "User must be between 13 and 120 years old"
        }
      },
      gender: {
        type: String,
        enum: ["male", "female", "other", "prefer_not_to_say"]
      },
      profilePhoto: {
        type: String,
        validate: {
          validator: function(url) {
            return !url || /^https?:\/\/.+\..+$/.test(url);
          },
          message: "Please provide a valid URL for profile photo"
        }
      },
      bio: {
        type: String,
        maxlength: [500, "Bio cannot exceed 500 characters"],
        trim: true
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
        trim: true
      },
      state: {
        type: String,
        trim: true
      },
      zipCode: {
        type: String,
        trim: true,
        match: [/^\d{5,10}(?:[-\s]\d{4})?$/, "Please provide a valid zip code"]
      },
      country: {
        type: String,
        trim: true,
        default: "USA"
      }
    },
    preferences: {
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
        push: { type: Boolean, default: true }
      },
      language: {
        type: String,
        default: "en",
        enum: ["en", "es", "fr", "de", "hi"]
      },
      currency: {
        type: String,
        default: "USD",
        uppercase: true
      },
      theme: {
        type: String,
        enum: ["light", "dark", "auto"],
        default: "auto"
      }
    },
    walletTransactions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "WalletTransaction"
    }],
    bookings: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking"
    }],
    tickets: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket"
    }],
    verification: {
      email: {
        verified: { type: Boolean, default: false },
        token: { type: String },
        expires: { type: Date }
      },
      phone: {
        verified: { type: Boolean, default: false },
        token: { type: String },
        expires: { type: Date }
      },
      identity: {
        verified: { type: Boolean, default: false },
        verifiedAt: { type: Date },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
      }
    },
    security: {
      twoFactorEnabled: { type: Boolean, default: false },
      twoFactorSecret: { type: String, select: false },
      lastPasswordChange: { type: Date, default: Date.now },
      loginAttempts: { type: Number, default: 0, select: false },
      lockUntil: { type: Date, select: false }
    },
    status: {
      type: String,
      enum: ["active", "suspended", "deactivated", "pending"],
      default: "active",
      index: true
    },
    lastLogin: {
      type: Date,
      default: null
    },
    loginHistory: [{
      ip: String,
      userAgent: String,
      timestamp: { type: Date, default: Date.now },
      success: Boolean
    }],
    referral: {
      code: {
        type: String,
        unique: true,
        uppercase: true,
        match: [/^[A-Z0-9]{8}$/, "Referral code must be 8 alphanumeric characters"]
      },
      referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      referrals: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        joinedAt: { type: Date, default: Date.now },
        bonusCredited: { type: Boolean, default: false }
      }],
      bonusEarned: { type: Number, default: 0, min: 0 }
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for user's age
userSchema.virtual("age").get(function() {
  if (!this.profile.dateOfBirth) return null;
  return Math.floor((new Date() - this.profile.dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000));
});

// Virtual for account status
userSchema.virtual("accountStatus").get(function() {
  if (this.security.loginAttempts >= 5 && this.security.lockUntil > new Date()) {
    return "locked";
  }
  return this.status;
});

// Virtual for isVerified
userSchema.virtual("isVerified").get(function() {
  return this.verification.email.verified && this.verification.phone.verified;
});

// Indexes for better query performance
userSchema.index({ role: 1, status: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    this.security.lastPasswordChange = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to generate referral code
userSchema.pre("save", function(next) {
  if (this.isNew && !this.referral.code) {
    this.referral.code = Math.random().toString(36).substr(2, 8).toUpperCase();
  }
  next();
});

// Pre-save middleware to handle login attempts
userSchema.pre("save", function(next) {
  if (this.isModified("security.loginAttempts") && this.security.loginAttempts < 5) {
    this.security.lockUntil = undefined;
  }
  next();
});

// Method to compare entered password with hashed password
userSchema.methods.comparePassword = async function(enteredPassword) {
  if (this.security.lockUntil && this.security.lockUntil > new Date()) {
    throw new Error("Account is temporarily locked due to too many failed login attempts");
  }

  const isMatch = await bcrypt.compare(enteredPassword, this.password);
  
  if (!isMatch) {
    this.security.loginAttempts += 1;
    if (this.security.loginAttempts >= 5) {
      this.security.lockUntil = Date.now() + 30 * 60 * 1000; // Lock for 30 minutes
    }
    await this.save();
    return false;
  }

  if (this.security.loginAttempts > 0) {
    this.security.loginAttempts = 0;
    this.security.lockUntil = undefined;
    await this.save();
  }

  return true;
};

// Method to update wallet balance
userSchema.methods.updateWallet = async function(amount, transactionId) {
  const newBalance = this.walletBalance + amount;
  
  if (newBalance < 0) {
    throw new Error("Insufficient wallet balance");
  }

  this.walletBalance = newBalance;
  
  if (transactionId) {
    this.walletTransactions.push(transactionId);
  }

  return this.save();
};

// Method to add login attempt to history
userSchema.methods.addLoginHistory = function(ip, userAgent, success) {
  this.loginHistory.unshift({
    ip,
    userAgent,
    success,
    timestamp: new Date()
  });

  // Keep only last 10 login attempts
  if (this.loginHistory.length > 10) {
    this.loginHistory = this.loginHistory.slice(0, 10);
  }

  return this.save();
};

// Method to check if account is locked
userSchema.methods.isLocked = function() {
  return this.security.lockUntil && this.security.lockUntil > new Date();
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  this.security.loginAttempts = 0;
  this.security.lockUntil = undefined;
  return this.save();
};

// Static method to find users by role
userSchema.statics.findByRole = function(role, page = 1, limit = 10) {
  return this.find({ role, isActive: true })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .select("-password -security.twoFactorSecret");
};

// Static method to find users by status
userSchema.statics.findByStatus = function(status, page = 1, limit = 10) {
  return this.find({ status, isActive: true })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .select("-password -security.twoFactorSecret");
};

// Query helper to filter by registration date
userSchema.query.byRegistrationDate = function(startDate, endDate) {
  return this.find({
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  });
};

// Query helper to filter by wallet balance
userSchema.query.byWalletBalance = function(minBalance, maxBalance) {
  return this.find({
    walletBalance: {
      $gte: minBalance || 0,
      $lte: maxBalance || Number.MAX_SAFE_INTEGER
    }
  });
};

module.exports = mongoose.model("User", userSchema);