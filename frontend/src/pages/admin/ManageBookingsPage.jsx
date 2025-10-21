/**
 * Admin page for managing all bookings
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import adminService from '../../services/adminService'
import { toast } from 'react-hot-toast'

const ManageBookingsPage = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all'
  })

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    setLoading(true)
    setError(null)
    try {
      const filterParams = {}
      if (filters.status !== 'all') {
        filterParams.status = filters.status
      }
      
      const response = await adminService.getAllBookings(filterParams)
      
      if (response.data.success) {
        setBookings(response.data.data.bookings || [])
      } else {
        throw new Error('Failed to fetch bookings')
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
      setError(error.response?.data?.message || 'Failed to load bookings')
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const response = await adminService.updateBookingStatus(bookingId, newStatus)
      
      if (response.data.success) {
        toast.success('Booking status updated successfully')
        fetchBookings()
      } else {
        throw new Error('Failed to update booking status')
      }
    } catch (error) {
      console.error('Failed to update booking status:', error)
      toast.error(error.response?.data?.message || 'Failed to update booking status')
    }
  }

  const handleCancelBooking = async () => {
    if (!selectedBooking) return
    
    try {
      const response = await adminService.updateBookingStatus(selectedBooking._id, 'cancelled')
      
      if (response.data.success) {
        toast.success('Booking cancelled successfully')
        setShowCancelDialog(false)
        setSelectedBooking(null)
        fetchBookings()
      } else {
        throw new Error('Failed to cancel booking')
      }
    } catch (error) {
      console.error('Failed to cancel booking:', error)
      toast.error(error.response?.data?.message || 'Failed to cancel booking')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-accent/20 text-black40',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-accent/20 text-black40'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPaymentStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-accent/20 text-black40',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-purple-100 text-purple-800'
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

  const filteredBookings = bookings.filter(booking => {
    if (filters.status !== 'all' && booking.bookingStatus !== filters.status) {
      return false
    }
    // Add date range filtering logic here
    return true
  })

  if (loading && bookings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" variant="primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Bookings</h1>
          <p className="text-gray-600">View and manage all customer bookings</p>
        </div>
        
        {/* Filters */}
        <div className="flex space-x-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Bookings Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredBookings.map((booking, index) => (
          <motion.div
            key={booking._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              {/* Booking Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {booking.trip?.route?.sourceCity || 'N/A'} → {booking.trip?.route?.destinationCity || 'N/A'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {booking.trip?.departureDateTime ? formatDateTime(booking.trip.departureDateTime) : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500">
                      PNR: {booking.pnrNumber} | Booked on: {formatDateTime(booking.createdAt)}
                    </p>
                  </div>
                  
                  {/* Status Badges */}
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(booking.bookingStatus)}`}>
                      {booking.bookingStatus.charAt(0).toUpperCase() + booking.bookingStatus.slice(1)}
                    </span>
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getPaymentStatusColor(booking.paymentStatus)}`}>
                      Payment: {booking.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* User & Trip Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">Customer</p>
                    <p>{booking.user?.name || 'N/A'}</p>
                    <p className="text-gray-600">{booking.user?.email || 'N/A'}</p>
                    <p className="text-gray-600">{booking.user?.phone || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-900">Bus Details</p>
                    <p>{booking.trip?.bus?.busNumber || 'N/A'}</p>
                    <p className="text-gray-600">{booking.trip?.bus?.busName || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-900">Booking Details</p>
                    <p>{booking.seats?.length || 0} seat(s) | ₹{booking.totalAmount || 0}</p>
                    <p className="text-gray-600">{booking.paymentMethod?.toUpperCase() || 'N/A'} | {booking.seats?.map(s => s.seatNumber).join(', ') || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col space-y-2 mt-4 lg:mt-0 lg:ml-6">
                <button
                  onClick={() => {
                    setSelectedBooking(booking)
                    setShowDetailsModal(true)
                  }}
                  className="px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-dark transition-colors"
                >
                  View Details
                </button>
                
                {booking.bookingStatus === 'confirmed' && (
                  <button
                    onClick={() => {
                      setSelectedBooking(booking)
                      setShowCancelDialog(true)
                    }}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
                  >
                    Cancel Booking
                  </button>
                )}
                
                <select
                  value={booking.bookingStatus}
                  onChange={(e) => handleStatusUpdate(booking._id, e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredBookings.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">🚌</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
          <p className="text-gray-600">No bookings match your current filters.</p>
        </motion.div>
      )}

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
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
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-gray-900">Booking Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Trip Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Trip Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Route</p>
                      <p className="font-medium">{selectedBooking.trip?.route?.sourceCity || 'N/A'} → {selectedBooking.trip?.route?.destinationCity || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Departure</p>
                      <p className="font-medium">{selectedBooking.trip?.departureDateTime ? formatDateTime(selectedBooking.trip.departureDateTime) : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Bus</p>
                      <p className="font-medium">{selectedBooking.trip?.bus?.busNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Bus Name</p>
                      <p className="font-medium">{selectedBooking.trip?.bus?.busName || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Name</p>
                      <p className="font-medium">{selectedBooking.user?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Email</p>
                      <p className="font-medium">{selectedBooking.user?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Phone</p>
                      <p className="font-medium">{selectedBooking.user?.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">PNR</p>
                      <p className="font-medium">{selectedBooking.pnrNumber || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Passenger Details */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Passenger Details</h4>
                  <div className="space-y-3">
                    {selectedBooking.seats?.map((seat, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{seat.passengerName}</p>
                          <p className="text-sm text-gray-600">
                            {seat.passengerAge} years | {seat.passengerGender} | Seat: {seat.seatNumber}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Payment Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Total Amount</p>
                      <p className="font-medium text-lg text-accent">₹{selectedBooking.totalAmount || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Payment Method</p>
                      <p className="font-medium">{selectedBooking.paymentMethod?.toUpperCase() || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Payment Status</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(selectedBooking.paymentStatus)}`}>
                        {selectedBooking.paymentStatus}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-600">Booking Status</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedBooking.bookingStatus)}`}>
                        {selectedBooking.bookingStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        title="Cancel Booking"
        message={`Are you sure you want to cancel booking ${selectedBooking?.pnrNumber}? This will refund the amount to the customer.`}
        confirmText="Cancel Booking"
        cancelText="Keep Booking"
        onConfirm={handleCancelBooking}
        onCancel={() => {
          setShowCancelDialog(false)
          setSelectedBooking(null)
        }}
        type="danger"
        isLoading={false}
      />
    </div>
  )
}

export default ManageBookingsPage