const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const {
  registerUser,
  loginUser,
  getMe
  // ONLY include functions that actually exist in your authController
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.'
  }
});

// Basic validation
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// ONLY THESE THREE BASIC ROUTES
router.post('/register', authLimiter, registerValidation, registerUser);
router.post('/login', authLimiter, loginValidation, loginUser);
router.get('/me', protect, getMe);

// Session check route
router.get('/session', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Session is valid',
    user: req.user
  });
});

module.exports = router;