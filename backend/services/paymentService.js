// FILE: backend/services/paymentService.js
/**
 * Payment service for handling Razorpay payments
 * Supports creating orders and verifying payments
 */

const Razorpay = require('razorpay');
const crypto = require('crypto');
const logger = require('../utils/logger');

// Initialize Razorpay instance only if credentials are provided
let razorpay = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && 
    process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key_id') {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
  logger.info('Razorpay initialized successfully');
} else {
  logger.warn('Razorpay credentials not configured. Payment features will be disabled.');
}

/**
 * Create Razorpay order
 */
const createOrder = async (amount, currency = 'INR', receipt, notes = {}) => {
  if (!razorpay) {
    throw new Error('Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env file');
  }
  
  try {
    const options = {
      amount: amount * 100, // Amount in paise
      currency,
      receipt,
      notes
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    logger.error(`Razorpay order creation error: ${error.message}`);
    throw new Error('Failed to create payment order');
  }
};

/**
 * Verify Razorpay payment signature
 */
const verifyPayment = (orderId, paymentId, signature) => {
  if (!process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET === 'your_razorpay_key_secret') {
    logger.error('Razorpay key secret not configured');
    return false;
  }
  
  try {
    const text = `${orderId}|${paymentId}`;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    return generated_signature === signature;
  } catch (error) {
    logger.error(`Payment verification error: ${error.message}`);
    return false;
  }
};

/**
 * Get payment details
 */
const getPaymentDetails = async (paymentId) => {
  if (!razorpay) {
    throw new Error('Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env file');
  }
  
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    logger.error(`Error fetching payment details: ${error.message}`);
    throw new Error('Failed to fetch payment details');
  }
};

/**
 * Initiate refund
 */
const initiateRefund = async (paymentId, amount, notes = {}) => {
  if (!razorpay) {
    throw new Error('Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env file');
  }
  
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount * 100, // Amount in paise
      notes
    });
    return refund;
  } catch (error) {
    logger.error(`Refund initiation error: ${error.message}`);
    throw new Error('Failed to initiate refund');
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentDetails,
  initiateRefund
};
