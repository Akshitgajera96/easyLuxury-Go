/**
 * Bus card component for displaying bus information in search results
 */

import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const BusCard = ({ bus, trip, onSelect }) => {
  const {
    busNumber,
    seatType,
    amenities = [],
    operator,
    totalSeats
  } = bus

  const {
    departureDateTime,
    arrivalDateTime,
    baseFare,
    availableSeats
  } = trip
  
  const fare = baseFare

  const busTypeConfig = {
    sleeper: { label: 'Sleeper', color: 'bg-blue-100 text-blue-700' },
    'semi-sleeper': { label: 'Semi Sleeper', color: 'bg-green-100 text-green-700' },
    seater: { label: 'Seater', color: 'bg-sky-100 text-sky-700' },
    luxury: { label: 'Luxury', color: 'bg-purple-100 text-purple-700' }
  }

  const amenityIcons = {
    wifi: '📶',
    charging: '🔌',
    ac: '❄️',
    blanket: '🛏️',
    snacks: '🍿',
    entertainment: '📺'
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
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

  const typeConfig = busTypeConfig[seatType] || busTypeConfig.seater

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{operator}</h3>
            <p className="text-gray-500">Bus No: {busNumber}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${typeConfig.color}`}>
            {typeConfig.label}
          </span>
        </div>

        {/* Schedule */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {formatTime(departureDateTime)}
            </p>
            <p className="text-sm text-gray-500">
              {formatDate(departureDateTime)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Departure</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 text-gray-400">
              <div className="h-px bg-gray-300 flex-1"></div>
              <span className="text-sm">🚌</span>
              <div className="h-px bg-gray-300 flex-1"></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {calculateDuration(departureDateTime, arrivalDateTime)}
            </p>
          </div>

          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {formatTime(arrivalDateTime)}
            </p>
            <p className="text-sm text-gray-500">
              {formatDate(arrivalDateTime)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Arrival</p>
          </div>
        </div>

        {/* Amenities */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Amenities</h4>
          <div className="flex flex-wrap gap-2">
            {amenities.map((amenity) => (
              <span
                key={amenity}
                className="inline-flex items-center space-x-1 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
              >
                <span>{amenityIcons[amenity] || '?'}</span>
                <span className="capitalize">{amenity}</span>
              </span>
            ))}
            {amenities.length === 0 && (
              <span className="text-sm text-gray-400">No amenities listed</span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">₹{fare}</p>
              <p className="text-xs text-gray-500">per seat</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">{availableSeats}</p>
              <p className="text-xs text-gray-500">seats left</p>
            </div>
          </div>

          <button
            onClick={() => onSelect(bus, trip)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={availableSeats === 0}
          >
            {availableSeats === 0 ? 'Sold Out' : 'Select Seats'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default BusCard