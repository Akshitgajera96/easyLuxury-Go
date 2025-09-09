// models/Captain.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const Bus = require("./Bus"); // ✅ safer than mongoose.model("Bus")

const documentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["LICENSE", "ID_PROOF", "ADDRESS_PROOF", "OTHER"]
    },
    url: {
      type: String,
      required: true,
      match: [/^https?:\/\/.+\..+$/, "Please provide a valid document URL"]
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    verified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { _id: false }
);

const captainSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      minlength: [3, "Name must be at least 3 characters long"],
      maxlength: [100, "Name cannot exceed 100 characters"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email"]
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      validate: {
        validator: (v) => /^\+?[1-9]\d{1,14}$/.test(v),
        message: "Please provide a valid phone number"
      }
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false,
      validate: {
        validator: (v) =>
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/.test(
            v
          ),
        message:
          "Password must contain uppercase, lowercase, number and special character"
      }
    },
    licenseNumber: {
      type: String,
      required: [true, "License number is required"],
      unique: true,
      uppercase: true,
      trim: true
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
      validate: {
        validator: function (value) {
          const today = new Date();
          const age = today.getFullYear() - value.getFullYear();
          return age >= 21;
        },
        message: "Captain must be at least 21 years old"
      }
    },
    profilePhoto: {
      type: String,
      match: [/^https?:\/\/.+\..+$/, "Please provide a valid photo URL"]
    },
    address: {
      street: String,
      city: { type: String, required: true },
      state: String,
      country: { type: String, required: true },
      postalCode: {
        type: String,
        validate: {
          validator: (v) => /^\d{5,6}$/.test(v),
          message: "Please provide a valid postal code"
        }
      }
    },
    busAssigned: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bus",
      validate: {
        validator: async function (busId) {
          if (!busId) return true;
          const bus = await Bus.findById(busId);
          return !!bus;
        },
        message: "Assigned bus does not exist"
      }
    },
    documents: [documentSchema],
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      totalRatings: { type: Number, default: 0 }
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"],
      default: "PENDING"
    },
    availability: {
      type: String,
      enum: ["AVAILABLE", "ON_TRIP", "OFFLINE"],
      default: "OFFLINE"
    },
    experience: {
      years: { type: Number, default: 0, min: 0 },
      certifications: [String]
    },
    salary: {
      amount: { type: Number, min: 0 },
      currency: { type: String, default: "INR" }
    },
    emergencyContact: {
      name: { type: String },
      relation: { type: String },
      phone: {
        type: String,
        validate: {
          validator: (v) => !v || /^\+?[1-9]\d{1,14}$/.test(v),
          message: "Please provide a valid emergency contact number"
        }
      }
    },
    isActive: { type: Boolean, default: true },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    metadata: {
      lastLogin: Date,
      lastTrip: Date,
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    }
  },
  { timestamps: true }
);

// ✅ Password hashing
captainSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ✅ Password comparison
captainSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ✅ Virtuals
captainSchema.virtual("age").get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  let age = today.getFullYear() - this.dateOfBirth.getFullYear();
  const m = today.getMonth() - this.dateOfBirth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < this.dateOfBirth.getDate())) {
    age--;
  }
  return age;
});

captainSchema.virtual("licenseStatus").get(function () {
  if (!this.licenseNumber) return "UNKNOWN";
  return this.status === "APPROVED" ? "VALID" : "PENDING_VERIFICATION";
});

captainSchema.virtual("totalTrips", {
  ref: "Booking",
  localField: "_id",
  foreignField: "captain",
  count: true
});

// ✅ Indexes
captainSchema.index({ status: 1, isActive: 1 });
captainSchema.index({ "address.city": 1 });
captainSchema.index({ "rating.average": -1 });

const Captain = mongoose.model("Captain", captainSchema);
module.exports = Captain;
