/**
 * Location Service
 * Handles all location tracking related API calls
 */

import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// Get authentication token
const getAuthHeader = () => {
  const token = localStorage.getItem('token')
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
}

/**
 * Update bus location for a trip
 * @param {string} tripId - Trip ID
 * @param {object} locationData - Location data (latitude, longitude, speed, heading)
 */
const updateLocation = async (tripId, locationData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/location/update`,
      {
        tripId,
        ...locationData
      },
      getAuthHeader()
    )
    return response.data
  } catch (error) {
    console.error('Error updating location:', error)
    throw error
  }
}

/**
 * Get current location of a trip
 * @param {string} tripId - Trip ID
 */
const getLocation = async (tripId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/location/${tripId}`,
      getAuthHeader()
    )
    return response.data
  } catch (error) {
    console.error('Error fetching location:', error)
    throw error
  }
}

/**
 * Get location history for a trip
 * @param {string} tripId - Trip ID
 */
const getLocationHistory = async (tripId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/location/${tripId}/history`,
      getAuthHeader()
    )
    return response.data
  } catch (error) {
    console.error('Error fetching location history:', error)
    throw error
  }
}

/**
 * Get all active trips with their current locations (Admin only)
 */
const getAllActiveLocations = async () => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/location/all-active`,
      getAuthHeader()
    )
    return response.data
  } catch (error) {
    console.error('Error fetching all active locations:', error)
    throw error
  }
}

/**
 * Start continuous location tracking
 * @param {string} tripId - Trip ID
 * @param {function} callback - Callback to handle location updates
 * @param {object} options - Geolocation options
 */
const startLocationTracking = (tripId, callback, options = {}) => {
  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 5000,
    distanceFilter: 10 // Update every 10 meters
  }

  const trackingOptions = { ...defaultOptions, ...options }

  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser')
  }

  const watchId = navigator.geolocation.watchPosition(
    async (position) => {
      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed: position.coords.speed ? position.coords.speed * 3.6 : 0, // Convert m/s to km/h
        heading: position.coords.heading || 0,
        accuracy: position.coords.accuracy
      }

      try {
        await updateLocation(tripId, locationData)
        if (callback) {
          callback(locationData, null)
        }
      } catch (error) {
        if (callback) {
          callback(null, error)
        }
      }
    },
    (error) => {
      console.error('Geolocation error:', error)
      if (callback) {
        callback(null, error)
      }
    },
    trackingOptions
  )

  return watchId
}

/**
 * Stop location tracking
 * @param {number} watchId - Watch ID returned by startLocationTracking
 */
const stopLocationTracking = (watchId) => {
  if (watchId !== null && watchId !== undefined) {
    navigator.geolocation.clearWatch(watchId)
  }
}

/**
 * Get current position once
 * @param {object} options - Geolocation options
 */
const getCurrentPosition = (options = {}) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'))
      return
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed: position.coords.speed ? position.coords.speed * 3.6 : 0,
          heading: position.coords.heading || 0,
          accuracy: position.coords.accuracy
        })
      },
      (error) => {
        reject(error)
      },
      { ...defaultOptions, ...options }
    )
  })
}

const locationService = {
  updateLocation,
  getLocation,
  getLocationHistory,
  getAllActiveLocations,
  startLocationTracking,
  stopLocationTracking,
  getCurrentPosition
}

export default locationService
