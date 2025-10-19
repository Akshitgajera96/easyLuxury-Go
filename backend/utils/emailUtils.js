// FILE: backend/utils/emailUtils.js
/**
 * Email utility for sending notifications
 * Uses SendGrid for email delivery with fallback to console logging
 * Environment dependencies: SENDGRID_API_KEY, SENDGRID_FROM_EMAIL
 */

const sgMail = require('@sendgrid/mail');

// Initialize SendGrid if API key is available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Send email using SendGrid or fallback to console
 * @param {object} emailData - Email configuration
 * @param {string} emailData.to - Recipient email
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.text - Plain text content
 * @param {string} emailData.html - HTML content
 * @returns {object} Send result
 */
const sendEmail = async (emailData) => {
  const { to, subject, text, html } = emailData;

  // Validate required fields
  if (!to || !subject || (!text && !html)) {
    throw new Error('Missing required email fields: to, subject, and text/html');
  }

  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@easyluxury.com',
    subject,
    text,
    html
  };

  try {
    // Use SendGrid if API key is available
    if (process.env.SENDGRID_API_KEY) {
      const result = await sgMail.send(msg);
      console.log(`✅ Email sent to ${to}: ${result[0].statusCode}`);
      return { success: true, provider: 'sendgrid', messageId: result[0].headers['x-message-id'] };
    } else {
      // Fallback to console logging (development)
      console.log('📧 Email (console fallback):', {
        to,
        subject,
        text,
        html: html ? '[HTML content]' : undefined
      });
      return { success: true, provider: 'console', message: 'Email logged to console' };
    }
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    
    // Even if email fails, log and continue (don't break the application)
    console.log('📧 Email would have been sent:', { to, subject });
    return { 
      success: false, 
      provider: process.env.SENDGRID_API_KEY ? 'sendgrid' : 'console',
      error: error.message 
    };
  }
};

/**
 * Send booking confirmation email
 * @param {object} booking - Booking object
 * @param {object} user - User object
 * @returns {object} Send result
 */
