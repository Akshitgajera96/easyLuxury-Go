/**
 * Registration page component for new user signup
 */

import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/common/LoadingSpinner'
import logo from '../assets/images/logo.jpg'

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const userType = location.state?.userType || 'customer'

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
    if (success) setSuccess('')
  }

  const validateForm = () => {
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address')
      return false
    }
    if (!formData.name.trim()) {
      setError('Please enter your full name')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        role: userType
      })

      if (result.success) {
        setSuccess('Account created successfully! Redirecting...')
        
        // Redirect to role-specific page
        const userRole = result.data.user.role
        let redirectPath = '/'
        
        switch (userRole) {
          case 'admin':
            redirectPath = '/admin/dashboard'
            break
          case 'staff':
            redirectPath = '/staff/dashboard'
            break
          case 'customer':
          default:
            redirectPath = '/profile'
        }
        
        setTimeout(() => {
          navigate(redirectPath)
        }, 2000)
      } else {
        setError(result.error || 'Registration failed. Please try again.')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getRoleDescription = () => {
    switch (userType) {
      case 'admin':
        return 'Create an administrator account to manage the entire system'
      case 'staff':
        return 'Register as staff member (driver or conductor)'
      default:
        return 'Create your customer account to start booking luxury buses'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-sky-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2 mb-8">
            <div className="h-16 w-16 rounded-full bg-white shadow-lg border-2 border-accent flex items-center justify-center overflow-hidden">
              <img 
                src={logo} 
                alt="easyLuxury" 
                className="w-full h-full object-cover" 
                style={{ imageRendering: '-webkit-optimize-contrast' }}
              />
            </div>
            <span className="text-2xl font-bold text-black40">easyLuxury</span>
          </Link>
          
          <h2 className="text-3xl font-bold text-gray-900">
            Create {userType === 'customer' ? 'Customer' : userType.charAt(0).toUpperCase() + userType.slice(1)} Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {getRoleDescription()}
          </p>
        </div>

        {/* Registration Form */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl p-8 space-y-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-red-400">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-green-400">✓</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-gray-900"
              placeholder="Enter your full name"
            />
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-gray-900"
              placeholder="Enter your email address"
            />
          </div>

          {/* Phone Field */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-gray-900"
              placeholder="Enter your phone number"
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth
            </label>
            <input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-gray-900"
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-gray-900"
              placeholder="Create a password (min. 6 characters)"
            />
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-gray-900"
              placeholder="Confirm your password"
            />
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
              I agree to the{' '}
              <a href="#" className="text-accent hover:text-accent">
                Terms and Conditions
              </a>{' '}
              and{' '}
              <a href="#" className="text-accent hover:text-accent">
                Privacy Policy
              </a>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-gray-900 py-3 rounded-lg font-semibold hover:bg-gradient-to-r hover:from-accent hover:to-accent-dark hover:shadow-xl hover:scale-105 transition-all duration-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <LoadingSpinner size="sm" variant="primary" />}
            Create {userType === 'customer' ? 'Customer' : userType.charAt(0).toUpperCase() + userType.slice(1)} Account
          </button>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-accent hover:text-accent"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </motion.form>

        {/* Role Information */}
        {userType !== 'customer' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-accent/10 rounded-xl shadow-lg p-6 border border-accent"
          >
            <h4 className="font-bold text-black40 mb-2">Important Notice</h4>
            <p className="text-sm text-black40">
              {userType === 'admin' 
                ? 'Admin accounts require approval from system administrators. Your account will be activated after verification.'
                : 'Staff accounts require verification and assignment by administrators. You will be notified once your account is active.'
              }
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default RegisterPage