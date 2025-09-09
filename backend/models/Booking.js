// backend/models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: [true, 'Bus reference is required'],
      index: true
    },

    /**
     * Seat numbers are stored as strings (to match many Bus seat schemas).
     * We accept numbers or strings from input and normalize to strings.
     */
    seatNumbers: {
      type: [String],
      required: [true, 'Seat numbers are required'],
      set: function (vals) {
        if (!Array.isArray(vals)) return vals;
        // normalize to strings and remove accidental whitespace
        return vals.map(v => String(v).trim());
      },
      validate: [
        {
          validator: function (val) {
            return Array.isArray(val) && val.length > 0;
          },
          message: 'At least one seat number must be provided'
        },
        {
          // ensure each seat looks numeric (allow like "1", "01", etc.)
          validator: function (val) {
            return val.every(s => /^(\d+)$/.test(String(s)));
          },
          message: 'Each seat number must be a positive integer'
        },
        {
          // no duplicate seat numbers allowed
          validator: function (val) {
            return new Set(val.map(String)).size === val.length;
          },
          message: 'Duplicate seat numbers are not allowed'
        }
      ]
    },

    // price is interpreted as per-seat price (number)
    price: {
      type: Number,
      required: [true, 'Price is required (per seat)'],
      min: [0, 'Price must be a non-negative number'],
      set: v => Math.round((Number(v) || 0) * 100) / 100 // two decimals
    },

    // totalAmount will be computed automatically (price * seats + tax)
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount must be non-negative'],
      set: v => Math.round((Number(v) || 0) * 100) / 100 // two decimals
    },

    taxAmount: {
      type: Number,
      default: 0,
      min: [0, 'Tax amount cannot be negative'],
      set: v => Math.round((Number(v) || 0) * 100) / 100
    },

    bookingType: {
      type: String,
      enum: ['online', 'offline'],
      default: 'online'
    },

    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'refunded', 'completed'],
      default: 'confirmed',
      index: true
    },

    date: {
      // date of journey (YYYY-MM-DD) - time is stored separately in departureTime
      type: Date,
      required: [true, 'Booking date is required'],
      index: true,
      validate: {
        validator: function (d) {
          // allow bookings for today or future only
          if (!d) return false;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const booked = new Date(d);
          booked.setHours(0, 0, 0, 0);
          return booked >= today;
        },
        message: 'Booking date must be today or in the future'
      }
    },

    /**
     * departureTime & arrivalTime are stored as "HH:MM" strings.
     * We validate the format but keep storage lightweight.
     */
    departureTime: {
      type: String,
      required: [true, 'Departure time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time format (HH:MM)']
    },

    arrivalTime: {
      type: String,
      required: [true, 'Arrival time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time format (HH:MM)']
    },

    paymentId: { type: String, default: null },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'wallet', 'cash', 'bank_transfer'],
      default: 'card'
    },
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', default: null },
    refund: { type: mongoose.Schema.Types.ObjectId, ref: 'Refund', default: null },

    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
    },
    cancelledAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },

    isActive: { type: Boolean, default: true, index: true }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    optimisticConcurrency: true // enable optimistic concurrency control
  }
);

/**
 * Virtual: formattedDate (friendly)
 */
bookingSchema.virtual('formattedDate').get(function () {
  if (!this.date) return null;
  return this.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
});

/**
 * Helper: combine booking.date + departureTime into a Date object
 */
bookingSchema.methods.getDepartureDateTime = function () {
  if (!this.date || !this.departureTime) return null;
  const [h, m] = this.departureTime.split(':').map(Number);
  const dt = new Date(this.date);
  dt.setHours(h, m, 0, 0);
  return dt;
};

/**
 * Virtual: duration (arrival - departure), handles overnight journeys
 */
