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

        {/* Mobile Navigation */}
        <motion.div
          initial={false}
          animate={isMobileMenuOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
          className="md:hidden overflow-hidden"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 backdrop-blur-lg bg-white/80 rounded-lg mt-2 border border-gray-200/50 shadow-lg">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-lg text-base font-medium transition-all duration-300 ${
                  isActivePath(item.path)
                    ? 'bg-[#90D7FF] text-white shadow-md'
                    : 'text-[#90D7FF] hover:bg-[#90D7FF]/10 hover:text-[#B1E5FF]'
                }`}
              >
                {item.label}
              </Link>
            ))}
            
            {isAuthenticated ? (
              <div className="pt-2 border-t border-gray-200 space-y-2">
                <div className="px-4 py-2 text-sm font-medium text-[#90D7FF] bg-[#90D7FF]/5 rounded-lg">
                  Welcome, {user?.name}
                </div>
                <Link
                  to={
                    user?.role === 'admin' 
                      ? '/admin/dashboard' 
                      : user?.role === 'staff'
                      ? '/staff/dashboard'
                      : '/profile'
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-2 rounded-lg text-base font-medium border-2 border-[#90D7FF] text-[#90D7FF] hover:bg-[#90D7FF] hover:text-white transition-all duration-300"
                >
                  {user?.role === 'admin' ? 'Dashboard' : user?.role === 'staff' ? 'Dashboard' : 'My Account'}
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 rounded-lg text-base font-medium bg-red-500 text-white hover:bg-red-600 transition-all duration-300"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-gray-200 space-y-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-2 rounded-lg text-base font-medium border-2 border-[#90D7FF] text-[#90D7FF] hover:bg-[#90D7FF] hover:text-white transition-all duration-300"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-2 rounded-lg text-base font-medium bg-[#90D7FF] text-white hover:bg-[#B1E5FF] transition-all duration-300"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </nav>
  )
}

export default Navbar