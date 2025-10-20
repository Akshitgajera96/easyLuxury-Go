/**
 * Sidebar layout component for user dashboard and admin panel
 * Provides navigation for authenticated users
 */

import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import logo from '../../assets/images/logo.jpg'

const Sidebar = ({ isOpen = true, onClose }) => {
  const { user, isAdmin } = useAuth()
  const location = useLocation()
  const isStaff = user?.role === 'staff'

  const userMenuItems = [
    { path: '/profile', label: 'My Profile', icon: '👤' },
    { path: '/my-bookings', label: 'My Bookings', icon: '🎫' },
    { path: '/wallet', label: 'Wallet', icon: '💰' },
    { path: '/reviews', label: 'My Reviews', icon: '⭐' },
  ]

  const adminMenuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/buses', label: 'Manage Buses', icon: '🚌' },
    { path: '/admin/routes', label: 'Manage Routes', icon: '🗺️' },
    { path: '/admin/trips', label: 'Manage Trips', icon: '🕒' },
    { path: '/admin/bookings', label: 'Manage Bookings', icon: '📋' },
    { path: '/admin/users', label: 'Manage Users', icon: '👥' },
    { path: '/admin/analytics', label: 'Analytics', icon: '📈' },
  ]

  const staffMenuItems = [
    { path: '/staff/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/staff/my-trips', label: 'My Trips', icon: '🚌' },
    { path: '/staff/passengers', label: 'Passengers', icon: '👥' },
    { path: '/staff/updates', label: 'Trip Updates', icon: '📍' },
    { path: '/trips', label: 'Find Trip', icon: '🔍' },
  ]

  const menuItems = isAdmin ? adminMenuItems : isStaff ? staffMenuItems : userMenuItems

  const isActivePath = (path) => {
    return location.pathname === path
  }

  return (
    <>
      {/* Mobile Overlay - only show on mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - responsive behavior */}
      <div
        className={`fixed lg:sticky top-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-xl transition-transform duration-300 
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 lg:z-30`}
        style={{
          height: '100vh',
          maxHeight: '100vh',
        }}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center overflow-hidden">
                <img 
                  src={logo} 
                  alt="easyLuxury" 
                  className="w-full h-full object-cover" 
                  style={{ imageRendering: '-webkit-optimize-contrast' }}
                />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: '#000000' }}>easyLuxury</h2>
                <p className="text-sm" style={{ color: '#000000' }}>
                  {isAdmin ? 'Admin Panel' : isStaff ? 'Staff Portal' : 'My Account'}
                </p>
              </div>
            </div>
            
            {/* Close button for mobile */}
            <button
              onClick={onClose}
              className="lg:hidden absolute top-4 right-4 p-2 text-gray-600 hover:text-black40"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Info */}
          <div className="flex-shrink-0 p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#000000' }}>{user?.name}</p>
                <p className="text-xs truncate" style={{ color: '#000000' }}>{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-1 text-xs bg-accent-light text-accent-dark rounded-full font-semibold border border-accent">
                  {user?.role?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Menu - Scrollable */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden min-h-0" style={{ scrollbarWidth: 'thin' }}>
            {menuItems.map((item, index) => (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActivePath(item.path)
                      ? 'bg-accent shadow-lg font-semibold'
                      : 'hover:text-accent hover:bg-accent-light'
                  }`}
                  style={{ color: '#000000' }}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Footer - Always at bottom */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200">
            <Link
              to="/"
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold hover:text-accent hover:bg-accent-light transition-colors"
              style={{ color: '#000000', fontWeight: '600' }}
            >
              <span className="text-xl">🏠</span>
              <span style={{ color: '#000000', fontWeight: '600' }}>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar