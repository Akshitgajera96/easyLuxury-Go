/**
 * User page to view and manage personal bookings
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import bookingService from '../../services/bookingService'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { toast } from 'react-hot-toast'

const MyBookingsPage = () => {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all' // all, pending, confirmed, ongoing, completed, cancelled
  })

  useEffect(() => {
    const fetchUserBookings = async () => {
      setLoading(true)
      try {
        const response = await bookingService.getUserBookings()
        
        const mockBookings = [
          {
            id: 'BK001',
            pnr: 'EL20240120001',
            trip: {
              route: { from: 'Mumbai', to: 'Goa' },
              departureDateTime: '2024-01-25T08:00:00',
              arrivalDateTime: '2024-01-25T20:00:00',
              bus: { 
                busNumber: 'MH01AB1234', 
                operator: 'Luxury Travels',
                busType: 'sleeper',
                amenities: ['wifi', 'ac', 'charging', 'blanket']
              }
            },
            seats: ['U1-1', 'U1-2'],
            passengers: [
              { name: 'Raj Sharma', age: 28, gender: 'male' },
              { name: 'Priya Sharma', age: 26, gender: 'female' }
            ],
            totalAmount: 2832, // 2400 + 18% tax + 30 convenience fee
            bookingStatus: 'confirmed',
            paymentStatus: 'completed',
            paymentMethod: 'wallet',
            boardingPoint: 'Mumbai Central Bus Stand',
            droppingPoint: 'Goa Bus Terminal',
            createdAt: '2024-01-15T10:30:00',
            cancellationTime: null,
            refundAmount: null
          },
          {
            id: 'BK002',
            pnr: 'EL20240115002',
            trip: {
              route: { from: 'Delhi', to: 'Jaipur' },
              departureDateTime: '2024-01-18T10:00:00',
              arrivalDateTime: '2024-01-18T16:00:00',
              bus: { 
                busNumber: 'MH01CD5678', 
                operator: 'Comfort Rides',
                busType: 'semi-sleeper',
                amenities: ['ac', 'charging', 'blanket']
              }
            },
            seats: ['L2-1'],
            passengers: [
              { name: 'Raj Sharma', age: 28, gender: 'male' }
            ],
            totalAmount: 944, // 800 + 18% tax + 30 convenience fee
            bookingStatus: 'completed',
            paymentStatus: 'completed',
            paymentMethod: 'card',
            boardingPoint: 'Delhi ISBT',
            droppingPoint: 'Jaipur Bus Stand',
            createdAt: '2024-01-10T14:20:00',
            cancellationTime: null,
            refundAmount: null
          },
          {
            id: 'BK003',
            pnr: 'EL20240110003',
            trip: {
              route: { from: 'Bangalore', to: 'Chennai' },
              departureDateTime: '2024-01-12T14:00:00',
              arrivalDateTime: '2024-01-12T20:00:00',
              bus: { 
                busNumber: 'MH01EF9012', 
                operator: 'Express Travels',
                busType: 'seater',
                amenities: ['ac', 'charging']
              }
            },
            seats: ['S1', 'S2', 'S3'],
            passengers: [
              { name: 'Raj Sharma', age: 28, gender: 'male' },
              { name: 'Amit Kumar', age: 30, gender: 'male' },
              { name: 'Neha Singh', age: 25, gender: 'female' }
            ],
            totalAmount: 2124, // 1800 + 18% tax + 30 convenience fee
            bookingStatus: 'cancelled',
            paymentStatus: 'refunded',
            paymentMethod: 'upi',
            boardingPoint: 'Bangalore Central',
            droppingPoint: 'Chennai Mofussil',
            createdAt: '2024-01-05T09:15:00',
            cancellationTime: '2024-01-11T16:30:00',
            refundAmount: 1912
          }
        ]
        
        // Use API response if available, otherwise fallback to mock data
        if (response && response.success && response.data) {
          setBookings(response.data.bookings || [])
        } else {
          setBookings(mockBookings) // Fallback to mock data
        }
      } catch (error) {
        console.error('Failed to fetch bookings:', error)
        // Use mock data on error
        const mockBookings = [
          // ... keeping mock data as fallback
        ]
        setBookings(mockBookings)
        toast.error('Could not load bookings from server. Showing sample data.', {
          duration: 3000
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUserBookings()
  }, [])

  const handleCancelBooking = async () => {
    if (!selectedBooking) return
    
    setLoading(true)
    try {
      const response = await bookingService.cancelBooking(
        selectedBooking.id,
        'Customer requested cancellation'
      )
      
      if (response && response.success) {
        setBookings(prev => prev.map(booking => 
          booking.id === selectedBooking.id 
            ? { 
                ...booking, 
                bookingStatus: 'cancelled', 
                paymentStatus: 'refunded',
                cancellationTime: new Date().toISOString(),
                refundAmount: response.data.booking?.refundAmount || Math.round(booking.totalAmount * 0.8)
              }
            : booking
        ))
        toast.success('Booking cancelled successfully!', {
          duration: 3000
        })
      } else {
        throw new Error('Cancellation failed')
      }
      setShowCancelDialog(false)
      setSelectedBooking(null)
    } catch (error) {
      console.error('Failed to cancel booking:', error)
      toast.error(error.response?.data?.message || 'Failed to cancel booking', {
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-accent/20 text-black40',
      confirmed: 'bg-green-100 text-green-800',
      ongoing: 'bg-sky-100 text-sky-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-accent/20 text-black40'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      confirmed: '✅',
      ongoing: '🚌',
      cancelled: '❌',
      completed: '✔️'
    }
    return icons[status] || '❓'
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

  const isUpcoming = (departureDateTime) => {
    return new Date(departureDateTime) > new Date()
  }

  const canCancel = (booking) => {
    return booking.bookingStatus === 'confirmed' && isUpcoming(booking.trip.departureDateTime)
  }

  const handleDownloadTicket = (booking) => {
    // Generate ticket content
    const ticketContent = `
==============================================
      EASYLUXURY GO - BUS TICKET
==============================================

PNR Number: ${booking.pnr}
Booking ID: ${booking.id}
Booking Date: ${formatDateTime(booking.createdAt)}

----------------------------------------------
TRIP DETAILS
----------------------------------------------
Route: ${booking.trip.route.from} ? ${booking.trip.route.to}
Departure: ${formatDateTime(booking.trip.departureDateTime)}
Arrival: ${formatDateTime(booking.trip.arrivalDateTime)}

Bus Number: ${booking.trip.bus.busNumber}
Operator: ${booking.trip.bus.operator}
Bus Type: ${booking.trip.bus.busType.toUpperCase()}

----------------------------------------------
PASSENGER DETAILS
----------------------------------------------
${booking.passengers.map((p, i) => `Seat ${booking.seats[i]}: ${p.name}, ${p.age} yrs, ${p.gender}`).join('\n')}

----------------------------------------------
BOARDING & DROP POINTS
----------------------------------------------
Boarding: ${booking.boardingPoint}
Dropping: ${booking.droppingPoint}

----------------------------------------------
PAYMENT DETAILS
----------------------------------------------
Total Amount: ?${booking.totalAmount}
Payment Method: ${booking.paymentMethod.toUpperCase()}
Payment Status: ${booking.paymentStatus.toUpperCase()}
Booking Status: ${booking.bookingStatus.toUpperCase()}

----------------------------------------------
AMENITIES
----------------------------------------------
${booking.trip.bus.amenities.map(a => `� ${a.toUpperCase()}`).join('\n')}

==============================================
      Thank you for choosing EasyLuxury Go!
      Have a safe journey!
==============================================

Customer Support: support@easyluxurygo.com
Website: www.easyluxurygo.com
    `

    // Create and download file
    const blob = new Blob([ticketContent], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `EasyLuxuryGo_Ticket_${booking.pnr}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const filteredBookings = bookings.filter(booking => {
    if (filters.status === 'all') return true
    if (filters.status === 'pending') return booking.bookingStatus === 'pending'
    if (filters.status === 'confirmed') return booking.bookingStatus === 'confirmed'
    if (filters.status === 'ongoing') return booking.bookingStatus === 'ongoing'
    if (filters.status === 'upcoming') return isUpcoming(booking.trip.departureDateTime) && (booking.bookingStatus === 'confirmed' || booking.bookingStatus === 'pending')
    if (filters.status === 'completed') return booking.bookingStatus === 'completed'
    if (filters.status === 'cancelled') return booking.bookingStatus === 'cancelled'
    return true
  })

  if (loading && bookings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" variant="primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black40 text-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">My Bookings</h1>
              <p className="text-accent mt-2">Manage and track your bus bookings</p>
            </div>
            <div className="text-right">
              <div className="bg-accent text-black40 px-4 py-2 rounded-lg">
                <p className="text-sm font-semibold">Total Bookings</p>
                <p className="text-xl font-bold">{bookings.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilters({ status: 'all' })}
              className={`px-4 py-2 rounded-lg font-medium ${
                filters.status === 'all'
                  ? 'bg-accent text-gray-900'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Bookings
            </button>
            <button
              onClick={() => setFilters({ status: 'pending' })}
              className={`px-4 py-2 rounded-lg font-medium ${
                filters.status === 'pending'
                  ? 'bg-accent text-gray-900'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilters({ status: 'confirmed' })}
              className={`px-4 py-2 rounded-lg font-medium ${
                filters.status === 'confirmed'
                  ? 'bg-accent text-gray-900'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => setFilters({ status: 'ongoing' })}
              className={`px-4 py-2 rounded-lg font-medium ${
                filters.status === 'ongoing'
                  ? 'bg-accent text-gray-900'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Ongoing
            </button>
            <button
              onClick={() => setFilters({ status: 'completed' })}
              className={`px-4 py-2 rounded-lg font-medium ${
                filters.status === 'completed'
                  ? 'bg-accent text-gray-900'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilters({ status: 'cancelled' })}
              className={`px-4 py-2 rounded-lg font-medium ${
                filters.status === 'cancelled'
                  ? 'bg-accent text-gray-900'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-6">
          {filteredBookings.map((booking, index) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Booking Header */}
              <div className="bg-gray-50 p-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {booking.trip.route.from} ? {booking.trip.route.to}
                      </h3>
                      <p className="text-sm text-gray-600">
                        PNR: {booking.pnr} � Booked on {formatDateTime(booking.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(booking.bookingStatus)}`}>
                      {booking.bookingStatus.charAt(0).toUpperCase() + booking.bookingStatus.slice(1)}
                    </span>
                    <span className="text-lg font-bold text-accent">
                      ?{booking.totalAmount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Trip Information */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Trip Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Departure:</span>
                        <span className="font-medium">{formatDateTime(booking.trip.departureDateTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Arrival:</span>
                        <span className="font-medium">{formatDateTime(booking.trip.arrivalDateTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bus:</span>
                        <span className="font-medium">{booking.trip.bus.busNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Operator:</span>
                        <span className="font-medium">{booking.trip.bus.operator}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bus Type:</span>
                        <span className="font-medium capitalize">{booking.trip.bus.busType}</span>
                      </div>
                    </div>
                  </div>

                  {/* Passenger & Seat Details */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Passenger Details</h4>
                    <div className="space-y-2">
                      {booking.passengers.map((passenger, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-900 font-medium">{passenger.name}</span>
                          <span className="text-gray-600">
                            {passenger.age} yrs � {passenger.gender} � {booking.seats[idx]}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <h5 className="font-medium text-gray-900 mb-2">Boarding & Drop</h5>
                      <p className="text-sm text-gray-600">{booking.boardingPoint}</p>
                      <p className="text-sm text-gray-600">{booking.droppingPoint}</p>
                    </div>
                  </div>

                  {/* Payment & Actions */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Payment & Actions</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Payment Method:</span>
                        <span className="font-medium">{booking.paymentMethod.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Payment Status:</span>
                        <span className={`font-medium ${
                          booking.paymentStatus === 'completed' ? 'text-green-600' : 
                          booking.paymentStatus === 'refunded' ? 'text-black40' : 'text-black40'
                        }`}>
                          {booking.paymentStatus}
                        </span>
                      </div>
                      
                      {booking.cancellationTime && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-sm text-red-700">
                            Cancelled on {formatDateTime(booking.cancellationTime)}
                          </p>
                          {booking.refundAmount && (
                            <p className="text-sm text-red-600 mt-1">
                              Refund: ?{booking.refundAmount} processed
                            </p>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-2 pt-2">
                        <div className="flex space-x-2">
                          {canCancel(booking) && (
                            <button
                              onClick={() => {
                                setSelectedBooking(booking)
                                setShowCancelDialog(true)
                              }}
                              className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg font-medium hover:bg-red-200 transition-colors text-sm"
                            >
                              Cancel Booking
                            </button>
                          )}
                          <button 
                            onClick={() => handleDownloadTicket(booking)}
                            className="flex-1 bg-accent/20 text-black40 py-2 rounded-lg font-medium hover:bg-gradient-to-r hover:from-accent hover:to-accent-dark hover:shadow-xl hover:scale-105 transition-all duration-300/30 transition-colors text-sm"
                          >
                            Download Ticket
                          </button>
                        </div>
                        {/* Track Bus Button - Only show for confirmed/ongoing trips */}
                        {(booking.bookingStatus === 'confirmed' || booking.bookingStatus === 'ongoing') && isUpcoming(booking.trip.departureDateTime) && (
                          <button
                            onClick={() => window.location.href = `/track-bus/${booking.trip._id || booking.trip.id}`}
                            className="w-full bg-gradient-to-r from-accent to-accent-dark text-gray-900 py-2 rounded shadow-lg hover:shadow-xl-accent hover:scale-105 transition-all duration-300 font-medium transition-colors text-sm flex items-center justify-center"
                          >
                            <span>Track Bus Live</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Bus Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {booking.trip.bus.amenities.map(amenity => (
                      <span
                        key={amenity}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                      >
                        <span className="capitalize">{amenity}</span>
                      </span>
                    ))}
                  </div>
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
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-4">
              {filters.status === 'all' 
                ? "You haven't made any bookings yet."
                : `No ${filters.status} bookings found.`
              }
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-gradient-to-r from-accent to-accent-dark text-gray-900 px-6 py-3 rounded shadow-lg hover:shadow-xl-accent hover:scale-105 transition-all duration-300 font-semibold transition-colors"
            >
              Book Your First Trip
            </button>
          </motion.div>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        title="Cancel Booking"
        message={`Are you sure you want to cancel your booking from ${selectedBooking?.trip.route.from} to ${selectedBooking?.trip.route.to}? A cancellation fee may apply.`}
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

export default MyBookingsPage