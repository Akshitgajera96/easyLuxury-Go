/**
 * Admin page for managing bus routes
 * Allows admins to create, edit, and delete routes dynamically
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import SearchableSelect from '../../components/common/SearchableSelect'
import routeService from '../../services/routeService'

const ManageRoutesPage = () => {
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [formData, setFormData] = useState({
    sourceCity: '',
    destinationCity: '',
    distance: '',
    estimatedDuration: '',
    baseFare: '',
    stops: []
  })
  const [stopInput, setStopInput] = useState('')

  // All 50 cities from homepage
  const cities = [
    'Agra', 'Ahmedabad', 'Ajmer', 'Allahabad', 'Amritsar', 'Aurangabad',
    'Bangalore', 'Bhopal', 'Bhubaneswar', 'Chandigarh', 'Chennai', 'Coimbatore',
    'Dehradun', 'Delhi', 'Goa', 'Gurgaon', 'Guwahati', 'Haridwar', 'Hyderabad',
    'Indore', 'Jaipur', 'Jalandhar', 'Jammu', 'Jodhpur', 'Kanpur', 'Kochi',
    'Kolkata', 'Lucknow', 'Ludhiana', 'Madurai', 'Mangalore', 'Mumbai', 'Mysore',
    'Nagpur', 'Nashik', 'Noida', 'Patna', 'Pune', 'Raipur', 'Rajkot', 'Ranchi',
    'Shimla', 'Surat', 'Thiruvananthapuram', 'Udaipur', 'Vadodara', 'Varanasi',
    'Vijayawada', 'Visakhapatnam'
  ].sort()

  useEffect(() => {
    fetchRoutes()
  }, [])

  const fetchRoutes = async () => {
    setLoading(true)
    try {
      const response = await routeService.getAllRoutes()
      if (response.success && response.data) {
        setRoutes(response.data.routes || [])
      }
    } catch (error) {
      console.error('Failed to fetch routes:', error)
      toast.error('Failed to load routes')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddStop = () => {
    if (stopInput.trim() && !formData.stops.includes(stopInput.trim())) {
      setFormData(prev => ({
        ...prev,
        stops: [...prev.stops, stopInput.trim()]
      }))
      setStopInput('')
    }
  }

  const handleRemoveStop = (index) => {
    setFormData(prev => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index)
    }))
  }

  const resetForm = () => {
    setFormData({
      sourceCity: '',
      destinationCity: '',
      distance: '',
      estimatedDuration: '',
      baseFare: '',
      stops: []
    })
    setStopInput('')
  }

  const handleCreateRoute = async (e) => {
    e.preventDefault()
    
    // Validate all fields are filled
    if (!formData.sourceCity || !formData.destinationCity) {
      toast.error('Please select source and destination cities')
      return
    }
    
    if (formData.sourceCity === formData.destinationCity) {
      toast.error('Source and destination cannot be the same')
      return
    }

    if (!formData.distance || formData.distance <= 0) {
      toast.error('Please enter a valid distance')
      return
    }

    if (!formData.estimatedDuration || formData.estimatedDuration <= 0) {
      toast.error('Please enter a valid estimated duration')
      return
    }

    if (!formData.baseFare || formData.baseFare <= 0) {
      toast.error('Please enter a valid base fare')
      return
    }

    setLoading(true)
    try {
      // Ensure numbers are sent as numbers
      const routeData = {
        ...formData,
        distance: Number(formData.distance),
        estimatedDuration: Number(formData.estimatedDuration),
        baseFare: Number(formData.baseFare)
      }
      
      const response = await routeService.createRoute(routeData)
      if (response.success) {
        toast.success('Route created successfully!')
        fetchRoutes()
        setShowAddModal(false)
        resetForm()
      }
    } catch (error) {
      console.error('Failed to create route:', error)
      toast.error(error.response?.data?.message || 'Failed to create route')
    } finally {
      setLoading(false)
    }
  }

  const handleEditRoute = (route) => {
    setSelectedRoute(route)
    setFormData({
      sourceCity: route.sourceCity,
      destinationCity: route.destinationCity,
      distance: route.distance,
      estimatedDuration: route.estimatedDuration,
      baseFare: route.baseFare,
      stops: route.stops || []
    })
    setShowEditModal(true)
  }

  const handleUpdateRoute = async (e) => {
    e.preventDefault()
    
    if (formData.sourceCity === formData.destinationCity) {
      toast.error('Source and destination cannot be the same')
      return
    }

    setLoading(true)
    try {
      const response = await routeService.updateRoute(selectedRoute._id, formData)
      if (response.success) {
        toast.success('Route updated successfully!')
        fetchRoutes()
        setShowEditModal(false)
        resetForm()
        setSelectedRoute(null)
      }
    } catch (error) {
      console.error('Failed to update route:', error)
      toast.error(error.response?.data?.message || 'Failed to update route')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRoute = async () => {
    if (!selectedRoute) return

    setLoading(true)
    try {
      const response = await routeService.deleteRoute(selectedRoute._id)
      if (response.success) {
        toast.success('Route deleted successfully!')
        fetchRoutes()
        setShowDeleteDialog(false)
        setSelectedRoute(null)
      }
    } catch (error) {
      console.error('Failed to delete route:', error)
      toast.error(error.response?.data?.message || 'Failed to delete route')
    } finally {
      setLoading(false)
    }
  }

  if (loading && routes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" variant="primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Material Design Header Card */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Routes</h1>
            <p className="text-gray-600 text-lg">Create and manage bus routes across cities</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:bg-blue-700 hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add New Route</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Routes</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{routes.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
          </div>
        </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Routes</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {routes.filter(r => r.isActive).length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Avg Distance</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {routes.length > 0 
                    ? Math.round(routes.reduce((sum, r) => sum + (parseInt(r.distance) || 0), 0) / routes.length)
                    : 0} km
                </p>
              </div>
              <div className="bg-accent/20 p-3 rounded-lg">
                <svg className="w-8 h-8 text-black40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

      {/* Routes Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Distance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Base Fare
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stops
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {routes.length > 0 ? (
                  routes.map((route, index) => (
                    <motion.tr
                      key={route._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-black40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {route.sourceCity} → {route.destinationCity}
                            </div>
                            <div className="text-sm text-gray-500">
                              Route ID: {route._id.slice(-6)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{route.distance} km</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{route.estimatedDuration}h</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-accent">₹{route.baseFare}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {route.stops?.length || 0} stop{route.stops?.length !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          route.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {route.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditRoute(route)}
                          className="text-black40 hover:text-black40 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRoute(route)
                            setShowDeleteDialog(true)
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        <p className="mt-2 text-sm">No routes found. Create your first route to get started!</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* Add Route Modal */}
      <AnimatePresence>
        {showAddModal && (
          <RouteFormModal
            title="Add New Route"
            formData={formData}
            cities={cities}
            stopInput={stopInput}
            setStopInput={setStopInput}
            onInputChange={handleInputChange}
            onAddStop={handleAddStop}
            onRemoveStop={handleRemoveStop}
            onSubmit={handleCreateRoute}
            onClose={() => {
              setShowAddModal(false)
              resetForm()
            }}
            isLoading={loading}
          />
        )}
      </AnimatePresence>

      {/* Edit Route Modal */}
      <AnimatePresence>
        {showEditModal && (
          <RouteFormModal
            title="Edit Route"
            formData={formData}
            cities={cities}
            stopInput={stopInput}
            setStopInput={setStopInput}
            onInputChange={handleInputChange}
            onAddStop={handleAddStop}
            onRemoveStop={handleRemoveStop}
            onSubmit={handleUpdateRoute}
            onClose={() => {
              setShowEditModal(false)
              resetForm()
              setSelectedRoute(null)
            }}
            isLoading={loading}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Route"
        message={`Are you sure you want to delete the route from ${selectedRoute?.sourceCity} to ${selectedRoute?.destinationCity}? This action cannot be undone.`}
        confirmText="Delete Route"
        cancelText="Cancel"
        onConfirm={handleDeleteRoute}
        onCancel={() => {
          setShowDeleteDialog(false)
          setSelectedRoute(null)
        }}
        type="danger"
        isLoading={loading}
      />
    </div>
  )
}

// Route Form Modal Component
const RouteFormModal = ({
  title,
  formData,
  cities,
  stopInput,
  setStopInput,
  onInputChange,
  onAddStop,
  onRemoveStop,
  onSubmit,
  onClose,
  isLoading
}) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-6">
          <div className="space-y-6">
            {/* Source City */}
            <div>
              <SearchableSelect
                value={formData.sourceCity}
                onChange={(value) => onInputChange('sourceCity', value)}
                options={cities}
                placeholder="Type or select source city"
                label="Source City"
                icon="📍"
                required={true}
              />
            </div>

            {/* Destination City */}
            <div>
              <SearchableSelect
                value={formData.destinationCity}
                onChange={(value) => onInputChange('destinationCity', value)}
                options={cities}
                placeholder="Type or select destination city"
                label="Destination City"
                icon="🏁"
                required={true}
              />
            </div>

            {/* Distance and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Distance (km)
                </label>
                <input
                  type="number"
                  value={formData.distance}
                  onChange={(e) => onInputChange('distance', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="e.g., 350"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.estimatedDuration}
                  onChange={(e) => onInputChange('estimatedDuration', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="e.g., 6.5"
                  required
                  min="0.5"
                />
              </div>
            </div>

            {/* Base Fare */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Fare (₹)
              </label>
              <input
                type="number"
                value={formData.baseFare}
                onChange={(e) => onInputChange('baseFare', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="e.g., 800"
                required
                min="1"
              />
            </div>

            {/* Stops */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stops (Optional)
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={stopInput}
                  onChange={(e) => setStopInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), onAddStop())}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="Enter stop city name"
                />
                <button
                  type="button"
                  onClick={onAddStop}
                  className="px-4 py-3 bg-black40 text-white rounded-lg hover:bg-black40 transition-colors"
                >
                  Add
                </button>
              </div>
              
              {formData.stops.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.stops.map((stop, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg"
                    >
                      <span className="text-sm text-gray-700">{stop}</span>
                      <button
                        type="button"
                        onClick={() => onRemoveStop(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-accent text-gray-900 rounded-lg font-semibold hover:bg-gradient-to-r hover:from-accent hover:to-accent-dark hover:shadow-xl hover:scale-105 transition-all duration-300 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isLoading && <LoadingSpinner size="sm" />}
              <span>{title}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default ManageRoutesPage
