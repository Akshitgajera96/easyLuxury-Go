/**
 * Staff Login Page
 * Allows approved staff to login to the system
 */

import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const StaffLoginPage = () => {
  const navigate = useNavigate()
  const { staffLogin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
    setStatusMessage(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      setError('Please enter both email and password')
      return
    }

    try {
      setLoading(true)
      const result = await staffLogin(formData.email, formData.password)

      if (result.success) {
        // Check if staff data is present (login successful)
        if (result.data?.staff) {
          // Staff is approved and logged in successfully
          navigate('/staff/dashboard')
        } else {
          // This shouldn't happen with the new flow but handle it
          navigate('/staff/dashboard')
        }
      } else {
        // Login failed - show error
        setError(result.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      
      // Handle specific error responses
      const response = error.response?.data
      
      if (response?.status === 'pending') {
        setStatusMessage({
          type: 'pending',
          message: response.message || 'Your account is pending admin approval.'
        })
      } else if (response?.status === 'rejected') {
        setStatusMessage({
          type: 'rejected',
          message: response.message || 'Your registration was rejected by the admin.'
        })
      } else if (response?.status === 'cancelled') {
        setStatusMessage({
          type: 'cancelled',
          message: response.message || 'Your account has been cancelled.'
        })
      } else {
        setError(response?.message || error.message || 'Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-black40 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-white">Staff</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Staff Login
          </h2>
          <p className="text-gray-600">
            Access your staff dashboard
          </p>
        </div>

        {/* Status Messages */}
        {statusMessage && (
          <div className={`mb-6 p-4 rounded-lg border ${
            statusMessage.type === 'pending' 
              ? 'bg-accent/10 border-accent' 
              : statusMessage.type === 'rejected'
              ? 'bg-red-50 border-red-200'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-3 mt-0.5">
                <span className={`inline-block w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                  statusMessage.type === 'pending' 
                    ? 'bg-accent text-gray-900' 
                    : statusMessage.type === 'rejected'
                    ? 'bg-gradient-to-r from-error-light to-error shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-white'
                    : 'bg-gray-500 text-white'
                }`}>
                  {statusMessage.type === 'pending' ? '!' : 'X'}
                </span>
              </div>
              <div>
                <p className={`text-sm font-medium ${
                  statusMessage.type === 'pending' 
                    ? 'text-gray-800' 
                    : statusMessage.type === 'rejected'
                    ? 'text-red-800'
                    : 'text-gray-800'
                }`}>
                  {statusMessage.message}
                </p>
                {statusMessage.type === 'pending' && (
                  <p className="text-xs text-gray-700 mt-1">
                    You will be notified via email once your account is approved.
                  </p>
                )}
                {statusMessage.type === 'rejected' && (
                  <p className="text-xs text-red-700 mt-1">
                    Please contact the administrator for more information.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
            <span className="inline-block w-5 h-5 bg-gradient-to-r from-error-light to-error shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-white rounded-full text-xs font-bold flex-shrink-0 mr-2 mt-0.5 flex items-center justify-center">!</span>
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black40 focus:border-transparent text-gray-900"
              placeholder="your.email@company.com"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black40 focus:border-transparent text-gray-900"
                placeholder="••••••••"
                required
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black40 text-gray-100 px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        {/* Links */}
        <div className="mt-6 space-y-3">
          <p className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/staff/register" className="text-black40 hover:text-accent font-semibold">
              Register here
            </Link>
          </p>
          
          <div className="border-t border-gray-200 pt-4">
            <p className="text-center text-sm text-gray-500">
              For customers:{' '}
              <Link to="/login" className="text-black40 hover:text-accent">
                Customer Login
              </Link>
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start">
            <span className="inline-block w-5 h-5 bg-gradient-to-r from-accent to-accent-dark text-white rounded shadow-lg hover:shadow-xl-accent hover:scale-105 transition-all duration-300-full text-xs font-bold flex-shrink-0 mr-2 mt-0.5 flex items-center justify-center">i</span>
            <div className="text-sm text-gray-800">
              <p className="font-medium mb-1">New staff members:</p>
              <p className="text-xs text-gray-700">
                After registration, your account requires admin approval before you can login.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffLoginPage
