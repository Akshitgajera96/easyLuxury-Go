// FILE: frontend/src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react'
import { authService } from '../services/authService'
import { createAuthChannel } from '../auth/authChannel'

const AuthContext = createContext()

// 🔐 Initialize cross-tab communication channel
const authChannel = createAuthChannel()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // 🔐 SECURE TOKEN HANDLING - Get token based on role from sessionStorage
  const getTokenByRole = (role) => {
    switch (role) {
      case 'admin':
        return sessionStorage.getItem('adminToken')
      case 'staff':
        return sessionStorage.getItem('staffToken')
      case 'customer':
      case 'user':
      default:
        return sessionStorage.getItem('userToken')
    }
  }

  // 🔐 SECURE TOKEN HANDLING - Get stored token from any role from sessionStorage
  const getStoredToken = () => {
    return sessionStorage.getItem('adminToken') || 
           sessionStorage.getItem('staffToken') || 
           sessionStorage.getItem('userToken')
  }

  // 🔐 SECURE TOKEN HANDLING - Save token based on role to sessionStorage (tab-scoped)
  const saveTokenByRole = (role, token, userData) => {
    // Save role-specific token WITHOUT clearing others (allow concurrent sessions per tab)
    switch (role) {
      case 'admin':
        sessionStorage.setItem('adminToken', token)
        sessionStorage.setItem('adminUser', JSON.stringify(userData))
        break
      case 'staff':
        sessionStorage.setItem('staffToken', token)
        sessionStorage.setItem('staffUser', JSON.stringify(userData))
        break
      case 'customer':
      case 'user':
      default:
        sessionStorage.setItem('userToken', token)
        sessionStorage.setItem('customerUser', JSON.stringify(userData))
        break
    }
    
    // Save current user data (for active session)
    sessionStorage.setItem('user', JSON.stringify(userData))
    sessionStorage.setItem('activeRole', role)
  }

  // 🔐 TAB-AWARE SESSION - Initialize auth from sessionStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = getStoredToken()
      const storedUser = sessionStorage.getItem('user')

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          setToken(storedToken)
          setUser(parsedUser)
        } catch (error) {
          console.error('Token validation failed:', error)
          logout()
        }
      }
      setLoading(false)
    }

    initializeAuth()
  }, [])

  // 🔐 CROSS-TAB LOGOUT - Listen for logout events from other tabs
  useEffect(() => {
    const unsubscribe = authChannel.subscribe((message) => {
      if (message?.type === 'logout') {
        // Clear session storage
        sessionStorage.removeItem('adminToken')
        sessionStorage.removeItem('staffToken')
        sessionStorage.removeItem('userToken')
        sessionStorage.removeItem('user')
        sessionStorage.removeItem('activeRole')
        sessionStorage.removeItem('adminUser')
        sessionStorage.removeItem('staffUser')
        sessionStorage.removeItem('customerUser')
        // Update state
        setUser(null)
        setToken(null)
        // Redirect handled by route protection
      }
    })

    return () => unsubscribe()
  }, [])

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password)
      // apiClient interceptor returns response.data, so response = { success, data: { user, token }, message }
      const { user: userData, token: authToken } = response.data

      if (!userData || !authToken) {
        throw new Error('Invalid response structure')
      }

      const userRole = userData.role || 'customer'

      setUser(userData)
      setToken(authToken)
      
      // Save with role-specific key
      saveTokenByRole(userRole, authToken, userData)

      return { success: true, data: { user: userData, token: authToken } }
    } catch (error) {
      console.error('AuthContext - Login error:', error)
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Login failed' 
      }
    }
  }

  const adminLogin = async (email, password) => {
    try {
      const response = await authService.adminLogin(email, password)
      // apiClient interceptor returns response.data, so response = { success, data: { admin, token }, message }
      const { admin: adminData, token: authToken } = response.data

      if (!adminData || !authToken) {
        console.error('Invalid admin response structure:', response)
        throw new Error('Invalid response structure')
      }

      setUser(adminData)
      setToken(authToken)
      
      // Save with admin-specific key
      saveTokenByRole('admin', authToken, adminData)

      return { success: true, data: { admin: adminData, token: authToken } }
    } catch (error) {
      console.error('AuthContext - Admin login error:', error)
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Admin login failed' 
      }
    }
  }

  const staffLogin = async (email, password) => {
    try {
      const response = await authService.staffLogin(email, password)
      
      const { staff: staffData, token: authToken } = response.data

      if (!staffData || !authToken) {
        throw new Error('Invalid response structure')
      }

      setUser(staffData)
      setToken(authToken)
      
      // Save with staff-specific key
      saveTokenByRole('staff', authToken, staffData)

      return { success: true, data: { staff: staffData, token: authToken } }
    } catch (error) {
      console.error('❌ AuthContext - Staff login error:', error.response?.data || error.message)
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Staff login failed',
        status: error.response?.data?.status // Pass through status for pending/rejected/cancelled
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await authService.register(userData)
      // Backend returns: { success: true, data: { user, token }, message }
      // apiClient returns response.data, so we get the full structure
      const { user: newUser, token: authToken } = response.data

      const userRole = newUser.role || 'customer'

      setUser(newUser)
      setToken(authToken)
      
      // Save with role-specific key
      saveTokenByRole(userRole, authToken, newUser)

      return { success: true, data: response.data }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      }
    }
  }

  const logout = async () => {
    try {
      // Call logout endpoint to invalidate token on server (if needed)
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // 🔐 CROSS-TAB LOGOUT - Broadcast logout to all tabs
      authChannel.post({ type: 'logout' })
      
      // Clear local state and storage - remove ALL role tokens from sessionStorage
      setUser(null)
      setToken(null)
      sessionStorage.removeItem('adminToken')
      sessionStorage.removeItem('staffToken')
      sessionStorage.removeItem('userToken')
      sessionStorage.removeItem('user')
      sessionStorage.removeItem('activeRole')
      sessionStorage.removeItem('adminUser')
      sessionStorage.removeItem('staffUser')
      sessionStorage.removeItem('customerUser')
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData)
      const updatedUser = response.user
      setUser(updatedUser)
      
      // 🔐 SECURE TOKEN HANDLING - Update user data in sessionStorage
      sessionStorage.setItem('user', JSON.stringify(updatedUser))
      
      return { success: true, data: response }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Profile update failed' 
      }
    }
  }

  const value = {
    user,
    token,
    loading,
    login,
    adminLogin,
    staffLogin,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
    isStaff: user?.role === 'staff',
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}