bookingSchema.virtual('duration').get(function () {
  if (!this.departureTime || !this.arrivalTime) return null;
  const [depH, depM] = this.departureTime.split(':').map(Number);
  const [arrH, arrM] = this.arrivalTime.split(':').map(Number);

  const depTotal = depH * 60 + depM;
  const arrTotal = arrH * 60 + arrM;
  let diff = arrTotal - depTotal;
  if (diff < 0) diff += 24 * 60; // overnight
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  return `${hours}h ${minutes}m`;
});

/**
 * Virtual: isCancellable (true if confirmed and more than configurable hours before departure)
 * Default cancellation window is 2 hours, but can be overridden with env CANCEL_WINDOW_HOURS.
 */
bookingSchema.virtual('isCancellable').get(function () {
  if (this.status !== 'confirmed') return false;
  const departureDT = this.getDepartureDateTime();
  if (!departureDT) return false;
  const now = new Date();
  const hoursBefore = (departureDT - now) / (1000 * 60 * 60);
  const windowHours = Number(process.env.CANCEL_WINDOW_HOURS || 2);
  return hoursBefore > windowHours;
});

/**
 * Indexes for fast queries
 */
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ bus: 1, date: 1, status: 1 });
bookingSchema.index({ date: 1, status: 1 });
bookingSchema.index({ status: 1, isActive: 1 });

/**
 * Pre-save: compute totalAmount as (price * numberOfSeats) + taxAmount
 * If totalAmount is already provided and differs, we trust caller only if explicitly passed.
 */
bookingSchema.pre('save', function (next) {
  try {
    // ensure price and taxAmount are numbers
    const price = Number(this.price || 0);
    const tax = Number(this.taxAmount || 0);
    const seatsCount = Array.isArray(this.seatNumbers) ? this.seatNumbers.length : 0;

    // compute expected total
    const expectedTotal = Math.round((price * seatsCount + tax) * 100) / 100;

    // set totalAmount if it differs or wasn't set
    if (!this.totalAmount || Number(this.totalAmount) !== expectedTotal) {
      this.totalAmount = expectedTotal;
    }
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Statics & query helpers
 */
bookingSchema.statics.findActive = function () {
  return this.find({ isActive: true, status: 'confirmed' });
};

bookingSchema.statics.findByUser = function (userId, page = 1, limit = 10) {
  const p = Math.max(1, parseInt(page, 10));
  const l = Math.max(1, Math.min(100, parseInt(limit, 10)));
  return this.find({ user: userId, isActive: true })
    .sort({ createdAt: -1 })
    .limit(l)
    .skip((p - 1) * l)
    .populate('bus', 'busNumber route');
};

/**
 * Check seat availability for a bus on a date.
 * Returns array [{ seat, available }]
 */
bookingSchema.statics.checkSeatAvailability = async function (busId, date, seatNumbers) {
  if (!Array.isArray(seatNumbers) || seatNumbers.length === 0) {
    return [];
  }
  // normalize seatNumbers to strings
  const seats = seatNumbers.map(s => String(s).trim());
  const conflicting = await this.find({
    bus: busId,
    date: new Date(date),
    status: 'confirmed',
    seatNumbers: { $in: seats }
  }).select('seatNumbers');

  return seats.map(seat => ({
    seat,
    available: !conflicting.some(b => b.seatNumbers.map(String).includes(seat))
  }));
};

/**
 * Instance methods: cancel & complete
 */
bookingSchema.methods.cancel = async function (reason = 'User requested cancellation') {
  if (this.status === 'cancelled') return this;
  this.status = 'cancelled';
  this.cancellationReason = reason;
  this.cancelledAt = new Date();
  return this.save();
};

bookingSchema.methods.complete = async function () {
  if (this.status === 'completed') return this;
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

/**
 * Query helpers
 */
bookingSchema.query.byDateRange = function (startDate, endDate) {
  const filter = {};
  if (startDate) filter.$gte = new Date(startDate);
  if (endDate) filter.$lte = new Date(endDate);
  return this.find({ date: filter });
};

bookingSchema.query.byStatus = function (status) {
  return this.find({ status });
};

module.exports = mongoose.model('Booking', bookingSchema);
