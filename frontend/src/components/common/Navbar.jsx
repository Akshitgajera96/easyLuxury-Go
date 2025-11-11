/**
 * Main navigation bar component with responsive design
 * Handles user authentication state and navigation
 */

import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from './LoadingSpinner'
import logo from '../../assets/images/logo.jpg'

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { user, isAuthenticated, logout, loading } = useAuth()
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    setIsMobileMenuOpen(false)
  }

  const getNavItems = () => {
    const baseItems = [
      { path: '/', label: 'Home' },
      { path: '/trips', label: 'Find Trips' },
    ]
    
    if (isAuthenticated) {
      if (user?.role === 'admin') {
        return [
          ...baseItems,
          { path: '/admin/dashboard', label: 'Dashboard' },
          { path: '/admin/buses', label: 'Buses' },
          { path: '/admin/trips', label: 'Manage Trips' },
        ]
      } else if (user?.role === 'staff') {
        return [
          ...baseItems,
          { path: '/staff/dashboard', label: 'Dashboard' },
        ]
      } else {
        return [
          ...baseItems,
          { path: '/my-bookings', label: 'My Bookings' },
          { path: '/wallet', label: 'Wallet' },
        ]
      }
    }
    
    return baseItems
  }
  
  const navItems = getNavItems()

  const isActivePath = (path) => {
    return location.pathname === path
  }

  if (loading) {
    return (
      <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-lg bg-white/70 border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <LoadingSpinner size="sm" variant="white" />
          </div>
        </div>
      </nav>
    )
  }

  return (
    <>
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-in-out ${
        isScrolled 
          ? 'bg-transparent backdrop-blur-lg' 
          : 'backdrop-blur-lg bg-white/70 border-b border-gray-200/50 shadow-md'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="h-12 w-12 rounded-full bg-white shadow-md flex items-center justify-center overflow-hidden group-hover:shadow-lg transition-all duration-300">
                <img 
                  src={logo} 
                  alt="easyLuxury" 
                  className="w-full h-full object-cover" 
                  style={{ imageRendering: '-webkit-optimize-contrast' }}
                />
              </div>
              <span className="text-xl font-bold text-[#90D7FF] transition-colors duration-300">easyLuxury</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActivePath(item.path)
                      ? 'bg-[#90D7FF] text-white shadow-md'
                      : 'text-[#90D7FF] hover:text-[#B1E5FF] hover:bg-[#90D7FF]/10'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* User Menu - Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <span className="text-sm font-medium text-[#90D7FF] transition-colors duration-300">
                    Welcome, {user?.name}
                  </span>
                  <Link
                    to={
                      user?.role === 'admin' 
                        ? '/admin/dashboard' 
                        : user?.role === 'staff'
                        ? '/staff/dashboard'
                        : '/profile'
                    }
                    className="px-4 py-2 text-sm rounded-lg font-medium border-2 border-[#90D7FF] text-[#90D7FF] hover:bg-[#90D7FF] hover:text-white transition-all duration-300"
                  >
                    {user?.role === 'admin' ? 'Dashboard' : user?.role === 'staff' ? 'Dashboard' : 'My Account'}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-all duration-300"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex space-x-3">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm rounded-lg border-2 border-[#90D7FF] text-[#90D7FF] hover:bg-[#90D7FF] hover:text-white font-medium transition-all duration-300"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm bg-[#90D7FF] text-white rounded-lg font-medium hover:bg-[#B1E5FF] transition-all duration-300"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90D7FF] text-[#90D7FF] hover:bg-[#90D7FF]/10 transition-all duration-300"
                aria-label="Toggle menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Navigation Sidebar */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: isMobileMenuOpen ? 0 : '100%' }}
        transition={{ type: 'tween', duration: 0.3 }}
        className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 md:hidden overflow-y-auto"
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-full bg-white shadow-md flex items-center justify-center overflow-hidden">
                <img 
                  src={logo} 
                  alt="easyLuxury" 
                  className="w-full h-full object-cover" 
                  style={{ imageRendering: '-webkit-optimize-contrast' }}
                />
              </div>
              <span className="text-lg font-bold text-[#90D7FF]">easyLuxury</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              aria-label="Close menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Info Section */}
          {isAuthenticated && (
            <div className="p-4 bg-[#90D7FF]/5 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-[#90D7FF] rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-600">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-[#90D7FF] text-white rounded-full font-semibold">
                    {user?.role?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                  isActivePath(item.path)
                    ? 'bg-[#90D7FF] text-white shadow-md'
                    : 'text-gray-700 hover:bg-[#90D7FF]/10 hover:text-[#90D7FF]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="p-4 border-t border-gray-200 space-y-2">
            {isAuthenticated ? (
              <>
                <Link
                  to={
                    user?.role === 'admin' 
                      ? '/admin/dashboard' 
                      : user?.role === 'staff'
                      ? '/staff/dashboard'
                      : '/profile'
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full px-4 py-3 rounded-lg text-center font-semibold border-2 border-[#90D7FF] text-[#90D7FF] hover:bg-[#90D7FF] hover:text-white transition-all duration-300"
                >
                  {user?.role === 'admin' ? 'Dashboard' : user?.role === 'staff' ? 'Dashboard' : 'My Account'}
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full px-4 py-3 rounded-lg text-center font-semibold bg-red-500 text-white hover:bg-red-600 transition-all duration-300"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full px-4 py-3 rounded-lg text-center font-semibold border-2 border-[#90D7FF] text-[#90D7FF] hover:bg-[#90D7FF] hover:text-white transition-all duration-300"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full px-4 py-3 rounded-lg text-center font-semibold bg-[#90D7FF] text-white hover:bg-[#B1E5FF] transition-all duration-300"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </>
  )
}

export default Navbar