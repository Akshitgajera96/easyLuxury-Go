const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode'); // For QR code generation

// Ensure directories exist
const ticketsDir = path.join(__dirname, '../public/tickets');
const receiptsDir = path.join(__dirname, '../public/receipts');
const invoicesDir = path.join(__dirname, '../public/invoices');

[ ticketsDir, receiptsDir, invoicesDir ].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Company information
const COMPANY_INFO = {
  name: 'EasyLuxury Go',
  address: '123 Luxury Street, Premium City',
  phone: '+1 (555) 123-LUXURY',
  email: 'support@easyluxurygo.com',
  website: 'www.easyluxurygo.com',
  taxId: 'TAX-ID-123456789'
};

/**
 * Generate ticket PDF with enhanced features
 */
async function generateTicketPDF(booking, user, bus, options = {}) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        margin: 40,
        size: 'A4',
        bufferPages: true
      });
      
      const fileName = `ticket_${booking._id}_${Date.now()}.pdf`;
      const filePath = path.join(ticketsDir, fileName);
      const writeStream = fs.createWriteStream(filePath);

      doc.pipe(writeStream);

      // Generate QR code
      const qrCodeData = await generateQRCodeData(booking, user, bus);
      let qrCodeImage = null;
      
      try {
        qrCodeImage = await QRCode.toDataURL(qrCodeData);
      } catch (qrError) {
        console.warn('QR code generation failed:', qrError.message);
      }

      // Add header with company logo and info
      await addHeader(doc);
      
      // Add ticket title
      addTitle(doc, 'BUS TICKET');
      
      // Add booking reference
      addBookingReference(doc, booking);
      
      // Add passenger information section
      addPassengerInfo(doc, user);
      
      // Add journey details section
      addJourneyInfo(doc, booking, bus);
      
      // Add seat information
      addSeatInfo(doc, booking);
      
      // Add fare details
      addFareDetails(doc, booking);
      
      // Add QR code if generated
      if (qrCodeImage) {
        await addQRCode(doc, qrCodeImage);
      }
      
      // Add terms and conditions
      addTermsAndConditions(doc);
      
      // Add footer
      addFooter(doc, 'Thank you for choosing EasyLuxury Go!');
      
      // Finalize the PDF
      doc.end();

      writeStream.on('finish', () => {
        resolve({
          filePath,
          fileName,
          publicUrl: `/tickets/${fileName}`
        });
      });

      writeStream.on('error', (error) => {
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate receipt PDF
 */
async function generateReceiptPDF(payment, booking, user, options = {}) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        margin: 40,
        size: 'A4'
      });
      
      const fileName = `receipt_${payment._id}_${Date.now()}.pdf`;
      const filePath = path.join(receiptsDir, fileName);
      const writeStream = fs.createWriteStream(filePath);

      doc.pipe(writeStream);

      // Add header
      await addHeader(doc);
      
      // Add title
      addTitle(doc, 'PAYMENT RECEIPT');
      
      // Add receipt details
      addReceiptDetails(doc, payment, booking);
      
      // Add payment breakdown
      addPaymentBreakdown(doc, payment, booking);
      
      // Add payment method
      addPaymentMethod(doc, payment);
      
      // Add footer with company info
      addFooter(doc, 'This is an official receipt. Please keep it for your records.');

      doc.end();

      writeStream.on('finish', () => {
        resolve({
          filePath,
          fileName,
          publicUrl: `/receipts/${fileName}`
        });
      });

      writeStream.on('error', reject);

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate invoice PDF
 */
