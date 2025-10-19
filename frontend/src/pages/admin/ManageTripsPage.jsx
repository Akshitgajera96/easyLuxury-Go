/**
 * Admin page for managing bus trips and schedules
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { Link } from 'react-router-dom'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import routeService from '../../services/routeService'
import busService from '../../services/busService'
import tripService from '../../services/tripService'

const ManageTripsPage = () => {
  const [trips, setTrips] = useState([])
  const [buses, setBuses] = useState([])
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [formData, setFormData] = useState({
    busId: '',
    routeId: '',
    departureDateTime: '',
    arrivalDateTime: '',
    baseFare: '',
    driverName: '',
    driverPhone: '',
    conductorName: '',
    conductorPhone: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch routes, buses, and trips from API
      const [routesRes, busesRes, tripsRes] = await Promise.all([
        routeService.getAllRoutes(),
        busService.getAllBuses(),
        tripService.getAllTrips()
      ])

      if (routesRes.success && routesRes.data) {
        setRoutes(routesRes.data.routes || [])
      }

      if (busesRes.success && busesRes.data) {
        setBuses(busesRes.data.buses || [])
      }

      if (tripsRes.success && tripsRes.data) {
        setTrips(tripsRes.data.trips || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTrip = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Validation
      if (!formData.busId || !formData.routeId) {
        toast.error('Please select both bus and route')
        setLoading(false)
        return
      }

      const tripData = {
        bus: formData.busId,
        route: formData.routeId,
        departureDateTime: formData.departureDateTime,
        arrivalDateTime: formData.arrivalDateTime,
        baseFare: parseInt(formData.baseFare),
        driver: {
          name: formData.driverName,
          phone: formData.driverPhone
        },
        conductor: {
          name: formData.conductorName,
          phone: formData.conductorPhone
        }
      }

      const response = await tripService.createTrip(tripData)
      
      if (response.success) {
        toast.success('Trip created successfully!')
        fetchData()
        setShowAddModal(false)
        setFormData({
          busId: '',
          routeId: '',
          departureDateTime: '',
          arrivalDateTime: '',
          baseFare: '',
          driverName: '',
          driverPhone: '',
          conductorName: '',
          conductorPhone: ''
        })
      }
    } catch (error) {
      console.error('Failed to add trip:', error)
      toast.error(error.response?.data?.message || 'Failed to create trip')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTrip = async () => {
    if (!selectedTrip) return
    
    setLoading(true)
    try {
      // In real app: await tripService.deleteTrip(selectedTrip.id)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setTrips(prev => prev.filter(trip => (trip._id || trip.id) !== (selectedTrip._id || selectedTrip.id)))
      setShowDeleteDialog(false)
      setSelectedTrip(null)
    } catch (error) {
      console.error('Failed to delete trip:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateTripStatus = async (tripId, newStatus) => {
    setLoading(true)
    try {
      // In real app: await tripService.updateTrip(tripId, { status: newStatus })
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setTrips(prev => prev.map(trip => 
        (trip._id || trip.id) === tripId ? { ...trip, status: newStatus } : trip
      ))
    } catch (error) {
      console.error('Failed to update trip status:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-amber-100 text-amber-800',
      boarding: 'bg-blue-100 text-blue-800',
      departed: 'bg-sky-100 text-sky-800',
      arrived: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading && trips.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" variant="primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Alert if no buses or routes */}
      {(buses.length === 0 || routes.length === 0) && (
        <div className="bg-accent/10 border-l-4 border-accent p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-accent" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-black40">
                {buses.length === 0 && routes.length === 0 && (
                  <span>Please add <strong>buses</strong> and <strong>routes</strong> before scheduling trips.</span>
                )}
                {buses.length === 0 && routes.length > 0 && (
                  <span>Please add <strong>buses</strong> before scheduling trips.</span>
                )}
                {buses.length > 0 && routes.length === 0 && (
                  <span>Please add <strong>routes</strong> before scheduling trips.</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Trips</h1>
          <p className="text-gray-600">Schedule and manage bus trips</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          disabled={buses.length === 0 || routes.length === 0}
          className="bg-accent text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gradient-to-r hover:from-accent hover:to-accent-dark hover:shadow-xl hover:scale-105 transition-all duration-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={buses.length === 0 || routes.length === 0 ? 'Please add buses and routes first' : ''}
        >
          + Schedule New Trip
        </button>
      </div>

      {/* Trips Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trip Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bus & Crew
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fare & Seats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trips.map((trip, index) => (
                <motion.tr
                  key={trip._id || trip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="hover:bg-gray-50"
                >
                  {/* Trip Details */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {trip.route?.sourceCity || trip.route?.from || 'N/A'} → {trip.route?.destinationCity || trip.route?.to || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Depart: {formatDateTime(trip.departureDateTime)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Arrive: {formatDateTime(trip.arrivalDateTime)}
                      </div>
                    </div>
                  </td>

                  {/* Bus & Crew */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {trip.bus?.busNumber || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {trip.bus?.operator || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Driver: {trip.driver?.name || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400">
                        Conductor: {trip.conductor?.name || 'N/A'}
                      </div>
                    </div>
                  </td>

                  {/* Fare & Seats */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-semibold text-accent">
                        ₹{trip.baseFare || trip.fare || 0}
                      </div>
                      <div className="text-sm text-gray-500">
                        {trip.availableSeats || 0} seats available
                      </div>
                      <div className="text-xs text-gray-400">
                        {trip.bookedSeats?.length || 0} booked
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(trip.status)}`}>
                      {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <select
                        value={trip.status}
                        onChange={(e) => updateTripStatus(trip._id || trip.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-accent"
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="boarding">Boarding</option>
                        <option value="departed">Departed</option>
                        <option value="arrived">Arrived</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button
                        onClick={() => {
                          setSelectedTrip(trip)
                          setShowDeleteDialog(true)
                        }}
                        className="text-red-600 hover:text-red-900 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {trips.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">🚌</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No trips scheduled</h3>
          <p className="text-gray-600 mb-4">Get started by scheduling your first trip.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-accent text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gradient-to-r hover:from-accent hover:to-accent-dark hover:shadow-xl hover:scale-105 transition-all duration-300 transition-colors"
          >
            Schedule First Trip
          </button>
        </motion.div>
      )}

      {/* Add Trip Modal */}
      {showAddModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Schedule New Trip</h3>
              
              <form onSubmit={handleAddTrip} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bus Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Bus
                    </label>
                    <select
                      required
                      value={formData.busId}
                      onChange={(e) => setFormData(prev => ({ ...prev, busId: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    >
                      <option value="">Choose a bus</option>
                      {buses.length === 0 && (
                        <option disabled>No buses available. Please add buses first.</option>
                      )}
                      {buses.map(bus => (
                        <option key={bus._id || bus.id} value={bus._id || bus.id}>
                          {bus.busNumber} - {bus.operator} ({bus.seatType || 'N/A'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Route Selection */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Select Route
                      </label>
                      {routes.length === 0 && (
                        <Link
                          to="/admin/routes"
                          className="text-sm text-accent hover:text-black40 font-medium flex items-center gap-1"
                          onClick={() => setShowAddModal(false)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Create Route
                        </Link>
                      )}
                    </div>
                    <select
                      required
                      value={formData.routeId}
                      onChange={(e) => setFormData(prev => ({ ...prev, routeId: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    >
                      <option value="">Choose a route</option>
                      {routes.length === 0 && (
                        <option disabled>No routes available. Click "Create Route" above.</option>
                      )}
                      {routes.map(route => (
                        <option key={route._id || route.id} value={route._id || route.id}>
                          {route.sourceCity} → {route.destinationCity} ({route.estimatedDuration}h)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Departure Date & Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Departure Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.departureDateTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, departureDateTime: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>

                  {/* Arrival Date & Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Arrival Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.arrivalDateTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, arrivalDateTime: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>

                  {/* Base Fare */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Base Fare (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.baseFare}
                      onChange={(e) => setFormData(prev => ({ ...prev, baseFare: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                      placeholder="Enter base fare amount"
                    />
                  </div>
                </div>

                {/* Driver & Conductor Section */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Crew Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Driver Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Driver Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.driverName}
                        onChange={(e) => setFormData(prev => ({ ...prev, driverName: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                        placeholder="Enter driver name"
                      />
                    </div>

                    {/* Driver Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Driver Phone
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.driverPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, driverPhone: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                        placeholder="Enter driver phone"
                        pattern="[0-9]{10}"
                        maxLength="10"
                      />
                    </div>

                    {/* Conductor Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Conductor Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.conductorName}
                        onChange={(e) => setFormData(prev => ({ ...prev, conductorName: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                        placeholder="Enter conductor name"
                      />
                    </div>

                    {/* Conductor Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Conductor Phone
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.conductorPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, conductorPhone: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                        placeholder="Enter conductor phone"
                        pattern="[0-9]{10}"
                        maxLength="10"
                      />
                    </div>
                  </div>
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
                    Schedule Trip
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
        title="Delete Trip"
        message={`Are you sure you want to delete the trip from ${selectedTrip?.route?.sourceCity || selectedTrip?.route?.from || 'N/A'} to ${selectedTrip?.route?.destinationCity || selectedTrip?.route?.to || 'N/A'}? This action cannot be undone.`}
        confirmText={loading ? "Deleting..." : "Delete Trip"}
        cancelText="Cancel"
        onConfirm={handleDeleteTrip}
        onCancel={() => {
          setShowDeleteDialog(false)
          setSelectedTrip(null)
        }}
        type="danger"
        isLoading={loading}
      />
    </div>
  )
}

export default ManageTripsPage