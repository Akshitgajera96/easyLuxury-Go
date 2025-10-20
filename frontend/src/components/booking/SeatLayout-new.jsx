/**
 * Seat layout component for displaying and selecting bus seats
 * Supports both old (lowerDeck/upperDeck) and new (left/right) layout structures
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const SeatLayout = ({ 
  busLayout = null, // New structure: { left: { upper: [], lower: [] }, right: { upper: [], lower: [] }, totalRows: number }
  seatType = 'seater',
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

  // Check if bus layout uses new structure (left/right) or old structure (lowerDeck/upperDeck)
  const hasNewLayout = busLayout && busLayout.left && busLayout.right
  const totalRows = hasNewLayout ? busLayout.totalRows : (busLayout?.lowerDeck?.rows || 10)
  
  // Get all seats from the new layout structure
  const getAllSeatsFromLayout = () => {
    if (!hasNewLayout) return []
    
    const allSeats = []
    if (busLayout.left.upper) allSeats.push(...busLayout.left.upper)
    if (busLayout.left.lower) allSeats.push(...busLayout.left.lower)
    if (busLayout.right.upper) allSeats.push(...busLayout.right.upper)
    if (busLayout.right.lower) allSeats.push(...busLayout.right.lower)
    
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
        bg: 'bg-accent',
        hover: 'hover:bg-accent-dark hover:scale-105',
        border: 'border-accent-dark',
        text: 'text-black40',
        cursor: 'cursor-pointer'
      }
    }

    const config = seatConfig[status]

    return (
      <motion.button
        key={seatNumber}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={status === 'available' || status === 'selected' ? { scale: 1.05 } : {}}
        onClick={() => handleSeatClick(seatNumber)}
        disabled={status === 'booked' || status === 'locked'}
        className={`
          ${config.bg} ${config.hover} ${config.border} ${config.text} ${config.cursor}
          border-2 rounded-lg p-2 text-xs font-semibold
          transition-all duration-200
          flex items-center justify-center
          min-w-[50px] min-h-[50px]
        `}
        title={`Seat ${seatNumber} - ${status}`}
      >
        {seatNumber}
      </motion.button>
    )
  }

  // New rendering for LEFT/RIGHT layout structure
  const renderNewLayout = () => {
    if (!hasNewLayout || !busLayout) return null
    
    const { left, right, totalRows } = busLayout
    
    // Group seats by row
    const leftUpperByRow = {}
    const leftLowerByRow = {}
    const rightUpperByRow = {}
    const rightLowerByRow = {}
    
    left.upper.forEach(seat => {
      const row = seat.position.row
      if (!leftUpperByRow[row]) leftUpperByRow[row] = []
      leftUpperByRow[row].push(seat)
    })
    
    left.lower.forEach(seat => {
      const row = seat.position.row
      if (!leftLowerByRow[row]) leftLowerByRow[row] = []
      leftLowerByRow[row].push(seat)
    })
    
    right.upper.forEach(seat => {
      const row = seat.position.row
      if (!rightUpperByRow[row]) rightUpperByRow[row] = []
      rightUpperByRow[row].push(seat)
    })
    
    right.lower.forEach(seat => {
      const row = seat.position.row
      if (!rightLowerByRow[row]) rightLowerByRow[row] = []
      rightLowerByRow[row].push(seat)
    })
    
    return Array.from({ length: totalRows }).map((_, rowIndex) => {
      const rowNum = rowIndex + 1
      
      return (
        <div key={`row-${rowNum}`} className="mb-4">
          <div className="text-center text-xs text-gray-500 mb-2">Row {rowNum}</div>
          
          <div className="grid grid-cols-5 gap-4 items-center">
            {/* Left Side */}
            <div className="col-span-2">
              {leftUpperByRow[rowNum] && leftUpperByRow[rowNum].length > 0 && (
                <div className="mb-2">
                  <div className="text-xs text-black40 font-semibold mb-1">Upper</div>
                  <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${leftUpperByRow[rowNum].length}, 1fr)` }}>
                    {leftUpperByRow[rowNum].map(seat => renderSeat(seat))}
                  </div>
                </div>
              )}
              
              {leftLowerByRow[rowNum] && leftLowerByRow[rowNum].length > 0 && (
                <div>
                  <div className="text-xs text-black40 font-semibold mb-1">Lower</div>
                  <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${leftLowerByRow[rowNum].length}, 1fr)` }}>
                    {leftLowerByRow[rowNum].map(seat => renderSeat(seat))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Aisle */}
            <div className="col-span-1 flex justify-center">
              <div className="w-1 h-full bg-gray-200"></div>
            </div>
            
            {/* Right Side */}
            <div className="col-span-2">
              {rightUpperByRow[rowNum] && rightUpperByRow[rowNum].length > 0 && (
                <div className="mb-2">
                  <div className="text-xs text-purple-600 font-semibold mb-1">Upper</div>
                  <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${rightUpperByRow[rowNum].length}, 1fr)` }}>
                    {rightUpperByRow[rowNum].map(seat => renderSeat(seat))}
                  </div>
                </div>
              )}
              
              {rightLowerByRow[rowNum] && rightLowerByRow[rowNum].length > 0 && (
                <div>
                  <div className="text-xs text-purple-600 font-semibold mb-1">Lower</div>
                  <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${rightLowerByRow[rowNum].length}, 1fr)` }}>
                    {rightLowerByRow[rowNum].map(seat => renderSeat(seat))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    })
  }

  const totalSeatsInLayout = hasNewLayout ? allLayoutSeats.length : 0
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">🪑 Select Your Seats</h3>
          <p className="text-sm text-gray-500 capitalize">
            {hasNewLayout ? `${totalRows} Rows • ${totalSeatsInLayout} Total Seats` : 'Bus Layout'}
          </p>
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-semibold text-accent">{localSelectedSeats.length}</span> / {maxSeats} selected
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 border-2 border-green-400 rounded"></div>
          <span className="text-xs text-gray-700">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent border-2 border-accent-dark rounded"></div>
          <span className="text-xs text-gray-700">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-300 border-2 border-gray-500 rounded"></div>
          <span className="text-xs text-gray-700">Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-200 border-2 border-orange-400 rounded"></div>
          <span className="text-xs text-gray-700">Locked</span>
        </div>
      </div>

      {/* Bus Layout */}
      <div className="bg-gray-50 rounded-lg p-6">
        {/* Driver section */}
        <div className="text-center mb-6">
          <div className="inline-block bg-black40 text-white px-6 py-2 rounded-t-lg font-semibold">
            👨‍✈️ Driver
          </div>
        </div>

        {/* Seats */}
        <div className="max-w-4xl mx-auto">
          {hasNewLayout ? renderNewLayout() : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">⚠️ No seat layout configured</p>
              <p className="text-sm">Please contact admin to set up bus layout</p>
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