async function generateInvoicePDF(booking, user, bus, payment, options = {}) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        margin: 40,
        size: 'A4'
      });
      
      const fileName = `invoice_${booking._id}_${Date.now()}.pdf`;
      const filePath = path.join(invoicesDir, fileName);
      const writeStream = fs.createWriteStream(filePath);

      doc.pipe(writeStream);

      // Add header
      await addHeader(doc);
      
      // Add title
      addTitle(doc, 'TAX INVOICE');
      
      // Add invoice details
      addInvoiceDetails(doc, booking, user);
      
      // Add customer information
      addCustomerInfo(doc, user);
      
      // Add service details
      addServiceDetails(doc, booking, bus);
      
      // Add tax breakdown
      addTaxBreakdown(doc, booking, payment);
      
      // Add total amount
      addTotalAmount(doc, payment);
      
      // Add payment terms
      addPaymentTerms(doc);
      
      // Add footer
      addFooter(doc, 'Invoice generated electronically. No signature required.');

      doc.end();

      writeStream.on('finish', () => {
        resolve({
          filePath,
          fileName,
          publicUrl: `/invoices/${fileName}`
        });
      });

      writeStream.on('error', reject);

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Helper functions
 */
async function addHeader(doc) {
  // Company header
  doc.fontSize(20).font('Helvetica-Bold').text(COMPANY_INFO.name, 50, 50, { align: 'left' });
  doc.fontSize(10).font('Helvetica').text(COMPANY_INFO.address, 50, 75);
  doc.text(`Phone: ${COMPANY_INFO.phone} | Email: ${COMPANY_INFO.email}`, 50, 90);
  doc.text(`Website: ${COMPANY_INFO.website}`, 50, 105);
  
  // Add horizontal line
  doc.moveTo(50, 120).lineTo(550, 120).stroke();
  doc.moveDown(3);
}

function addTitle(doc, title) {
  doc.fontSize(18).font('Helvetica-Bold').text(title, { align: 'center' });
  doc.moveDown();
}

function addBookingReference(doc, booking) {
  doc.fontSize(10).font('Helvetica');
  doc.text(`Booking Reference: ${booking.bookingReference || booking._id}`, { align: 'right' });
  doc.text(`Date: ${new Date(booking.createdAt).toLocaleDateString()}`, { align: 'right' });
  doc.moveDown();
}

function addPassengerInfo(doc, user) {
  doc.fontSize(12).font('Helvetica-Bold').text('PASSENGER INFORMATION', { underline: true });
  doc.fontSize(10).font('Helvetica');
  doc.text(`Name: ${user.name}`);
  doc.text(`Email: ${user.email}`);
  doc.text(`Phone: ${user.phone}`);
  if (user.idNumber) {
    doc.text(`ID: ${user.idNumber}`);
  }
  doc.moveDown();
}

function addJourneyInfo(doc, booking, bus) {
  doc.fontSize(12).font('Helvetica-Bold').text('JOURNEY DETAILS', { underline: true });
  doc.fontSize(10).font('Helvetica');
  doc.text(`Bus: ${bus.busName} (${bus.busNumber})`);
  doc.text(`Route: ${bus.route.from} → ${bus.route.to}`);
  doc.text(`Date: ${new Date(booking.journeyDate).toLocaleDateString()}`);
  doc.text(`Departure: ${booking.departureTime}`);
  doc.text(`Arrival: ${booking.arrivalTime}`);
  doc.text(`Duration: ${bus.route.duration}`);
  doc.moveDown();
}

function addSeatInfo(doc, booking) {
  doc.fontSize(12).font('Helvetica-Bold').text('SEAT INFORMATION', { underline: true });
  doc.fontSize(10).font('Helvetica');
  doc.text(`Seat(s): ${booking.seatNumbers.join(', ')}`);
  doc.text(`Total Passengers: ${booking.seatNumbers.length}`);
  doc.moveDown();
}

function addFareDetails(doc, booking) {
  doc.fontSize(12).font('Helvetica-Bold').text('FARE DETAILS', { underline: true });
  doc.fontSize(10).font('Helvetica');
  
  const table = {
    headers: ['Description', 'Quantity', 'Price', 'Total'],
    rows: [
      ['Seat Fare', booking.seatNumbers.length, `$${booking.price}`, `$${booking.totalAmount}`],
      ['Tax', '', '', `$${booking.taxAmount || 0}`],
      ['Service Fee', '', '', `$${booking.serviceCharge || 0}`]
    ]
  };
  
  // Simple table implementation
  doc.text(table.headers.join('\t\t'), { continued: true });
  doc.moveDown();
  
  table.rows.forEach(row => {
    doc.text(row.join('\t\t'), { continued: true });
    doc.moveDown();
  });
  
  doc.font('Helvetica-Bold').text(`Grand Total: $${booking.totalAmount + (booking.taxAmount || 0) + (booking.serviceCharge || 0)}`);
  doc.moveDown();
}

