/**
 * Custom hook for authentication functionality
 * Provides easy access to auth context with additional utilities
 */

import { useAuth as useAuthContext } from '../context/AuthContext'

export const useAuth = () => {
  const auth = useAuthContext()
  
  // Additional utility functions
  const hasRole = (role) => {
    return auth.user?.role === role
  }

  const hasAnyRole = (roles) => {
    return roles.includes(auth.user?.role)
  }

  const canAccess = (requiredRole) => {
    if (!requiredRole) return true
    return hasRole(requiredRole)
  }

  return {
    ...auth,
    hasRole,
    hasAnyRole,
    canAccess,
  }
}