/**
 * Booking page for selecting seats and completing bus bookings
 */

import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../hooks/useSocket'
import { useUser } from '../context/UserContext'
import BusCard from '../components/booking/BusCard'
import SeatLayout from '../components/booking/SeatLayout'
import BookingSummary from '../components/booking/BookingSummary'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ConfirmDialog from '../components/common/ConfirmDialog'
import PaymentMethodSelector from '../components/wallet/PaymentMethodSelector'
import bookingService from '../services/bookingService'
import { toast } from 'react-hot-toast'
import logo from '../assets/images/logo.jpg'

const BookingPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { socket, lockSeats, releaseSeats, useSeatUpdate } = useSocket()
  const { walletBalance, addWalletBalance } = useUser()

  const [currentStep, setCurrentStep] = useState(1) // 1: Seat Selection, 2: Passenger Details, 3: Payment
  const [selectedSeats, setSelectedSeats] = useState([])
  const [passengerDetails, setPassengerDetails] = useState([])
  const [loading, setLoading] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('wallet')
  const [showAddMoneyDialog, setShowAddMoneyDialog] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [addMoneyAmount, setAddMoneyAmount] = useState('')

  // Mock data - in real app, this would come from location state or API
  const trip = location.state?.trip || {
    id: '1',
    departureDateTime: '2024-01-20T10:00:00',
    arrivalDateTime: '2024-01-20T16:00:00',
    baseFare: 1200,
    availableSeats: 25,
    route: {
      sourceCity: 'Mumbai',
      destinationCity: 'Goa'
    }
  }

  const bus = location.state?.bus || {
    id: '1',
    busNumber: 'MH01AB1234',
    seatType: 'sleeper',
    amenities: ['wifi', 'ac', 'charging', 'blanket', 'snacks'],
    operator: 'Luxury Travels',
    totalSeats: 40,
    seatLayout: {
      left: {
        upper: Array.from({ length: 20 }, (_, i) => ({
          seatNumber: `U${Math.floor(i / 2) + 1}-${(i % 2) + 1}`,
          position: { row: Math.floor(i / 2) + 1, column: (i % 2) + 1 }
        })),
        lower: Array.from({ length: 20 }, (_, i) => ({
          seatNumber: `L${Math.floor(i / 2) + 1}-${(i % 2) + 1}`,
          position: { row: Math.floor(i / 2) + 1, column: (i % 2) + 1 }
        }))
      },
      right: {
        upper: [],
        lower: []
      },
      totalRows: 10
    }
  }

  // Debug: Log bus data to console
  useEffect(() => {
    console.log('🚌 Bus data received in BookingPage:', {
      busNumber: bus.busNumber,
      hasSeatLayout: !!bus.seatLayout,
      seatLayoutStructure: bus.seatLayout ? {
        hasLeft: !!bus.seatLayout.left,
        hasRight: !!bus.seatLayout.right,
        hasLowerDeck: !!bus.seatLayout.lowerDeck,
        hasUpperDeck: !!bus.seatLayout.upperDeck,
        leftUpperCount: bus.seatLayout.left?.upper?.length || 0,
        leftLowerCount: bus.seatLayout.left?.lower?.length || 0,
        rightUpperCount: bus.seatLayout.right?.upper?.length || 0,
        rightLowerCount: bus.seatLayout.right?.lower?.length || 0
      } : 'NO LAYOUT',
      fullSeatLayout: bus.seatLayout
    });
  }, [bus])

  const bookedSeats = ['U1-1', 'L2-3', 'U5-2'] // Mock booked seats
  const lockedSeats = ['U3-1'] // Mock locked seats

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } })
      return
    }
  }, [isAuthenticated, navigate, location])

  // Listen for seat updates using the socket hook
  useSeatUpdate((data) => {
    // Handle real-time seat updates - refresh available seats
  })

  useEffect(() => {
    // Lock seats when selected
    const tripId = trip._id || trip.id
    if (selectedSeats.length > 0 && socket) {
      lockSeats(tripId, selectedSeats)
    }

    // Cleanup: Release seats when component unmounts or seats change
    return () => {
      if (selectedSeats.length > 0 && socket) {
        releaseSeats(tripId, selectedSeats)
      }
    }
  }, [selectedSeats, trip._id, trip.id, socket, lockSeats, releaseSeats])

  const handleSeatSelect = (seats) => {
    setSelectedSeats(seats)
    
    // Initialize passenger details for selected seats
    const newPassengerDetails = seats.map((seat, index) => ({
      seatNumber: seat,
      name: '',
      age: '',
      gender: ''
    }))
    setPassengerDetails(newPassengerDetails)
  }

  const handlePassengerDetailChange = (index, field, value) => {
    const updatedDetails = [...passengerDetails]
    updatedDetails[index] = {
      ...updatedDetails[index],
      [field]: value
    }
    setPassengerDetails(updatedDetails)
  }

  const validatePassengerDetails = () => {
    for (let passenger of passengerDetails) {
      if (!passenger.name.trim() || !passenger.age || !passenger.gender) {
        return false
      }
      if (passenger.age < 5 || passenger.age > 100) {
        return false
      }
    }
    return true
  }

  const handleProceedToPayment = () => {
    if (validatePassengerDetails()) {
      setCurrentStep(3)
    } else {
      alert('Please fill all passenger details correctly')
    }
  }

  const handleConfirmBooking = async () => {
    setLoading(true)
    try {
      const bookingData = {
        tripId: trip._id || trip.id,
        seats: selectedSeats,
        passengerInfo: passengerDetails,
        paymentMethod: selectedPaymentMethod
      }

      const response = await bookingService.createBooking(bookingData)
      
      if (response.success) {
        toast.success('Booking confirmed successfully! ✅', {
          duration: 3000
        })
        
        navigate('/booking-confirmation', { 
          state: { 
            bookingId: response.data.booking._id || response.data.booking.bookingId,
            booking: response.data.booking,
            trip,
            bus,
            selectedSeats,
            passengerDetails,
            totalAmount: response.data.booking.totalAmount
          }
        })
      } else {
        throw new Error(response.message || 'Booking failed')
      }
    } catch (error) {
      console.error('Booking failed:', error)
      toast.error(error.response?.data?.message || error.message || 'Booking failed. Please try again.', {
        duration: 4000
      })
    } finally {
      setLoading(false)
      setShowConfirmDialog(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" variant="primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden">
                <img 
                  src={logo} 
                  alt="easyLuxury Logo" 
                  className="w-full h-full object-cover" 
                  style={{ imageRendering: '-webkit-optimize-contrast' }}
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Book Your Journey</h1>
                <p className="text-blue-100">
                  {trip.route?.sourceCity || trip.route?.from || 'Source'} → {trip.route?.destinationCity || trip.route?.to || 'Destination'} • {new Date(trip.departureDateTime).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Progress Steps */}
              <div className="flex items-center space-x-2">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      currentStep >= step 
                        ? 'bg-white text-blue-700' 
                        : 'bg-blue-900/50 text-white border-2 border-white/30'
                    }`}>
                      {step}
                    </div>
                    {step < 3 && (
                      <div className={`w-8 h-1 mx-2 ${
                        currentStep > step ? 'bg-white' : 'bg-white/30'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="text-sm text-blue-100">
                Step {currentStep} of 3
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Booking Steps */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bus Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <BusCard 
                bus={bus} 
                trip={trip} 
                onSelect={() => {}} 
              />
            </motion.div>

            {/* Step 1: Seat Selection */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <SeatLayout
                  busLayout={bus.seatLayout}
                  seatType={bus.seatType}
                  bookedSeats={bookedSeats}
                  lockedSeats={lockedSeats}
                  selectedSeats={selectedSeats}
                  onSeatSelect={handleSeatSelect}
                  maxSeats={5}
                />
                
                {selectedSeats.length > 0 && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-lg shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 hover:scale-105 transition-all duration-300 font-semibold"
                    >
                      Continue to Passenger Details ({selectedSeats.length} seats selected)
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 2: Passenger Details */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Passenger Details</h2>
                
                <div className="space-y-6">
                  {passengerDetails.map((passenger, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Passenger {index + 1} - Seat {passenger.seatNumber.replace('-', '')}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={passenger.name}
                            onChange={(e) => handlePassengerDetailChange(index, 'name', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                            placeholder="Enter passenger name"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Age
                          </label>
                          <input
                            type="number"
                            value={passenger.age}
                            onChange={(e) => handlePassengerDetailChange(index, 'age', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                            placeholder="Enter age"
                            min="5"
                            max="100"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Gender
                          </label>
                          <select
                            value={passenger.gender}
                            onChange={(e) => handlePassengerDetailChange(index, 'gender', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                          >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between mt-6">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                  >
                    Back to Seat Selection
                  </button>
                  <button
                    onClick={handleProceedToPayment}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 hover:scale-105 transition-all duration-300 font-semibold"
                  >
                    Proceed to Payment
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Payment */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment</h2>
                
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Booking Summary</h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p><strong>Status:</strong> <span className="text-blue-600 font-semibold">Pending Confirmation</span></p>
                    <p><strong>Seats:</strong> {selectedSeats.join(', ')}</p>
                    <p><strong>Passengers:</strong> {passengerDetails.length}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {/* Wallet Balance Display */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-100">Your Wallet Balance</p>
                        <p className="text-3xl font-bold">₹{walletBalance || 0}</p>
                      </div>
                      <div>
                        {(walletBalance || 0) < (selectedSeats.length * (trip.currentFare || trip.baseFare || trip.fare || 0) * 1.18 + 30) && (
                          <button
                            onClick={() => setShowAddMoneyDialog(true)}
                            className="bg-white text-blue-600 px-4 py-2 rounded-lg shadow-lg hover:shadow-xl hover:bg-blue-50 hover:scale-105 transition-all duration-300 font-semibold text-sm"
                          >
                            Add Money
                          </button>
                        )}
                      </div>
                    </div>
                    {(walletBalance || 0) < (selectedSeats.length * (trip.currentFare || trip.baseFare || trip.fare || 0) * 1.18 + 30) && (
                      <div className="mt-3 bg-red-50 border border-red-300 rounded-lg p-3">
                        <p className="text-sm text-red-700">
                          <strong>Warning:</strong> Insufficient balance! You need ₹{Math.ceil((selectedSeats.length * (trip.currentFare || trip.baseFare || trip.fare || 0) * 1.18 + 30) - (walletBalance || 0))} more to complete this booking.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Payment Methods</h3>
                    <div className="space-y-2">
                      <label className="flex items-center justify-between space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <input 
                            type="radio" 
                            name="payment" 
                            value="wallet"
                            checked={selectedPaymentMethod === 'wallet'}
                            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                            className="text-blue-600 focus:ring-2 focus:ring-blue-500" 
                          />
                          <span>Wallet Balance</span>
                        </div>
                        <span className="text-sm font-semibold text-blue-600">₹{walletBalance || 0}</span>
                      </label>
                      <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input 
                          type="radio" 
                          name="payment" 
                          value="card"
                          checked={selectedPaymentMethod === 'card'}
                          onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                          className="text-blue-600 focus:ring-2 focus:ring-blue-500" 
                        />
                        <span>Credit/Debit Card</span>
                      </label>
                      <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input 
                          type="radio" 
                          name="payment" 
                          value="upi"
                          checked={selectedPaymentMethod === 'upi'}
                          onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                          className="text-blue-600 focus:ring-2 focus:ring-blue-500" 
                        />
                        <span>UPI Payment</span>
                      </label>
                      <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input 
                          type="radio" 
                          name="payment" 
                          value="netbanking"
                          checked={selectedPaymentMethod === 'netbanking'}
                          onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                          className="text-blue-600 focus:ring-2 focus:ring-blue-500" 
                        />
                        <span>Net Banking</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-between mt-6">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                    >
                      Back to Passenger Details
                    </button>
                    <button
                      onClick={() => setShowConfirmDialog(true)}
                      disabled={loading || (selectedPaymentMethod === 'wallet' && (walletBalance || 0) < (selectedSeats.length * (trip.currentFare || trip.baseFare || trip.fare || 0) * 1.18 + 30))}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loading && <LoadingSpinner size="sm" variant="primary" />}
                      Confirm Booking
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column - Booking Summary */}
          <div className="lg:col-span-1">
            <BookingSummary
              trip={trip}
              bus={bus}
              selectedSeats={selectedSeats}
              passengerDetails={passengerDetails}
              onEditSeats={() => setCurrentStep(1)}
              onEditPassengers={() => setCurrentStep(2)}
            />
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Confirm Booking"
        message={`Are you sure you want to book ${selectedSeats.length} seat(s) for ₹${selectedSeats.length * (trip.currentFare || trip.baseFare || trip.fare || 0)}?`}
        confirmText={loading ? "Processing..." : "Confirm Booking"}
        cancelText="Cancel"
        onConfirm={handleConfirmBooking}
        onCancel={() => setShowConfirmDialog(false)}
        type="info"
        isLoading={loading}
      />

      {/* Add Money Simple Dialog */}
      {showAddMoneyDialog && !showPaymentModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowAddMoneyDialog(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Add Money to Wallet
                </h3>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-3">
                    Required: ₹{Math.ceil((selectedSeats.length * (trip.currentFare || trip.baseFare || trip.fare || 0) * 1.18 + 30) - (walletBalance || 0))}
                  </p>
                  
                  {/* Quick Amount Buttons */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[500, 1000, 2000, 5000].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setAddMoneyAmount(amount.toString())}
                        className="p-3 border-2 border-blue-500 text-blue-600 rounded-lg font-semibold hover:bg-blue-500 hover:text-white hover:shadow-xl hover:scale-105 transition-all duration-300"
                      >
                        ₹{amount}
                      </button>
                    ))}
                  </div>
                  
                  {/* Custom Amount */}
                  <input
                    type="number"
                    value={addMoneyAmount}
                    onChange={(e) => setAddMoneyAmount(e.target.value)}
                    placeholder="Or enter custom amount"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    min="1"
                  />
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => {
                    if (addMoneyAmount && parseInt(addMoneyAmount) > 0) {
                      setShowPaymentModal(true)
                    } else {
                      toast.error('Please enter a valid amount')
                    }
                  }}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Proceed to Payment
                </button>
                <button
                  onClick={() => {
                    setShowAddMoneyDialog(false)
                    setAddMoneyAmount('')
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-gray-700 font-medium hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <PaymentMethodSelector
          amount={parseInt(addMoneyAmount) || 0}
          onSuccess={async (paymentData) => {
            try {
              await addWalletBalance(parseInt(addMoneyAmount))
              setShowPaymentModal(false)
              setShowAddMoneyDialog(false)
              setAddMoneyAmount('')
              toast.success(`₹${addMoneyAmount} added successfully!`, {
                duration: 3000
              })
            } catch (error) {
              toast.error('Failed to add money. Please try again.')
            }
          }}
          onCancel={() => {
            setShowPaymentModal(false)
          }}
        />
      )}
    </div>
  )
}

export default BookingPage