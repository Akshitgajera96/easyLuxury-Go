/**
 * Public page to view ticket details from QR code scan
 * Accessible via /view-ticket?pnr=XXX
 */

import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import LoadingSpinner from '../components/common/LoadingSpinner'
import bookingService from '../services/bookingService'
import { toast } from 'react-hot-toast'
import logo from '../assets/images/logo.jpg'

const ViewTicketPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const pnr = searchParams.get('pnr')
  
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!pnr) {
      setError('No PNR provided')
      setLoading(false)
      return
    }

    const fetchBooking = async () => {
      try {
        setLoading(true)
        // Try to fetch booking by PNR
        const response = await bookingService.getMyBookings()
        
        if (response?.success && response.data?.bookings) {
          const foundBooking = response.data.bookings.find(
            b => b.pnr === pnr || b._id?.slice(-8).toUpperCase() === pnr.toUpperCase()
          )
          
          if (foundBooking) {
            setBooking(foundBooking)
          } else {
            setError('Ticket not found')
          }
        } else {
          setError('Failed to load ticket')
        }
      } catch (err) {
        console.error('Error fetching booking:', err)
        setError('Failed to load ticket details')
      } finally {
        setLoading(false)
      }
    }

    fetchBooking()
  }, [pnr])

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" variant="primary" />
          <p className="mt-4 text-gray-600">Loading ticket...</p>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ticket Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The requested ticket could not be found.'}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    )
  }

  const trip = booking.trip || {}
  const bus = trip.bus || {}

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-xl shadow-lg p-6 border-b-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden">
                <img 
                  src={logo} 
                  alt="easyLuxury Logo" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Electronic Reservation Slip</h1>
                <p className="text-blue-600 font-semibold">easyLuxuryGO</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">PNR Number</div>
              <div className="text-2xl font-bold text-blue-600">{booking.pnr || pnr}</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-b-xl shadow-lg p-6 space-y-6">
          {/* Status Badge */}
          <div className="text-center">
            <span className={`inline-block px-6 py-2 rounded-full text-sm font-semibold ${
              booking.bookingStatus === 'confirmed' 
                ? 'bg-green-100 text-green-800' 
                : booking.bookingStatus === 'cancelled'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {booking.bookingStatus?.toUpperCase() || 'PENDING'}
            </span>
          </div>

          {/* Trip Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* From */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">From</div>
              <div className="text-xl font-bold text-gray-900">{trip.route?.sourceCity || 'N/A'}</div>
              <div className="text-sm text-gray-700 mt-2">
                <div className="font-semibold">Departure</div>
                <div>{formatDateTime(trip.departureDateTime)}</div>
              </div>
              {booking.boardingPoint && (
                <div className="text-xs text-gray-600 mt-2">
                  📍 {booking.boardingPoint.terminal || booking.boardingPoint.address}
                </div>
              )}
            </div>

            {/* To */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">To</div>
              <div className="text-xl font-bold text-gray-900">{trip.route?.destinationCity || 'N/A'}</div>
              <div className="text-sm text-gray-700 mt-2">
                <div className="font-semibold">Arrival</div>
                <div>{formatDateTime(trip.arrivalDateTime)}</div>
              </div>
              {booking.droppingPoint && (
                <div className="text-xs text-gray-600 mt-2">
                  📍 {booking.droppingPoint.terminal || booking.droppingPoint.address}
                </div>
              )}
            </div>
          </div>

          {/* Bus Details */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bus Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Bus Number</div>
                <div className="font-semibold text-gray-900">{bus.busNumber || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Bus Type</div>
                <div className="font-semibold text-gray-900 capitalize">{bus.seatType || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Operator</div>
                <div className="font-semibold text-gray-900">{bus.operator || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Amount</div>
                <div className="font-semibold text-blue-600">₹{booking.totalAmount || 0}</div>
              </div>
            </div>
          </div>

          {/* Passenger Details */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Passenger Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Seat</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Age</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Gender</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {booking.seats?.map((seat, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-blue-600">{seat.seatNumber}</td>
                      <td className="px-4 py-3 text-gray-900">{seat.passengerName}</td>
                      <td className="px-4 py-3 text-gray-900">{seat.passengerAge}</td>
                      <td className="px-4 py-3 text-gray-900 capitalize">{seat.passengerGender}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Important Notice */}
          <div className="border-t pt-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700 font-semibold">Important Information</p>
                  <ul className="text-xs text-yellow-700 mt-2 space-y-1 list-disc list-inside">
                    <li>Please carry a valid ID proof during travel</li>
                    <li>Arrive at boarding point 30 minutes before departure</li>
                    <li>This ticket is non-transferable</li>
                    <li>Contact customer support for any queries</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t pt-6 text-center text-sm text-gray-600">
            <p>For queries, contact: care@easyluxurygo.com | 24/7 Support: 1800-123-4567</p>
            <p className="mt-2 text-xs">This is a computer-generated ticket. No signature required.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ViewTicketPage
