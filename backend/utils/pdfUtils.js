// FILE: backend/utils/pdfUtils.js
/**
 * PDF generation utility for tickets and invoices
 * Uses pdfkit for PDF generation
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate booking ticket PDF
 * @param {object} booking - Booking object
 * @param {object} user - User object
 * @returns {Promise<Buffer>} PDF buffer
 */
const generateTicketPDF = async (booking, user) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header
      doc.fillColor('#0A192F')
         .fontSize(20)
         .text('easyLuxury Go', 50, 50)
         .fillColor('#FFCA28')
         .fontSize(16)
         .text('E-Ticket', 400, 50)
         .fillColor('#333')
         .fontSize(10)
         .text(`Generated: ${new Date().toLocaleString()}`, 400, 70);

      // Booking Details
      doc.fontSize(14)
         .text('BOOKING DETAILS', 50, 120)
         .moveDown(0.5);

      doc.fontSize(10)
         .text(`PNR Number: ${booking.pnrNumber}`, 50, 150)
         .text(`Booking Date: ${new Date(booking.createdAt).toLocaleString()}`, 50, 165)
         .text(`Status: ${booking.bookingStatus.toUpperCase()}`, 50, 180);

      // Passenger Details
      doc.fontSize(14)
         .text('PASSENGER DETAILS', 50, 220)
         .moveDown(0.5);

      let passengerY = 250;
      booking.seats.forEach((seat, index) => {
        doc.fontSize(10)
           .text(`Passenger ${index + 1}:`, 50, passengerY)
           .text(`Name: ${seat.passengerName}`, 150, passengerY)
           .text(`Seat: ${seat.seatNumber}`, 300, passengerY)
           .text(`Age: ${seat.passengerAge} | Gender: ${seat.passengerGender}`, 400, passengerY);
        passengerY += 20;
      });

      // Trip Details
      doc.fontSize(14)
         .text('TRIP DETAILS', 50, passengerY + 20)
         .moveDown(0.5);

      doc.fontSize(10)
         .text(`Route: ${booking.trip.route.source.city} to ${booking.trip.route.destination.city}`, 50, passengerY + 50)
         .text(`Departure: ${new Date(booking.trip.departureDateTime).toLocaleString()}`, 50, passengerY + 65)
         .text(`Arrival: ${new Date(booking.trip.arrivalDateTime).toLocaleString()}`, 50, passengerY + 80)
         .text(`Bus: ${booking.trip.bus.busName} (${booking.trip.bus.busNumber})`, 50, passengerY + 95)
         .text(`Operator: ${booking.trip.bus.operator}`, 50, passengerY + 110);

      // Boarding Point
      doc.fontSize(14)
         .text('BOARDING POINT', 50, passengerY + 140)
         .moveDown(0.5);

      doc.fontSize(10)
         .text(`Terminal: ${booking.boardingPoint.terminal}`, 50, passengerY + 170)
         .text(`Address: ${booking.boardingPoint.address}`, 50, passengerY + 185)
         .text(`Reporting Time: ${booking.boardingPoint.time}`, 50, passengerY + 200);

      // Payment Details
      doc.fontSize(14)
         .text('PAYMENT DETAILS', 300, passengerY + 140)
         .moveDown(0.5);

      doc.fontSize(10)
         .text(`Total Amount: ₹${booking.totalAmount}`, 300, passengerY + 170)
         .text(`Payment Method: ${booking.paymentMethod.toUpperCase()}`, 300, passengerY + 185)
         .text(`Payment Status: ${booking.paymentStatus.toUpperCase()}`, 300, passengerY + 200);

      // Footer
      doc.fontSize(8)
         .text('Please carry a valid government-issued ID proof for verification.', 50, 700)
         .text('Report at the boarding point 30 minutes before departure.', 50, 715)
         .text('For support, contact: support@easyluxury.com | Phone: 1800-123-4567', 50, 730);

      // QR Code placeholder
      doc.rect(400, 600, 100, 100).stroke();
      doc.fontSize(8).text('QR Code', 425, 650);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate invoice PDF
 * @param {object} booking - Booking object
 * @param {object} user - User object
 * @returns {Promise<Buffer>} PDF buffer
 */
