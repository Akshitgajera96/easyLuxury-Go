const express = require("express");
const { body } = require("express-validator");
const {
  registerUser,
  loginUser,
  registerCaptain,
  loginCaptain,
  logout,
  getProfile,
  changePassword,
} = require("../controllers/authController");
const { protect, validate } = require("../middlewares/authMiddleware");

const router = express.Router();

// ----------------------------
// User Routes
// ----------------------------

/**
 * @route   POST /auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  "/register",
  [
    body("name")
      .trim()
      .notEmpty().withMessage("Name is required")
      .isLength({ min: 2, max: 50 }).withMessage("Name must be between 2 and 50 characters"),
    body("email")
      .trim()
      .isEmail().withMessage("Valid email is required")
      .normalizeEmail(),
    body("password")
      .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .withMessage("Password must contain uppercase, lowercase, number, and special character"),
    body("phone")
      .optional()
      .matches(/^\d{10}$/)
      .withMessage("Phone must be exactly 10 digits"),
  ],
  validate,
  registerUser
);

/**
 * @route   POST /auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  "/login",
  [
    body("email")
      .trim()
      .isEmail().withMessage("Valid email is required")
      .normalizeEmail(),
    body("password")
      .notEmpty().withMessage("Password is required"),
  ],
  validate,
  loginUser
);

// ----------------------------
// Captain Routes
// ----------------------------

/**
 * @route   POST /auth/captain/register
 * @desc    Register a new captain
 * @access  Public
 */
router.post(
  "/captain/register",
  [
    body("fullName")
      .trim()
      .notEmpty().withMessage("Full name is required")
      .isLength({ min: 2, max: 50 }).withMessage("Full name must be between 2 and 50 characters"),
    body("email")
      .trim()
      .isEmail().withMessage("Valid email is required")
      .normalizeEmail(),
    body("password")
      .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .withMessage("Password must contain uppercase, lowercase, number, and special character"),
    body("phone")
      .optional()
      .matches(/^\d{10}$/)
      .withMessage("Phone must be exactly 10 digits"),
    body("licenseNumber")
      .trim()
      .notEmpty().withMessage("License number is required"),
  ],
  validate,
  registerCaptain
);

/**
 * @route   POST /auth/captain/login
 * @desc    Login captain
 * @access  Public
 */
router.post(
  "/captain/login",
  [
    body("email")
      .trim()
      .isEmail().withMessage("Valid email is required")
      .normalizeEmail(),
    body("password")
      .notEmpty().withMessage("Password is required"),
  ],
  validate,
  loginCaptain
);

// ----------------------------
// Protected Routes
// ----------------------------

/**
 * @route   POST /auth/logout
 * @desc    Logout user or captain
 * @access  Private
 */
router.post("/logout", protect, logout);

/**
 * @route   GET /auth/me
 * @desc    Get current authenticated user/captain profile
 * @access  Private
 */
router.get("/me", protect, getProfile);

/**
 * @route   PUT /auth/change-password
 * @desc    Change password for user or captain
 * @access  Private
 */
router.put(
  "/change-password",
  [
    body("oldPassword")
      .notEmpty().withMessage("Old password is required"),
    body("newPassword")
      .isLength({ min: 8 }).withMessage("New password must be at least 8 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .withMessage("New password must contain uppercase, lowercase, number, and special character"),
  ],
  validate,
  protect,
  changePassword
);

/**
 * @route   GET /auth/session
 * @desc    Simple test route to check if session is valid
 * @access  Private
 */
router.get("/session", protect, (req, res) => {
  res.status(200).json({
    success: true,
    msg: "Session active",
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.role,
    },
  });
});

module.exports = router;
