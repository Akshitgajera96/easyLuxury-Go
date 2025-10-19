/**
 * Dynamic seat layout component that adapts to bus configuration
 * Supports LEFT/RIGHT structure with UPPER/LOWER berths as configured by admin
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
    if (localSelectedSeats.includes(seatNumber)) {
      // Deselect seat
      newSelectedSeats = localSelectedSeats.filter(seat => seat !== seatNumber)
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
        text: 'text-green-800',
        border: 'border-green-300',
        label: 'Available'
      },
      selected: {
        bg: 'bg-accent',
        hover: 'hover:bg-gradient-to-r hover:from-accent hover:to-accent-dark hover:shadow-xl hover:scale-105 transition-all duration-300',
        text: 'text-black40',
        border: 'border-accent',
        label: 'Selected'
      },
      booked: {
        bg: 'bg-red-200',
        hover: 'cursor-not-allowed',
        text: 'text-red-700',
        border: 'border-red-400',
        label: 'Booked'
      },
      locked: {
        bg: 'bg-orange-200',
        hover: 'cursor-not-allowed',
        text: 'text-orange-700',
        border: 'border-orange-400',
        label: 'Locked'
      }
    }

    const config = seatConfig[status]

    return (
      <motion.button
        key={seatNumber}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={status === 'available' ? { scale: 1.1 } : {}}
        whileTap={status === 'available' ? { scale: 0.95 } : {}}
        onClick={() => handleSeatClick(seatNumber)}
        disabled={status === 'booked' || status === 'locked'}
        className={`
          w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold
          transition-all duration-200 border-2 shadow-md
          ${config.bg} ${config.hover} ${config.text} ${config.border}
          ${status === 'booked' || status === 'locked' ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
        `}
        title={`Seat ${seatNumber} - ${config.label}`}
      >
        <span className="text-[10px] font-bold">{seatNumber}</span>
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
            {/* LEFT SIDE */}
            <div className="col-span-2 bg-accent/10 rounded-lg p-3 border border-accent">
              {/* Left Upper */}
              {leftUpperByRow[rowNum] && leftUpperByRow[rowNum].length > 0 && (
                <div className="mb-2">
                  <div className="text-xs text-black40 font-semibold mb-1">Upper</div>
                  <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${leftUpperByRow[rowNum].length}, 1fr)` }}>
                    {leftUpperByRow[rowNum].map(seat => renderSeat(seat))}
                  </div>
                </div>
              )}
              
              {/* Left Lower */}
              {leftLowerByRow[rowNum] && leftLowerByRow[rowNum].length > 0 && (
                <div>
                  <div className="text-xs text-black40 font-semibold mb-1">Lower</div>
                  <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${leftLowerByRow[rowNum].length}, 1fr)` }}>
                    {leftLowerByRow[rowNum].map(seat => renderSeat(seat))}
                  </div>
                </div>
              )}
            </div>
            
            {/* AISLE */}
            <div className="flex items-center justify-center">
              <div className="w-1 h-20 bg-gray-300 rounded"></div>
            </div>
            
            {/* RIGHT SIDE */}
            <div className="col-span-2 bg-purple-50 rounded-lg p-3 border border-purple-200">
              {/* Right Upper */}
              {rightUpperByRow[rowNum] && rightUpperByRow[rowNum].length > 0 && (
                <div className="mb-2">
                  <div className="text-xs text-purple-600 font-semibold mb-1">Upper</div>
                  <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${rightUpperByRow[rowNum].length}, 1fr)` }}>
                    {rightUpperByRow[rowNum].map(seat => renderSeat(seat))}
                  </div>
                </div>
              )}
              
              {/* Right Lower */}
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
          <h3 className="text-lg font-semibold text-gray-900">?? Select Your Seats</h3>
          <p className="text-sm text-gray-500 capitalize">
            {hasNewLayout ? `${totalRows} Rows • ${totalSeatsInLayout} Total Seats` : 'Bus Layout'}
          </p>
        </div>
        <div className="text-sm font-semibold text-gray-700">
          Selected: <span className="text-accent">{localSelectedSeats.length}</span> / {maxSeats}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-green-100 border border-green-300 rounded-full"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-accent border border-accent rounded-full"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-red-200 border border-red-400 rounded-full"></div>
          <span>Booked</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-orange-200 border border-orange-400 rounded-full"></div>
          <span>Locked</span>
        </div>
      </div>

      {/* Seat Layout */}
      <div className="bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg p-6 mb-4 max-h-[500px] overflow-y-auto">
        {/* Driver section */}
        <div className="text-center mb-6">
          <div className="inline-block bg-black40 text-white px-6 py-2 rounded-t-lg font-semibold">
            ?? Driver
          </div>
        </div>

        {/* Dynamic seat layout */}
        <div className="max-w-4xl mx-auto">
          {hasNewLayout ? renderNewLayout() : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">?? No seat layout configured</p>
              <p className="text-sm">Please contact admin to set up bus layout</p>
            </div>
          )}
        </div>
      </div>

      {/* Selected seats summary */}
      {localSelectedSeats.length > 0 && (
        <div className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg p-4 border-2 border-accent">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <span className="text-accent mr-2">?</span>
            Selected Seats ({localSelectedSeats.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {localSelectedSeats.map(seat => (
              <span
                key={seat}
                className="bg-accent text-black40 px-4 py-2 rounded-full text-sm font-bold shadow-md"
              >
                {seat}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SeatLayout