// backend/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    phone: {
      type: String,
      unique: true,
      sparse: true, // allows some users without phone
      match: [/^\d{10}$/, "Phone must be 10 digits"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // never return by default
      match: [
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        "Password must contain uppercase, lowercase, number, and special character",
      ],
    },
   
    referral: {
      code: { type: String, unique: true, sparse: true },
      usedCode: { type: String },
    },
    wallet: {
      balance: { type: Number, default: 0, min: 0 },
    },
    role: {
      type: String,
      enum: ["user", "admin", "captain"],
      default: "user",
    },
    isActive: { type: Boolean, default: true },
    loginHistory: [
      {
        ip: String,
        userAgent: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
  },
  { timestamps: true }
);

/**
 * 🔐 Password hash middleware
 */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * 🎁 Generate referral code if not already set
 */
userSchema.pre("save", function (next) {
  if (!this.referral.code) {
    this.referral.code = crypto.randomBytes(4).toString("hex").toUpperCase();
  }
  next();
});

/**
 * 🔄 Compare password & handle account lock
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (this.isLocked()) {
    throw new Error("Account is temporarily locked due to too many failed attempts");
  }

  const isMatch = await bcrypt.compare(candidatePassword, this.password);

  if (!isMatch) {
    this.loginAttempts += 1;

    if (this.loginAttempts >= 5) {
      this.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // lock for 15 minutes
    }

    await this.save({ validateBeforeSave: false });
    return false;
  }

  // successful login
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  await this.save({ validateBeforeSave: false });
  return true;
};

/**
 * 💰 Update wallet balance
 */
userSchema.methods.updateWallet = async function (amount) {
  this.wallet.balance += amount;
  if (this.wallet.balance < 0) this.wallet.balance = 0; // prevent negative
  await this.save({ validateBeforeSave: false });
  return this.wallet.balance;
};

/**
 * 📜 Add login history entry
 */
userSchema.methods.addLoginHistory = async function (ip, userAgent) {
  this.loginHistory.push({ ip, userAgent });
  // Keep only last 10 entries
  if (this.loginHistory.length > 10) this.loginHistory.shift();
  await this.save({ validateBeforeSave: false });
};

/**
 * 🚫 Check if user account is locked
 */
userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

/**
 * 🔄 Reset login attempts
 */
userSchema.methods.resetLoginAttempts = async function () {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  await this.save({ validateBeforeSave: false });
};

const User = mongoose.model("User", userSchema);
module.exports = User;
