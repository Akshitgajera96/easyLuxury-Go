/**
 * Track Bus Page - Real-time bus location tracking
 * Shows live map with bus location, ETA, and trip details
 */

import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import LiveBusMap from '../../components/map/LiveBusMap'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useSocket } from '../../hooks/useSocket'
import tripService from '../../services/tripService'
import { toast } from 'react-hot-toast'

const TrackBusPage = () => {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const { socket } = useSocket()
  const [loading, setLoading] = useState(true)
  const [trip, setTrip] = useState(null)
  const [busLocation, setBusLocation] = useState(null)

  useEffect(() => {
    fetchTripDetails()
  }, [tripId])

  // Listen for real-time location updates via Socket.IO
  useEffect(() => {
    if (socket && tripId) {
      // Join trip-specific room
      socket.emit('join_trip', tripId)

      // Listen for location updates
      socket.on('location_update', (data) => {
        if (data.tripId === tripId) {
          setBusLocation({
            latitude: data.latitude,
            longitude: data.longitude,
            speed: data.speed,
            heading: data.heading,
            lastUpdated: data.timestamp
          })
        }
      })

      return () => {
        socket.emit('leave_trip', tripId)
        socket.off('location_update')
      }
    }
  }, [socket, tripId])

  const fetchTripDetails = async () => {
    setLoading(true)
    try {
      const response = await tripService.getTripById(tripId)
      
      if (response && response.success) {
        setTrip(response.data.trip)
        
        // Set initial location if available
        if (response.data.trip.currentLocation) {
          setBusLocation(response.data.trip.currentLocation)
        }
      }
    } catch (error) {
      console.error('Failed to fetch trip:', error)
      toast.error('Could not load trip details', {
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateETA = () => {
    if (!trip || !busLocation) return 'Calculating...'
    
    // Simple ETA calculation (you can use actual distance/speed)
    const arrival = new Date(trip.arrivalDateTime)
    const now = new Date()
    const diff = arrival - now
    
    if (diff < 0) return 'Arrived'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${hours}h ${minutes}m`
  }

  const getTripStatus = () => {
    if (!trip) return 'Unknown'
    
    const now = new Date()
    const departure = new Date(trip.departureDateTime)
    const arrival = new Date(trip.arrivalDateTime)
    
    if (now < departure) return 'Scheduled'
    if (now >= departure && now < arrival) return 'In Transit'
    return 'Completed'
  }

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A'
    return new Date(dateTime).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" variant="primary" />
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Trip not found</p>
          <button
            onClick={() => navigate('/bookings')}
            className="mt-4 bg-accent text-gray-900 px-6 py-2 rounded-lg font-semibold"
          >
            Go to My Bookings
          </button>
        </div>
      </div>
    )
  }

  const status = getTripStatus()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black40 text-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Track Your Bus</h1>
              <p className="text-accent mt-1">
                {trip.route?.sourceCity || 'Source'} → {trip.route?.destinationCity || 'Destination'}
              </p>
            </div>
            <button
              onClick={() => navigate('/bookings')}
              className="bg-black40 hover:bg-black40 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Back to Bookings
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section - Takes 2 columns */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="h-[600px]">
                <LiveBusMap
                  tripId={tripId}
                  busLocation={busLocation}
                  route={trip.route}
                />
              </div>
            </motion.div>
          </div>

          {/* Trip Info Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Status Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Status</h3>
              
              <div className="space-y-4">
                <div className={`inline-block px-4 py-2 rounded-full font-semibold ${
                  status === 'In Transit' ? 'bg-green-100 text-green-800' :
                  status === 'Scheduled' ? 'bg-accent/20 text-black40' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {status}
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">ETA</span>
                    <span className="font-bold text-accent text-xl">{calculateETA()}</span>
                  </div>
                  
                  {busLocation?.speed !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Current Speed</span>
                      <span className="font-semibold text-green-600">
                        {Math.round(busLocation.speed)} km/h
                      </span>
                    </div>
                  )}
                </div>

                {busLocation?.lastUpdated && (
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    Last updated: {new Date(busLocation.lastUpdated).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Trip Details Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Details</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Bus Number</p>
                  <p className="font-semibold text-gray-900">{trip.bus?.busNumber || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Operator</p>
                  <p className="font-semibold text-gray-900">{trip.bus?.operator || 'N/A'}</p>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-600">Departure</p>
                  <p className="font-semibold text-gray-900">{formatDateTime(trip.departureDateTime)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Expected Arrival</p>
                  <p className="font-semibold text-gray-900">{formatDateTime(trip.arrivalDateTime)}</p>
                </div>

                {trip.driver && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-600">Driver</p>
                    <p className="font-semibold text-gray-900">{trip.driver.name || 'N/A'}</p>
                    {trip.driver.phone && (
                      <p className="text-sm text-black40">{trip.driver.phone}</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Refresh Button */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <button
                onClick={fetchTripDetails}
                className="w-full bg-accent text-gray-900 py-3 rounded-lg font-semibold hover:bg-gradient-to-r hover:from-accent hover:to-accent-dark hover:shadow-xl hover:scale-105 transition-all duration-300 transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh Location</span>
              </button>
            </motion.div>
          </div>
        </div>

        {/* No Location Warning */}
        {!busLocation && status === 'In Transit' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 bg-accent/10 border-l-4 border-accent p-4 rounded"
          >
            <div className="flex">
              <svg className="h-5 w-5 text-accent mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-black40">Location Not Available</h3>
                <p className="mt-1 text-sm text-black40">
                  Bus location tracking will be available once the driver starts sharing location.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default TrackBusPage
