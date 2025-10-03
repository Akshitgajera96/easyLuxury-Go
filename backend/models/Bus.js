// backend/models/Bus.js
const mongoose = require("mongoose");

// ---------------- SUB SCHEMAS ---------------- //
const seatSchema = new mongoose.Schema({
  number: { type: Number, required: true, min: 1 },
  isBooked: { type: Boolean, default: false },
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  bookingType: { type: String, enum: ["online", "offline"], default: null },
  bookedAt: { type: Date, default: null },
  seatType: { type: String, enum: ["standard", "premium", "sleeper"], default: "standard" },
  priceMultiplier: { type: Number, default: 1.0, min: 0.5, max: 2.0 },
});

const routeStopSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  time: {
    type: String,
    required: true,
    match: [
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      "Invalid time format. Use HH:mm (24h)",
    ],
  },
  order: { type: Number, required: true, min: 1 },
  distanceFromStart: { type: Number, min: 0, default: 0 },
});

const amenitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  available: { type: Boolean, default: true },
  icon: {
    type: String,
    default: "",
    validate: {
      validator: (url) => !url || /^https?:\/\/[^\s$.?#].[^\s]*$/.test(url),
      message: "Invalid icon URL",
    },
  },
});

// ---------------- MAIN SCHEMA ---------------- //
const busSchema = new mongoose.Schema(
  {
    busNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      match: /^[A-Z0-9\-]+$/,
    },
    busName: { type: String, required: true, trim: true, maxlength: 100 },
    operator: { type: String, required: true, trim: true },
    totalSeats: { type: Number, required: true, min: 1, max: 100 },
    availableSeats: { type: Number, required: true, min: 0 },
    seats: { type: [seatSchema], default: [] },

    route: {
      from: { type: String, required: true, trim: true },
      to: { type: String, required: true, trim: true },
      stops: { type: [routeStopSchema], default: [] },
      distance: { type: Number, required: true, min: 1 },
      duration: { type: Number, required: true, min: 1 }, // minutes
      type: {
        type: String,
        enum: ["intercity", "intracity", "express", "luxury"],
        default: "intercity",
      },
    },

    schedule: {
      departure: { type: Date, required: true, index: true },
      arrival: {
        type: Date,
        required: true,
        validate: {
          validator: function (val) {
            return !this.schedule?.departure || val > this.schedule.departure;
          },
          message: "Arrival must be after departure",
        },
      },
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "one-time"],
        default: "daily",
      },
    },

    basePrice: {
      type: Number,
      required: true,
      min: 0,
      set: (v) => Math.round(v * 100) / 100,
    },

    amenities: { type: [amenitySchema], default: [] },
    photos: [
      {
        type: String,
        validate: {
          validator: (url) => /^https?:\/\/[^\s$.?#].[^\s]*$/.test(url),
          message: "Invalid photo URL",
        },
      },
    ],

    features: {
      ac: { type: Boolean, default: false },
      wifi: { type: Boolean, default: false },
      chargingPoints: { type: Boolean, default: false },
      entertainment: { type: Boolean, default: false },
      toilet: { type: Boolean, default: false },
    },

    status: {
      type: String,
      enum: ["active", "maintenance", "out_of_service", "scheduled"],
      default: "active",
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },

    captain: { type: mongoose.Schema.Types.ObjectId, ref: "Captain", default: null },
    statusReason: { type: String, maxlength: 500, default: "" },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// ---------------- VIRTUALS ---------------- //
busSchema.virtual("formattedDuration").get(function () {
  if (!this.route?.duration) return null;
  const hours = Math.floor(this.route.duration / 60);
  const minutes = this.route.duration % 60;
  return `${hours}h ${minutes}m`;
});

busSchema.virtual("formattedDistance").get(function () {
  return this.route?.distance ? `${this.route.distance} km` : null;
});

busSchema.virtual("departureDate").get(function () {
  return this.schedule?.departure
    ? this.schedule.departure.toISOString().split("T")[0]
    : null;
});

busSchema.virtual("occupancyPercentage").get(function () {
  if (!this.totalSeats) return 0;
  return Math.round(
    ((this.totalSeats - this.availableSeats) / this.totalSeats) * 100
  );
});

// ---------------- MIDDLEWARE ---------------- //
busSchema.pre("save", function (next) {
  const bookedSeats = this.seats.filter((seat) => seat.isBooked).length;
  this.availableSeats = this.totalSeats - bookedSeats;

  if (this.availableSeats < 0) {
    return next(new Error("Available seats cannot be negative"));
  }
  next();
});

// ---------------- STATIC METHODS ---------------- //
busSchema.statics.findByRouteAndDate = function (from, to, date) {
  const startDate = new Date(date);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);

  return this.find({
    "route.from": new RegExp(from, "i"),
    "route.to": new RegExp(to, "i"),
    "schedule.departure": { $gte: startDate, $lt: endDate },
    isActive: true,
    status: "active",
  });
};

busSchema.statics.getAvailableSeats = async function (busId) {
  const bus = await this.findById(busId);
  return bus ? bus.seats.filter((s) => !s.isBooked).map((s) => s.number) : [];
};

// ---------------- INSTANCE METHODS ---------------- //
busSchema.methods.bookSeat = async function (
  seatNumber,
  userId,
  bookingType = "online"
) {
  const seat = this.seats.find((s) => s.number === seatNumber);
  if (!seat) throw new Error(`Seat ${seatNumber} not found`);
  if (seat.isBooked) throw new Error(`Seat ${seatNumber} is already booked`);

  seat.isBooked = true;
  seat.bookedBy = userId;
  seat.bookingType = bookingType;
  seat.bookedAt = new Date();
  this.availableSeats--;

  await this.save();
  return seat;
};

busSchema.methods.releaseSeat = async function (seatNumber) {
  const seat = this.seats.find((s) => s.number === seatNumber);
  if (!seat) throw new Error(`Seat ${seatNumber} not found`);
  if (!seat.isBooked) throw new Error(`Seat ${seatNumber} is not booked`);

  seat.isBooked = false;
  seat.bookedBy = null;
  seat.bookingType = null;
  seat.bookedAt = null;
  this.availableSeats++;

  await this.save();
  return seat;
};

busSchema.methods.getSeatPrice = function (seatNumber) {
  const seat = this.seats.find((s) => s.number === seatNumber);
  if (!seat) throw new Error(`Seat ${seatNumber} not found`);
  return Math.round(this.basePrice * seat.priceMultiplier * 100) / 100;
};

module.exports = mongoose.model("Bus", busSchema);
