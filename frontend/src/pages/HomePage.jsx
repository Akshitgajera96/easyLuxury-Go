/**
 * Home page component with search functionality and featured trips
 */

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import SearchableSelect from '../components/common/SearchableSelect'

const HomePage = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [searchData, setSearchData] = useState({
    from: '',
    to: '',
    date: '',
    passengers: 1
  })

  // Comprehensive list of major Indian cities
  const cities = [
    'Agra',
    'Ahmedabad',
    'Ajmer',
    'Allahabad',
    'Amritsar',
    'Aurangabad',
    'Bangalore',
    'Bhopal',
    'Bhubaneswar',
    'Chandigarh',
    'Chennai',
    'Coimbatore',
    'Dehradun',
    'Delhi',
    'Goa',
    'Gurgaon',
    'Guwahati',
    'Haridwar',
    'Hyderabad',
    'Indore',
    'Jaipur',
    'Jalandhar',
    'Jammu',
    'Jodhpur',
    'Kanpur',
    'Kochi',
    'Kolkata',
    'Lucknow',
    'Ludhiana',
    'Madurai',
    'Mangalore',
    'Mumbai',
    'Mysore',
    'Nagpur',
    'Nashik',
    'Noida',
    'Patna',
    'Pune',
    'Raipur',
    'Rajkot',
    'Ranchi',
    'Shimla',
    'Surat',
    'Thiruvananthapuram',
    'Udaipur',
    'Vadodara',
    'Varanasi',
    'Vijayawada',
    'Visakhapatnam'
  ].sort()

  const featuredTrips = [
    {
      from: 'Mumbai',
      to: 'Goa',
      duration: '12h',
      price: 1200,
      type: 'luxury',
      amenities: ['wifi', 'ac', 'entertainment'],
      image: '🚌'
    },
    {
      from: 'Delhi',
      to: 'Jaipur',
      duration: '6h', 
      price: 800,
      type: 'sleeper',
      amenities: ['ac', 'charging', 'blanket'],
      image: '🛏️'
    },
    {
      from: 'Bangalore',
      to: 'Chennai',
      duration: '5h',
      price: 600,
      type: 'seater',
      amenities: ['ac', 'charging'],
      image: '💺'
    }
  ]

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchData.from && searchData.to && searchData.date) {
      navigate(`/trips?from=${searchData.from}&to=${searchData.to}&date=${searchData.date}&passengers=${searchData.passengers}`)
    }
  }

  const handleInputChange = (field, value) => {
    setSearchData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const swapCities = () => {
    setSearchData(prev => ({
      ...prev,
      from: prev.to,
      to: prev.from
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100 relative overflow-x-hidden">
      {/* Animated Background Grid */}
      <div className="grid-background absolute inset-0 opacity-20"></div>
      
      {/* Blue Orb Decorations */}
      <div className="absolute rounded-full bg-gradient-to-br from-blue-300 to-blue-400 blur-3xl opacity-20" style={{ width: '400px', height: '400px', top: '-200px', right: '-100px' }}></div>
      <div className="absolute rounded-full bg-gradient-to-br from-blue-300 to-blue-400 blur-3xl opacity-20" style={{ width: '300px', height: '300px', bottom: '100px', left: '-150px' }}></div>
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-bold mb-6 text-gray-900"
            >
              Travel in{' '}
              <span className="bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">Luxury</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto"
            >
              Experience premium bus travel with real-time tracking, comfortable amenities, and exceptional service across India.
            </motion.p>
          </div>

          {/* Search Form - Glass Effect */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 md:p-8 max-w-4xl mx-auto rounded-2xl shadow-xl border border-sky-200 hover:shadow-2xl transition-shadow duration-300"
          >
            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* From */}
                <div className="md:col-span-4">
                  <SearchableSelect
                    value={searchData.from}
                    onChange={(value) => handleInputChange('from', value)}
                    options={cities}
                    placeholder="Type or select origin city"
                    label="From"
                    required={true}
                  />
                </div>

                {/* Swap Button */}
                <div className="md:col-span-1 flex items-end justify-center">
                  <button
                    type="button"
                    onClick={swapCities}
                    className="p-3 text-gray-600 hover:text-sky-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </button>
                </div>

                {/* To */}
                <div className="md:col-span-4">
                  <SearchableSelect
                    value={searchData.to}
                    onChange={(value) => handleInputChange('to', value)}
                    options={cities}
                    placeholder="Type or select destination city"
                    label="To"
                    required={true}
                  />
                </div>

                {/* Date */}
                <div className="md:col-span-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Travel Date
                  </label>
                  <input
                    type="date"
                    value={searchData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent text-gray-900 bg-white"
                    required
                  />
                </div>

                {/* Passengers */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Passengers
                  </label>
                  <select
                    value={searchData.passengers}
                    onChange={(e) => handleInputChange('passengers', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent text-gray-900 bg-white"
                  >
                    {[1,2,3,4,5].map(num => (
                      <option key={num} value={num} className="text-gray-900">{num} {num === 1 ? 'Passenger' : 'Passengers'}</option>
                    ))}
                  </select>
                </div>

                {/* Search Button */}
                <div className="md:col-span-12">
                  <button
                    type="submit"
                    className="w-full btn-sky py-4 text-lg"
                  >
                    🚌 Search Buses
                  </button>
                </div>

                {/* Browse All Buses Button */}
                <div className="md:col-span-12">
                  <button
                    type="button"
                    onClick={() => navigate('/trips')}
                    className="w-full bg-white text-blue-700 py-3 rounded-lg font-semibold hover:bg-blue-50 hover:border-blue-500 border-2 border-blue-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    Or Browse All Available Buses
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose easyLuxury?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're redefining luxury bus travel with cutting-edge features and premium services.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Real-time Tracking',
                description: 'Track your bus in real-time and get live updates on arrival times.',
                icon: '📍',
                color: 'bg-cyan-500',
                bgColor: 'bg-blue-50'
              },
              {
                title: 'Comfortable Seats',
                description: 'Luxurious seats with ample legroom and multiple recline options.',
                icon: '💺',
                color: 'bg-green-500',
                bgColor: 'bg-green-50'
              },
              {
                title: 'Sleeper Berths',
                description: 'Clean and comfortable sleeper berths for overnight journeys.',
                icon: '🛏️',
                color: 'bg-sky-500',
                bgColor: 'bg-sky-50'
              },
              {
                title: 'Free WiFi',
                description: 'Stay connected with complimentary high-speed internet.',
                icon: '📶',
                color: 'bg-accent',
                bgColor: 'bg-accent-light'
              },
              {
                title: 'Charging Ports',
                description: 'Individual charging ports to keep your devices powered.',
                icon: '🔌',
                color: 'bg-red-500',
                bgColor: 'bg-red-50'
              },
              {
                title: 'Easy Booking',
                description: 'Simple 3-step booking process with instant confirmation.',
                icon: '✅',
                color: 'bg-blue-500',
                bgColor: 'bg-cyan-50'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`text-center p-5 ${feature.bgColor} rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-200 group cursor-pointer`}
              >
                <div className={`text-3xl mb-3 inline-block p-3 ${feature.color} rounded-xl text-white shadow-md group-hover:scale-105 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Trips Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Popular Routes
            </h2>
            <p className="text-xl text-gray-600">
              Discover our most sought-after luxury bus routes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredTrips.map((trip, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/trips')}
              >
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900">
                      {trip.from} → {trip.to}
                    </h3>
                    <p className="text-gray-500">{trip.duration} journey</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {trip.amenities.map(amenity => (
                      <span
                        key={amenity}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm capitalize"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-accent">
                      ₹{trip.price}
                    </span>
                    <span className="text-sm text-gray-500">per seat</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-16 bg-gradient-primary relative overflow-hidden">
          <div className="absolute inset-0 glow-sky-lg opacity-20"></div>
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              Ready to Travel in Style?
            </h2>
            <p className="text-lg text-sky-200 mb-8">
              Join thousands of satisfied travelers and experience luxury bus travel today.
            </p>
            <button
              onClick={() => navigate('/register')}
              className="btn-sky text-lg px-12 py-4"
            >
              Get Started Now
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

export default HomePage