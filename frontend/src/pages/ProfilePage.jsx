/**
 * User profile page for customers to manage their account
 */

import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useUser } from '../context/UserContext'
import ProfileCard from '../components/user/ProfileCard'
import LoadingSpinner from '../components/common/LoadingSpinner'

const ProfilePage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile, walletBalance, loading } = useUser()

  if (loading) {
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
              <h1 className="text-3xl font-bold">My Profile</h1>
              <p className="text-accent mt-2">Manage your account and preferences</p>
            </div>
            <div className="text-right">
              <div className="bg-accent text-gray-900 px-4 py-2 rounded-lg">
                <p className="text-sm font-semibold">Wallet Balance</p>
                <p className="text-xl font-bold">₹{walletBalance}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Quick Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Summary */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gray-900 text-2xl font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{user?.name}</h3>
                <p className="text-gray-500">{user?.email}</p>
                <div className="mt-2">
                  <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {user?.role?.toUpperCase()}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <h4 className="font-semibold text-gray-900 mb-4">Quick Stats</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Bookings</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Upcoming Trips</span>
                  <span className="font-semibold">2</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Reviews Written</span>
                  <span className="font-semibold">5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-semibold">2024</span>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <h4 className="font-semibold text-gray-900 mb-4">Quick Actions</h4>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/my-bookings')}
                  className="w-full text-left p-3 bg-accent/10 text-gray-900 rounded-lg hover:bg-accent hover:shadow-xl hover:scale-105 transition-all duration-300 font-medium"
                >
                  🚌 View My Bookings
                </button>
                <button 
                  onClick={() => navigate('/wallet')}
                  className="w-full text-left p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium"
                >
                  💰 Add Wallet Money
                </button>
                <button 
                  onClick={() => navigate('/reviews')}
                  className="w-full text-left p-3 bg-sky-50 text-sky-700 rounded-lg hover:bg-sky-100 transition-colors font-medium"
                >
                  ✍ Write a Review
                </button>
                <button 
                  onClick={() => navigate('/trips')}
                  className="w-full text-left p-3 bg-accent/10 text-gray-900 rounded-lg hover:bg-accent hover:shadow-xl hover:scale-105 transition-all duration-300 font-medium"
                >
                  🎫 Book New Trip
                </button>
              </div>
            </motion.div>
          </div>

          {/* Main Content - Profile Card */}
          <div className="lg:col-span-2">
            <ProfileCard />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage