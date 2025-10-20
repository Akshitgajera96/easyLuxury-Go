/**
 * Booking summary component showing trip details, selected seats, and price breakdown
 */

import React from 'react'
import { motion } from 'framer-motion'

const BookingSummary = ({ 
  trip, 
  bus, 
  selectedSeats = [], 
  passengerDetails = [],
  onEditSeats,
  onEditPassengers 
}) => {
  const { 
    departureDateTime, 
    arrivalDateTime, 
    fare,
    baseFare,
    route 
  } = trip

  // Use baseFare if fare is not available (support both formats)
  const seatFare = fare || baseFare || 0

  const {
    busNumber,
    busType,
    operator,
    amenities = []
  } = bus

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const calculateDuration = (departure, arrival) => {
    const dep = new Date(departure)
    const arr = new Date(arrival)
    const diff = arr - dep
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const calculateTotal = () => {
    const totalBaseFare = selectedSeats.length * seatFare
    const taxes = totalBaseFare * 0.18 // 18% GST
    const convenienceFee = 30
    return {
      baseFare: totalBaseFare,
      taxes: Math.round(taxes),
      convenienceFee,
      total: Math.round(totalBaseFare + taxes + convenienceFee)
    }
  }

  const totals = calculateTotal()

  const getSeatType = (seatNumber) => {
    if (seatNumber.startsWith('U')) return 'Upper Berth'
    if (seatNumber.startsWith('L')) return 'Lower Berth'
    return 'Seater'
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-xl shadow-lg border border-gray-100 sticky top-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      {/* Header */}
      <div className="bg-black40 text-white p-6 rounded-t-xl">
        <h2 className="text-xl font-bold">Booking Summary</h2>
        <p className="text-accent text-sm">Review your trip details</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Trip Details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Route:</span>
              <span className="font-semibold">{route?.from} → {route?.to}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Departure:</span>
              <span className="font-semibold">
                {formatTime(departureDateTime)} · {formatDate(departureDateTime)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Arrival:</span>
              <span className="font-semibold">
                {formatTime(arrivalDateTime)} · {formatDate(arrivalDateTime)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Duration:</span>
              <span className="font-semibold">
                {calculateDuration(departureDateTime, arrivalDateTime)}
              </span>
            </div>
          </div>
        </div>

        {/* Bus Details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bus Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Operator:</span>
              <span className="font-semibold">{operator}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Bus Type:</span>
              <span className="font-semibold capitalize">{busType}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Bus Number:</span>
              <span className="font-semibold">{busNumber}</span>
            </div>
          </div>
        </div>

        {/* Selected Seats */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Selected Seats</h3>
            <button
              onClick={onEditSeats}
              className="text-accent hover:text-accent font-medium text-sm"
            >
              Change Seats
            </button>
          </div>
          {selectedSeats.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {selectedSeats.map((seat, index) => (
                <div
                  key={seat}
                  className="bg-gray-50 rounded-lg p-3 flex justify-between items-center"
                >
                  <div>
                    <span className="font-semibold text-gray-900">
                      {seat.replace('-', '')}
                    </span>
                    <span className="text-xs text-gray-500 block">
                      {getSeatType(seat)}
                    </span>
                  </div>
                  <span className="font-semibold text-accent">₹{seatFare}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No seats selected</p>
          )}
        </div>

        {/* Passenger Details */}
        {passengerDetails.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Passenger Details</h3>
              <button
                onClick={onEditPassengers}
                className="text-accent hover:text-accent font-medium text-sm"
              >
                Edit Passengers
              </button>
            </div>
            <div className="space-y-3">
              {passengerDetails.map((passenger, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">{passenger.name}</p>
                      <p className="text-sm text-gray-600">
                        {passenger.age} years · {passenger.gender}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Seat: {selectedSeats[index]?.replace('-', '')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price Breakdown */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Breakdown</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Base Fare ({selectedSeats.length} seats)</span>
              <span>₹{totals.baseFare}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Taxes & GST (18%)</span>
              <span>₹{totals.taxes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Convenience Fee</span>
              <span>₹{totals.convenienceFee}</span>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount</span>
                <span className="text-accent">₹{totals.total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-accent/10 border border-accent rounded-lg p-4">
          <h4 className="font-semibold text-black40 mb-2">Important Information</h4>
          <ul className="text-sm text-black40 space-y-1">
            <li>• Please carry a valid ID proof during travel</li>
            <li>• Arrive at boarding point 30 minutes before departure</li>
            <li>• Cancellation charges apply as per policy</li>
            <li>• Seats are subject to availability confirmation</li>
          </ul>
        </div>
      </div>
    </motion.div>
  )
}

export default BookingSummary