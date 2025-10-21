import jsPDF from 'jspdf'

/**
 * Generates a PDF ticket for a booking
 * @param {Object} booking - Booking data
 * @param {Object} trip - Trip data (optional, if not in booking)
 * @param {Object} bus - Bus data (optional, if not in booking)
 * @returns {jsPDF} PDF document
 */
export const generateTicketPDF = (booking, trip = null, bus = null) => {
  const doc = new jsPDF()
  
  // Use data from booking or passed parameters
  const tripData = trip || booking.trip || {}
  const busData = bus || tripData.bus || booking.bus || {}
  
  // Colors
  const primaryColor = [34, 197, 94] // green-500
  const secondaryColor = [75, 85, 99] // gray-600
  const lightGray = [243, 244, 246] // gray-100
  
  // Helper function to format date
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }
  
  let yPos = 20
  
  // Header - Company Name with background
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, 210, 35, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('EASYLUXURY GO', 105, 20, { align: 'center' })
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('BUS TICKET', 105, 28, { align: 'center' })
  
  yPos = 45
  
  // Reset text color
  doc.setTextColor(0, 0, 0)
  
  // PNR and Booking ID Section
  doc.setFillColor(...lightGray)
  doc.rect(15, yPos, 180, 25, 'F')
  
  doc.setFontSize(10)
  doc.setTextColor(...secondaryColor)
  doc.text('PNR Number', 20, yPos + 8)
  doc.text('Booking Date', 120, yPos + 8)
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text(booking.pnr || booking._id?.slice(-8).toUpperCase() || 'N/A', 20, yPos + 16)
  doc.text(formatDateTime(booking.createdAt || new Date()), 120, yPos + 16)
  
  yPos += 35
  
  // Trip Details Section
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...primaryColor)
  doc.text('TRIP DETAILS', 15, yPos)
  yPos += 8
  
  // Route
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...secondaryColor)
  doc.text('Route', 20, yPos)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  const route = `${tripData.route?.sourceCity || 'N/A'} → ${tripData.route?.destinationCity || 'N/A'}`
  doc.text(route, 20, yPos + 7)
  yPos += 18
  
  // Departure and Arrival in two columns
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...secondaryColor)
  doc.text('Departure', 20, yPos)
  doc.text('Arrival', 120, yPos)
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text(formatDateTime(tripData.departureDateTime), 20, yPos + 7)
  doc.text(formatDateTime(tripData.arrivalDateTime), 120, yPos + 7)
  yPos += 20
  
  // Bus Details
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...secondaryColor)
  doc.text('Bus Number', 20, yPos)
  doc.text('Bus Type', 120, yPos)
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text(busData.busNumber || 'N/A', 20, yPos + 7)
  doc.text(busData.busType?.toUpperCase() || 'N/A', 120, yPos + 7)
  yPos += 18
  
  if (busData.operator) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...secondaryColor)
    doc.text('Operator', 20, yPos)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(busData.operator, 20, yPos + 7)
    yPos += 18
  }
  
  yPos += 5
  
  // Passenger Details Section
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...primaryColor)
  doc.text('PASSENGER DETAILS', 15, yPos)
  yPos += 8
  
  // Table header
  doc.setFillColor(...lightGray)
  doc.rect(15, yPos, 180, 8, 'F')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('Seat', 20, yPos + 6)
  doc.text('Name', 50, yPos + 6)
  doc.text('Age', 120, yPos + 6)
  doc.text('Gender', 150, yPos + 6)
  yPos += 10
  
  // Passenger rows
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  
  const seats = booking.seats || []
  seats.forEach((seat, index) => {
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }
    
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250)
      doc.rect(15, yPos - 5, 180, 8, 'F')
    }
    
    doc.text(seat.seatNumber || 'N/A', 20, yPos)
    doc.text(seat.passengerName || 'N/A', 50, yPos)
    doc.text((seat.passengerAge || 'N/A').toString(), 120, yPos)
    doc.text(seat.passengerGender || 'N/A', 150, yPos)
    yPos += 8
  })
  
  yPos += 5
  
  // Boarding & Drop Points
  if (yPos > 230) {
    doc.addPage()
    yPos = 20
  }
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...primaryColor)
  doc.text('BOARDING & DROP POINTS', 15, yPos)
  yPos += 8
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...secondaryColor)
  doc.text('Boarding Point', 20, yPos)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  const boardingText = booking.boardingPoint?.address || booking.boardingPoint || 'N/A'
  const boardingTime = booking.boardingPoint?.time || 'TBD'
  doc.text(`${boardingText} at ${boardingTime}`, 20, yPos + 7, { maxWidth: 170 })
  yPos += 18
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...secondaryColor)
  doc.text('Dropping Point', 20, yPos)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  const droppingText = booking.droppingPoint?.address || booking.droppingPoint || 'N/A'
  const droppingTime = booking.droppingPoint?.time || 'TBD'
  doc.text(`${droppingText} at ${droppingTime}`, 20, yPos + 7, { maxWidth: 170 })
  yPos += 20
  
  // Payment Details
  if (yPos > 230) {
    doc.addPage()
    yPos = 20
  }
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...primaryColor)
  doc.text('PAYMENT DETAILS', 15, yPos)
  yPos += 8
  
  doc.setFillColor(...lightGray)
  doc.rect(15, yPos, 180, 25, 'F')
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...secondaryColor)
  doc.text('Total Amount', 20, yPos + 8)
  doc.text('Payment Method', 20, yPos + 16)
  
  doc.text('Payment Status', 120, yPos + 8)
  doc.text('Booking Status', 120, yPos + 16)
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text(`₹${booking.totalAmount || 0}`, 70, yPos + 8)
  doc.text((booking.paymentMethod || 'N/A').toUpperCase(), 70, yPos + 16)
  doc.text((booking.paymentStatus || 'N/A').toUpperCase(), 165, yPos + 8)
  doc.text((booking.bookingStatus || 'CONFIRMED').toUpperCase(), 165, yPos + 16)
  
  yPos += 35
  
  // Amenities (if available)
  if (busData.amenities && busData.amenities.length > 0) {
    if (yPos > 240) {
      doc.addPage()
      yPos = 20
    }
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...primaryColor)
    doc.text('AMENITIES', 15, yPos)
    yPos += 8
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    
    busData.amenities.forEach((amenity) => {
      doc.text(`✓ ${amenity.toUpperCase()}`, 20, yPos)
      yPos += 6
    })
    
    yPos += 5
  }
  
  // Footer
  const footerY = 280
  doc.setDrawColor(...primaryColor)
  doc.line(15, footerY - 5, 195, footerY - 5)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...primaryColor)
  doc.text('Thank you for choosing EasyLuxury Go!', 105, footerY, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...secondaryColor)
  doc.text('Have a safe journey!', 105, footerY + 5, { align: 'center' })
  doc.text('support@easyluxurygo.com | www.easyluxurygo.com', 105, footerY + 10, { align: 'center' })
  
  return doc
}

/**
 * Downloads a PDF ticket
 * @param {Object} booking - Booking data
 * @param {Object} trip - Trip data (optional)
 * @param {Object} bus - Bus data (optional)
 */
export const downloadTicketPDF = (booking, trip = null, bus = null) => {
  const doc = generateTicketPDF(booking, trip, bus)
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
  const doc = generateTicketPDF(booking, trip, bus)
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
