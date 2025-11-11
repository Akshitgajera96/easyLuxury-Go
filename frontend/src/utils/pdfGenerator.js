import jsPDF from 'jspdf'

/**
 * Generates a QR code data URL using free QR code API
 * @param {string} text - Text to encode in QR code
 * @returns {Promise<string>} Data URL of QR code
 */
const generateQRCode = async (text) => {
  try {
    // Use free QR code API from goqr.me (no registration required)
    // Alternative: api.qrserver.com
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`
    
    // Fetch the QR code image
    const response = await fetch(qrApiUrl)
    if (!response.ok) {
      throw new Error('Failed to generate QR code')
    }
    
    // Convert to blob then to data URL
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
    // Fallback: create a simple placeholder
    const canvas = document.createElement('canvas')
    const size = 200
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, size, size)
    ctx.strokeStyle = 'black'
    ctx.lineWidth = 2
    ctx.strokeRect(10, 10, size - 20, size - 20)
    ctx.font = '20px Arial'
    ctx.fillStyle = 'black'
    ctx.textAlign = 'center'
    ctx.fillText('QR CODE', size / 2, size / 2)
    return canvas.toDataURL('image/png')
  }
}

/**
 * Generates a PDF ticket for a booking - IRCTC Style
 * @param {Object} booking - Booking data
 * @param {Object} trip - Trip data (optional, if not in booking)
 * @param {Object} bus - Bus data (optional, if not in booking)
 * @returns {jsPDF} PDF document
 */
export const generateTicketPDF = async (booking, trip = null, bus = null) => {
  const doc = new jsPDF()
  
  // Use data from booking or passed parameters
  const tripData = trip || booking.trip || {}
  const busData = bus || tripData.bus || booking.bus || {}
  
  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }
  
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }
  
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A'
    return `${formatTime(dateString)} ${formatDate(dateString)}`
  }
  
  // Page margins
  const margin = 10
  const pageWidth = 210
  const contentWidth = pageWidth - (margin * 2)
  
  // Draw main border
  doc.setDrawColor(0)
  doc.setLineWidth(0.5)
  doc.rect(margin, margin, contentWidth, 277)
  
  let yPos = margin + 5
  
  // Header - Electronic Reservation Slip
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Electronic Reservation Slip (ERS)', pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 8
  
  // Company Logo/Name (center with decorative design) - SINGLE COLOR
  // Draw logo circle (blue)
  const logoCircleRadius = 5
  const logoCircleX = pageWidth / 2 - 30
  const logoCircleY = yPos + 2
  
  // Blue circle background
  doc.setFillColor(30, 64, 175) // Blue color
  doc.circle(logoCircleX, logoCircleY, logoCircleRadius, 'F')
  
  // White bus icon representation (simplified)
  doc.setFillColor(255, 255, 255)
  doc.rect(logoCircleX - 2.5, logoCircleY - 1.5, 5, 3, 'F')
  
  // Company name - ALL IN BLUE COLOR
  doc.setTextColor(30, 64, 175) // Blue for entire logo
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('easy', logoCircleX + 8, yPos + 4)
  doc.text('Luxury', logoCircleX + 23, yPos + 4)
  doc.setFontSize(14)
  doc.text('GO', logoCircleX + 41, yPos + 4)
  
  // Tagline
  doc.setTextColor(100, 100, 100)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('Travel in Comfort & Style', pageWidth / 2, yPos + 9, { align: 'center' })
  
  // Reset text color
  doc.setTextColor(0, 0, 0)
  
  yPos += 16
  
  // Boarding At Section with subtle blue color
  doc.setFillColor(219, 234, 254) // Light blue
  doc.rect(70, yPos - 4, 70, 6, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 64, 175) // Blue text
  doc.text('Boarding At', pageWidth / 2, yPos, { align: 'center' })
  doc.setTextColor(0, 0, 0) // Reset to black
  
  yPos += 8
  
  // Three column section: Booked From | Boarding Location | To
  const col1X = margin + 5
  const col2X = pageWidth / 2
  const col3X = pageWidth - margin - 50
  
  // Booked From
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Booked From', col1X, yPos)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(tripData.route?.sourceCity || 'N/A', col1X, yPos + 4)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text(`Start Date: ${formatDate(tripData.departureDateTime)}`, col1X, yPos + 8)
  
  // Boarding Location (center)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  const boardingLocation = booking.boardingPoint?.terminal || booking.boardingPoint?.address || tripData.route?.sourceCity || 'N/A'
  doc.text(boardingLocation, col2X, yPos + 2, { align: 'center', maxWidth: 60 })
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Departure: ${formatTime(tripData.departureDateTime)}`, col2X, yPos + 7, { align: 'center' })
  
  // To
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('To', col3X, yPos)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(tripData.route?.destinationCity || 'N/A', col3X, yPos + 4)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text(`Arrival: ${formatTime(tripData.arrivalDateTime)}`, col3X, yPos + 8)
  
  yPos += 14
  
  // Horizontal line
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 5
  
  // Info Grid - PNR, Bus No, Class, etc.
  const gridY = yPos
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  
  // Row 1: PNR | Bus No./Name | Class
  doc.text('PNR', col1X, gridY)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(booking.pnr || booking._id?.slice(-8).toUpperCase() || 'N/A', col1X, gridY + 4)
  
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('Bus No./Name', col2X - 20, gridY)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(busData.busNumber || 'N/A', col2X - 20, gridY + 4)
  
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('Class', col3X, gridY)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(busData.seatType?.toUpperCase() || 'STANDARD', col3X, gridY + 4)
  
  yPos = gridY + 10
  
  // Row 2: Quota | Distance | Booking Date
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('Quota', col1X, yPos)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('GN', col1X, yPos + 4)
  
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('Distance', col2X - 20, yPos)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(tripData.distance ? `${tripData.distance} KM` : 'N/A', col2X - 20, yPos + 4)
  
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('Booking Date', col3X, yPos)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  const bookingDateTime = new Date(booking.createdAt || new Date()).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
  doc.text(bookingDateTime, col3X, yPos + 4)
  
  yPos += 10
  
  // Horizontal line
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 5
  
  // Passenger Details Table
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 64, 175) // Blue
  doc.text('Passenger Details:', margin + 5, yPos)
  doc.setTextColor(0, 0, 0) // Reset to black
  yPos += 5
  
  // Table header with light background
  const tableStartY = yPos
  doc.setDrawColor(0)
  doc.setLineWidth(0.2)
  doc.line(margin, tableStartY, pageWidth - margin, tableStartY)
  
  // Background for header row
  doc.setFillColor(240, 248, 255) // Light blue background
  doc.rect(margin, tableStartY, contentWidth, 6, 'F')
  
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  // Fixed column positions for consistent table layout
  const slnoX = margin + 5
  const nameX = margin + 15
  const ageX = margin + 80   // Adjusted for better spacing
  const genderX = margin + 105  // Adjusted
  const seatX = margin + 135   // Adjusted
  const statusX = margin + 165 // Adjusted
  
  yPos += 4
  doc.text('No', slnoX, yPos)
  doc.text('Name', nameX, yPos)
  doc.text('Age', ageX, yPos)
  doc.text('Gender', genderX, yPos)
  doc.text('Seat Number', seatX, yPos)
  doc.text('Booking Status', statusX, yPos)
  yPos += 2
  doc.line(margin, yPos, pageWidth - margin, yPos)
  
  // Passenger rows
  doc.setFont('helvetica', 'normal')
  const seats = booking.seats || []
  seats.forEach((seat, index) => {
    yPos += 4
    doc.text((index + 1).toString(), slnoX, yPos)
    doc.text(seat.passengerName || 'N/A', nameX, yPos)
    doc.text((seat.passengerAge || 'N/A').toString(), ageX, yPos)
    doc.text(seat.passengerGender || 'N/A', genderX, yPos)
    doc.text(seat.seatNumber || 'N/A', seatX, yPos)
    doc.text(booking.bookingStatus?.toUpperCase() || 'CONFIRMED', statusX, yPos)
  })
  
  yPos += 2
  doc.line(margin, yPos, pageWidth - margin, yPos)
  
  yPos += 5
  
  // Transaction ID
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text(`Transaction ID: ${booking._id || 'N/A'}`, margin + 5, yPos)
  
  yPos += 6
  
  // Horizontal line
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 5
  
  // Payment Details
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 64, 175) // Blue
  doc.text('Payment Details', margin + 5, yPos)
  doc.setTextColor(0, 0, 0) // Reset to black
  yPos += 5
  
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  
  // Calculate fare breakdown
  const ticketFare = booking.totalAmount || 0
  const convenienceFee = 0
  const insurancePremium = 0
  const cancellationPremium = 0
  const pgCharges = 0
  const totalFare = ticketFare
  
  // Define column positions for better alignment
  const labelX = margin + 10
  const valueX = pageWidth - margin - 15
  
  // Generate QR code with URL to view ticket online
  const frontendUrl = window.location.origin || 'https://easyluxurygo.com'
  const ticketViewUrl = `${frontendUrl}/view-ticket?pnr=${booking.pnr || booking._id?.slice(-8) || 'N/A'}`
  const qrCodeImage = await generateQRCode(ticketViewUrl)
  
  // Payment details (no QR code here anymore)
  doc.text('Ticket Fare:', labelX, yPos)
  doc.text(`Rs ${ticketFare.toFixed(2)}`, valueX, yPos, { align: 'right' })
  yPos += 4
  
  doc.text('Convenience Fee (Incl of GST):', labelX, yPos)
  doc.text(`Rs ${convenienceFee.toFixed(2)}`, valueX, yPos, { align: 'right' })
  yPos += 4
  
  doc.text('Travel Insurance Premium (Incl of GST):', labelX, yPos)
  doc.text(`Rs ${insurancePremium.toFixed(2)}`, valueX, yPos, { align: 'right' })
  yPos += 4
  
  doc.text('Free Cancellation Premium (Incl of GST):', labelX, yPos)
  doc.text(`Rs ${cancellationPremium.toFixed(2)}`, valueX, yPos, { align: 'right' })
  yPos += 4
  
  doc.text('PG Charges:', labelX, yPos)
  doc.text(`Rs ${pgCharges.toFixed(2)}`, valueX, yPos, { align: 'right' })
  yPos += 4
  
  doc.setFont('helvetica', 'bold')
  doc.text('Total Fare:', labelX, yPos)
  doc.text(`Rs ${totalFare.toFixed(2)}`, valueX, yPos, { align: 'right' })
  
  yPos += 10
  
  // Horizontal line
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 4
  
  // Important Instructions
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 64, 175) // Blue
  doc.text('INSTRUCTIONS:', margin + 5, yPos)
  doc.setTextColor(0, 0, 0) // Reset to black
  yPos += 4
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  
  const instructions = [
    '1. Prescribed Original ID proofs are - Voter Identity Card / Passport / PAN Card / Driving License / Photo ID card issued by Central / State Govt.',
    '2. The bus ticket is booked on a personal User ID. Cancellation charges and automatic refund of the ticket amount after deducting the applicable',
    '   CLEARAGE by EasyLuxury Go shall be credited to the account used for payment for booking of the ticket.',
    '3. Passengers traveling on a fully waitlisted e-ticket will be treated as Ticketless.',
    '4. Obtain certificate from the bus conductor if you board when LESS THAN 4 PASSENGERS travel. This original certificate must be sent to SEAT',
    '   office within 3 days from the date of journey specifying Ticket Booking details along with prescribed time for filing refund.',
    '5. In case ticket is lost / misplaced, if ticket issued for travel of more than one passenger, some passengers have confirmed reservation and',
    '   others are on waiting list, full refund of fare, less clerkage shall be admissible for confirmed passengers only, not having done the journey.',
    '6. In case bus is late more than 3 hours, refund is admissible as per rules.',
    '7. This ticket will be cancelled and forfeited without any refund of money, under section 7A(3) of the Bus Travel Act.',
    '8. For details, Rules, Refund rules, Terms & Conditions visit: www.easyluxurygo.com',
    '9. The bus driver and conductor will verify your ticket before boarding the bus. You are advised to carry a valid ID proof.',
    '10. For your safety, carry your prescribed ID proof and follow bus safety guidelines throughout your journey.'
  ]
  
  instructions.forEach((instruction) => {
    const lines = doc.splitTextToSize(instruction, contentWidth - 10)
    lines.forEach((line) => {
      if (yPos > 270) return // Don't exceed page
      doc.text(line, margin + 5, yPos)
      yPos += 3
    })
  })
  
  // Add QR code at bottom left (above footer)
  const footerY = 280
  const qrSize = 20
  const qrX = margin + 5
  const qrY = footerY - qrSize - 5
  
  if (qrCodeImage) {
    try {
      doc.addImage(qrCodeImage, 'PNG', qrX, qrY, qrSize, qrSize)
      // Add border around QR code
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.3)
      doc.rect(qrX, qrY, qrSize, qrSize)
    } catch (error) {
      console.error('Error adding QR code:', error)
      // Fallback: draw border with text
      doc.setDrawColor(0)
      doc.rect(qrX, qrY, qrSize, qrSize)
      doc.setFontSize(6)
      doc.text('QR', qrX + qrSize/2, qrY + qrSize/2, { align: 'center' })
    }
  } else {
    // Fallback: draw border with text
    doc.setDrawColor(0)
    doc.rect(qrX, qrY, qrSize, qrSize)
    doc.setFontSize(6)
    doc.text('QR', qrX + qrSize/2, qrY + qrSize/2, { align: 'center' })
  }
  
  // Footer with contact info
  doc.setDrawColor(0)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6)
  doc.text('Contact us on: care@easyluxurygo.com OR 24/7 Customer Support at 1800-123-4567', pageWidth / 2, footerY, { align: 'center' })
  
  return doc
}

