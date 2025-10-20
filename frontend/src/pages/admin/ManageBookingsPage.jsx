/**
 * Admin page for managing all bookings
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ConfirmDialog from '../../components/common/ConfirmDialog'

const ManageBookingsPage = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all'
  })

  useEffect(() => {
    // Simulate API call to fetch bookings
    const fetchBookings = async () => {
      setLoading(true)
      try {
        // In real app: await bookingService.getAllBookings()
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const mockBookings = [
          {
            id: 'BK001',
            user: { name: 'Raj Sharma', email: 'raj@example.com', phone: '9876543210' },
            trip: {
              route: { from: 'Mumbai', to: 'Goa' },
              departureDateTime: '2024-01-20T08:00:00',
              bus: { busNumber: 'MH01AB1234', operator: 'Luxury Travels' }
            },
            seats: ['U1-1', 'U1-2'],
            passengers: [
              { name: 'Raj Sharma', age: 28, gender: 'male' },
              { name: 'Priya Sharma', age: 26, gender: 'female' }
            ],
            totalAmount: 2400,
            bookingStatus: 'confirmed',
            paymentStatus: 'completed',
            paymentMethod: 'wallet',
            pnr: 'EL20240120001',
            createdAt: '2024-01-15T10:30:00'
          },
          {
            id: 'BK002',
            user: { name: 'Amit Kumar', email: 'amit@example.com', phone: '9876543211' },
            trip: {
              route: { from: 'Delhi', to: 'Jaipur' },
              departureDateTime: '2024-01-20T10:00:00',
              bus: { busNumber: 'MH01CD5678', operator: 'Comfort Rides' }
            },
            seats: ['L2-1'],
            passengers: [
              { name: 'Amit Kumar', age: 32, gender: 'male' }
            ],
            totalAmount: 800,
            bookingStatus: 'pending',
            paymentStatus: 'pending',
            paymentMethod: 'card',
            pnr: 'EL20240120002',
            createdAt: '2024-01-15T14:20:00'
          },
          {
            id: 'BK003',
            user: { name: 'Priya Patel', email: 'priya@example.com', phone: '9876543212' },
            trip: {
              route: { from: 'Bangalore', to: 'Chennai' },
              departureDateTime: '2024-01-20T14:00:00',
              bus: { busNumber: 'MH01EF9012', operator: 'Express Travels' }
            },
            seats: ['S1', 'S2', 'S3'],
            passengers: [
              { name: 'Priya Patel', age: 25, gender: 'female' },
              { name: 'Rahul Patel', age: 28, gender: 'male' },
              { name: 'Neha Patel', age: 22, gender: 'female' }
            ],
            totalAmount: 1800,
            bookingStatus: 'cancelled',
            paymentStatus: 'refunded',
            paymentMethod: 'upi',
            pnr: 'EL20240120003',
            createdAt: '2024-01-14T09:15:00'
          }
        ]
        setBookings(mockBookings)
      } catch (error) {
        console.error('Failed to fetch bookings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [])

  const handleStatusUpdate = async (bookingId, newStatus) => {
    setLoading(true)
    try {
      // In real app: await bookingService.updateBookingStatus(bookingId, { bookingStatus: newStatus })
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId ? { ...booking, bookingStatus: newStatus } : booking
      ))
    } catch (error) {
      console.error('Failed to update booking status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async () => {
    if (!selectedBooking) return
    
    setLoading(true)
    try {
      // In real app: await bookingService.cancelBooking(selectedBooking.id)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setBookings(prev => prev.map(booking => 
        booking.id === selectedBooking.id 
          ? { ...booking, bookingStatus: 'cancelled', paymentStatus: 'refunded' }
          : booking
      ))
      setShowCancelDialog(false)
      setSelectedBooking(null)
    } catch (error) {
      console.error('Failed to cancel booking:', error)
    } finally {
      setLoading(false)
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
            key={booking.id}
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
                      {booking.trip.route.from} → {booking.trip.route.to}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {formatDateTime(booking.trip.departureDateTime)}
                    </p>
                    <p className="text-sm text-gray-500">
                      PNR: {booking.pnr} � Booked on: {formatDateTime(booking.createdAt)}
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
                    <p>{booking.user.name}</p>
                    <p className="text-gray-600">{booking.user.email}</p>
                    <p className="text-gray-600">{booking.user.phone}</p>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-900">Bus Details</p>
                    <p>{booking.trip.bus.busNumber}</p>
                    <p className="text-gray-600">{booking.trip.bus.operator}</p>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-900">Booking Details</p>
                    <p>{booking.seats.length} seat(s) � ₹{booking.totalAmount}</p>
                    <p className="text-gray-600">{booking.paymentMethod.toUpperCase()} � {booking.seats.join(', ')}</p>
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
                  className="px-4 py-2 bg-accent/20 text-black40 rounded-lg font-medium hover:bg-gradient-to-r hover:from-accent hover:to-accent-dark hover:shadow-xl hover:scale-105 transition-all duration-300/30 transition-colors"
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
                  onChange={(e) => handleStatusUpdate(booking.id, e.target.value)}
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
                  className="text-gray-400 hover:text-gray-600"
                >
                  ?
                </button>
              </div>

              <div className="space-y-6">
                {/* Trip Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Trip Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Route</p>
                      <p className="font-medium">{selectedBooking.trip.route.from} → {selectedBooking.trip.route.to}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Departure</p>
                      <p className="font-medium">{formatDateTime(selectedBooking.trip.departureDateTime)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Bus</p>
                      <p className="font-medium">{selectedBooking.trip.bus.busNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Operator</p>
                      <p className="font-medium">{selectedBooking.trip.bus.operator}</p>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Name</p>
                      <p className="font-medium">{selectedBooking.user.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Email</p>
                      <p className="font-medium">{selectedBooking.user.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Phone</p>
                      <p className="font-medium">{selectedBooking.user.phone}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">PNR</p>
                      <p className="font-medium">{selectedBooking.pnr}</p>
                    </div>
                  </div>
                </div>

                {/* Passenger Details */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Passenger Details</h4>
                  <div className="space-y-3">
                    {selectedBooking.passengers.map((passenger, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{passenger.name}</p>
                          <p className="text-sm text-gray-600">
                            {passenger.age} years � {passenger.gender} � Seat: {selectedBooking.seats[index]}
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
                      <p className="font-medium text-lg text-accent">₹{selectedBooking.totalAmount}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Payment Method</p>
                      <p className="font-medium">{selectedBooking.paymentMethod.toUpperCase()}</p>
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
        message={`Are you sure you want to cancel booking ${selectedBooking?.pnr}? This will refund the amount to the customer.`}
        confirmText={loading ? "Cancelling..." : "Cancel Booking"}
        cancelText="Keep Booking"
        onConfirm={handleCancelBooking}
        onCancel={() => {
          setShowCancelDialog(false)
          setSelectedBooking(null)
        }}
        type="danger"
        isLoading={loading}
      />
    </div>
  )
}

export default ManageBookingsPage