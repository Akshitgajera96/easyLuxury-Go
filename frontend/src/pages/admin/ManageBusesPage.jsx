/**
 * Admin page for managing bus fleet
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import BusSeatBuilder from '../../components/admin/BusSeatBuilder'
import busService from '../../services/busService'

const ManageBusesPage = () => {
  const [buses, setBuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedBus, setSelectedBus] = useState(null)
  const [formData, setFormData] = useState({
    busNumber: '',
    busType: 'sleeper',
    totalSeats: 40,
    operator: '',
    amenities: [],
    facilities: [],
    seatLayout: null
  })

  const busTypes = [
    { value: 'sleeper', label: 'Sleeper', icon: '🛏️' },
    { value: 'semi-sleeper', label: 'Semi Sleeper', icon: '💺' },
    { value: 'seater', label: 'Seater', icon: '🪑' },
    { value: 'luxury', label: 'Luxury', icon: '⭐' }
  ]

  const amenitiesList = [
    { value: 'wifi', label: 'WiFi', icon: '📶' },
    { value: 'ac', label: 'AC', icon: '❄️' },
    { value: 'charging_point', label: 'Charging Ports', icon: '🔌' },
    { value: 'blanket', label: 'Blankets', icon: '🛏️' },
    { value: 'water_bottle', label: 'Water Bottle', icon: '💧' },
    { value: 'snacks', label: 'Snacks', icon: '🍿' },
    { value: 'entertainment', label: 'Entertainment', icon: '📺' }
  ]

  useEffect(() => {
    fetchBuses()
  }, [])

  const fetchBuses = async () => {
    setLoading(true)
    try {
      const response = await busService.getAllBuses()
      if (response.success && response.data) {
        setBuses(response.data.buses || [])
      }
    } catch (error) {
      console.error('Failed to fetch buses:', error)
      toast.error('Failed to load buses')
    } finally {
      setLoading(false)
    }
  }

  const handleAddBus = async (e) => {
    e.preventDefault()
    
    // Validate seat layout is configured
    if (!formData.seatLayout || 
        !formData.seatLayout.lowerDeck || 
        !formData.seatLayout.upperDeck ||
        (!formData.seatLayout.lowerDeck.seats?.length && !formData.seatLayout.upperDeck.seats?.length)) {
      toast.error('Please configure and generate the seat layout')
      return
    }
    
    setLoading(true)
    try {
      const busData = {
        busNumber: formData.busNumber.toUpperCase(),
        busName: `${formData.operator} - ${formData.busNumber}`,
        operator: formData.operator,
        seatType: formData.busType,
        totalSeats: parseInt(formData.totalSeats),
        amenities: formData.amenities,
        seatLayout: formData.seatLayout,
        hasAC: formData.amenities.includes('ac'),
        hasWifi: formData.amenities.includes('wifi'),
        hasCharging: formData.amenities.includes('charging_point')
      }

      const response = await busService.createBus(busData)
      
      if (response.success) {
        toast.success('Bus added successfully with custom seat layout!')
        fetchBuses()
        setShowAddModal(false)
        setFormData({
          busNumber: '',
          busType: 'sleeper',
          totalSeats: 40,
          operator: '',
          amenities: [],
          facilities: [],
          seatLayout: null
        })
      }
    } catch (error) {
      console.error('Failed to add bus:', error)
      toast.error(error.response?.data?.message || 'Failed to add bus')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBus = async () => {
    if (!selectedBus) return
    
    setLoading(true)
    try {
      const response = await busService.deleteBus(selectedBus._id || selectedBus.id)
      
      if (response.success) {
        toast.success('Bus deleted successfully!')
        fetchBuses()
        setShowDeleteDialog(false)
        setSelectedBus(null)
      }
    } catch (error) {
      console.error('Failed to delete bus:', error)
      toast.error(error.response?.data?.message || 'Failed to delete bus')
    } finally {
      setLoading(false)
    }
  }

  const toggleBusStatus = async (busId, currentStatus) => {
    setLoading(true)
    try {
      const response = await busService.toggleBusStatus(busId)
      
      if (response.success) {
        toast.success(`Bus ${currentStatus ? 'deactivated' : 'activated'} successfully!`)
        fetchBuses()
      }
    } catch (error) {
      console.error('Failed to update bus status:', error)
      toast.error('Failed to update bus status')
    } finally {
      setLoading(false)
    }
  }

  const handleAmenityToggle = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }))
  }

  if (loading && buses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" variant="primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Material Design Header Card */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Buses</h1>
            <p className="text-gray-600 text-lg">Manage your bus fleet and configurations</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:bg-blue-700 hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            <span>Add New Bus</span>
          </button>
        </div>
      </div>

      {/* Material Design Buses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {buses.map((bus, index) => (
          <motion.div
            key={bus._id || bus.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
          >
            {/* Bus Header */}
            <div className={`p-4 ${bus.isActive ? 'bg-sky-600 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300' : 'bg-gray-500 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300'} text-white`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold">{bus.busNumber}</h3>
                  <p className="text-sm opacity-90">{bus.operator}</p>
                </div>
                <span className="text-2xl">
                  {busTypes.find(t => t.value === bus.busType)?.icon}
                </span>
              </div>
            </div>

            {/* Bus Details */}
            <div className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-semibold capitalize">{bus.seatType || bus.busType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Seats:</span>
                  <span className="font-semibold">{bus.totalSeats}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-semibold ${
                    bus.isActive ? 'text-sky-600' : 'text-red-600'
                  }`}>
                    {bus.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Amenities */}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Amenities</h4>
                <div className="flex flex-wrap gap-1">
                  {bus.amenities.map(amenity => (
                    <span
                      key={amenity}
                      className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-700"
                    >
                      <span>{amenitiesList.find(a => a.value === amenity)?.icon}</span>
                      <span className="capitalize">{amenity}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={() => toggleBusStatus(bus._id || bus.id, bus.isActive)}
                  className={`flex-1 py-2 px-3 rounded text-sm font-medium ${
                    bus.isActive
                      ? 'bg-sky-100 text-sky-700 hover:bg-sky-200'
                      : 'bg-sky-100 text-sky-700 hover:bg-sky-200'
                  }`}
                >
                  {bus.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => {
                    setSelectedBus(bus)
                    setShowDeleteDialog(true)
                  }}
                  className="flex-1 py-2 px-3 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {buses.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-md p-16 text-center border border-gray-100"
        >
          <div className="text-7xl mb-6">🚌</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No buses found</h3>
          <p className="text-gray-600 text-lg mb-6">Get started by adding your first bus to the fleet.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:bg-blue-700 hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            Add First Bus
          </button>
        </motion.div>
      )}

      {/* Add Bus Modal */}
      {showAddModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Bus</h3>
              
              <form onSubmit={handleAddBus} className="space-y-4">
                {/* Bus Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bus Number
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.busNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, busNumber: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="e.g., MH01AB1234"
                  />
                </div>

                {/* Bus Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bus Type
                  </label>
                  <select
                    value={formData.busType}
                    onChange={(e) => setFormData(prev => ({ ...prev, busType: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    {busTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Total Seats */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Seats
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={formData.totalSeats}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalSeats: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>

                {/* Operator */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Operator
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.operator}
                    onChange={(e) => setFormData(prev => ({ ...prev, operator: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="Bus operator name"
                  />
                </div>

                {/* Amenities */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amenities
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {amenitiesList.map(amenity => (
                      <label
                        key={amenity.value}
                        className="flex items-center space-x-2 p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={formData.amenities.includes(amenity.value)}
                          onChange={() => handleAmenityToggle(amenity.value)}
                          className="text-accent rounded"
                        />
                        <span className="text-sm">{amenity.icon} {amenity.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Seat Layout Builder */}
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">🎨 Design Seat Layout</h4>
                  <BusSeatBuilder
                    busType={formData.busType}
                    totalSeats={formData.totalSeats}
                    onSeatLayoutChange={(layout) => setFormData(prev => ({ ...prev, seatLayout: layout }))}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-accent text-gray-900 py-3 rounded-lg font-semibold hover:bg-gradient-to-r hover:from-accent hover:to-accent-dark hover:shadow-xl hover:scale-105 transition-all duration-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading && <LoadingSpinner size="sm" variant="primary" />}
                    Add Bus
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Bus"
        message={`Are you sure you want to delete bus ${selectedBus?.busNumber}? This action cannot be undone.`}
        confirmText={loading ? "Deleting..." : "Delete Bus"}
        cancelText="Cancel"
        onConfirm={handleDeleteBus}
        onCancel={() => {
          setShowDeleteDialog(false)
          setSelectedBus(null)
        }}
        type="danger"
        isLoading={loading}
      />
    </div>
  )
}

export default ManageBusesPage