// FILE: backend/services/emailService.js
/**
 * Email service for sending OTP and notifications
 * Uses Nodemailer for email delivery
 */

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Create transporter only if credentials are provided
let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD && 
    process.env.EMAIL_USER !== 'your-email@gmail.com') {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  logger.info('Email service initialized successfully');
} else {
  logger.warn('Email credentials not configured. Email features will be disabled.');
}

/**
 * Generate random 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP email for password reset
 */
const sendPasswordResetOTP = async (email, name, otp) => {
  if (!transporter) {
    logger.warn('Email service not configured. Skipping password reset OTP email.');
    return false;
  }
  
  const mailOptions = {
    from: `"easyLuxury Go" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset OTP - easyLuxury Go',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #fbbf24; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #1e3a8a; letter-spacing: 8px; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${name}</strong>,</p>
            <p>We received a request to reset your password for your easyLuxury Go account.</p>
            
            <div class="otp-box">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">Your OTP Code:</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #6b7280;">Valid for 10 minutes</p>
            </div>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              • Do not share this OTP with anyone<br>
              • This OTP will expire in 10 minutes<br>
              • If you didn't request this, please ignore this email
            </div>
            
            <p>If you have any questions, please contact our support team.</p>
            <p>Best regards,<br><strong>easyLuxury Go Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2025 easyLuxury Go. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Password reset OTP sent to: ${email}`);
    return true;
  } catch (error) {
    logger.error(`Error sending password reset OTP: ${error.message}`);
    throw error;
  }
};

/**
 * Send OTP email for booking confirmation
 */
const sendBookingOTP = async (email, name, otp, bookingDetails) => {
  if (!transporter) {
    logger.warn('Email service not configured. Skipping booking OTP email.');
    return false;
  }
  
  const { busName, route, date, seatNumbers, amount } = bookingDetails;
  
  const mailOptions = {
    from: `"easyLuxury Go" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Booking Confirmation OTP - easyLuxury Go',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #10b981; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #059669; letter-spacing: 8px; }
          .booking-details { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎫 Confirm Your Booking</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${name}</strong>,</p>
            <p>Please use the OTP below to confirm your bus ticket booking:</p>
            
            <div class="otp-box">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">Your Confirmation OTP:</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #6b7280;">Valid for 10 minutes</p>
            </div>
            
            <div class="booking-details">
              <h3 style="margin-top: 0; color: #1e3a8a;">📋 Booking Details</h3>
              <div class="detail-row">
                <span><strong>Bus:</strong></span>
                <span>${busName}</span>
              </div>
              <div class="detail-row">
                <span><strong>Route:</strong></span>
                <span>${route}</span>
              </div>
              <div class="detail-row">
                <span><strong>Date:</strong></span>
                <span>${date}</span>
              </div>
              <div class="detail-row">
                <span><strong>Seats:</strong></span>
                <span>${seatNumbers}</span>
              </div>
              <div class="detail-row" style="border-bottom: none;">
                <span><strong>Amount:</strong></span>
                <span style="color: #059669; font-weight: bold;">₹${amount}</span>
              </div>
            </div>
            
            <p style="background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
              <strong>ℹ️ Note:</strong> After entering the OTP, proceed to payment to complete your booking.
            </p>
            
            <p>Best regards,<br><strong>easyLuxury Go Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2025 easyLuxury Go. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Booking OTP sent to: ${email}`);
    return true;
  } catch (error) {
    logger.error(`Error sending booking OTP: ${error.message}`);
    throw error;
  }
};

/**
 * Send booking confirmation email after successful payment
 */