async function addQRCode(doc, qrCodeImage) {
  try {
    const qrCodeBuffer = Buffer.from(qrCodeImage.split(',')[1], 'base64');
    doc.image(qrCodeBuffer, 400, doc.y, { width: 100, height: 100 });
    doc.moveDown(6); // Adjust spacing after QR code
  } catch (error) {
    console.warn('Failed to add QR code to PDF:', error.message);
  }
}

function addTermsAndConditions(doc) {
  doc.fontSize(8).font('Helvetica-Oblique').text('Terms & Conditions:', { underline: true });
  doc.fontSize(7).text('• Ticket is non-transferable and valid only for the specified journey.');
  doc.text('• Passenger must arrive at least 30 minutes before departure.');
  doc.text('• Cancellation policies apply as per company terms.');
  doc.text('• EasyLuxury Go is not responsible for lost or stolen tickets.');
  doc.moveDown();
}

function addFooter(doc, message) {
  const bottom = doc.page.margins.bottom;
  doc.y = doc.page.height - bottom - 40;
  
  doc.fontSize(8).font('Helvetica').text(message, { align: 'center' });
  doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
}

async function generateQRCodeData(booking, user, bus) {
  return JSON.stringify({
    type: 'bus_ticket',
    ticketId: booking._id.toString(),
    bookingReference: booking.bookingReference,
    passenger: user.name,
    bus: bus.busNumber,
    route: `${bus.route.from}-${bus.route.to}`,
    date: booking.journeyDate,
    seats: booking.seatNumbers,
    timestamp: new Date().toISOString()
  });
}

// Additional helper functions for receipts and invoices
function addReceiptDetails(doc, payment, booking) {
  doc.fontSize(12).font('Helvetica-Bold').text('RECEIPT DETAILS', { underline: true });
  doc.fontSize(10).font('Helvetica');
  doc.text(`Receipt Number: ${payment.transactionId}`);
  doc.text(`Payment Date: ${new Date(payment.createdAt).toLocaleDateString()}`);
  doc.text(`Booking Reference: ${booking.bookingReference}`);
  doc.text(`Status: ${payment.status.toUpperCase()}`);
  doc.moveDown();
}

function addPaymentBreakdown(doc, payment, booking) {
  doc.fontSize(12).font('Helvetica-Bold').text('PAYMENT BREAKDOWN', { underline: true });
  doc.fontSize(10).font('Helvetica');
  doc.text(`Amount Paid: $${payment.amount}`);
  doc.text(`Payment Method: ${payment.paymentMethod}`);
  doc.text(`Transaction ID: ${payment.gatewayTransactionId || 'N/A'}`);
  doc.moveDown();
}

function addPaymentMethod(doc, payment) {
  doc.fontSize(10).font('Helvetica');
  doc.text(`Payment processed via: ${payment.paymentGateway || 'System'}`);
}

// Error handling wrapper
async function generatePDFWithRetry(generatorFunction, ...args) {
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generatorFunction(...args);
    } catch (error) {
      lastError = error;
      console.warn(`PDF generation attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }
    }
  }
  
  throw new Error(`PDF generation failed after ${maxRetries} attempts: ${lastError.message}`);
}

// Cleanup old files function
function cleanupOldFiles(directory, maxAgeHours = 24) {
  const files = fs.readdirSync(directory);
  const now = Date.now();
  const maxAge = maxAgeHours * 60 * 60 * 1000;
  
  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stats = fs.statSync(filePath);
    
    if (now - stats.mtimeMs > maxAge) {
      fs.unlinkSync(filePath);
    }
  });
}

module.exports = {
  generateTicketPDF,
  generateReceiptPDF,
  generateInvoicePDF,
  generatePDFWithRetry,
  cleanupOldFiles,
  COMPANY_INFO
};