const express = require("express");
const { body } = require("express-validator");
const rateLimit = require("express-rate-limit");

// Import correct controller functions
const {
  register,
  login,
  getProfile,
  logout,
  changePassword,
} = require("../controllers/authController");

const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// Rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});

// Validation rules
const registerValidation = [
  body("name").isLength({ min: 2, max: 100 }).withMessage("Name must be 2-100 chars"),
  body("email").isEmail().withMessage("Provide valid email"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 chars"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Provide valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Routes
router.post("/register", authLimiter, registerValidation, register);
router.post("/login", authLimiter, loginValidation, login);
router.post("/logout", protect, logout);
router.get("/me", protect, getProfile);
router.post("/change-password", protect, changePassword);

// Session check
router.get("/session", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Session is valid",
    user: req.user,
  });
});

module.exports = router;
