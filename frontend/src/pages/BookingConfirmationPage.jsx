/**
 * Booking Confirmation Page
 * Displays booking details after successful payment
 */

import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Download, Share2, Calendar, MapPin, User, CreditCard, Bus, Clock } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { downloadTicketPDF, shareTicket } from '../utils/pdfGenerator'

const BookingConfirmationPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { booking, trip, bus, selectedSeats, passengerDetails, totalAmount } = location.state || {}

  useEffect(() => {
    // Redirect if no booking data
    if (!booking) {
      toast.error('No booking data found')
      navigate('/my-bookings')
    }
  }, [booking, navigate])

  if (!booking) {
    return null
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const [isDownloading, setIsDownloading] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

  const handleDownloadTicket = async () => {
    try {
      setIsDownloading(true)
      downloadTicketPDF(booking, trip, bus)
      toast.success('Ticket downloaded successfully!', { icon: '📥' })
    } catch (error) {
      console.error('Error downloading ticket:', error)
      toast.error('Failed to download ticket')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleShareTicket = async () => {
    try {
      setIsSharing(true)
      const result = await shareTicket(booking, trip, bus)
      
      if (result.method === 'native') {
        // User shared via native share
      } else {
        // Fallback to download
        toast.success('Ticket downloaded! You can share it manually.', { icon: '📥' })
      }
    } catch (error) {
      console.error('Error sharing ticket:', error)
      toast.error('Failed to share ticket')
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-block bg-green-500 rounded-full p-4 mb-4">
            <CheckCircle className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600 text-lg">Your journey is all set. Have a great trip! 🎉</p>
        </motion.div>

        {/* Booking Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6"
        >
          {/* Booking Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-green-100 text-sm mb-1">Booking ID</p>
                <p className="text-2xl font-bold font-mono">{booking._id?.slice(-8).toUpperCase() || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="text-green-100 text-sm mb-1">Status</p>
                <span className="inline-flex items-center px-3 py-1 bg-white text-green-600 rounded-full text-sm font-semibold">
                  ✓ {booking.bookingStatus || 'Confirmed'}
                </span>
              </div>
            </div>
          </div>

          {/* Journey Details */}
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Bus className="w-5 h-5 mr-2 text-blue-600" />
              Journey Details
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-start space-x-3 mb-4">
                  <MapPin className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">From</p>
                    <p className="font-semibold text-gray-900">{trip?.route?.sourceCity || booking.boardingPoint?.terminal || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-red-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">To</p>
                    <p className="font-semibold text-gray-900">{trip?.route?.destinationCity || booking.droppingPoint?.terminal || 'N/A'}</p>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-start space-x-3 mb-4">
                  <Calendar className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Departure</p>
                    <p className="font-semibold text-gray-900">
                      {trip?.departureDateTime ? formatDate(trip.departureDateTime) : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {trip?.departureDateTime ? formatTime(trip.departureDateTime) : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-orange-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Arrival</p>
                    <p className="font-semibold text-gray-900">
                      {trip?.arrivalDateTime ? formatDate(trip.arrivalDateTime) : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {trip?.arrivalDateTime ? formatTime(trip.arrivalDateTime) : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bus Details */}
          <div className="p-6 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-3">Bus Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Bus Number</p>
                <p className="font-semibold text-gray-900">{bus?.busNumber || trip?.bus?.busNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Bus Type</p>
                <p className="font-semibold text-gray-900 capitalize">{bus?.seatType || trip?.bus?.seatType || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Passenger Details */}
          <div className="p-6 border-b">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-purple-600" />
              Passenger Details
            </h3>
            <div className="space-y-3">
              {booking.seats?.map((seat, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      {seat.seatNumber}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{seat.passengerName}</p>
                      <p className="text-sm text-gray-600">
                        {seat.passengerAge} years • {seat.passengerGender}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-green-600" />
              Payment Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Seats ({booking.seats?.length || 0})</span>
                <span>₹{booking.totalAmount || totalAmount || 0}</span>
              </div>
              {booking.promoCode && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({booking.promoCode.code})</span>
                  <span>-₹{booking.promoCode.discountAmount || 0}</span>
                </div>
              )}
              <div className="border-t pt-2 mt-2 flex justify-between text-lg font-bold text-gray-900">
                <span>Total Paid</span>
                <span>₹{booking.totalAmount || totalAmount || 0}</span>
              </div>
              <div className="text-sm text-gray-500">
                Payment Method: <span className="font-semibold capitalize">{booking.paymentMethod || 'Wallet'}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap gap-4 justify-center mb-6"
        >
          <button
            onClick={handleDownloadTicket}
            disabled={isDownloading}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            <span>{isDownloading ? 'Downloading...' : 'Download Ticket'}</span>
          </button>
          <button
            onClick={handleShareTicket}
            disabled={isSharing}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Share2 className="w-5 h-5" />
            <span>{isSharing ? 'Sharing...' : 'Share Ticket'}</span>
          </button>
        </motion.div>

        {/* View All Bookings Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mb-6"
        >
          <Link
            to="/my-bookings"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition-colors shadow-lg"
          >
            <span>View All Bookings</span>
          </Link>
        </motion.div>

        {/* Important Notes */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-lg"
        >
          <h4 className="font-semibold text-blue-900 mb-2">Important Information</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Please arrive at the boarding point at least 15 minutes before departure</li>
            <li>• Carry a valid ID proof for verification</li>
            <li>• You can track your bus in real-time from "My Bookings"</li>
            <li>• For cancellation, refer to our cancellation policy</li>
          </ul>
        </motion.div>
      </div>
    </div>
  )
}

export default BookingConfirmationPage
