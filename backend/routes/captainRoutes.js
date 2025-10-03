// backend/routes/captainRoutes.js
const express = require("express");
const { body, param, query } = require("express-validator");
const {
  registerCaptain,
  getAllCaptains,
  getCaptainById,
  updateCaptain,
  deleteCaptain,
  getCaptainAvailability,
  updateCaptainAvailability,
  getCaptainStats,
  assignBusToCaptain,
  removeBusFromCaptain,
} = require("../controllers/captainController");

const { protect, requireRole, validate } = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * -------------------------
 * Validation middlewares
 * -------------------------
 */

// ✅ Register a new captain
const registerCaptainValidation = [
  body("fullName")
    .trim()
    .notEmpty().withMessage("Full name is required")
    .isLength({ min: 3, max: 100 }).withMessage("Full name must be between 3 and 100 characters"),
  body("email")
    .trim()
    .isEmail().withMessage("Valid email is required")
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage("Email cannot exceed 255 characters"),
  body("phone")
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage("Valid phone number is required (E.164 format)"),
  body("licenseNumber")
    .trim()
    .notEmpty().withMessage("License number is required")
    .isLength({ max: 50 }).withMessage("License number cannot exceed 50 characters"),
  body("password")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage("Password must include uppercase, lowercase, number, and special character"),
  body("dateOfBirth")
    .notEmpty().withMessage("Date of birth is required")
    .isISO8601().toDate().withMessage("Date of birth must be a valid date"),
  validate,
];

// ✅ Update captain
const updateCaptainValidation = [
  body("fullName")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage("Full name must be between 3 and 100 characters"),
  body("phone")
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage("Valid phone number is required (E.164 format)"),
  body("licenseNumber")
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage("License number cannot exceed 50 characters"),
  body("status")
    .optional()
    .isIn(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"])
    .withMessage("Invalid status value"),
  body("availability")
    .optional()
    .isIn(["AVAILABLE", "ON_TRIP", "OFFLINE"])
    .withMessage("Invalid availability value"),
  validate,
];

// ✅ Captain ID param validation
const captainIdParamValidation = [
  param("id").isMongoId().withMessage("Valid captain ID is required"),
  validate,
];

// ✅ Query validation
const queryValidation = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("search").optional().trim().isLength({ max: 100 }).withMessage("Search cannot exceed 100 characters"),
  query("isAvailable").optional().isBoolean().withMessage("isAvailable must be boolean"),
  validate,
];

/**
 * -------------------------
 * Routes
 * -------------------------
 */

// 🔐 All captain routes are admin-protected
router.use(protect, requireRole("admin"));

// ➕ Register a new captain
router.post("/", registerCaptainValidation, registerCaptain);

// 📄 Get all captains
router.get("/", queryValidation, getAllCaptains);

// 📊 Get captain stats
router.get("/stats", getCaptainStats);

// 🔍 Get captain by ID
router.get("/:id", captainIdParamValidation, getCaptainById);

// 👀 Get captain availability
router.get("/:id/availability", captainIdParamValidation, getCaptainAvailability);

// ✏️ Update captain profile
router.put("/:id", captainIdParamValidation, updateCaptainValidation, updateCaptain);

// 🔄 Update captain availability
router.patch(
  "/:id/availability",
  captainIdParamValidation,
  [body("availability").isIn(["AVAILABLE", "ON_TRIP", "OFFLINE"]).withMessage("Invalid availability value"), validate],
  updateCaptainAvailability
);

// 🚌 Assign bus to captain
router.patch(
  "/:id/assign-bus",
  captainIdParamValidation,
  [body("busId").isMongoId().withMessage("Valid bus ID is required"), validate],
  assignBusToCaptain
);

// ❌ Remove bus from captain
router.patch("/:id/remove-bus", captainIdParamValidation, removeBusFromCaptain);

// 🗑️ Delete captain
router.delete("/:id", captainIdParamValidation, deleteCaptain);

module.exports = router;
