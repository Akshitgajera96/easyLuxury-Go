/**
 * Location Tracker Component for Staff
 * Allows drivers/conductors to share their live location
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Navigation, Clock, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'
import staffService from '../../services/staffService'
import { toast } from 'react-hot-toast'

const LocationTracker = ({ tripId, onLocationUpdate }) => {
  const [tracking, setTracking] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [error, setError] = useState(null)
  const [watchId, setWatchId] = useState(null)

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [watchId])

  const startTracking = () => {
    if (!tripId) {
      toast.error('No trip selected for location tracking')
      setError('Trip ID is required')
      return
    }

    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      setError('Geolocation not supported')
      return
    }

    setError(null)
    setTracking(true)

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateLocation(position)
      },
      (err) => {
        console.error('Error getting location:', err)
        toast.error('Failed to get your location')
        setError(err.message)
        setTracking(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )

    // Watch position changes
    const id = navigator.geolocation.watchPosition(
      (position) => {
        updateLocation(position)
      },
      (err) => {
        console.error('Error watching location:', err)
        setError(err.message)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000, // Cache for 5 seconds
        distanceFilter: 10 // Update every 10 meters
      }
    )

    setWatchId(id)
    toast.success('Location tracking started')
  }

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
    setTracking(false)
    toast.success('Location tracking stopped')
  }

  const updateLocation = async (position) => {
    const locationData = {
      tripId,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      speed: position.coords.speed || 0,
      heading: position.coords.heading || 0,
      accuracy: position.coords.accuracy
    }

    setCurrentLocation({
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      speed: locationData.speed,
      heading: locationData.heading,
      accuracy: locationData.accuracy
    })

    // Send to backend
    try {
      const response = await staffService.updateLocation(locationData)

      if (response?.success) {
        setLastUpdate(new Date())
        setError(null) // Clear any previous errors
        if (onLocationUpdate) {
          onLocationUpdate({
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            speed: locationData.speed,
            heading: locationData.heading
          })
        }
      }
    } catch (error) {
      console.error('Failed to update location:', error)
      // Don't show toast for every failed update to avoid spam
      setError('Failed to send location update')
    }
  }

  const manualUpdate = () => {
    if (!tracking) {
      toast.error('Please start tracking first')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateLocation(position)
        toast.success('Location updated manually')
      },
      (err) => {
        console.error('Error getting location:', err)
        toast.error('Failed to get your location')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Not updated yet'
    const now = new Date()
    const diffMs = now - lastUpdate
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)

    if (diffSec < 10) return 'Just now'
    if (diffSec < 60) return `${diffSec} seconds ago`
    if (diffMin < 60) return `${diffMin} minutes ago`
    return lastUpdate.toLocaleTimeString()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-accent" />
          Live Location Tracking
        </h3>
        {tracking && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="flex items-center space-x-2"
          >
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-sm font-semibold text-green-600">Active</span>
          </motion.div>
        )}
      </div>

      {/* Status Card */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-600 mb-1">Status</p>
            <div className="flex items-center">
              {tracking ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm font-semibold text-green-600">Tracking Active</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm font-semibold text-gray-600">Not Tracking</span>
                </>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Last Update</p>
            <div className="flex items-center">
              <Clock className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-sm font-semibold text-gray-900">{formatLastUpdate()}</span>
            </div>
          </div>
        </div>

        {currentLocation && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-600">Latitude:</span>
                <span className="ml-2 font-mono font-semibold">{currentLocation.latitude.toFixed(6)}</span>
              </div>
              <div>
                <span className="text-gray-600">Longitude:</span>
                <span className="ml-2 font-mono font-semibold">{currentLocation.longitude.toFixed(6)}</span>
              </div>
              {currentLocation.speed > 0 && (
                <div>
                  <span className="text-gray-600">Speed:</span>
                  <span className="ml-2 font-semibold text-green-600">
                    {Math.round(currentLocation.speed * 3.6)} km/h
                  </span>
                </div>
              )}
              {currentLocation.accuracy && (
                <div>
                  <span className="text-gray-600">Accuracy:</span>
                  <span className="ml-2 font-semibold">±{Math.round(currentLocation.accuracy)}m</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Location Error</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {!tracking ? (
          <button
            onClick={startTracking}
            className="w-full bg-gradient-to-r from-accent to-accent-dark text-gray-900 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <Navigation className="w-5 h-5" />
            <span>Start Location Tracking</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={manualUpdate}
              className="bg-accent/20 text-black40 py-3 rounded-lg font-semibold hover:bg-accent/30 transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Update Now</span>
            </button>
            <button
              onClick={stopTracking}
              className="bg-red-100 text-red-700 py-3 rounded-lg font-semibold hover:bg-red-200 transition-colors"
            >
              Stop Tracking
            </button>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-800">
            <p className="font-semibold mb-1">Location Tracking Info</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Your location will be shared with passengers</li>
              <li>Updates automatically every few seconds</li>
              <li>Ensure GPS/location services are enabled</li>
              <li>For best accuracy, stay outdoors when possible</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default LocationTracker
