// FILE: backend/utils/seatAllocator.js
/**
 * Seat allocation utility for bus seat management
 * Handles seat selection, allocation, and validation
 */

const { SEAT_STATUS } = require('../constants/enums');

/**
 * Generate seat layout for a bus
 * @param {number} totalSeats - Total number of seats
 * @param {string} seatType - Type of seats (sleeper, semi_sleeper, seater)
 * @returns {object} Seat layout configuration
 */
const generateSeatLayout = (totalSeats, seatType) => {
  let seatsPerRow, rows;
  
  switch (seatType) {
    case 'sleeper':
      seatsPerRow = 1;
      rows = totalSeats;
      break;
    case 'semi_sleeper':
      seatsPerRow = 2;
      rows = Math.ceil(totalSeats / seatsPerRow);
      break;
    case 'seater':
    default:
      seatsPerRow = 2;
      rows = Math.ceil(totalSeats / seatsPerRow);
      break;
  }

  const seatNumbers = [];
  for (let i = 1; i <= totalSeats; i++) {
    const row = Math.ceil(i / seatsPerRow);
    const seatLetter = seatType === 'sleeper' ? '' : 
                      (i % seatsPerRow === 1 ? 'A' : 'B');
    const seatNumber = seatType === 'sleeper' ? `S${i}` : `${row}${seatLetter}`;
    seatNumbers.push(seatNumber);
  }

  return {
    lowerDeck: {
      rows,
      seatsPerRow,
      seatNumbers
    },
    upperDeck: {
      rows: 0,
      seatsPerRow: 0,
      seatNumbers: []
    }
  };
};

/**
 * Get seat status for all seats in a trip
 * @param {object} trip - Trip object with bookedSeats
 * @param {array} lockedSeats - Array of currently locked seats
 * @returns {object} Seat status mapping
 */
const getSeatStatus = (trip, lockedSeats = []) => {
  const seatStatus = {};
  const bookedSeatNumbers = trip.bookedSeats.map(seat => seat.seatNumber);
  
  // Get all possible seat numbers from bus layout
  const allSeats = [...trip.bus.seatLayout.lowerDeck.seatNumbers, ...trip.bus.seatLayout.upperDeck.seatNumbers];
  
  allSeats.forEach(seat => {
    if (bookedSeatNumbers.includes(seat)) {
      seatStatus[seat] = SEAT_STATUS.BOOKED;
    } else if (lockedSeats.includes(seat)) {
      seatStatus[seat] = SEAT_STATUS.SELECTED;
    } else {
      seatStatus[seat] = SEAT_STATUS.AVAILABLE;
    }
  });
  
  return seatStatus;
};

/**
 * Validate seat selection
 * @param {array} selectedSeats - Array of selected seat numbers
 * @param {object} trip - Trip object
 * @param {array} lockedSeats - Array of locked seats
 * @returns {object} Validation result with isValid and message
 */
const validateSeatSelection = (selectedSeats, trip, lockedSeats = []) => {
  if (!selectedSeats || selectedSeats.length === 0) {
    return { isValid: false, message: 'No seats selected' };
  }

  // Check if seats exist in bus layout
  const allSeats = [...trip.bus.seatLayout.lowerDeck.seatNumbers, ...trip.bus.seatLayout.upperDeck.seatNumbers];
  const invalidSeats = selectedSeats.filter(seat => !allSeats.includes(seat));
  
  if (invalidSeats.length > 0) {
    return { isValid: false, message: `Invalid seats: ${invalidSeats.join(', ')}` };
  }

  // Check if seats are already booked
  const bookedSeats = trip.bookedSeats.map(seat => seat.seatNumber);
  const alreadyBooked = selectedSeats.filter(seat => bookedSeats.includes(seat));
  
  if (alreadyBooked.length > 0) {
    return { isValid: false, message: `Seats already booked: ${alreadyBooked.join(', ')}` };
  }

  // Check if seats are currently locked by other users
  const lockedByOthers = selectedSeats.filter(seat => 
    lockedSeats.includes(seat) && !bookedSeats.includes(seat)
  );
  
  if (lockedByOthers.length > 0) {
    return { isValid: false, message: `Seats currently unavailable: ${lockedByOthers.join(', ')}` };
  }

  // Check maximum seats per booking
  if (selectedSeats.length > 6) {
    return { isValid: false, message: 'Cannot book more than 6 seats at once' };
  }

  return { isValid: true, message: 'Seat selection is valid' };
};

/**
 * Get adjacent seats for group booking
 * @param {array} availableSeats - Array of available seat numbers
 * @param {number} groupSize - Number of adjacent seats needed
 * @returns {array} Array of adjacent seat groups
 */
const findAdjacentSeats = (availableSeats, groupSize) => {
  if (groupSize <= 1) return availableSeats.map(seat => [seat]);
  
  const adjacentGroups = [];
  const seatMap = new Map();
  
  // Create mapping of row numbers to seats
  availableSeats.forEach(seat => {
    const row = parseInt(seat.match(/\d+/)[0]);
    if (!seatMap.has(row)) {
      seatMap.set(row, []);
    }
    seatMap.get(row).push(seat);
  });
  
  // Find adjacent seats in same row
  for (const [row, seats] of seatMap) {
    if (seats.length >= groupSize) {
      // Sort seats by position (A before B)
      const sortedSeats = seats.sort();
      
      for (let i = 0; i <= sortedSeats.length - groupSize; i++) {
        const group = sortedSeats.slice(i, i + groupSize);
        adjacentGroups.push(group);
      }
    }
  }
  
  return adjacentGroups;
};

/**
 * Calculate seat fare based on position and type
 * @param {string} seatNumber - Seat number
 * @param {number} baseFare - Base fare for the trip
 * @param {string} seatType - Type of seat
 * @returns {number} Calculated fare for the seat
 */
const calculateSeatFare = (seatNumber, baseFare, seatType) => {
  let multiplier = 1.0;
  
  // Premium pricing for certain seat positions
  if (seatType === 'sleeper') {
    // Sleeper seats might have different pricing
    multiplier = 1.2;
  } else {
    // For regular seats, window seats might be premium
    if (seatNumber.endsWith('A')) {
      multiplier = 1.1; // Window seat premium
    }
  }
  
  return Math.round(baseFare * multiplier);
};

module.exports = {
  generateSeatLayout,
  getSeatStatus,
  validateSeatSelection,
  findAdjacentSeats,
  calculateSeatFare
};