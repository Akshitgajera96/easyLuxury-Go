const Bus = require('../models/Bus');
const Booking = require('../models/Booking');

// Seat allocation strategies
const ALLOCATION_STRATEGIES = {
  WINDOW_FIRST: 'window_first',
  AISLE_FIRST: 'aisle_first',
  TOGETHER: 'together',
  RANDOM: 'random',
  PREFERRED: 'preferred'
};

// Seat types for better allocation logic
const SEAT_TYPES = {
  WINDOW: 'window',
  AISLE: 'aisle',
  MIDDLE: 'middle'
};

/**
 * Get seat type based on seat number and bus layout
 */
function getSeatType(seatNumber, totalSeats, seatsPerRow = 4) {
  const seatsInRow = seatNumber % seatsPerRow || seatsPerRow;
  
  if (seatsInRow === 1 || seatsInRow === seatsPerRow) {
    return SEAT_TYPES.WINDOW;
  } else if (seatsInRow === 2 || seatsInRow === seatsPerRow - 1) {
    return SEAT_TYPES.AISLE;
  }
  return SEAT_TYPES.MIDDLE;
}

/**
 * Check if seats are adjacent
 */
function areSeatsAdjacent(seat1, seat2, seatsPerRow = 4) {
  const row1 = Math.ceil(seat1 / seatsPerRow);
  const row2 = Math.ceil(seat2 / seatsPerRow);
  
  if (row1 !== row2) return false;
  
  const position1 = (seat1 - 1) % seatsPerRow;
  const position2 = (seat2 - 1) % seatsPerRow;
  
  return Math.abs(position1 - position2) === 1;
}

/**
 * Get optimal seat layout configuration
 */
function getSeatLayout(totalSeats, seatsPerRow = 4) {
  const rows = Math.ceil(totalSeats / seatsPerRow);
  const layout = [];
  
  for (let row = 1; row <= rows; row++) {
    const rowSeats = [];
    for (let seat = 1; seat <= seatsPerRow; seat++) {
      const seatNumber = (row - 1) * seatsPerRow + seat;
      if (seatNumber <= totalSeats) {
        rowSeats.push({
          number: seatNumber,
          type: getSeatType(seatNumber, totalSeats, seatsPerRow),
          row: row,
          position: seat
        });
      }
    }
    layout.push(rowSeats);
  }
  
  return layout;
}

/**
 * Get all available seats for a bus on a specific date
 */
async function getAvailableSeats(busId, date) {
  if (!busId || !date) {
    throw new Error('Bus ID and date are required');
  }

  const bus = await Bus.findById(busId);
  if (!bus) throw new Error('Bus not found');

  // Get all bookings for this bus on the specified date
  const existingBookings = await Booking.find({
    bus: busId,
    date: date,
    status: { $in: ['confirmed', 'pending'] }
  });

  const bookedSeats = new Set();
  existingBookings.forEach(booking => {
    booking.seatNumbers.forEach(seat => bookedSeats.add(seat));
  });

  const allSeats = Array.from({ length: bus.totalSeats }, (_, i) => i + 1);
  const availableSeats = allSeats.filter(seat => !bookedSeats.has(seat));

  return {
    totalSeats: bus.totalSeats,
    availableSeats,
    bookedSeats: Array.from(bookedSeats),
    availableOnline: availableSeats.filter(seat => seat <= bus.availableOnlineSeats),
    availableOffline: availableSeats.filter(seat => seat > bus.availableOnlineSeats)
  };
}

/**
 * Allocate seats on a bus with advanced strategies
 */
