/**
 * Staff Location Update Page
 * Allows staff to manage their assigned trip and update location
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bus, Route as RouteIcon, MapPin, Clock, Users } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import LocationTracker from '../../components/staff/LocationTracker'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import axios from 'axios'
import { toast } from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const LocationUpdatePage = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [assignedTrip, setAssignedTrip] = useState(null)
  const [tripDetails, setTripDetails] = useState(null)

  useEffect(() => {
    fetchAssignedTrip()
  }, [])

  const fetchAssignedTrip = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      
      // First, get staff details to find assigned bus
      const staffResponse = await axios.get(`${API_BASE_URL}/staff/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (staffResponse.data.success && staffResponse.data.data.staff?.assignedBus) {
        const busId = staffResponse.data.data.staff.assignedBus

        // Find active trip for this bus
        const tripsResponse = await axios.get(`${API_BASE_URL}/trips`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (tripsResponse.data.success) {
          const now = new Date()
          const activeTrip = tripsResponse.data.data.trips.find(trip => {
            const departure = new Date(trip.departureDateTime)
            const arrival = new Date(trip.arrivalDateTime)
            return (
              trip.bus._id === busId &&
              departure <= now &&
              arrival >= now &&
              trip.isActive
            )
          })

          if (activeTrip) {
            setAssignedTrip(activeTrip)
            fetchTripDetails(activeTrip._id)
          } else {
            toast.error('No active trip found for your bus')
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch assigned trip:', error)
      toast.error('Failed to load trip information')
    } finally {
      setLoading(false)
    }
  }

  const fetchTripDetails = async (tripId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE_URL}/trips/${tripId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setTripDetails(response.data.data.trip)
      }
    } catch (error) {
      console.error('Failed to fetch trip details:', error)
    }
  }

  const handleLocationUpdate = (location) => {
    // Update UI or show confirmation
    console.log('Location updated:', location)
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

  if (!assignedTrip) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-black40 text-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl font-bold flex items-center">
              <MapPin className="w-7 h-7 mr-2 text-accent" />
              Location Update
            </h1>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-12 text-center"
          >
            <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Active Trip</h2>
            <p className="text-gray-600 mb-6">
              You don't have an active trip assigned at the moment.
            </p>
            <button
              onClick={fetchAssignedTrip}
              className="bg-accent text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-accent/90 transition-colors"
            >
              Refresh
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black40 text-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <MapPin className="w-7 h-7 mr-2 text-accent" />
                Location Update
              </h1>
              <p className="text-accent mt-1">
                Share your live location with passengers
              </p>
            </div>
            <div className="bg-accent/20 px-4 py-2 rounded-lg text-center">
              <p className="text-sm text-gray-300">Bus Number</p>
              <p className="text-xl font-bold text-accent">
                {assignedTrip.bus?.busNumber || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trip Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Trip Info Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Bus className="w-5 h-5 mr-2 text-accent" />
                Trip Information
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Bus Details</p>
                  <p className="font-semibold text-gray-900">{assignedTrip.bus?.busNumber}</p>
                  <p className="text-sm text-gray-600">{assignedTrip.bus?.operator}</p>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-600 mb-2 flex items-center">
                    <RouteIcon className="w-4 h-4 mr-1" />
                    Route
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2 mt-1"></div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {assignedTrip.route?.sourceCity || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(assignedTrip.departureDateTime)}
                        </p>
                      </div>
                    </div>
                    <div className="ml-1 border-l-2 border-gray-300 h-6"></div>
                    <div className="flex items-start">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2 mt-1"></div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {assignedTrip.route?.destinationCity || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(assignedTrip.arrivalDateTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {tripDetails && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-600 mb-2 flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      Passengers
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Booked Seats:</span>
                      <span className="font-semibold text-accent">
                        {tripDetails.bookedSeats?.length || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Available:</span>
                      <span className="font-semibold text-green-600">
                        {tripDetails.availableSeats || 0}
                      </span>
                    </div>
                  </div>
                )}

                {assignedTrip.driver && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-600">Driver</p>
                    <p className="font-semibold text-gray-900">{assignedTrip.driver.name}</p>
                    {assignedTrip.driver.phone && (
                      <p className="text-sm text-gray-600">{assignedTrip.driver.phone}</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Location Tracker */}
          <div className="lg:col-span-2">
            <LocationTracker 
              tripId={assignedTrip._id} 
              onLocationUpdate={handleLocationUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default LocationUpdatePage
