/**
 * Bus Seat Structure Builder Component
 * Allows admins to visually create bus seat layouts
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const BusSeatBuilder = ({ busType, totalSeats, onSeatLayoutChange }) => {
  const [seatLayout, setSeatLayout] = useState({
    left: { upper: [], lower: [] },
    right: { upper: [], lower: [] }
  })
  const [config, setConfig] = useState({
    rows: 10, // Number of rows (front to back)
    leftUpperSeats: busType === 'sleeper' ? 1 : 0, // Upper berth on left per row
    leftLowerSeats: busType === 'sleeper' ? 1 : 2, // Lower berth/seats on left per row
    rightUpperSeats: busType === 'sleeper' ? 1 : 0, // Upper berth on right per row
    rightLowerSeats: busType === 'sleeper' ? 1 : 2  // Lower berth/seats on right per row
  })

  const handleConfigChange = (field, value) => {
    const newConfig = { ...config, [field]: parseInt(value) || 0 }
    setConfig(newConfig)
  }

  // Auto-generate seat layout when config changes and matches total seats
  useEffect(() => {
    const configuredTotal = getTotalSeatsInLayout()
    if (configuredTotal === totalSeats && configuredTotal > 0) {
      generateSeats()
    }
  }, [config.rows, config.leftUpperSeats, config.leftLowerSeats, config.rightUpperSeats, config.rightLowerSeats])

  const generateSeats = () => {
    const leftUpper = []
    const leftLower = []
    const rightUpper = []
    const rightLower = []
    
    // Generate seats for each row
    for (let row = 1; row <= config.rows; row++) {
      // Left Upper seats
      for (let seat = 1; seat <= config.leftUpperSeats; seat++) {
        leftUpper.push({
          seatNumber: `LU${row}`,
          seatType: 'upper',
          position: { row, side: 'left', level: 'upper', seat }
        })
      }
      
      // Left Lower seats
      for (let seat = 1; seat <= config.leftLowerSeats; seat++) {
        leftLower.push({
          seatNumber: `LL${row}${config.leftLowerSeats > 1 ? `-${seat}` : ''}`,
          seatType: 'lower',
          position: { row, side: 'left', level: 'lower', seat }
        })
      }
      
      // Right Upper seats
      for (let seat = 1; seat <= config.rightUpperSeats; seat++) {
        rightUpper.push({
          seatNumber: `RU${row}`,
          seatType: 'upper',
          position: { row, side: 'right', level: 'upper', seat }
        })
      }
      
      // Right Lower seats
      for (let seat = 1; seat <= config.rightLowerSeats; seat++) {
        rightLower.push({
          seatNumber: `RL${row}${config.rightLowerSeats > 1 ? `-${seat}` : ''}`,
          seatType: 'lower',
          position: { row, side: 'right', level: 'lower', seat }
        })
      }
    }

    const newLayout = {
      left: { upper: leftUpper, lower: leftLower },
      right: { upper: rightUpper, lower: rightLower },
      totalRows: config.rows
    }

    setSeatLayout(newLayout)
    onSeatLayoutChange(newLayout)
  }

  const getTotalSeatsInLayout = () => {
    return config.rows * (config.leftUpperSeats + config.leftLowerSeats + config.rightUpperSeats + config.rightLowerSeats)
  }

  return (
    <div className="space-y-6">
      <div className="bg-accent/10 border border-accent rounded-lg p-4">
        <h3 className="font-semibold text-black40 mb-2">🏛️ Configure Bus Seat Structure (LEFT/RIGHT Layout)</h3>
        <p className="text-sm text-black40">
          Design a realistic bus layout with LEFT and RIGHT sections, each having UPPER and LOWER berths. 
          Layout auto-generates when total matches! 🎯
        </p>
        <div className="mt-2 text-xs text-black40 bg-white rounded p-2 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <strong>Example:</strong> For a 40-seat sleeper bus with 10 rows: <br/>
          Left: 1 upper + 1 lower = 20 seats | Right: 1 upper + 1 lower = 20 seats | Total: 40 seats
        </div>
      </div>

      {/* Number of Rows */}
      <div className="bg-white border-2 border-accent rounded-lg p-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <label className="block text-sm font-medium text-gray-900 mb-2">
          🔢 Number of Rows (Front to Back)
        </label>
        <input
          type="number"
          min="1"
          max="15"
          value={config.rows}
          onChange={(e) => handleConfigChange('rows', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-lg font-semibold"
          placeholder="e.g., 10"
        />
        <p className="text-xs text-gray-500 mt-1">Total rows from driver seat to back</p>
      </div>

      {/* Configuration Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Side Configuration */}
        <div className="bg-white border-2 border-accent rounded-lg p-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <span className="bg-accent/20 text-black40 px-2 py-1 rounded text-sm mr-2">⬅️ Left Side</span>
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ⬆️ Upper Berths per Row
              </label>
              <input
                type="number"
                min="0"
                max="2"
                value={config.leftUpperSeats}
                onChange={(e) => handleConfigChange('leftUpperSeats', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="Usually 1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ⬇️ Lower Berths per Row
              </label>
              <input
                type="number"
                min="0"
                max="3"
                value={config.leftLowerSeats}
                onChange={(e) => handleConfigChange('leftLowerSeats', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="Usually 1 or 2"
              />
            </div>

            <div className="bg-accent/10 rounded p-3 text-sm">
              <span className="font-semibold text-black40">Left Side Total: </span>
              <span className="text-black40">{config.rows * (config.leftUpperSeats + config.leftLowerSeats)}</span>
            </div>
          </div>
        </div>

        {/* Right Side Configuration */}
        <div className="bg-white border-2 border-sky-200 rounded-lg p-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <span className="bg-sky-100 text-sky-800 px-2 py-1 rounded text-sm mr-2">➡️ Right Side</span>
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ⬆️ Upper Berths per Row
              </label>
              <input
                type="number"
                min="0"
                max="2"
                value={config.rightUpperSeats}
                onChange={(e) => handleConfigChange('rightUpperSeats', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="Usually 1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ⬇️ Lower Berths per Row
              </label>
              <input
                type="number"
                min="0"
                max="3"
                value={config.rightLowerSeats}
                onChange={(e) => handleConfigChange('rightLowerSeats', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="Usually 1 or 2"
              />
            </div>

            <div className="bg-sky-50 rounded p-3 text-sm">
              <span className="font-semibold text-sky-800">Right Side Total: </span>
              <span className="text-sky-900">{config.rows * (config.rightUpperSeats + config.rightLowerSeats)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Total Seats Summary */}
      <div className="bg-gradient-to-r from-black40 to-blue-800 text-white rounded-lg p-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-accent text-sm mb-1">Expected Total</p>
            <p className="text-3xl font-bold">{totalSeats}</p>
          </div>
          <div>
            <p className="text-accent text-sm mb-1">Configured Total</p>
            <p className="text-3xl font-bold">{getTotalSeatsInLayout()}</p>
          </div>
          <div>
            <p className="text-accent text-sm mb-1">Status</p>
            <p className={`text-2xl font-bold ${getTotalSeatsInLayout() === totalSeats ? 'text-green-400' : 'text-accent'}`}>
              {getTotalSeatsInLayout() === totalSeats ? '✅ Match' : '⚠️ Mismatch'}
            </p>
          </div>
        </div>
      </div>

      {/* Auto-Generate Status */}
      <div className="flex justify-center">
        {getTotalSeatsInLayout() === totalSeats && getTotalSeatsInLayout() > 0 ? (
          <div className="bg-green-100 border-2 border-green-500 text-green-800 px-8 py-3 rounded-lg font-semibold flex items-center gap-2">
            <span>✅</span>
            <span>Seat Layout Auto-Generated!</span>
          </div>
        ) : (
          <div className="bg-accent/20 border-2 border-accent text-gray-900 px-8 py-3 rounded-lg font-semibold flex items-center gap-2">
            <span>⚙️</span>
            <span>Configure rows to match {totalSeats} total seats</span>
          </div>
        )}
      </div>

      {/* Preview Section */}
      {(seatLayout.left.upper.length > 0 || seatLayout.left.lower.length > 0 || 
        seatLayout.right.upper.length > 0 || seatLayout.right.lower.length > 0) ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border-2 border-green-500 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-green-500 mr-2">👁️</span>
            Preview: Seat Layout Generated Successfully ({getTotalSeatsInLayout()} seats)
          </h3>
          
          {/* Bus Layout Visualization */}
          <div className="bg-gray-100 rounded-lg p-6">
            <div className="mb-4 text-center">
              <div className="inline-block bg-black40 text-white px-4 py-2 rounded-t-lg font-semibold">
                🚗 Driver
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-4 max-w-6xl mx-auto">
              {/* Left Side Column */}
              <div className="col-span-2 space-y-3">
                <div className="text-center font-semibold text-black40 mb-2">⬅️ LEFT SIDE</div>
                
                {/* Row by row display */}
                {Array.from({ length: config.rows }).map((_, rowIndex) => (
                  <div key={`left-row-${rowIndex}`} className="border border-accent rounded-lg p-3 bg-accent/10">
                    <div className="text-xs text-gray-600 mb-2 text-center font-semibold">Row {rowIndex + 1}</div>
                    
                    <div className="space-y-2">
                      {/* Upper seats for this row */}
                      {config.leftUpperSeats > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-semibold text-sky-700 w-12">Upper</div>
                          <div className="flex gap-2">
                            {seatLayout.left.upper
                              .filter(seat => seat.position.row === rowIndex + 1)
                              .map(seat => (
                                <div
                                  key={seat.seatNumber}
                                  className="bg-black40 text-white text-xs font-bold rounded-lg flex items-center justify-center shadow-sm hover:bg-gray-800 transition-colors w-12 h-12"
                                  title={seat.seatType}
                                >
                                  {seat.seatNumber}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Lower seats for this row */}
                      {config.leftLowerSeats > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-semibold text-sky-700 w-12">Lower</div>
                          <div className="flex gap-2">
                            {seatLayout.left.lower
                              .filter(seat => seat.position.row === rowIndex + 1)
                              .map(seat => (
                                <div
                                  key={seat.seatNumber}
                                  className="bg-black40 text-white text-xs font-bold rounded-lg flex items-center justify-center shadow-sm hover:bg-gray-800 transition-colors w-12 h-12"
                                  title={seat.seatType}
                                >
                                  {seat.seatNumber}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Aisle Column */}
              <div className="flex items-center justify-center">
                <div className="w-full border-l-2 border-r-2 border-dashed border-gray-400 h-full flex items-center justify-center min-h-[200px]">
                  <div className="text-gray-400 text-xs font-semibold transform rotate-90 whitespace-nowrap">
                    🚪 AISLE
                  </div>
                </div>
              </div>

              {/* Right Side Column */}
              <div className="col-span-2 space-y-3">
                <div className="text-center font-semibold text-sky-800 mb-2">RIGHT SIDE ➡️</div>
                
                {/* Row by row display */}
                {Array.from({ length: config.rows }).map((_, rowIndex) => (
                  <div key={`right-row-${rowIndex}`} className="border border-sky-200 rounded-lg p-3 bg-sky-50">
                    <div className="text-xs text-gray-600 mb-2 text-center font-semibold">Row {rowIndex + 1}</div>
                    
                    <div className="space-y-2">
                      {/* Upper seats for this row */}
                      {config.rightUpperSeats > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-semibold text-sky-700 w-12">Upper</div>
                          <div className="flex gap-2">
                            {seatLayout.right.upper
                              .filter(seat => seat.position.row === rowIndex + 1)
                              .map(seat => (
                                <div
                                  key={seat.seatNumber}
                                  className="bg-sky-500 text-white text-xs font-bold rounded-lg flex items-center justify-center shadow-sm hover:bg-sky-600 transition-colors w-12 h-12"
                                  title={seat.seatType}
                                >
                                  {seat.seatNumber}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Lower seats for this row */}
                      {config.rightLowerSeats > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-semibold text-sky-700 w-12">Lower</div>
                          <div className="flex gap-2">
                            {seatLayout.right.lower
                              .filter(seat => seat.position.row === rowIndex + 1)
                              .map(seat => (
                                <div
                                  key={seat.seatNumber}
                                  className="bg-sky-500 text-white text-xs font-bold rounded-lg flex items-center justify-center shadow-sm hover:bg-sky-600 transition-colors w-12 h-12"
                                  title={seat.seatType}
                                >
                                  {seat.seatNumber}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 bg-accent/10 border border-accent rounded p-3">
            <p className="text-sm text-black40">
              ✅ <strong>Success!</strong> This layout has been auto-generated with {config.rows} rows. 
              Left side has {config.leftUpperSeats + config.leftLowerSeats} seats per row, 
              right side has {config.rightUpperSeats + config.rightLowerSeats} seats per row.
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-gray-500 text-sm">
            📝 Configure rows and seats for left/right sides above. Preview will appear automatically when totals match!
          </p>
        </div>
      )}
    </div>
  )
}

export default BusSeatBuilder
