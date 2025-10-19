// FILE: backend/services/paymentService.js
/**
 * Payment service for handling Razorpay payments
 * Supports creating orders and verifying payments
 */

const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance only if credentials are provided
let razorpay = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && 
    process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key_id') {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
  console.log('✓ Razorpay initialized successfully');
} else {
  console.warn('⚠ Razorpay credentials not configured. Payment features will be disabled.');
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
    console.error('Razorpay order creation error:', error);
    throw new Error('Failed to create payment order');
  }
};

/**
 * Verify Razorpay payment signature
 */
const verifyPayment = (orderId, paymentId, signature) => {
  if (!process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET === 'your_razorpay_key_secret') {
    console.error('Razorpay key secret not configured');
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
    console.error('Payment verification error:', error);
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
    console.error('Error fetching payment details:', error);
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
    console.error('Refund initiation error:', error);
    throw new Error('Failed to initiate refund');
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentDetails,
  initiateRefund
};
