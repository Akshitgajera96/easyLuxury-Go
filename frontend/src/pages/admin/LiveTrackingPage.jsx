/**
 * Admin Live Tracking Dashboard
 * Shows all active buses on a single map with real-time locations
 */

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Map, { Marker, Popup } from 'react-map-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Bus, RefreshCw, MapPin, Navigation, Clock } from 'lucide-react'
import maplibregl from 'maplibre-gl'
import AdminNav from '../../components/admin/AdminNav'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useSocket } from '../../hooks/useSocket'
import axios from 'axios'
import { toast } from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_API_KEY

const LiveTrackingPage = () => {
  const { socket } = useSocket()
  const [loading, setLoading] = useState(true)
  const [activeTrips, setActiveTrips] = useState([])
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [showPopup, setShowPopup] = useState(false)
  const [viewport, setViewport] = useState({
    latitude: 20.5937,
    longitude: 78.9629,
    zoom: 5
  })
  const mapRef = useRef()

  useEffect(() => {
    fetchActiveTrips()
    const interval = setInterval(fetchActiveTrips, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Listen for real-time location updates via Socket.IO
  useEffect(() => {
    if (socket) {
      socket.on('location_update', (data) => {
        setActiveTrips(prev => prev.map(trip => 
          trip._id === data.tripId 
            ? {
                ...trip,
                currentLocation: {
                  latitude: data.latitude,
                  longitude: data.longitude,
                  speed: data.speed,
                  heading: data.heading,
                  lastUpdated: data.timestamp
                }
              }
            : trip
        ))
      })

      return () => {
        socket.off('location_update')
      }
    }
  }, [socket])

  const fetchActiveTrips = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE_URL}/location/all-active`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setActiveTrips(response.data.data.activeTrips)
        
        // Join socket rooms for all active trips
        if (socket) {
          response.data.data.activeTrips.forEach(trip => {
            socket.emit('join_trip', trip._id)
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch active trips:', error)
      if (error.response?.status !== 401) {
        toast.error('Failed to load active buses')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    setLoading(true)
    fetchActiveTrips()
    toast.success('Locations refreshed', { duration: 2000 })
  }

  const handleMarkerClick = (trip) => {
    setSelectedTrip(trip)
    setShowPopup(true)
    setViewport({
      ...viewport,
      latitude: trip.currentLocation.latitude,
      longitude: trip.currentLocation.longitude,
      zoom: 12
    })
  }

  const formatSpeed = (speed) => {
    return speed ? `${Math.round(speed)} km/h` : 'N/A'
  }

  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return 'No updates yet'
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit'
    })
  }

  const getStatusColor = (trip) => {
    if (!trip.currentLocation?.lastUpdated) return 'bg-gray-400'
    
    const lastUpdate = new Date(trip.currentLocation.lastUpdated)
    const now = new Date()
    const diffMins = (now - lastUpdate) / 60000
    
    if (diffMins < 5) return 'bg-green-500' // Active
    if (diffMins < 15) return 'bg-yellow-500' // Warning
    return 'bg-red-500' // Stale
  }

  if (loading && activeTrips.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <LoadingSpinner size="lg" variant="primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      
      {/* Header */}
      <div className="bg-black40 text-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <MapPin className="w-7 h-7 mr-2 text-accent" />
                Live Bus Tracking
              </h1>
              <p className="text-accent mt-1">
                Monitor all active buses in real-time
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-accent/20 px-4 py-2 rounded-lg">
                <p className="text-sm text-gray-300">Active Buses</p>
                <p className="text-2xl font-bold text-accent">{activeTrips.length}</p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="bg-accent text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-accent/90 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Buses List Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-lg p-4 max-h-[calc(100vh-250px)] overflow-y-auto"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Bus className="w-5 h-5 mr-2" />
                Active Buses
              </h3>
              
              {activeTrips.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No active buses</p>
              ) : (
                <div className="space-y-3">
                  {activeTrips.map((trip) => (
                    <motion.div
                      key={trip._id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => handleMarkerClick(trip)}
                      className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors border-l-4 border-accent"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {trip.bus?.busNumber || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-600">
                            {trip.bus?.operator || 'N/A'}
                          </p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(trip)} animate-pulse`} />
                      </div>
                      
                      <div className="text-xs text-gray-600 space-y-1">
                        <p className="flex items-center">
                          <Navigation className="w-3 h-3 mr-1" />
                          {trip.route?.sourceCity} → {trip.route?.destinationCity}
                        </p>
                        {trip.currentLocation?.speed > 0 && (
                          <p className="text-green-600 font-medium">
                            {formatSpeed(trip.currentLocation.speed)}
                          </p>
                        )}
                        <p className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatLastUpdated(trip.currentLocation?.lastUpdated)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Map View */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-4"
            >
              <div className="h-[calc(100vh-250px)] rounded-xl overflow-hidden">
                <Map
                  ref={mapRef}
                  {...viewport}
                  onMove={evt => setViewport(evt.viewState)}
                  style={{ width: '100%', height: '100%' }}
                  mapStyle={`https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`}
                  mapLib={maplibregl}
                >
                  {activeTrips.map((trip) => (
                    trip.currentLocation?.latitude && trip.currentLocation?.longitude && (
                      <Marker
                        key={trip._id}
                        latitude={trip.currentLocation.latitude}
                        longitude={trip.currentLocation.longitude}
                        anchor="center"
                        onClick={() => handleMarkerClick(trip)}
                      >
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="cursor-pointer relative"
                        >
                          <div 
                            className="bg-accent rounded-full p-3 shadow-2xl border-4 border-white"
                            style={{ transform: `rotate(${trip.currentLocation.heading || 0}deg)` }}
                          >
                            <Bus className="w-6 h-6 text-black40" />
                            {trip.currentLocation.speed > 0 && (
                              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center">
                                {Math.round(trip.currentLocation.speed)}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </Marker>
                    )
                  ))}

                  {/* Popup */}
                  {showPopup && selectedTrip && (
                    <Popup
                      latitude={selectedTrip.currentLocation.latitude}
                      longitude={selectedTrip.currentLocation.longitude}
                      anchor="top"
                      onClose={() => setShowPopup(false)}
                      closeOnClick={false}
                    >
                      <div className="p-2 min-w-[220px]">
                        <h3 className="font-bold text-black40 mb-2 flex items-center">
                          <Bus className="w-5 h-5 mr-2" />
                          {selectedTrip.bus?.busNumber}
                        </h3>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Operator:</span>
                            <span className="font-semibold">{selectedTrip.bus?.operator}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Route:</span>
                            <span className="font-semibold text-xs">
                              {selectedTrip.route?.sourceCity} → {selectedTrip.route?.destinationCity}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Speed:</span>
                            <span className="font-semibold text-green-600">
                              {formatSpeed(selectedTrip.currentLocation.speed)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Last Updated:</span>
                            <span className="font-semibold">
                              {formatLastUpdated(selectedTrip.currentLocation.lastUpdated)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  )}
                </Map>
              </div>

              {/* Map Legend */}
              <div className="absolute bottom-8 left-8 bg-white rounded-lg shadow-lg p-3 text-sm">
                <h4 className="font-semibold mb-2 text-gray-900">Status</h4>
                <div className="space-y-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span>Active (&lt;5 min)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <span>Warning (5-15 min)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span>Stale (&gt;15 min)</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* No Active Buses Message */}
        {activeTrips.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white rounded-xl shadow-lg"
          >
            <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Buses</h3>
            <p className="text-gray-600">
              There are no buses currently in transit with location tracking enabled.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default LiveTrackingPage
