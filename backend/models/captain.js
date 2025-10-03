const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const Bus = require("./Bus");

// --- Sub Schemas --- //
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
    uploadedAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { _id: false }
);

// --- Main Captain Schema --- //
const captainSchema = new mongoose.Schema(
  {
    // ... all your fields as before ...
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// --- Password Hashing --- //
captainSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// --- Methods --- //
captainSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// --- Virtuals & Indexes as before ---
captainSchema.virtual("age").get(function () { /* ... */ });
captainSchema.virtual("licenseStatus").get(function () { /* ... */ });
captainSchema.virtual("totalTrips", { ref: "Booking", localField: "_id", foreignField: "captain", count: true });

captainSchema.index({ email: 1, phone: 1 }, { unique: true });
captainSchema.index({ status: 1, isActive: 1 });
captainSchema.index({ "address.city": 1 });
captainSchema.index({ "rating.average": -1 });

// --- Fix OverwriteModelError ---
const Captain = mongoose.models.Captain || mongoose.model("Captain", captainSchema);

module.exports = Captain;