const generateInvoicePDF = async (booking, user) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header
      doc.fillColor('#0A192F')
         .fontSize(20)
         .text('easyLuxury Go', 50, 50)
         .fillColor('#333')
         .fontSize(16)
         .text('TAX INVOICE', 400, 50)
         .fontSize(10)
         .text(`Invoice Date: ${new Date().toLocaleString()}`, 400, 70);

      // Customer Details
      doc.fontSize(14)
         .text('BILL TO:', 50, 120)
         .moveDown(0.5);

      doc.fontSize(10)
         .text(`Name: ${user.name}`, 50, 150)
         .text(`Email: ${user.email}`, 50, 165)
         .text(`Phone: ${user.phone || 'N/A'}`, 50, 180);

      // Booking Details
      doc.fontSize(14)
         .text('INVOICE DETAILS', 50, 220)
         .moveDown(0.5);

      doc.fontSize(10)
         .text(`Invoice Number: INV-${booking.pnrNumber}`, 50, 250)
         .text(`PNR Number: ${booking.pnrNumber}`, 50, 265)
         .text(`Booking Date: ${new Date(booking.createdAt).toLocaleString()}`, 50, 280);

      // Itemized Bill
      doc.fontSize(14)
         .text('BILL BREAKDOWN', 50, 320)
         .moveDown(0.5);

      // Table Headers
      doc.fontSize(10)
         .text('Description', 50, 350)
         .text('Quantity', 300, 350)
         .text('Unit Price', 350, 350)
         .text('Amount', 450, 350);

      // Draw line
      doc.moveTo(50, 360).lineTo(500, 360).stroke();

      let yPosition = 370;
      
      // Base fare
      const seatCount = booking.seats.length;
      const baseFare = booking.totalAmount / seatCount;
      
      booking.seats.forEach((seat, index) => {
        doc.text(`Seat ${seat.seatNumber} - ${seat.passengerName}`, 50, yPosition)
           .text('1', 300, yPosition)
           .text(`₹${baseFare}`, 350, yPosition)
           .text(`₹${baseFare}`, 450, yPosition);
        yPosition += 15;
      });

      // Promo code discount
      if (booking.promoCode && booking.promoCode.discountAmount > 0) {
        yPosition += 10;
        doc.text('Promo Code Discount', 50, yPosition)
           .text('-', 300, yPosition)
           .text('-', 350, yPosition)
           .text(`-₹${booking.promoCode.discountAmount}`, 450, yPosition);
      }

      // Total
      yPosition += 20;
      doc.moveTo(50, yPosition).lineTo(500, yPosition).stroke();
      yPosition += 10;
      
      doc.fontSize(12)
         .text('TOTAL AMOUNT', 50, yPosition)
         .text(`₹${booking.totalAmount}`, 450, yPosition);

      // Payment Details
      doc.fontSize(14)
         .text('PAYMENT INFORMATION', 50, yPosition + 40)
         .moveDown(0.5);

      doc.fontSize(10)
         .text(`Payment Method: ${booking.paymentMethod.toUpperCase()}`, 50, yPosition + 70)
         .text(`Payment Status: ${booking.paymentStatus.toUpperCase()}`, 50, yPosition + 85)
         .text(`Transaction Date: ${new Date(booking.createdAt).toLocaleString()}`, 50, yPosition + 100);

      // Footer
      doc.fontSize(8)
         .text('This is a computer-generated invoice. No signature required.', 50, 700)
         .text('Thank you for choosing easyLuxury Go!', 50, 715)
         .text('For queries: support@easyluxury.com | GSTIN: 29AABCE1234F1Z2', 50, 730);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Save PDF to file (for development/testing)
 * @param {Buffer} pdfBuffer - PDF buffer
 * @param {string} filename - File name
 * @returns {string} File path
 */
const savePDFToFile = (pdfBuffer, filename) => {
  const filePath = path.join(__dirname, '../temp', filename);
  
  // Ensure temp directory exists
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, pdfBuffer);
  return filePath;
};

module.exports = {
  generateTicketPDF,
  generateInvoicePDF,
  savePDFToFile
};