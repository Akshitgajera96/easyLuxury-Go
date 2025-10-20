// FILE: backend/validations/bookingValidation.js
/**
 * Input validation for booking endpoints
 * Uses express-validator for request validation
 */

const { body } = require('express-validator');
const { PAYMENT_METHODS } = require('../constants/enums');

const createBookingValidation = [
  body('tripId')
    .notEmpty()
    .withMessage('Trip ID is required')
    .isMongoId()
    .withMessage('Invalid Trip ID format'),
  
  body('seats')
    .isArray({ min: 1 })
    .withMessage('At least one seat must be selected')
    .custom((seats) => {
      if (!seats.every(seat => typeof seat === 'string' && seat.trim().length > 0)) {
        throw new Error('All seats must be valid seat numbers');
      }
      return true;
    }),
  
  body('passengerInfo.name')
    .notEmpty()
    .withMessage('Passenger name is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Passenger name must be between 2 and 100 characters')
    .escape(),
  
  body('passengerInfo.age')
    .isInt({ min: 1, max: 120 })
    .withMessage('Passenger age must be between 1 and 120'),
  
  body('passengerInfo.gender')
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  
  body('paymentMethod')
    .isIn(Object.values(PAYMENT_METHODS))
    .withMessage('Invalid payment method'),
  
  body('promoCode')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Promo code must be between 3 and 20 characters')
    .escape()
];

const cancelBookingValidation = [
  body('reason')
    .notEmpty()
    .withMessage('Cancellation reason is required')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Cancellation reason must be between 5 and 500 characters')
    .escape()
];

module.exports = {
  createBookingValidation,
  cancelBookingValidation
};