async function allocateSeats(busId, seatCount, options = {}) {
  const {
    preferredSeats = [],
    strategy = ALLOCATION_STRATEGIES.WINDOW_FIRST,
    requireTogether = false,
    date = new Date().toISOString().split('T')[0],
    seatsPerRow = 4
  } = options;

  // Input validation
  if (!busId || !seatCount || seatCount <= 0) {
    throw new Error('Invalid bus ID or seat count');
  }

  if (seatCount > 10) {
    throw new Error('Cannot allocate more than 10 seats at once');
  }

  const bus = await Bus.findById(busId);
  if (!bus) throw new Error('Bus not found');

  // Get available seats
  const availability = await getAvailableSeats(busId, date);
  
  if (availability.availableSeats.length < seatCount) {
    throw new Error(`Not enough seats available. Requested: ${seatCount}, Available: ${availability.availableSeats.length}`);
  }

  let allocatedSeats = [];

  // Strategy-based allocation
  switch (strategy) {
    case ALLOCATION_STRATEGIES.PREFERRED:
      allocatedSeats = allocatePreferredSeats(availability, preferredSeats, seatCount);
      break;
    
    case ALLOCATION_STRATEGIES.WINDOW_FIRST:
      allocatedSeats = allocateWindowSeatsFirst(availability, seatCount, seatsPerRow);
      break;
    
    case ALLOCATION_STRATEGIES.AISLE_FIRST:
      allocatedSeats = allocateAisleSeatsFirst(availability, seatCount, seatsPerRow);
      break;
    
    case ALLOCATION_STRATEGIES.TOGETHER:
      allocatedSeats = allocateTogetherSeats(availability, seatCount, seatsPerRow);
      break;
    
    case ALLOCATION_STRATEGIES.RANDOM:
      allocatedSeats = allocateRandomSeats(availability, seatCount);
      break;
    
    default:
      allocatedSeats = allocateWindowSeatsFirst(availability, seatCount, seatsPerRow);
  }

  // Ensure seats are together if required
  if (requireTogether && !areSeatsTogether(allocatedSeats, seatsPerRow)) {
    const togetherSeats = allocateTogetherSeats(availability, seatCount, seatsPerRow);
    if (togetherSeats.length === seatCount) {
      allocatedSeats = togetherSeats;
    } else {
      console.warn('Could not allocate seats together. Returning best available.');
    }
  }

  // Validate allocation is within online quota
  const onlineSeats = allocatedSeats.filter(seat => seat <= bus.availableOnlineSeats);
  if (onlineSeats.length < allocatedSeats.length) {
    throw new Error('Not enough online seats available for allocation');
  }

  return {
    allocatedSeats,
    strategyUsed: strategy,
    areTogether: areSeatsTogether(allocatedSeats, seatsPerRow),
    seatTypes: allocatedSeats.map(seat => getSeatType(seat, bus.totalSeats, seatsPerRow)),
    availability: {
      remaining: availability.availableSeats.length - allocatedSeats.length,
      totalRemaining: availability.availableSeats.length
    }
  };
}

/**
 * Allocation strategy implementations
 */
function allocatePreferredSeats(availability, preferredSeats, seatCount) {
  const allocated = [];
  const availableSet = new Set(availability.availableSeats);

  // Try preferred seats first
  for (const seat of preferredSeats) {
    if (availableSet.has(seat) && allocated.length < seatCount) {
      allocated.push(seat);
      availableSet.delete(seat);
    }
  }

  // Fill remaining with available seats
  for (const seat of availability.availableSeats) {
    if (allocated.length >= seatCount) break;
    if (!allocated.includes(seat)) {
      allocated.push(seat);
    }
  }

  return allocated.sort((a, b) => a - b);
}

function allocateWindowSeatsFirst(availability, seatCount, seatsPerRow) {
  const windowSeats = availability.availableSeats.filter(seat => 
    getSeatType(seat, availability.totalSeats, seatsPerRow) === SEAT_TYPES.WINDOW
  );
  
  const aisleSeats = availability.availableSeats.filter(seat => 
    getSeatType(seat, availability.totalSeats, seatsPerRow) === SEAT_TYPES.AISLE
  );
  
  const middleSeats = availability.availableSeats.filter(seat => 
    getSeatType(seat, availability.totalSeats, seatsPerRow) === SEAT_TYPES.MIDDLE
  );

  return [...windowSeats, ...aisleSeats, ...middleSeats]
    .slice(0, seatCount)
    .sort((a, b) => a - b);
}

function allocateAisleSeatsFirst(availability, seatCount, seatsPerRow) {
  const aisleSeats = availability.availableSeats.filter(seat => 
    getSeatType(seat, availability.totalSeats, seatsPerRow) === SEAT_TYPES.AISLE
  );
  
  const windowSeats = availability.availableSeats.filter(seat => 
    getSeatType(seat, availability.totalSeats, seatsPerRow) === SEAT_TYPES.WINDOW
  );
  
  const middleSeats = availability.availableSeats.filter(seat => 
    getSeatType(seat, availability.totalSeats, seatsPerRow) === SEAT_TYPES.MIDDLE
  );

  return [...aisleSeats, ...windowSeats, ...middleSeats]
    .slice(0, seatCount)
    .sort((a, b) => a - b);
}

