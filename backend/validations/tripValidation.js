// FILE: backend/validations/tripValidation.js
/**
 * Input validation for trip endpoints
 * Uses express-validator for request validation
 */

const { body, query } = require('express-validator');
const { TRIP_STATUS } = require('../constants/enums');

const createTripValidation = [
  body('bus')
    .notEmpty()
    .withMessage('Bus ID is required')
    .isMongoId()
    .withMessage('Invalid Bus ID format'),
  
  body('route')
    .notEmpty()
    .withMessage('Route ID is required')
    .isMongoId()
    .withMessage('Invalid Route ID format'),
  
  body('departureDateTime')
    .notEmpty()
    .withMessage('Departure date and time is required')
    .isISO8601()
    .withMessage('Invalid departure date format')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Departure date must be in the future');
      }
      return true;
    }),
  
  body('arrivalDateTime')
    .notEmpty()
    .withMessage('Arrival date and time is required')
    .isISO8601()
    .withMessage('Invalid arrival date format')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.departureDateTime)) {
        throw new Error('Arrival date must be after departure date');
      }
      return true;
    }),
  
  body('currentFare')
    .isFloat({ min: 1 })
    .withMessage('Current fare must be a positive number'),
  
  body('driver.name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Driver name must be between 2 and 100 characters')
    .escape(),
  
  body('driver.phone')
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Driver phone must be a valid 10-digit number'),
  
  body('conductor.name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Conductor name must be between 2 and 100 characters')
    .escape()
];

const updateTripStatusValidation = [
  body('status')
    .isIn(Object.values(TRIP_STATUS))
    .withMessage('Invalid trip status')
];

const searchTripsValidation = [
  query('from')
    .notEmpty()
    .withMessage('Source city is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Source city must be between 2 and 50 characters')
    .escape(),
  
  query('to')
    .notEmpty()
    .withMessage('Destination city is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Destination city must be between 2 and 50 characters')
    .escape(),
  
  query('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      if (new Date(value) < new Date().setHours(0, 0, 0, 0)) {
        throw new Error('Date cannot be in the past');
      }
      return true;
    })
];

module.exports = {
  createTripValidation,
  updateTripStatusValidation,
  searchTripsValidation
};