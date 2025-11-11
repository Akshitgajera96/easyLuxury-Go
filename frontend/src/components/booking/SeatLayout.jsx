/**
 * Seat layout component for displaying and selecting bus seats
 * Supports both old (lowerDeck/upperDeck) and new (left/right) layout structures
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const SeatLayout = ({ 
  busLayout = null, // New structure: { left: { upper: [], lower: [] }, right: { upper: [], lower: [] }, totalRows: number }
  seatType = 'seater',
  totalSeats = 40, // Total seats in the bus (for fallback generation)
  seats = [], 
  bookedSeats = [], 
  lockedSeats = [],
  onSeatSelect,
  selectedSeats = [],
  maxSeats = 5 
}) => {
  const [localSelectedSeats, setLocalSelectedSeats] = useState(selectedSeats)

  useEffect(() => {
    setLocalSelectedSeats(selectedSeats)
  }, [selectedSeats])

  // Debug logging to help diagnose seat layout issues
  useEffect(() => {
    console.log('🚌 SeatLayout Debug:', {
      hasBusLayout: !!busLayout,
      busLayoutKeys: busLayout ? Object.keys(busLayout) : [],
      hasNewLayout,
      hasOldLayout,
      leftSeats: busLayout?.left ? {
        upperCount: busLayout.left.upper?.length || 0,
        lowerCount: busLayout.left.lower?.length || 0
      } : null,
      rightSeats: busLayout?.right ? {
        upperCount: busLayout.right.upper?.length || 0,
        lowerCount: busLayout.right.lower?.length || 0
      } : null,
      oldLayoutSeats: busLayout?.lowerDeck ? {
        lowerDeckSeats: busLayout.lowerDeck.seats?.length || 0,
        upperDeckSeats: busLayout.upperDeck?.seats?.length || 0
      } : null
    })
  }, [busLayout])

  // Auto-generate a basic layout if none exists
  const generateFallbackLayout = () => {
    if (!totalSeats || totalSeats === 0) return null
    
    console.log('🔧 Auto-generating fallback layout for', totalSeats, 'seats of type:', seatType)
    
    // Determine if it's a sleeper bus based on seatType
    const isSleeper = seatType === 'sleeper' || seatType === 'semi-sleeper'
    
    // Generate simple layout based on total seats
    const seatsPerRow = isSleeper ? 3 : 4 // Sleeper: 2 right + 1 left, Seater: 2 right + 2 left
    const rows = Math.ceil(totalSeats / seatsPerRow)
    
    const leftSeats = []
    const rightSeats = []
    
    let seatIndex = 1 // Start from 1 for seat numbering
    for (let row = 1; row <= rows; row++) {
      // Right side (2 seats per row)
      for (let i = 0; i < 2; i++) {
        if (seatIndex <= totalSeats) {
          const seatNum = `S${seatIndex}`
          rightSeats.push({
            seatNumber: seatNum,
            seatType: 'single',
            position: { row, side: 'right', level: 'lower', seat: i + 1 }
          })
          seatIndex++
        }
      }
      
      // Left side (1 or 2 seats depending on bus type)
      const leftSeatsInRow = isSleeper ? 1 : 2
      for (let i = 0; i < leftSeatsInRow; i++) {
        if (seatIndex <= totalSeats) {
          const seatNum = `S${seatIndex}`
          leftSeats.push({
            seatNumber: seatNum,
            seatType: 'single',
            position: { row, side: 'left', level: 'lower', seat: i + 1 }
          })
          seatIndex++
        }
      }
    }
    
    return {
      left: { upper: [], lower: leftSeats },
      right: { upper: [], lower: rightSeats },
      totalRows: rows
    }
  }
  
  // Check if bus layout uses new structure (left/right) or old structure (lowerDeck/upperDeck)
  const hasNewLayout = busLayout && busLayout.left && busLayout.right && busLayout.totalRows > 0
  const hasOldLayout = busLayout && (busLayout.lowerDeck?.seats?.length > 0 || busLayout.upperDeck?.seats?.length > 0)
  const totalRows = hasNewLayout ? busLayout.totalRows : (busLayout?.lowerDeck?.rows || 10)
  
  // Convert old layout format to new format
  const convertOldLayoutToNew = () => {
    if (!hasOldLayout) return null
    
    const leftSeats = []
    const rightSeats = []
    
    // Process lowerDeck seats (these start with 'L' for lower)
    if (busLayout.lowerDeck && busLayout.lowerDeck.seats) {
      busLayout.lowerDeck.seats.forEach(seat => {
        const seatNum = seat.seatNumber
        const row = seat.position?.row || 1
        const col = seat.position?.column || 1
        
        // In sleeper buses: column 1-2 are RIGHT side, column 3 is LEFT side
        // Admin creates: Right side 2 seats, Left side 1 seat
        // Seat numbers like "L1-1", "L1-2" (right), "L1-3" (left)
        const isLeft = col === 3
        
        const newSeat = {
          seatNumber: seatNum,
          seatType: 'lower',
          position: {
            row: row,
            side: isLeft ? 'left' : 'right',
            level: 'lower',
            seat: isLeft ? 1 : col
          }
        }
        
        if (isLeft) {
          leftSeats.push(newSeat)
        } else {
          rightSeats.push(newSeat)
        }
      })
    }
    
    // Process upperDeck seats (these start with 'U' for upper)
    if (busLayout.upperDeck && busLayout.upperDeck.seats) {
      busLayout.upperDeck.seats.forEach(seat => {
        const seatNum = seat.seatNumber
        const row = seat.position?.row || 1
        const col = seat.position?.column || 1
        
        // In sleeper buses: column 1-2 are RIGHT side, column 3 is LEFT side
        // Admin creates: Right side 2 seats, Left side 1 seat
        // Seat numbers like "U1-1", "U1-2" (right), "U1-3" (left)
        const isLeft = col === 3
        
        const newSeat = {
          seatNumber: seatNum,
          seatType: 'upper',
          position: {
            row: row,
            side: isLeft ? 'left' : 'right',
            level: 'upper',
            seat: isLeft ? 1 : col
          }
        }
        
        if (isLeft) {
          leftSeats.push(newSeat)
        } else {
          rightSeats.push(newSeat)
        }
      })
    }
    
    return {
      left: {
        upper: leftSeats.filter(s => s.seatType === 'upper'),
        lower: leftSeats.filter(s => s.seatType === 'lower')
      },
      right: {
        upper: rightSeats.filter(s => s.seatType === 'upper'),
        lower: rightSeats.filter(s => s.seatType === 'lower')
      },
      totalRows: busLayout.lowerDeck?.rows || busLayout.upperDeck?.rows || 10
    }
  }
  
  // Get effective layout (convert old to new if needed, or generate fallback)
  const effectiveLayout = hasNewLayout 
    ? busLayout 
    : (hasOldLayout ? convertOldLayoutToNew() : generateFallbackLayout())
  
  // Get all seats from the layout structure
  const getAllSeatsFromLayout = () => {
    if (!effectiveLayout) return []
    
    const allSeats = []
    if (effectiveLayout.left && effectiveLayout.left.upper && Array.isArray(effectiveLayout.left.upper)) {
      allSeats.push(...effectiveLayout.left.upper)
    }
    if (effectiveLayout.left && effectiveLayout.left.lower && Array.isArray(effectiveLayout.left.lower)) {
      allSeats.push(...effectiveLayout.left.lower)
    }
    if (effectiveLayout.right && effectiveLayout.right.upper && Array.isArray(effectiveLayout.right.upper)) {
      allSeats.push(...effectiveLayout.right.upper)
    }
    if (effectiveLayout.right && effectiveLayout.right.lower && Array.isArray(effectiveLayout.right.lower)) {
      allSeats.push(...effectiveLayout.right.lower)
    }
    
    return allSeats
  }
  
  const allLayoutSeats = getAllSeatsFromLayout()

  const getSeatStatus = (seatNumber) => {
    if (bookedSeats.includes(seatNumber)) {
      return 'booked'
    }
    if (lockedSeats.includes(seatNumber)) {
      return 'locked'
    }
    if (localSelectedSeats.includes(seatNumber)) {
      return 'selected'
    }
    return 'available'
  }

  const getSeatType = (seatNumber) => {
    if (seatNumber.startsWith('U')) return 'upper'
    if (seatNumber.startsWith('L')) return 'lower'
    return 'seater'
  }

  const handleSeatClick = (seatNumber) => {
    const status = getSeatStatus(seatNumber)
    
    if (status === 'booked' || status === 'locked') {
      return
    }

    let newSelectedSeats
    if (status === 'selected') {
      // Deselect seat
      newSelectedSeats = localSelectedSeats.filter(s => s !== seatNumber)
    } else {
      // Select seat (if under max limit)
      if (localSelectedSeats.length >= maxSeats) {
        return
      }
      newSelectedSeats = [...localSelectedSeats, seatNumber]
    }

    setLocalSelectedSeats(newSelectedSeats)
    onSeatSelect(newSelectedSeats)
  }

  const renderSeat = (seat) => {
    const seatNumber = seat.seatNumber
    const status = getSeatStatus(seatNumber)
    const seatType = getSeatType(seatNumber)
    const isSelected = status === 'selected'

    const seatConfig = {
      available: {
        bg: 'bg-green-100',
        hover: 'hover:bg-green-200 hover:scale-105',
        border: 'border-green-400',
        text: 'text-green-800',
        cursor: 'cursor-pointer'
      },
      booked: {
        bg: 'bg-gray-300',
        hover: '',
        border: 'border-gray-500',
        text: 'text-gray-700',
        cursor: 'cursor-not-allowed'
      },
      locked: {
        bg: 'bg-orange-200',
        hover: '',
        border: 'border-orange-400',
        text: 'text-orange-800',
        cursor: 'cursor-not-allowed'
      },
      selected: {
        bg: 'bg-blue-500',
        hover: 'hover:bg-blue-600 hover:scale-105',
        border: 'border-blue-600',
        text: 'text-white',
        cursor: 'cursor-pointer'
      }
    }

    const config = seatConfig[status]

    return (
      <motion.button
        key={seatNumber}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={status === 'available' || status === 'selected' ? { scale: 1.1 } : {}}
        onClick={() => handleSeatClick(seatNumber)}
        disabled={status === 'booked' || status === 'locked'}
        className={`
          ${config.bg} ${config.hover} ${config.border} ${config.text} ${config.cursor}
          border-2 rounded-full p-1 text-[10px] font-bold
          transition-all duration-200
          flex items-center justify-center
          w-9 h-9
        `}
        title={`Seat ${seatNumber} - ${status}`}
      >
        {seatNumber}
      </motion.button>
    )
  }

  // New rendering for LEFT/RIGHT layout structure
  const renderNewLayout = () => {
    if (!effectiveLayout) return null
    
    const { left, right, totalRows } = effectiveLayout
    
    // Group seats by row
    const leftUpperByRow = {}
    const leftLowerByRow = {}
    const rightUpperByRow = {}
    const rightLowerByRow = {}
    
    // Safely process left side seats
    if (left && left.upper && Array.isArray(left.upper)) {
      left.upper.forEach(seat => {
        const row = seat.position.row
        if (!leftUpperByRow[row]) leftUpperByRow[row] = []
        leftUpperByRow[row].push(seat)
      })
    }
    
    if (left && left.lower && Array.isArray(left.lower)) {
      left.lower.forEach(seat => {
        const row = seat.position.row
        if (!leftLowerByRow[row]) leftLowerByRow[row] = []
        leftLowerByRow[row].push(seat)
      })
    }
    
    // Safely process right side seats
    if (right && right.upper && Array.isArray(right.upper)) {
      right.upper.forEach(seat => {
        const row = seat.position.row
        if (!rightUpperByRow[row]) rightUpperByRow[row] = []
        rightUpperByRow[row].push(seat)
      })
    }
    
    if (right && right.lower && Array.isArray(right.lower)) {
      right.lower.forEach(seat => {
        const row = seat.position.row
        if (!rightLowerByRow[row]) rightLowerByRow[row] = []
        rightLowerByRow[row].push(seat)
      })
    }
    
    return (
      <div className="flex gap-8">
        {/* Left Side */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="text-sm font-bold text-blue-600">← LEFT SIDE</div>
          </div>
          
          {Array.from({ length: totalRows }).map((_, rowIndex) => {
            const rowNum = rowIndex + 1
            const hasSeatsInRow = (leftUpperByRow[rowNum] && leftUpperByRow[rowNum].length > 0) || 
                                  (leftLowerByRow[rowNum] && leftLowerByRow[rowNum].length > 0)
            
            if (!hasSeatsInRow) return null
            
            return (
              <div key={`left-row-${rowNum}`} className="mb-3 bg-white rounded-lg border border-gray-200 p-3">
                <div className="text-xs text-gray-500 font-semibold mb-3">Row {rowNum}</div>
                
                {/* Check if row has both upper and lower seats */}
                <div className="space-y-2">
                  {/* Upper Deck Section - Show first if exists */}
                  {leftUpperByRow[rowNum] && leftUpperByRow[rowNum].length > 0 && (
                    <div>
                      <div className="text-[9px] text-purple-700 font-bold mb-1 flex items-center gap-1">
                        <span>⬆ Upper Deck</span>
                        <div className="flex-1 h-px bg-purple-300"></div>
                      </div>
                      <div className="flex gap-2">
                        {leftUpperByRow[rowNum].map(seat => renderSeat(seat))}
                      </div>
                    </div>
                  )}
                  
                  {/* Lower Deck Section - Show below if exists */}
                  {leftLowerByRow[rowNum] && leftLowerByRow[rowNum].length > 0 && (
                    <div>
                      <div className="text-[9px] text-blue-700 font-bold mb-1 flex items-center gap-1">
                        <span>⬇ Lower Deck</span>
                        <div className="flex-1 h-px bg-blue-300"></div>
                      </div>
                      <div className="flex gap-2">
                        {leftLowerByRow[rowNum].map(seat => renderSeat(seat))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Aisle */}
        <div className="w-px bg-gray-300"></div>
        
        {/* Right Side */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="text-sm font-bold text-blue-600">RIGHT SIDE →</div>
          </div>
          
          {Array.from({ length: totalRows }).map((_, rowIndex) => {
            const rowNum = rowIndex + 1
            const hasSeatsInRow = (rightUpperByRow[rowNum] && rightUpperByRow[rowNum].length > 0) || 
                                  (rightLowerByRow[rowNum] && rightLowerByRow[rowNum].length > 0)
            
            if (!hasSeatsInRow) return null
            
            return (
              <div key={`right-row-${rowNum}`} className="mb-3 bg-white rounded-lg border border-gray-200 p-3">
                <div className="text-xs text-gray-500 font-semibold mb-3">Row {rowNum}</div>
                
                {/* Create columns for each seat position, stacking upper over lower */}
                <div className="flex gap-2">
                  {/* Get max number of seats in this row */}
                  {Array.from({ 
                    length: Math.max(
                      rightUpperByRow[rowNum]?.length || 0, 
                      rightLowerByRow[rowNum]?.length || 0
                    ) 
                  }).map((_, seatIndex) => {
                    const upperSeat = rightUpperByRow[rowNum]?.[seatIndex]
                    const lowerSeat = rightLowerByRow[rowNum]?.[seatIndex]
                    
                    return (
                      <div key={`right-${rowNum}-${seatIndex}`} className="flex flex-col gap-1">
                        {/* Upper seat on top */}
                        {upperSeat ? (
                          <div className="relative">
                            <div className="absolute -top-3 left-0 text-[8px] text-purple-600 font-bold">Upper</div>
                            {renderSeat(upperSeat)}
                          </div>
                        ) : (
                          <div className="w-9 h-9"></div>
                        )}
                        
                        {/* Lower seat at bottom */}
                        {lowerSeat ? (
                          <div className="relative">
                            <div className="absolute -top-3 left-0 text-[8px] text-blue-600 font-bold">Lower</div>
                            {renderSeat(lowerSeat)}
                          </div>
                        ) : (
                          <div className="w-9 h-9"></div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const totalSeatsInLayout = effectiveLayout ? allLayoutSeats.length : 0
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">🪑 Select Your Seats</h3>
          <p className="text-sm text-gray-500 capitalize">
            {effectiveLayout ? `${effectiveLayout.totalRows} Rows • ${totalSeatsInLayout} Total Seats` : 'Bus Layout'}
          </p>
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-semibold text-blue-600">{localSelectedSeats.length}</span> / {maxSeats} selected
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-100 border-2 border-green-400 rounded-full"></div>
          <span className="text-xs text-gray-700">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-500 border-2 border-blue-600 rounded-full"></div>
          <span className="text-xs text-gray-700">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-300 border-2 border-gray-500 rounded-full"></div>
          <span className="text-xs text-gray-700">Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-orange-200 border-2 border-orange-400 rounded-full"></div>
          <span className="text-xs text-gray-700">Locked</span>
        </div>
      </div>

      {/* Bus Layout */}
      <div className="bg-gray-50 rounded-lg p-6">
        {/* Driver section */}
        <div className="text-center mb-6">
          <div className="inline-block bg-gradient-to-r from-gray-700 to-gray-800 text-white px-6 py-2 rounded-t-lg font-semibold shadow-md">
            👨‍✈️ Driver
          </div>
        </div>

        {/* Seats */}
        <div className="max-w-4xl mx-auto">
          {effectiveLayout ? renderNewLayout() : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">⚠️ No seat layout configured</p>
              <p className="text-sm">Please contact admin to set up bus layout</p>
              {busLayout && (
                <div className="mt-4 text-xs text-left bg-yellow-50 border border-yellow-200 rounded p-3 max-w-md mx-auto">
                  <p className="font-semibold text-yellow-800 mb-2">Debug Info:</p>
                  <pre className="text-yellow-700 whitespace-pre-wrap">
                    {JSON.stringify({
                      hasLeft: !!busLayout.left,
                      hasRight: !!busLayout.right,
                      totalRows: busLayout.totalRows,
                      hasLowerDeck: !!busLayout.lowerDeck,
                      hasUpperDeck: !!busLayout.upperDeck
                    }, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Selection Info */}
      {localSelectedSeats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-accent/10 border border-accent rounded-lg"
        >
          <p className="text-sm font-semibold text-black40 mb-2">Selected Seats:</p>
          <div className="flex flex-wrap gap-2">
            {localSelectedSeats.map(seat => (
              <span key={seat} className="bg-accent text-black40 px-3 py-1 rounded-full text-sm font-semibold">
                {seat}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default SeatLayout
