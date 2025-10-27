/**
 * Login page component with authentication form and user type selection
 */

import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/common/LoadingSpinner'
import logo from '../assets/images/logo.jpg'

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('customer') // 'customer', 'admin', 'staff'
  const [showPassword, setShowPassword] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Signing in...')
  const [isSlowConnection, setIsSlowConnection] = useState(false)

  const { login, adminLogin, staffLogin, user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  // Redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated && user) {
      switch (user.role) {
        case 'admin':
          navigate('/admin/dashboard', { replace: true })
          break
        case 'staff':
          navigate('/staff/dashboard', { replace: true })
          break
        default:
          navigate('/profile', { replace: true })
      }
    }
  }, [isAuthenticated, user, navigate])

  const userTypes = {
    customer: {
      title: 'Customer Login',
      description: 'Book buses and manage your travel'
    },
    admin: {
      title: 'Admin Login', 
      description: 'Manage buses, routes, and operations'
    },
    staff: {
      title: 'Staff Login',
      description: 'Driver and conductor access',
      note: 'Staff accounts must be created and approved by admin first'
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
  }

  const handleUserTypeClick = (type) => {
    setActiveTab(type)
    // Clear form when switching tabs
    setFormData({
      email: '',
      password: ''
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setLoadingMessage('Signing in...')
    setIsSlowConnection(false)

    // Detect slow connection/cold start after 3 seconds
    const slowConnectionTimer = setTimeout(() => {
      setIsSlowConnection(true)
      setLoadingMessage('Server is waking up, please wait...')
    }, 3000)

    // Show extended message after 8 seconds
    const extendedTimer = setTimeout(() => {
      if (loading) {
        setLoadingMessage('Almost there, server is starting up...')
      }
    }, 8000)

    try {
      // Call appropriate login method based on user type
      let result
      switch (activeTab) {
        case 'admin':
          result = await adminLogin(formData.email, formData.password)
          break
        case 'staff':
          result = await staffLogin(formData.email, formData.password)
          break
        case 'customer':
        default:
          result = await login(formData.email, formData.password)
          break
      }
      
      if (result.success) {
        // Get user data from result - handle different response structures
        const userData = result.data.user || result.data.admin || result.data.staff
        const userRole = userData?.role
        
        if (!userRole) {
          setError('Invalid login response. Please try again.')
          return
        }
        
        // Redirect to role-specific page
        let redirectPath = '/'
        
        switch (userRole) {
          case 'admin':
            redirectPath = '/admin/dashboard'
            break
          case 'staff':
            redirectPath = '/staff/dashboard'
            break
          case 'customer':
          case 'user':
          default:
            // If coming from a protected route, go there, otherwise go to profile
            redirectPath = from !== '/' ? from : '/profile'
        }
        
        // Use navigate with slight delay to ensure state is fully updated
        setTimeout(() => {
          navigate(redirectPath, { replace: true })
        }, 100)
      } else {
        // Handle special error statuses for staff
        if (result.status === 'pending') {
          setError('Your account is pending admin approval. You will be notified once approved.')
        } else if (result.status === 'rejected') {
          setError('Your registration was rejected. Please contact the administrator.')
        } else if (result.status === 'cancelled') {
          setError('Your account has been cancelled. Please contact the administrator.')
        } else {
          setError(result.error || 'Login failed. Please try again.')
        }
      }
    } catch (err) {
      console.error('Login error:', err)
      
      // Enhanced error messages for common issues
      let errorMessage = 'An unexpected error occurred. Please try again.'
      
      if (err.isTimeout || err.code === 'ECONNABORTED') {
        errorMessage = 'Server took too long to respond. The server may be starting up from sleep mode. Please try again in a moment.'
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to server. Please check your internet connection or try again in a moment.'
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      clearTimeout(slowConnectionTimer)
      clearTimeout(extendedTimer)
      setLoading(false)
      setIsSlowConnection(false)
      setLoadingMessage('Signing in...')
    }
  }

  const currentUserType = userTypes[activeTab]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
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
          
          <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account to continue
          </p>
        </div>

        {/* User Type Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-2 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex space-x-1">
            {Object.entries(userTypes).map(([key, config]) => (
              <button
                key={key}
                onClick={() => handleUserTypeClick(key)}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                  activeTab === key
                    ? 'bg-accent text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {config.title.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Login Form */}
        <motion.form
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl p-8 space-y-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          {/* Form Header */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900">
              {currentUserType.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {currentUserType.description}
            </p>
          </div>

          {/* Loading State with Cold Start Detection */}
          {loading && isSlowConnection && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800 font-medium">{loadingMessage}</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    First login may take 15-30 seconds as the server wakes up.
                  </p>
                </div>
              </div>
            </div>
          )}

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
              placeholder="Enter your email"
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-gray-900"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Staff Note */}
          {activeTab === 'staff' && currentUserType.note && (
            <div className="bg-accent/10 rounded-lg p-3 border border-accent">
              <div className="flex items-start gap-2">
                <span className="text-accent text-sm mt-0.5">ℹ️</span>
                <p className="text-xs text-gray-700">{currentUserType.note}</p>
              </div>
            </div>
          )}

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-accent hover:opacity-80">
                Forgot password?
              </a>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-gray-900 py-3 rounded-lg font-semibold hover:bg-gradient-to-r hover:from-accent hover:to-accent-dark hover:shadow-xl hover:scale-105 transition-all duration-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {loading && <LoadingSpinner size="sm" variant="primary" />}
            {loading ? loadingMessage : `Sign In as ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                {activeTab === 'customer' ? 'New to easyLuxury?' : 'Need an account?'}
              </span>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <Link
              to={activeTab === 'staff' ? '/staff/register' : '/register'}
              state={{ userType: activeTab }}
              className="w-full bg-black40 text-gray-100 py-3 rounded-lg font-semibold hover:opacity-90 transition-colors inline-block"
            >
              {activeTab === 'customer' ? 'Create Customer Account' : 
               activeTab === 'staff' ? 'Register as Staff' : 
               'Request Access'}
            </Link>
          </div>
        </motion.form>

        {/* User Type Information */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <h4 className="font-bold text-gray-900 mb-4 text-center">User Types</h4>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 text-sm">👤</span>
              </div>
              <div>
                <h5 className="font-semibold text-gray-900">Customer</h5>
                <p className="text-sm text-gray-600">Book buses, manage bookings, write reviews</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-black40 text-sm">👑</span>
              </div>
              <div>
                <h5 className="font-semibold text-gray-900">Admin</h5>
                <p className="text-sm text-gray-600">Manage buses, routes, trips, and users</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sky-600 text-sm">👨‍💼</span>
              </div>
              <div>
                <h5 className="font-semibold text-gray-900">Staff</h5>
                <p className="text-sm text-gray-600">Drivers and conductors manage trips</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default LoginPage