const sendBookingConfirmation = async (email, name, bookingDetails) => {
  if (!transporter) {
    logger.warn('Email service not configured. Skipping booking confirmation email.');
    return false;
  }
  
  const { bookingId, busName, route, date, seatNumbers, amount, paymentId } = bookingDetails;
  
  const mailOptions = {
    from: `"easyLuxury Go" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Booking Confirmed - ${bookingId} | easyLuxury Go`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-badge { background: #d1fae5; color: #065f46; padding: 15px; border-radius: 10px; text-align: center; margin: 20px 0; font-size: 18px; font-weight: bold; }
          .ticket-box { background: white; padding: 25px; border-radius: 10px; margin: 20px 0; border: 2px solid #10b981; }
          .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
          .qr-placeholder { background: #f3f4f6; padding: 40px; text-align: center; border-radius: 10px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Booking Confirmed!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Your journey awaits</p>
          </div>
          <div class="content">
            <p>Hello <strong>${name}</strong>,</p>
            
            <div class="success-badge">
              🎉 Your booking has been confirmed successfully!
            </div>
            
            <div class="ticket-box">
              <h3 style="margin-top: 0; color: #059669; text-align: center;">🎫 Your Ticket</h3>
              <div class="detail-row">
                <span><strong>Booking ID:</strong></span>
                <span style="color: #059669; font-weight: bold;">${bookingId}</span>
              </div>
              <div class="detail-row">
                <span><strong>Bus:</strong></span>
                <span>${busName}</span>
              </div>
              <div class="detail-row">
                <span><strong>Route:</strong></span>
                <span>${route}</span>
              </div>
              <div class="detail-row">
                <span><strong>Journey Date:</strong></span>
                <span>${date}</span>
              </div>
              <div class="detail-row">
                <span><strong>Seat Numbers:</strong></span>
                <span style="color: #059669; font-weight: bold;">${seatNumbers}</span>
              </div>
              <div class="detail-row">
                <span><strong>Amount Paid:</strong></span>
                <span style="color: #059669; font-weight: bold;">₹${amount}</span>
              </div>
              <div class="detail-row" style="border-bottom: none;">
                <span><strong>Payment ID:</strong></span>
                <span style="font-size: 12px;">${paymentId}</span>
              </div>
            </div>
            
            <div style="background: #dbeafe; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #1e3a8a;">📱 Important Instructions:</h4>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Please arrive at the boarding point 15 minutes before departure</li>
                <li>Carry a valid ID proof for verification</li>
                <li>Show this email or booking ID to the conductor</li>
                <li>Check your dashboard for real-time bus tracking</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/bookings/${bookingId}" 
                 style="background: #1e3a8a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                View Booking Details
              </a>
            </div>
            
            <p>Have a safe and comfortable journey!</p>
            <p>Best regards,<br><strong>easyLuxury Go Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2025 easyLuxury Go. All rights reserved.</p>
            <p>Need help? Contact us at support@easyluxurygo.com</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Booking confirmation sent to: ${email}`);
    return true;
  } catch (error) {
    logger.error(`Error sending booking confirmation: ${error.message}`);
    throw error;
  }
};

/**
 * Send staff approval email
 */
const sendStaffApprovalEmail = async (staffEmail, staffName, extra = {}) => {
  if (!transporter) {
    logger.warn('Email service not configured. Skipping staff approval email.');
    return false;
  }
  
  const { loginUrl = `${process.env.FRONTEND_URL}/staff/login`, adminName = 'Admin' } = extra;
  
  const mailOptions = {
    from: `"easyLuxury Go" <${process.env.EMAIL_USER}>`,
    to: staffEmail,
    subject: 'Your Staff Account Has Been Approved - easyLuxury Go',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-badge { background: #d1fae5; color: #065f46; padding: 15px; border-radius: 10px; text-align: center; margin: 20px 0; font-size: 18px; font-weight: bold; }
          .info-box { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #10b981; }
          .login-button { display: inline-block; background: #1e3a8a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Account Approved!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Welcome to the team</p>
          </div>
          <div class="content">
            <p>Hello <strong>${staffName}</strong>,</p>
            
            <div class="success-badge">
              🎉 Congratulations! Your staff account has been approved!
            </div>
            
            <p>We are pleased to inform you that your staff registration request has been reviewed and approved by our admin team.</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: #059669;">📋 Next Steps:</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>You can now log in to the staff portal using your registered email and password</li>
                <li>Access all staff features and manage your assigned duties</li>
                <li>Update your profile information if needed</li>
                <li>Contact support if you have any questions</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" 
                 style="background: #1e3a8a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                Login to Staff Portal
              </a>
            </div>
            
            <div style="background: #dbeafe; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <p style="margin: 0;"><strong>ℹ️ Login Information:</strong></p>
              <p style="margin: 10px 0 0 0;">Use your registered email address and the password you created during registration to log in.</p>
            </div>
            
            <p>If you did not request this account or have any concerns, please contact our support team immediately.</p>
            
            <p>We look forward to working with you!</p>
            <p>Best regards,<br><strong>easyLuxury Go Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2025 easyLuxury Go. All rights reserved.</p>
            <p>Need help? Contact us at support@easyluxurygo.com</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Staff approval email sent to: ${staffEmail}`);
    return true;
  } catch (error) {
    logger.error(`Error sending staff approval email: ${error.message}`);
    throw error;
  }
};

module.exports = {
  generateOTP,
  sendPasswordResetOTP,
  sendBookingOTP,
  sendBookingConfirmation,
  sendStaffApprovalEmail
};
