/**
 * Staff My Trips page - Shows assigned trips for drivers/conductors
 */

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'

const MyTripsPage = () => {
  const { user } = useAuth()
  const [selectedTab, setSelectedTab] = useState('upcoming') // upcoming, ongoing, completed

  const trips = {
    upcoming: [
      {
        id: 'TR001',
        route: 'Mumbai → Pune',
        date: '2025-10-12',
        time: '10:00 AM',
        busNumber: 'MH-12-AB-1234',
        seats: 45,
        status: 'Scheduled'
      },
      {
        id: 'TR002',
        route: 'Delhi → Jaipur',
        date: '2025-10-13',
        time: '02:00 PM',
        busNumber: 'DL-01-XY-5678',
        seats: 38,
        status: 'Scheduled'
      }
    ],
    ongoing: [
      {
        id: 'TR003',
        route: 'Bangalore → Chennai',
        date: '2025-10-11',
        time: '08:00 AM',
        busNumber: 'KA-05-MN-9012',
        seats: 52,
        status: 'In Progress',
        progress: 60
      }
    ],
    completed: [
      {
        id: 'TR004',
        route: 'Kolkata → Delhi',
        date: '2025-10-10',
        time: '06:00 AM',
        busNumber: 'WB-03-CD-3456',
        seats: 48,
        status: 'Completed'
      }
    ]
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-accent/20 text-black40'
      case 'In Progress':
        return 'bg-green-100 text-green-800'
      case 'Completed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">My Trips</h2>
        <p className="text-gray-600">Manage your assigned trips and schedules</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div className="flex border-b">
          <button
            onClick={() => setSelectedTab('upcoming')}
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
              selectedTab === 'upcoming'
                ? 'border-b-2 border-accent text-black40'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Upcoming ({trips.upcoming.length})
          </button>
          <button
            onClick={() => setSelectedTab('ongoing')}
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
              selectedTab === 'ongoing'
                ? 'border-b-2 border-accent text-black40'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Ongoing ({trips.ongoing.length})
          </button>
          <button
            onClick={() => setSelectedTab('completed')}
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
              selectedTab === 'completed'
                ? 'border-b-2 border-accent text-black40'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Completed ({trips.completed.length})
          </button>
        </div>
      </div>

      {/* Trip Cards */}
      <div className="space-y-4">
        {trips[selectedTab].map((trip, index) => (
          <motion.div
            key={trip.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{trip.route}</h3>
                <p className="text-sm text-gray-500">Trip ID: {trip.id}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(trip.status)}`}>
                {trip.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-semibold">{new Date(trip.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p className="font-semibold">{trip.time}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Bus Number</p>
                <p className="font-semibold">{trip.busNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Seats Booked</p>
                <p className="font-semibold">{trip.seats}/60</p>
              </div>
            </div>

            {trip.progress && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Trip Progress</span>
                  <span>{trip.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-success-light to-success shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 h-2 rounded-full transition-all"
                    style={{ width: `${trip.progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {selectedTab === 'upcoming' && (
                <>
                  <button className="flex-1 bg-accent text-gray-900 py-2 rounded-lg font-semibold hover:bg-gradient-to-r hover:from-accent hover:to-accent-dark hover:shadow-xl hover:scale-105 transition-all duration-300 transition-colors">
                    View Details
                  </button>
                  <button className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                    Check Route
                  </button>
                </>
              )}
              {selectedTab === 'ongoing' && (
                <>
                  <button className="flex-1 bg-gradient-to-r from-success to-success-dark shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                    Update Status
                  </button>
                  <button className="flex-1 bg-black40 text-white py-2 rounded-lg font-semibold hover:bg-black40/90 transition-colors">
                    View Passengers
                  </button>
                </>
              )}
              {selectedTab === 'completed' && (
                <button className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                  View Summary
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {trips[selectedTab].length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No {selectedTab} trips</p>
        </div>
      )}
    </div>
  )
}

export default MyTripsPage
