/**
 * Private route component with role-based access control
 * Redirects users to appropriate pages based on their role
 */

import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/common/LoadingSpinner'

const PrivateRoute = ({ children, requiredRole }) => {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" variant="primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirect to login with return url
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check if user has the required role
  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to role-specific home page
    switch (user?.role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />
      case 'staff':
        return <Navigate to="/staff/dashboard" replace />
      default:
        return <Navigate to="/profile" replace />
    }
  }

  return children
}

export default PrivateRoute