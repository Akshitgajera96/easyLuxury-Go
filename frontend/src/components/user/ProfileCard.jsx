/**
 * User profile card component for displaying and editing user information
 */

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useUser } from '../../context/UserContext'
import LoadingSpinner from '../common/LoadingSpinner'

const ProfileCard = () => {
  const { profile, updateProfile, loading } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    dateOfBirth: profile?.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
  })
  const [updateLoading, setUpdateLoading] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    setUpdateLoading(true)
    try {
      // Only send fields that backend accepts (name and phone)
      const updateData = {
        name: formData.name,
        phone: formData.phone
      }
      const result = await updateProfile(updateData)
      if (result.success) {
        setIsEditing(false)
      }
    } finally {
      setUpdateLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: profile?.name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      dateOfBirth: profile?.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
    })
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 flex items-center justify-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <LoadingSpinner size="lg" variant="primary" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      {/* Header */}
      <div className="bg-black40 text-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Profile Information</h2>
            <p className="text-accent">Manage your personal details</p>
          </div>
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center">
            <span className="text-black40 font-bold text-xl">
              {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {!isEditing ? (
          // View Mode
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                <p className="text-lg font-semibold text-gray-900">{profile?.name || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                <p className="text-lg font-semibold text-gray-900">{profile?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                <p className="text-lg font-semibold text-gray-900">{profile?.phone || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Date of Birth</label>
                <p className="text-lg font-semibold text-gray-900">
                  {profile?.dateOfBirth 
                    ? new Date(profile.dateOfBirth).toLocaleDateString()
                    : 'Not set'
                  }
                </p>
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                onClick={() => setIsEditing(true)}
                className="bg-accent text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gradient-to-r hover:from-accent hover:to-accent-dark hover:shadow-xl hover:scale-105 transition-all duration-300 transition-colors"
              >
                Edit Profile
              </button>
            </div>
          </div>
        ) : (
          // Edit Mode
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent transition-all bg-gray-100"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                onClick={handleSave}
                disabled={updateLoading}
                className="bg-accent text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gradient-to-r hover:from-accent hover:to-accent-dark hover:shadow-xl hover:scale-105 transition-all duration-300 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {updateLoading && <LoadingSpinner size="sm" variant="primary" />}
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                disabled={updateLoading}
                className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default ProfileCard