const sendBookingConfirmation = async (booking, user) => {
  const { pnrNumber, seats, totalAmount, trip } = booking;
  const passengerCount = seats.length;

  const subject = `Booking Confirmed - PNR: ${pnrNumber}`;
  const text = `
Dear ${user.name},

Your bus booking has been confirmed!

PNR Number: ${pnrNumber}
Route: ${trip.route.source.city} to ${trip.route.destination.city}
Departure: ${new Date(trip.departureDateTime).toLocaleString()}
Seats: ${seats.map(s => s.seatNumber).join(', ')}
Passengers: ${passengerCount}
Total Amount: ₹${totalAmount}

Thank you for choosing easyLuxury Go!
  `;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: #0A192F; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .booking-details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .footer { background: #f1f1f1; padding: 15px; text-align: center; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>easyLuxury Go</h1>
    <h2>Booking Confirmed!</h2>
  </div>
  
  <div class="content">
    <p>Dear <strong>${user.name}</strong>,</p>
    <p>Your bus booking has been successfully confirmed.</p>
    
    <div class="booking-details">
      <h3>Booking Details</h3>
      <p><strong>PNR Number:</strong> ${pnrNumber}</p>
      <p><strong>Route:</strong> ${trip.route.source.city} to ${trip.route.destination.city}</p>
      <p><strong>Departure:</strong> ${new Date(trip.departureDateTime).toLocaleString()}</p>
      <p><strong>Seats:</strong> ${seats.map(s => s.seatNumber).join(', ')}</p>
      <p><strong>Passengers:</strong> ${passengerCount}</p>
      <p><strong>Total Amount:</strong> ₹${totalAmount}</p>
    </div>
    
    <p>Have a pleasant journey!</p>
  </div>
  
  <div class="footer">
    <p>Thank you for choosing <strong>easyLuxury Go</strong></p>
    <p>For support, contact: support@easyluxury.com</p>
  </div>
</body>
</html>
  `;

  return await sendEmail({
    to: user.email,
    subject,
    text,
    html
  });
};

/**
 * Send booking cancellation email
 * @param {object} booking - Booking object
 * @param {object} user - User object
 * @returns {object} Send result
 */
const sendCancellationConfirmation = async (booking, user) => {
  const { pnrNumber, cancellation, trip } = booking;

  const subject = `Booking Cancelled - PNR: ${pnrNumber}`;
  const text = `
Dear ${user.name},

Your booking has been cancelled.

PNR Number: ${pnrNumber}
Route: ${trip.route.source.city} to ${trip.route.destination.city}
Refund Amount: ₹${cancellation.refundAmount}
Cancellation Reason: ${cancellation.cancellationReason}

Refund will be processed within 5-7 business days.

Thank you for using easyLuxury Go.
  `;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .cancellation-details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .footer { background: #f1f1f1; padding: 15px; text-align: center; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>easyLuxury Go</h1>
    <h2>Booking Cancelled</h2>
  </div>
  
  <div class="content">
    <p>Dear <strong>${user.name}</strong>,</p>
    <p>Your booking has been successfully cancelled.</p>
    
    <div class="cancellation-details">
      <h3>Cancellation Details</h3>
      <p><strong>PNR Number:</strong> ${pnrNumber}</p>
      <p><strong>Route:</strong> ${trip.route.source.city} to ${trip.route.destination.city}</p>
      <p><strong>Refund Amount:</strong> ₹${cancellation.refundAmount}</p>
      <p><strong>Cancellation Reason:</strong> ${cancellation.cancellationReason}</p>
      <p><strong>Cancelled At:</strong> ${new Date(cancellation.cancelledAt).toLocaleString()}</p>
    </div>
    
    <p><em>Refund will be processed within 5-7 business days.</em></p>
  </div>
  
  <div class="footer">
    <p>Thank you for using <strong>easyLuxury Go</strong></p>
    <p>We hope to serve you again soon!</p>
  </div>
</body>
</html>
  `;

  return await sendEmail({
    to: user.email,
    subject,
    text,
    html
  });
};

/**
 * Send wallet transaction notification
 * @param {object} user - User object
 * @param {number} amount - Transaction amount
 * @param {string} type - Transaction type (add/deduct)
 * @param {number} newBalance - New wallet balance
 * @returns {object} Send result
 */
const sendWalletNotification = async (user, amount, type, newBalance) => {
  const action = type === 'add' ? 'added to' : 'deducted from';
  const subject = `Wallet ${type === 'add' ? 'Credit' : 'Debit'} Notification`;
  
  const text = `
Dear ${user.name},

${type === 'add' ? '₹' + amount + ' has been successfully added to your wallet.' : '₹' + amount + ' has been deducted from your wallet for booking.'}

New Wallet Balance: ₹${newBalance}

Thank you for using easyLuxury Go.
  `;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: #FFCA28; color: #333; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .transaction-details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .footer { background: #f1f1f1; padding: 15px; text-align: center; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>easyLuxury Go</h1>
    <h2>Wallet ${type === 'add' ? 'Credit' : 'Debit'}</h2>
  </div>
  
  <div class="content">
    <p>Dear <strong>${user.name}</strong>,</p>
    
    <div class="transaction-details">
      <h3>Transaction Details</h3>
      <p><strong>Amount ${type === 'add' ? 'Added' : 'Deducted'}:</strong> ₹${amount}</p>
      <p><strong>New Wallet Balance:</strong> ₹${newBalance}</p>
      <p><strong>Transaction Date:</strong> ${new Date().toLocaleString()}</p>
    </div>
    
    <p>Thank you for using our wallet service.</p>
  </div>
  
  <div class="footer">
    <p><strong>easyLuxury Go</strong> - Your travel partner</p>
  </div>
</body>
</html>
  `;

  return await sendEmail({
    to: user.email,
    subject,
    text,
    html
  });
};

module.exports = {
  sendEmail,
  sendBookingConfirmation,
  sendCancellationConfirmation,
  sendWalletNotification
};