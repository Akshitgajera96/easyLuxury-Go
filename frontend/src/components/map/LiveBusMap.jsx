/**
 * Live Bus Map Component using MapTiler
 * Displays real-time bus location tracking
 */

import React, { useState, useEffect, useRef } from 'react'
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { motion } from 'framer-motion'

const LiveBusMap = ({ tripId, busLocation, route }) => {
  const [viewport, setViewport] = useState({
    latitude: busLocation?.latitude || 20.5937,
    longitude: busLocation?.longitude || 78.9629,
    zoom: 6
  })
  const [showPopup, setShowPopup] = useState(false)
  const mapRef = useRef()

  // Check if MapTiler API key is configured
  const hasMapTilerKey = import.meta.env.VITE_MAPTILER_API_KEY && 
    import.meta.env.VITE_MAPTILER_API_KEY !== 'your_maptiler_api_key_here'

  // Update viewport when bus location changes
  useEffect(() => {
    if (busLocation?.latitude && busLocation?.longitude) {
      setViewport(prev => ({
        ...prev,
        latitude: busLocation.latitude,
        longitude: busLocation.longitude,
        zoom: 12
      }))
    }
  }, [busLocation])

  // Route line data (from source to destination)
  const routeData = route ? {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [route.sourceCoordinates?.longitude || 72.8777, route.sourceCoordinates?.latitude || 19.0760],
        [route.destinationCoordinates?.longitude || 73.8567, route.destinationCoordinates?.latitude || 18.5204]
      ]
    }
  } : null

  const routeLayer = {
    id: 'route',
    type: 'line',
    paint: {
      'line-color': '#90D7FF',
      'line-width': 3,
      'line-dasharray': [2, 2]
    }
  }

  const formatSpeed = (speed) => {
    return speed ? `${Math.round(speed)} km/h` : 'N/A'
  }

  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return 'No updates yet'
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Show setup instructions if MapTiler key is not configured
  if (!hasMapTilerKey) {
    return (
      <div className="relative w-full h-full rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="max-w-md p-8 bg-white rounded-xl shadow-lg">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 text-center mb-3">Map Configuration Required</h3>
          <p className="text-gray-600 text-center mb-4 text-sm">
            To enable live bus tracking, add your MapTiler API key:
          </p>
          <div className="space-y-3 text-sm">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-lg">
              <p className="font-semibold text-gray-900 mb-2 flex items-center">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-xs">1</span>
                Get FREE MapTiler API Key
              </p>
              <p className="text-xs text-gray-600 mb-2">✓ No payment method required</p>
              <a 
                href="https://www.maptiler.com/cloud/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Get API Key →
              </a>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4 rounded-lg">
              <p className="font-semibold text-gray-900 mb-2 flex items-center">
                <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-xs">2</span>
                Add to frontend/.env
              </p>
              <code className="block text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto font-mono">
                VITE_MAPTILER_API_KEY=your_key_here
              </code>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <p className="text-xs text-gray-700">
                <strong>⚠️ Important:</strong> Restart your dev server after adding the key!
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <Map
        ref={mapRef}
        {...viewport}
        onMove={evt => setViewport(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle={`https://api.maptiler.com/maps/streets-v2/style.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`}
        mapLib={maplibregl}
        attributionControl={true}
      >
        {/* Route line */}
        {routeData && (
          <Source id="route" type="geojson" data={routeData}>
            <Layer {...routeLayer} />
          </Source>
        )}

        {/* Source marker (Green) */}
        {route?.sourceCoordinates && (
          <Marker
            latitude={route.sourceCoordinates.latitude}
            longitude={route.sourceCoordinates.longitude}
            anchor="bottom"
          >
            <div className="flex flex-col items-center">
              <div className="bg-gradient-to-r from-success-light to-success shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 rounded-full p-3 shadow-lg border-4 border-white">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-xs font-semibold bg-white px-2 py-1 rounded shadow mt-1 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                {route.sourceCity || 'Start'}
              </span>
            </div>
          </Marker>
        )}

        {/* Destination marker (Red) */}
        {route?.destinationCoordinates && (
          <Marker
            latitude={route.destinationCoordinates.latitude}
            longitude={route.destinationCoordinates.longitude}
            anchor="bottom"
          >
            <div className="flex flex-col items-center">
              <div className="bg-gradient-to-r from-error-light to-error shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 rounded-full p-3 shadow-lg border-4 border-white">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-xs font-semibold bg-white px-2 py-1 rounded shadow mt-1 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                {route.destinationCity || 'End'}
              </span>
            </div>
          </Marker>
        )}

        {/* Bus location marker (Moving) */}
        {busLocation?.latitude && busLocation?.longitude && (
          <>
            <Marker
              latitude={busLocation.latitude}
              longitude={busLocation.longitude}
              anchor="center"
              onClick={() => setShowPopup(!showPopup)}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="cursor-pointer"
              >
                <div 
                  className="bg-accent rounded-full p-4 shadow-2xl border-4 border-white relative"
                  style={{ transform: `rotate(${busLocation.heading || 0}deg)` }}
                >
                  <svg className="w-8 h-8 text-black40" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                  </svg>
                  {/* Speed indicator */}
                  {busLocation.speed > 0 && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-success-light to-success shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center">
                      {Math.round(busLocation.speed)}
                    </div>
                  )}
                </div>
              </motion.div>
            </Marker>

            {/* Bus info popup */}
            {showPopup && (
              <Popup
                latitude={busLocation.latitude}
                longitude={busLocation.longitude}
                anchor="top"
                onClose={() => setShowPopup(false)}
                closeOnClick={false}
                className="bus-popup"
              >
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-bold text-black40 mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                    </svg>
                    Bus Location
                  </h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Speed:</span>
                      <span className="font-semibold text-green-600">{formatSpeed(busLocation.speed)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-semibold">{formatLastUpdated(busLocation.lastUpdated)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2 pt-2 border-t">
                      <span>Lat: {busLocation.latitude.toFixed(4)}</span>
                      <span>Lng: {busLocation.longitude.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            )}
          </>
        )}
      </Map>

      {/* Map legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <h4 className="font-semibold mb-2 text-gray-900">Legend</h4>
        <div className="space-y-1">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gradient-to-r from-success-light to-success shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 rounded-full mr-2"></div>
            <span>Source</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gradient-to-r from-error-light to-error shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 rounded-full mr-2"></div>
            <span>Destination</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-accent rounded-full mr-2"></div>
            <span>Bus (Live)</span>
          </div>
        </div>
      </div>

      {/* Status indicator */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-center space-x-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-3 h-3 bg-gradient-to-r from-success-light to-success shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 rounded-full"
          />
          <span className="text-sm font-semibold text-gray-700">Live Tracking Active</span>
        </div>
      </div>
    </div>
  )
}

export default LiveBusMap
