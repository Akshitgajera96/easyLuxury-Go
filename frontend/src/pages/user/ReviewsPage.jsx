/**
 * User page to view and write reviews for completed trips
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const ReviewsPage = () => {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [completedBookings, setCompletedBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
    categories: {
      cleanliness: 5,
      comfort: 5,
      staff: 5,
      punctuality: 5
    }
  })

  useEffect(() => {
    // Simulate API calls to fetch data
    const fetchData = async () => {
      setLoading(true)
      try {
        // In real app: await Promise.all([reviewService.getMyReviews(), bookingService.getCompletedBookings()])
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Mock completed bookings (trips that can be reviewed)
        const mockCompletedBookings = [
          {
            id: 'BK002',
            pnr: 'EL20240115002',
            trip: {
              route: { from: 'Delhi', to: 'Jaipur' },
              departureDateTime: '2024-01-18T10:00:00',
              bus: { 
                busNumber: 'MH01CD5678', 
                operator: 'Comfort Rides',
                busType: 'semi-sleeper'
              }
            },
            seats: ['L2-1'],
            completedAt: '2024-01-18T16:00:00'
          },
          {
            id: 'BK004',
            pnr: 'EL20240112004',
            trip: {
              route: { from: 'Mumbai', to: 'Pune' },
              departureDateTime: '2024-01-16T08:00:00',
              bus: { 
                busNumber: 'MH01GH3456', 
                operator: 'Express Travels',
                busType: 'seater'
              }
            },
            seats: ['S4', 'S5'],
            completedAt: '2024-01-16T12:00:00'
          }
        ]

        // Mock existing reviews
        const mockReviews = [
          {
            id: '1',
            bookingId: 'BK001',
            trip: {
              route: { from: 'Mumbai', to: 'Goa' },
              departureDateTime: '2024-01-10T08:00:00',
              bus: { 
                busNumber: 'MH01AB1234', 
                operator: 'Luxury Travels',
                busType: 'sleeper'
              }
            },
            rating: 4,
            comment: 'Comfortable journey with good amenities. The staff was very helpful throughout the trip.',
            categories: {
              cleanliness: 4,
              comfort: 5,
              staff: 4,
              punctuality: 3
            },
            createdAt: '2024-01-11T14:30:00',
            isApproved: true
          },
          {
            id: '2',
            bookingId: 'BK003',
            trip: {
              route: { from: 'Bangalore', to: 'Chennai' },
              departureDateTime: '2024-01-08T14:00:00',
              bus: { 
                busNumber: 'MH01EF9012', 
                operator: 'Fast Travels',
                busType: 'seater'
              }
            },
            rating: 2,
            comment: 'Bus was delayed by 2 hours and AC was not working properly. Disappointing experience.',
            categories: {
              cleanliness: 3,
              comfort: 2,
              staff: 2,
              punctuality: 1
            },
            createdAt: '2024-01-09T10:15:00',
            isApproved: true
          }
        ]

        setCompletedBookings(mockCompletedBookings)
        setReviews(mockReviews)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!selectedBooking) return

    setLoading(true)
    try {
      // In real app: await reviewService.createReview({ ...reviewForm, bookingId: selectedBooking.id })
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newReview = {
        id: Date.now().toString(),
        bookingId: selectedBooking.id,
        trip: selectedBooking.trip,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        categories: reviewForm.categories,
        createdAt: new Date().toISOString(),
        isApproved: false
      }

      setReviews(prev => [newReview, ...prev])
      setCompletedBookings(prev => prev.filter(booking => booking.id !== selectedBooking.id))
      setShowReviewModal(false)
      setSelectedBooking(null)
      setReviewForm({
        rating: 5,
        comment: '',
        categories: {
          cleanliness: 5,
          comfort: 5,
          staff: 5,
          punctuality: 5
        }
      })
    } catch (error) {
      console.error('Failed to submit review:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRatingChange = (rating) => {
    setReviewForm(prev => ({ ...prev, rating }))
  }

  const handleCategoryChange = (category, value) => {
    setReviewForm(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: value
      }
    }))
  }

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const renderStars = (rating, onChange = null) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange && onChange(star)}
            className={`text-2xl ${
              star <= rating ? 'text-accent' : 'text-gray-300'
            } ${onChange ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          >
            ?
          </button>
        ))}
      </div>
    )
  }

  const getBookingReviewStatus = (bookingId) => {
    return reviews.some(review => review.bookingId === bookingId)
  }

  if (loading && reviews.length === 0 && completedBookings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" variant="primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black40 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">My Reviews</h1>
              <p className="text-accent mt-2">Share your travel experiences and help other travelers</p>
            </div>
            <div className="text-right">
              <div className="bg-accent text-black40 px-4 py-2 rounded-lg">
                <p className="text-sm font-semibold">Reviews Written</p>
                <p className="text-xl font-bold">{reviews.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Pending Reviews */}
          <div className="lg:col-span-2">
            {/* My Reviews */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-6 mb-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">My Reviews</h2>
              
              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review, index) => (
                    <div key={review.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {review.trip.route.from} → {review.trip.route.to}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {review.trip.bus.operator} • {formatDateTime(review.trip.departureDateTime)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {review.trip.bus.busNumber} • <span className="capitalize">{review.trip.bus.busType}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1 mb-2">
                            {renderStars(review.rating)}
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            review.isApproved ? 'bg-green-100 text-green-800' : 'bg-accent/20 text-black40'
                          }`}>
                            {review.isApproved ? 'Approved' : 'Pending Approval'}
                          </span>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4">{review.comment}</p>

                      {/* Category Ratings */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Cleanliness:</span>
                          {renderStars(review.categories.cleanliness)}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Comfort:</span>
                          {renderStars(review.categories.comfort)}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Staff Service:</span>
                          {renderStars(review.categories.staff)}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Punctuality:</span>
                          {renderStars(review.categories.punctuality)}
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 mt-4">
                        Reviewed on {formatDateTime(review.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">₹</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No reviews yet</h3>
                  <p className="text-gray-600">Complete a trip to write your first review!</p>
                </div>
              )}
            </motion.div>

            {/* Trips Awaiting Review */}
            {completedBookings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Trips Awaiting Your Review</h2>
                <div className="space-y-4">
                  {completedBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {booking.trip.route.from} → {booking.trip.route.to}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {booking.trip.bus.operator} • {formatDateTime(booking.trip.departureDateTime)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {booking.trip.bus.busNumber} • <span className="capitalize">{booking.trip.bus.busType}</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          PNR: {booking.pnr} • Completed on {formatDateTime(booking.completedAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedBooking(booking)
                          setShowReviewModal(true)
                        }}
                        className="bg-accent text-black40 px-4 py-2 rounded-lg font-semibold hover:bg-gradient-to-r hover:from-accent hover:to-accent-dark hover:shadow-xl hover:scale-105 transition-all duration-300 transition-colors"
                      >
                        Write Review
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column - Review Guidelines */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-lg p-6 sticky top-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Guidelines</h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-sm">₹</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Be Specific</h4>
                    <p className="text-sm text-gray-600">Mention specific details about your experience</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-sm">₹</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Be Honest</h4>
                    <p className="text-sm text-gray-600">Share your genuine experience to help others</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-sm">₹</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Rate Fairly</h4>
                    <p className="text-sm text-gray-600">Consider all aspects of your journey</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-sm">₹</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Be Constructive</h4>
                    <p className="text-sm text-gray-600">Provide helpful feedback for improvement</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-accent/10 rounded-lg">
                <h4 className="font-semibold text-black40 mb-2">Why Your Review Matters</h4>
                <p className="text-sm text-black40">
                  Your reviews help other travelers make informed decisions and help us improve our services.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedBooking && (
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
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Write Review for {selectedBooking.trip.route.from} → {selectedBooking.trip.route.to}
              </h3>
              
              <form onSubmit={handleSubmitReview} className="space-y-6">
                {/* Overall Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Overall Rating
                  </label>
                  <div className="flex items-center space-x-4">
                    {renderStars(reviewForm.rating, handleRatingChange)}
                    <span className="text-lg font-semibold text-gray-900">
                      {reviewForm.rating} out of 5
                    </span>
                  </div>
                </div>

                {/* Category Ratings */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Category Ratings
                  </label>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { key: 'cleanliness', label: 'Cleanliness' },
                      { key: 'comfort', label: 'Comfort' },
                      { key: 'staff', label: 'Staff Service' },
                      { key: 'punctuality', label: 'Punctuality' }
                    ].map((category) => (
                      <div key={category.key} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 w-32">
                          {category.label}
                        </span>
                        <div className="flex-1 max-w-xs">
                          {renderStars(reviewForm.categories[category.key], (rating) => 
                            handleCategoryChange(category.key, rating)
                          )}
                        </div>
                        <span className="text-sm text-gray-500 w-8 text-right">
                          {reviewForm.categories[category.key]}/5
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Review
                  </label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="Share details about your experience - what you liked, what could be improved, and any highlights of your journey..."
                    required
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-accent text-black40 py-3 rounded-lg font-semibold hover:bg-gradient-to-r hover:from-accent hover:to-accent-dark hover:shadow-xl hover:scale-105 transition-all duration-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading && <LoadingSpinner size="sm" variant="primary" />}
                    Submit Review
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default ReviewsPage