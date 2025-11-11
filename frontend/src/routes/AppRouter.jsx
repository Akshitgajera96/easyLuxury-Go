/**
 * Main application router with role-based routing
 * Directs users to appropriate pages based on their role
 */

import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// Public Pages
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import TripPage from '../pages/TripPage'
import ViewTicketPage from '../pages/ViewTicketPage'
import NotFoundPage from '../pages/NotFoundPage'

// Customer Pages
import ProfilePage from '../pages/ProfilePage'
import WalletPage from '../pages/WalletPage'
import BookingPage from '../pages/BookingPage'
import BookingConfirmationPage from '../pages/BookingConfirmationPage'
import MyBookingsPage from '../pages/user/MyBookingsPage'
import TrackBusPage from '../pages/user/TrackBusPage'
import ReviewsPage from '../pages/user/ReviewsPage'

// Admin Pages
import DashboardPage from '../pages/admin/DashboardPage'
import ManageBusesPage from '../pages/admin/ManageBusesPage'
import ManageRoutesPage from '../pages/admin/ManageRoutesPage'
import ManageTripsPage from '../pages/admin/ManageTripsPage'
import ManageBookingsPage from '../pages/admin/ManageBookingsPage'
import ManageUsersPage from '../pages/admin/ManageUsersPage'
import AnalyticsPage from '../pages/admin/AnalyticsPage'
import LiveTrackingPage from '../pages/admin/LiveTrackingPage'
import BusLocationMonitorPage from '../pages/admin/BusLocationMonitorPage'

// Staff Pages
import StaffDashboardPage from '../pages/staff/StaffDashboardPage'
import StaffLoginPending from '../pages/staff/StaffLoginPending'
import StaffPendingPage from '../pages/staff/StaffPendingPage'
import StaffLoginPage from '../pages/staff/StaffLoginPage'
import StaffRegisterPage from '../pages/staff/StaffRegisterPage'
import MyTripsPage from '../pages/staff/MyTripsPage'
import PassengersPage from '../pages/staff/PassengersPage'
import TripUpdatesPage from '../pages/staff/TripUpdatesPage'
import LocationUpdatePage from '../pages/staff/LocationUpdatePage'
import ManageStaffPage from '../pages/admin/ManageStaffPage'

// Layouts
import AdminLayout from '../components/layout/AdminLayout'
import StaffLayout from '../components/layout/StaffLayout'

// Route Components
import PrivateRoute from './PrivateRoute'
import AdminRoute from './AdminRoute'
import StaffRoute from './StaffRoute'

const AppRouter = () => {
  const { user, isAuthenticated } = useAuth()

  // Redirect authenticated users to their role-specific home
  const getDefaultRoute = () => {
    if (!isAuthenticated) return '/'
    
    switch (user?.role) {
      case 'admin':
        return '/admin/dashboard'
      case 'staff':
        return '/staff/dashboard'
      default:
        return '/profile'
    }
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/trips" element={<TripPage />} />
      <Route path="/view-ticket" element={<ViewTicketPage />} />
      
      {/* Staff Public Routes */}
      <Route path="/staff/login" element={<StaffLoginPage />} />
      <Route path="/staff/register" element={<StaffRegisterPage />} />
      <Route path="/staff/pending" element={<StaffPendingPage />} />
      <Route path="/staff/login-pending" element={<StaffLoginPending />} />
      
      {/* Customer Routes */}
      <Route 
        path="/profile" 
        element={
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/wallet" 
        element={
          <PrivateRoute>
            <WalletPage />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/booking" 
        element={
          <PrivateRoute>
            <BookingPage />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/booking-confirmation" 
        element={
          <PrivateRoute>
            <BookingConfirmationPage />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/my-bookings" 
        element={
          <PrivateRoute>
            <MyBookingsPage />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/reviews" 
        element={
          <PrivateRoute>
            <ReviewsPage />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/track-bus/:tripId" 
        element={
          <PrivateRoute>
            <TrackBusPage />
          </PrivateRoute>
        } 
      />

      {/* Admin Routes - Only accessible by admin users */}
      <Route 
        path="/admin/dashboard" 
        element={
          <AdminRoute>
            <AdminLayout>
              <DashboardPage />
            </AdminLayout>
          </AdminRoute>
        } 
      />
      <Route 
        path="/admin/buses" 
        element={
          <AdminRoute>
            <AdminLayout>
              <ManageBusesPage />
            </AdminLayout>
          </AdminRoute>
        } 
      />
      <Route 
        path="/admin/routes" 
        element={
          <AdminRoute>
            <AdminLayout>
              <ManageRoutesPage />
            </AdminLayout>
          </AdminRoute>
        } 
      />
      <Route 
        path="/admin/trips" 
        element={
          <AdminRoute>
            <AdminLayout>
              <ManageTripsPage />
            </AdminLayout>
          </AdminRoute>
        } 
      />
      <Route 
        path="/admin/bookings" 
        element={
          <AdminRoute>
            <AdminLayout>
              <ManageBookingsPage />
            </AdminLayout>
          </AdminRoute>
        } 
      />
      <Route 
        path="/admin/users" 
        element={
          <AdminRoute>
            <AdminLayout>
              <ManageUsersPage />
            </AdminLayout>
          </AdminRoute>
        } 
      />
      <Route 
        path="/admin/analytics" 
        element={
          <AdminRoute>
            <AdminLayout>
              <AnalyticsPage />
            </AdminLayout>
          </AdminRoute>
        } 
      />
      <Route 
        path="/admin/staff-pending" 
        element={
          <AdminRoute>
            <AdminLayout>
              <ManageStaffPage />
            </AdminLayout>
          </AdminRoute>
        } 
      />
      <Route 
        path="/admin/live-tracking" 
        element={
          <AdminRoute>
            <AdminLayout>
              <LiveTrackingPage />
            </AdminLayout>
          </AdminRoute>
        } 
      />
      <Route 
        path="/admin/location-monitor" 
        element={
          <AdminRoute>
            <AdminLayout>
              <BusLocationMonitorPage />
            </AdminLayout>
          </AdminRoute>
        } 
      />

      {/* Staff Routes - Only accessible by staff users */}
      <Route 
        path="/staff/dashboard" 
        element={
          <StaffRoute>
            <StaffLayout>
              <StaffDashboardPage />
            </StaffLayout>
          </StaffRoute>
        } 
      />
      <Route 
        path="/staff/my-trips" 
        element={
          <StaffRoute>
            <StaffLayout>
              <MyTripsPage />
            </StaffLayout>
          </StaffRoute>
        } 
      />
      <Route 
        path="/staff/passengers" 
        element={
          <StaffRoute>
            <StaffLayout>
              <PassengersPage />
            </StaffLayout>
          </StaffRoute>
        } 
      />
      <Route 
        path="/staff/updates" 
        element={
          <StaffRoute>
            <StaffLayout>
              <TripUpdatesPage />
            </StaffLayout>
          </StaffRoute>
        } 
      />
      <Route 
        path="/staff/location-update" 
        element={
          <StaffRoute>
            <StaffLayout>
              <LocationUpdatePage />
            </StaffLayout>
          </StaffRoute>
        } 
      />

      {/* Default redirect based on role */}
      <Route path="/dashboard" element={<Navigate to={getDefaultRoute()} replace />} />

      {/* 404 Page */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRouter