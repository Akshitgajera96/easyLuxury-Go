/**
 * Staff Trip Updates page - Update trip status and location
 */

import React, { useState } from 'react'
import { motion } from 'framer-motion'

const TripUpdatesPage = () => {
  const [location, setLocation] = useState('')
  const [status, setStatus] = useState('on_route')
  const [note, setNote] = useState('')

  const currentTrip = {
    id: 'TR003',
    route: 'Mumbai → Pune',
    busNumber: 'MH-12-AB-1234',
    startTime: '10:00 AM',
    estimatedArrival: '04:00 PM',
    progress: 60
  }

  const recentUpdates = [
    { time: '11:30 AM', location: 'Lonavala', status: 'Rest Stop', note: '15 min break' },
    { time: '10:45 AM', location: 'Khandala', status: 'On Route', note: 'Traffic smooth' },
    { time: '10:00 AM', location: 'Mumbai Depot', status: 'Departed', note: 'Trip started' }
  ]

  const handleSubmitUpdate = (e) => {
    e.preventDefault()
    // Reset form
    setLocation('')
    setNote('')
  }

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'departed':
        return 'bg-green-100 text-green-800'
      case 'on route':
      case 'on_route':
        return 'bg-accent/20 text-black40'
      case 'rest stop':
        return 'bg-accent/20 text-black40'
      case 'arrived':
        return 'bg-sky-100 text-sky-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Trip Updates</h2>
        <p className="text-gray-600">Update your current trip status and location</p>
      </div>

      {/* Current Trip Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-black40 to-blue-900 rounded-xl shadow-lg p-6 mb-6 text-white"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-bold">{currentTrip.route}</h3>
            <p className="text-accent">Trip ID: {currentTrip.id}</p>
          </div>
          <span className="bg-accent text-gray-900 px-4 py-2 rounded-full font-semibold">
            Active
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-accent text-sm">Bus Number</p>
            <p className="font-semibold">{currentTrip.busNumber}</p>
          </div>
          <div>
            <p className="text-accent text-sm">Start Time</p>
            <p className="font-semibold">{currentTrip.startTime}</p>
          </div>
          <div>
            <p className="text-accent text-sm">Est. Arrival</p>
            <p className="font-semibold">{currentTrip.estimatedArrival}</p>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Trip Progress</span>
            <span>{currentTrip.progress}%</span>
          </div>
          <div className="w-full bg-black40/80 rounded-full h-3">
            <div
              className="bg-accent h-3 rounded-full transition-all"
              style={{ width: `${currentTrip.progress}%` }}
            />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Update Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">Post Update</h3>
          <form onSubmit={handleSubmitUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Lonavala"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              >
                <option value="on_route">On Route</option>
                <option value="rest_stop">Rest Stop</option>
                <option value="delay">Delayed</option>
                <option value="arrived">Arrived</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Note (Optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add any additional information..."
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-accent text-gray-900 py-3 rounded-lg font-semibold hover:bg-gradient-to-r hover:from-accent hover:to-accent-dark hover:shadow-xl hover:scale-105 transition-all duration-300 transition-colors"
            >
              Post Update
            </button>
          </form>

          {/* Quick Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-3">
              <button className="bg-black40 text-white py-2 rounded-lg hover:bg-black40 transition-colors text-sm">
                Share Location
              </button>
              <button className="bg-gradient-to-r from-success to-success-dark shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-white py-2 rounded-lg hover:bg-green-700 transition-colors text-sm">
                Start Trip
              </button>
              <button className="bg-gradient-to-r from-accent to-accent-dark text-white py-2 rounded shadow-lg hover:shadow-xl-accent hover:scale-105 transition-all duration-300-lg hover:bg-gradient-to-r hover:from-accent hover:to-accent-dark hover:shadow-xl hover:scale-105 transition-all duration-300/90 transition-colors text-sm">
                Rest Break
              </button>
              <button className="bg-gradient-to-r from-info to-info-dark shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-white py-2 rounded-lg hover:bg-sky-700 transition-colors text-sm">
                Mark Arrived
              </button>
            </div>
          </div>
        </motion.div>

        {/* Recent Updates */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Updates</h3>
          <div className="space-y-4">
            {recentUpdates.map((update, index) => (
              <div key={index} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                    <span className="text-xl">📍</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-gray-900">{update.location}</h4>
                    <span className="text-xs text-gray-500">{update.time}</span>
                  </div>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold mb-1 ${getStatusColor(update.status)}`}>
                    {update.status}
                  </span>
                  <p className="text-sm text-gray-600">{update.note}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default TripUpdatesPage
