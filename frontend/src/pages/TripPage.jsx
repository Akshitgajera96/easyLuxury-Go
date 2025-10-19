/**
 * Trip search results page showing available buses and trips
 */

import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import BusCard from '../components/booking/BusCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import tripService from '../services/tripService'

const TripPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    busType: 'all',
    departureTime: 'all',
    priceRange: [0, 5000],
    amenities: []
  })

  const from = searchParams.get('from') || ''
  const to = searchParams.get('to') || ''
  const date = searchParams.get('date') || ''
  const passengers = searchParams.get('passengers') || '1'

  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true)
      try {
        let response
        
        // If search params are provided, search with filters
        // Otherwise, get all available trips
        if (from && to && date) {
          response = await tripService.searchTrips({
            from: from,
            to: to,
            date: date
          })
        } else {
          // Fetch all trips when no search criteria
          response = await tripService.getAllTrips()
        }

        if (response.success && response.data) {
          const allTrips = response.data.trips || []
          setTrips(allTrips)
          
          if (allTrips.length === 0 && from && to) {
            toast('No buses found for this route. Try different cities or dates.', {
              duration: 4000
            })
          }
        } else {
          setTrips([])
        }
      } catch (error) {
        console.error('Failed to fetch trips:', error)
        setTrips([])
        
        // Show user-friendly error message only for specific search
        if (from && to && date) {
          if (error.response?.status === 404) {
            toast('No trips available for this route yet. Try a different route.', {
              duration: 5000
            })
          } else {
            toast.error(error.response?.data?.message || 'Failed to load trips.', {
              duration: 3000
            })
          }
        }
      } finally {
        setLoading(false)
      }
    }

    fetchTrips()
  }, [from, to, date])

  const handleBusSelect = (bus, trip) => {
    navigate('/booking', { 
      state: { 
        bus, 
        trip,
        searchParams: { from, to, date, passengers }
      } 
    })
  }

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  const filteredTrips = trips.filter(trip => {
    // Apply user-selected filters
    if (filters.busType !== 'all' && trip.bus?.seatType !== filters.busType) {
      return false
    }
    if (filters.departureTime !== 'all') {
      const hour = new Date(trip.departureDateTime).getHours()
      if (filters.departureTime === 'morning' && (hour < 6 || hour >= 12)) return false
      if (filters.departureTime === 'afternoon' && (hour < 12 || hour >= 18)) return false
      if (filters.departureTime === 'evening' && (hour < 18 || hour >= 24)) return false
      if (filters.departureTime === 'night' && (hour >= 6)) return false
    }
    const tripFare = trip.baseFare || trip.fare || 0
    if (tripFare < filters.priceRange[0] || tripFare > filters.priceRange[1]) {
      return false
    }
    if (filters.amenities.length > 0) {
      return filters.amenities.every(amenity => trip.bus?.amenities?.includes(amenity))
    }
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" variant="primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black40 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Available Buses</h1>
              <p className="text-accent">
                {from && to ? (
                  <>{from} ? {to} • {date ? new Date(date).toLocaleDateString() : 'All Dates'} • {passengers} {passengers === '1' ? 'Passenger' : 'Passengers'}</>
                ) : (
                  <>All Available Routes • Browse and filter buses</>
                )}
              </p>
              {from && to && date && (
                <p className="text-accent text-sm mt-1">
                  ?? Showing trips for 3 days starting from selected date
                </p>
              )}
              {!from && !to && (
                <p className="text-accent text-sm mt-1">
                  ?? Use filters to narrow down your search
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-accent">{filteredTrips.length} buses found</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-lg p-6 sticky top-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
              
              {/* Bus Type Filter */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">Bus Type</h4>
                <div className="space-y-2">
                  {['all', 'sleeper', 'semi-sleeper', 'seater', 'luxury'].map(type => (
                    <label key={type} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="busType"
                        value={type}
                        checked={filters.busType === type}
                        onChange={(e) => handleFilterChange('busType', e.target.value)}
                        className="text-accent"
                      />
                      <span className="capitalize">{type === 'all' ? 'All Types' : type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Departure Time Filter */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">Departure Time</h4>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'Any Time' },
                    { value: 'morning', label: 'Morning (6AM - 12PM)' },
                    { value: 'afternoon', label: 'Afternoon (12PM - 6PM)' },
                    { value: 'evening', label: 'Evening (6PM - 12AM)' },
                    { value: 'night', label: 'Night (12AM - 6AM)' }
                  ].map(time => (
                    <label key={time.value} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="departureTime"
                        value={time.value}
                        checked={filters.departureTime === time.value}
                        onChange={(e) => handleFilterChange('departureTime', e.target.value)}
                        className="text-accent"
                      />
                      <span>{time.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">Price Range</h4>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    step="100"
                    value={filters.priceRange[1]}
                    onChange={(e) => handleFilterChange('priceRange', [0, parseInt(e.target.value)])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>?0</span>
                    <span>?{filters.priceRange[1]}</span>
                  </div>
                </div>
              </div>

              {/* Amenities Filter */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">Amenities</h4>
                <div className="space-y-2">
                  {['wifi', 'ac', 'charging', 'blanket', 'snacks', 'entertainment'].map(amenity => (
                    <label key={amenity} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.amenities.includes(amenity)}
                        onChange={(e) => {
                          const newAmenities = e.target.checked
                            ? [...filters.amenities, amenity]
                            : filters.amenities.filter(a => a !== amenity)
                          handleFilterChange('amenities', newAmenities)
                        }}
                        className="text-accent rounded"
                      />
                      <span className="capitalize">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Reset Filters */}
              <button
                onClick={() => setFilters({
                  busType: 'all',
                  departureTime: 'all',
                  priceRange: [0, 5000],
                  amenities: []
                })}
                className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Reset Filters
              </button>
            </motion.div>
          </div>

          {/* Trip Results */}
          <div className="lg:col-span-3">
            {filteredTrips.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-6xl mb-4">??</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No buses found</h3>
                <p className="text-gray-600 mb-4">
                  We couldn't find any buses matching your criteria. Try adjusting your filters or search parameters.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="bg-accent text-black40 px-6 py-3 rounded-lg font-semibold hover:bg-gradient-to-r hover:from-accent hover:to-accent-dark hover:shadow-xl hover:scale-105 transition-all duration-300 transition-colors"
                >
                  Search Again
                </button>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {filteredTrips.map((trip, index) => (
                  <motion.div
                    key={trip.id || `trip-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <BusCard
                      bus={trip.bus}
                      trip={trip}
                      onSelect={handleBusSelect}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TripPage