/**
 * Downloads a PDF ticket
 * @param {Object} booking - Booking data
 * @param {Object} trip - Trip data (optional)
 * @param {Object} bus - Bus data (optional)
 */
export const downloadTicketPDF = async (booking, trip = null, bus = null) => {
  const doc = await generateTicketPDF(booking, trip, bus)
  const fileName = `EasyLuxuryGo_Ticket_${booking.pnr || booking._id?.slice(-8) || 'ticket'}.pdf`
  doc.save(fileName)
}

/**
 * Shares a ticket (downloads PDF and uses Web Share API if available)
 * @param {Object} booking - Booking data
 * @param {Object} trip - Trip data (optional)
 * @param {Object} bus - Bus data (optional)
 */
export const shareTicket = async (booking, trip = null, bus = null) => {
  const doc = await generateTicketPDF(booking, trip, bus)
  const fileName = `EasyLuxuryGo_Ticket_${booking.pnr || booking._id?.slice(-8) || 'ticket'}.pdf`
  
  // Convert PDF to Blob
  const pdfBlob = doc.output('blob')
  
  // Check if Web Share API is available and supports files
  if (navigator.share && navigator.canShare) {
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' })
    
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: 'EasyLuxury Go - Bus Ticket',
          text: `Bus Ticket - PNR: ${booking.pnr || 'N/A'}`,
          files: [file]
        })
        return { success: true, method: 'native' }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error)
        }
        // Fall through to download if share fails
      }
    }
  }
  
  // Fallback: just download the file
  doc.save(fileName)
  return { success: true, method: 'download' }
}
