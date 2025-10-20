/**
 * Staff dashboard page for drivers and conductors
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import staffService from '../../services/staffService'
import bookingService from '../../services/bookingService'
import tripService from '../../services/tripService'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { toast } from 'react-hot-toast'

const StaffDashboardPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [todayTrips, setTodayTrips] = useState([])
  const [bookings, setBookings] = useState([])
  const [stats, setStats] = useState({
    totalBookings: 0,
    seatsBooked: 0,
    seatsAvailable: 0,
    boardingSoon: 0,
    totalCapacity: 0
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // Fetch all bookings for staff
      const bookingsResponse = await staffService.getAllBookings()
      
      if (bookingsResponse && bookingsResponse.success) {
        const allBookings = bookingsResponse.data.bookings || []
        setBookings(allBookings)
        
        // Calculate stats
        const confirmedBookings = allBookings.filter(b => b.bookingStatus === 'confirmed')
        const totalSeatsBooked = confirmedBookings.reduce((sum, b) => sum + (b.seats?.length || 0), 0)
        
        setStats({
          totalBookings: allBookings.length,
          seatsBooked: totalSeatsBooked,
          seatsAvailable: 100 - totalSeatsBooked, // This should come from actual trip capacity
          boardingSoon: confirmedBookings.filter(b => {
            const departureTime = new Date(b.trip?.departureDateTime)
            const now = new Date()
            const hoursDiff = (departureTime - now) / (1000 * 60 * 60)
            return hoursDiff > 0 && hoursDiff <= 2
          }).length,
          totalCapacity: 100 // This should come from actual trip
        })
        
        // Get unique trips from bookings
        const uniqueTrips = [...new Map(
          allBookings
            .filter(b => b.trip)
            .map(b => [b.trip._id || b.trip.id, b.trip])
        ).values()]
        
        setTodayTrips(uniqueTrips.slice(0, 5))
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      toast.error('Could not load dashboard data', {
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStartTrip = async () => {
    toast.success('Trip started!', { duration: 2000 })
  }

  const handleUpdateLocation = async () => {
    navigate('/staff/location-update')
  }

  const handleMarkArrival = async () => {
    toast.success('Arrival marked!', { duration: 2000 })
  }

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A'
    return new Date(dateTime).toLocaleString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const getTripStatus = (trip) => {
    if (!trip || !trip.departureDateTime) return 'Unknown'
    const now = new Date()
    const departure = new Date(trip.departureDateTime)
    const arrival = new Date(trip.arrivalDateTime)
    
    if (now < departure) return 'Scheduled'
    if (now >= departure && now < arrival) return 'Active'
    return 'Completed'
  }

  const getStatusColor = (status) => {
    const colors = {
      'Scheduled': 'bg-accent/20 text-black40',
      'Active': 'bg-green-100 text-green-800',
      'Completed': 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" variant="primary" />
      </div>
    )
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {/* Today's Trips */}
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Trips</h3>
          <div className="space-y-3">
            {todayTrips.length > 0 ? (
              todayTrips.map((trip, index) => {
                const status = getTripStatus(trip)
                return (
                  <div key={trip._id || index} className={`flex justify-between items-center p-3 rounded-lg ${
                    status === 'Active' ? 'bg-green-50' : 'bg-accent/10'
                  }`}>
                    <div>
                      <p className="font-semibold">
                        {trip.route?.sourceCity || trip.route?.from || 'N/A'} → {trip.route?.destinationCity || trip.route?.to || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDateTime(trip.departureDateTime)} - {formatDateTime(trip.arrivalDateTime)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-sm ${getStatusColor(status)}`}>
                      {status}
                    </span>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No trips scheduled today</p>
            )}
          </div>
        </div>

        {/* Passenger Management */}
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Passenger List</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {bookings.length > 0 ? (
              bookings.slice(0, 10).map((booking, index) => (
                booking.passengerInfo && booking.passengerInfo.length > 0 ? (
                  booking.passengerInfo.map((passenger, pIndex) => (
                    <div key={`${booking._id}-${pIndex}`} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                      <span className="font-medium">{passenger.name || 'N/A'}</span>
                      <span className="text-sm text-gray-500">Seat {booking.seats?.[pIndex] || 'N/A'}</span>
                    </div>
                  ))
                ) : null
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No passengers yet</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={handleStartTrip}
              className="w-full bg-accent text-gray-900 py-3 rounded-lg font-semibold hover:bg-gradient-to-r hover:from-accent hover:to-accent-dark hover:shadow-xl hover:scale-105 transition-all duration-300 transition-colors"
            >
              Start Trip
            </button>
            <button 
              onClick={handleUpdateLocation}
              className="w-full bg-black40 text-gray-100 py-3 rounded-lg font-semibold hover:bg-black40/90 transition-colors"
            >
              Update Location
            </button>
            <button 
              onClick={handleMarkArrival}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Mark Arrival
            </button>
          </div>
        </div>
      </motion.div>

      {/* Bus Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8 bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bus Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stats.seatsBooked}</p>
            <p className="text-sm text-green-700">Seats Booked</p>
          </div>
          <div className="p-4 bg-accent/10 rounded-lg">
            <p className="text-2xl font-bold text-black40">{stats.seatsAvailable}</p>
            <p className="text-sm text-black40">Seats Available</p>
          </div>
          <div className="p-4 bg-accent/10 rounded-lg">
            <p className="text-2xl font-bold text-black40">{stats.boardingSoon}</p>
            <p className="text-sm text-black40">Boarding Soon</p>
          </div>
          <div className="p-4 bg-sky-50 rounded-lg">
            <p className="text-2xl font-bold text-sky-600">{stats.totalBookings}</p>
            <p className="text-sm text-sky-700">Total Bookings</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default StaffDashboardPage