function allocateTogetherSeats(availability, seatCount, seatsPerRow) {
  const layout = getSeatLayout(availability.totalSeats, seatsPerRow);
  const availableSet = new Set(availability.availableSeats);
  
  // Find consecutive seats in the same row
  for (const row of layout) {
    const availableInRow = row.filter(seat => availableSet.has(seat.number));
    
    for (let i = 0; i <= availableInRow.length - seatCount; i++) {
      const potentialSeats = availableInRow.slice(i, i + seatCount).map(s => s.number);
      
      if (potentialSeats.length === seatCount) {
        // Check if seats are consecutive
        const areConsecutive = potentialSeats.every((seat, index) => 
          index === 0 || seat === potentialSeats[index - 1] + 1
        );
        
        if (areConsecutive) {
          return potentialSeats;
        }
      }
    }
  }
  
  // If no consecutive seats found, fall back to window first
  return allocateWindowSeatsFirst(availability, seatCount, seatsPerRow);
}

function allocateRandomSeats(availability, seatCount) {
  const shuffled = [...availability.availableSeats].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, seatCount).sort((a, b) => a - b);
}

/**
 * Check if seats are together in the same row
 */
function areSeatsTogether(seats, seatsPerRow) {
  if (seats.length <= 1) return true;
  
  const sortedSeats = [...seats].sort((a, b) => a - b);
  const firstRow = Math.ceil(sortedSeats[0] / seatsPerRow);
  
  // All seats must be in the same row
  if (!sortedSeats.every(seat => Math.ceil(seat / seatsPerRow) === firstRow)) {
    return false;
  }
  
  // Check if seats are consecutive
  for (let i = 1; i < sortedSeats.length; i++) {
    if (sortedSeats[i] !== sortedSeats[i - 1] + 1) {
      return false;
    }
  }
  
  return true;
}

/**
 * Validate seat numbers for a bus
 */
async function validateSeats(busId, seatNumbers, date) {
  if (!busId || !seatNumbers || !Array.isArray(seatNumbers)) {
    throw new Error('Invalid input parameters');
  }

  const bus = await Bus.findById(busId);
  if (!bus) throw new Error('Bus not found');

  // Check if seats are within valid range
  const invalidSeats = seatNumbers.filter(seat => 
    seat < 1 || seat > bus.totalSeats
  );
  
  if (invalidSeats.length > 0) {
    throw new Error(`Invalid seat numbers: ${invalidSeats.join(', ')}`);
  }

  // Check seat availability
  const availability = await getAvailableSeats(busId, date);
  const unavailableSeats = seatNumbers.filter(seat => 
    !availability.availableSeats.includes(seat)
  );

  // Check online quota
  const offlineSeats = seatNumbers.filter(seat => 
    seat > bus.availableOnlineSeats
  );

  return {
    isValid: unavailableSeats.length === 0 && offlineSeats.length === 0,
    unavailableSeats,
    offlineSeats,
    availableOnlineSeats: bus.availableOnlineSeats,
    totalSeats: bus.totalSeats
  };
}

/**
 * Get seat recommendations based on preferences
 */
async function getSeatRecommendations(busId, seatCount, preferences = {}) {
  const {
    preferWindow = true,
    preferAisle = false,
    requireTogether = true,
    avoidMiddle = true,
    date = new Date().toISOString().split('T')[0]
  } = preferences;

  const availability = await getAvailableSeats(busId, date);
  
  if (availability.availableSeats.length < seatCount) {
    throw new Error('Not enough seats available');
  }

  let strategy = ALLOCATION_STRATEGIES.WINDOW_FIRST;
  
  if (preferAisle) {
    strategy = ALLOCATION_STRATEGIES.AISLE_FIRST;
  }
  
  if (requireTogether) {
    strategy = ALLOCATION_STRATEGIES.TOGETHER;
  }

  return allocateSeats(busId, seatCount, {
    strategy,
    requireTogether,
    date
  });
}

module.exports = {
  allocateSeats,
  getAvailableSeats,
  validateSeats,
  getSeatRecommendations,
  ALLOCATION_STRATEGIES,
  SEAT_TYPES,
  getSeatLayout,
  areSeatsTogether
};