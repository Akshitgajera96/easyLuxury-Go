/**
 * Admin dashboard page with overview and key metrics
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  RefreshCw, Calendar, DollarSign, Users, Bus, 
  TrendingUp, IndianRupee, BarChart3, MapPin, 
  FileText, Route, AlertCircle, Sparkles, CheckCircle, 
  ClipboardList 
} from 'lucide-react'
import AdminNav from '../../components/admin/AdminNav'
import AnalyticsCard from '../../components/admin/AnalyticsCard'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import adminService from '../../services/adminService'
import { toast } from 'react-hot-toast'

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch real dashboard data from API
    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        const response = await adminService.getDashboardAnalytics()
        
        if (response.success) {
          const { summary, recentBookings, charts } = response.data
          
          // Calculate today's bookings and revenue
          const today = new Date().toDateString()
          const todayBookings = recentBookings.filter(b => 
            new Date(b.createdAt).toDateString() === today
          ).length
          
          const todayRevenue = recentBookings
            .filter(b => new Date(b.createdAt).toDateString() === today)
            .reduce((sum, b) => sum + (b.totalAmount || 0), 0)
          
          // Calculate growth rates (placeholder - can be enhanced with historical data)
          const bookingGrowth = 15.2
          const revenueGrowth = 22.5
          const userGrowth = 8.7
          
          // Calculate occupancy rate from booking status distribution
          const confirmedBookings = charts.bookingStatusDistribution.find(
            s => s._id === 'confirmed'
          )?.count || 0
          const totalBookingsCount = charts.bookingStatusDistribution.reduce(
            (sum, s) => sum + s.count, 0
          )
          const occupancyRate = totalBookingsCount > 0 
            ? Math.round((confirmedBookings / totalBookingsCount) * 100) 
            : 0
          
          // Transform recent bookings for display
          const transformedBookings = recentBookings.slice(0, 5).map(booking => ({
            id: booking.bookingId || booking._id,
            user: booking.user?.name || 'N/A',
            route: booking.trip?.route 
              ? `${booking.trip.route.sourceCity} → ${booking.trip.route.destinationCity}`
              : 'N/A',
            amount: booking.totalAmount || 0,
            status: booking.bookingStatus || 'pending'
          }))
          
          setDashboardData({
            totalBookings: summary.totalBookings || 0,
            totalRevenue: summary.totalRevenue || 0,
            activeUsers: summary.totalUsers || 0,
            availableBuses: summary.totalBuses || 0,
            todayBookings,
            todayRevenue,
            pendingReviews: summary.pendingRentalInquiries || 0,
            occupancyRate,
            bookingGrowth,
            revenueGrowth,
            userGrowth,
            recentBookings: transformedBookings,
            totalTrips: summary.totalTrips || 0,
            totalRoutes: summary.totalRoutes || 0,
            charts
          })
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        toast.error('Failed to load dashboard data')
        
        // Set empty data to prevent crashes
        setDashboardData({
          totalBookings: 0,
          totalRevenue: 0,
          activeUsers: 0,
          availableBuses: 0,
          todayBookings: 0,
          todayRevenue: 0,
          pendingReviews: 0,
          occupancyRate: 0,
          bookingGrowth: 0,
          revenueGrowth: 0,
          userGrowth: 0,
          recentBookings: [],
          totalTrips: 0,
          totalRoutes: 0
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" variant="primary" />
      </div>
    )
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Overview of your bus booking platform</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-gray-900 rounded-lg font-semibold hover:bg-gradient-to-r hover:from-accent hover:to-accent-dark hover:shadow-xl hover:scale-105 transition-all duration-300 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Quick Navigation */}
      <AdminNav />

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard
          title="Total Bookings"
          value={dashboardData.totalBookings}
          change={dashboardData.bookingGrowth}
          changeType="positive"
          icon={<Calendar className="w-6 h-6 text-accent" />}
          description="All-time bookings"
        />
        
        <AnalyticsCard
          title="Total Revenue"
          value={`₹${dashboardData.totalRevenue >= 100000 
            ? (dashboardData.totalRevenue / 100000).toFixed(1) + 'L' 
            : dashboardData.totalRevenue.toLocaleString()}`}
          change={dashboardData.revenueGrowth}
          changeType="positive"
          icon={<DollarSign className="w-6 h-6 text-green-600" />}
          description="All-time revenue"
        />
        
        <AnalyticsCard
          title="Active Users"
          value={dashboardData.activeUsers}
          change={dashboardData.userGrowth}
          changeType="positive"
          icon={<Users className="w-6 h-6 text-blue-600" />}
          description="Registered users"
        />
        
        <AnalyticsCard
          title="Available Buses"
          value={dashboardData.availableBuses}
          change={-2.1}
          changeType="negative"
          icon={<Bus className="w-6 h-6 text-sky-600" />}
          description="Active in fleet"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnalyticsCard
          title="Today's Bookings"
          value={dashboardData.todayBookings}
          change={8.3}
          changeType="positive"
          icon={<BarChart3 className="w-6 h-6 text-accent" />}
          description="Bookings today"
          loading={loading}
        />
        
        <AnalyticsCard
          title="Today's Revenue"
          value={`₹${dashboardData.todayRevenue.toLocaleString()}`}
          change={12.7}
          changeType="positive"
          icon={<IndianRupee className="w-6 h-6 text-green-600" />}
          description="Revenue today"
          loading={loading}
        />
        
        <AnalyticsCard
          title="Occupancy Rate"
          value={`${dashboardData.occupancyRate}%`}
          change={5.2}
          changeType="positive"
          icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
          description="Average bus occupancy"
          loading={loading}
        />
      </div>

      {/* Recent Bookings & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
            <a href="/admin/bookings" className="text-accent hover:text-accent text-sm font-medium">
              View All
            </a>
          </div>
          
          <div className="space-y-4">
            {dashboardData.recentBookings.length > 0 ? (
              dashboardData.recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{booking.id}</p>
                    <p className="text-sm text-gray-600">{booking.user}</p>
                    <p className="text-sm text-gray-500">{booking.route}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₹{booking.amount.toLocaleString()}</p>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      booking.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800'
                        : booking.status === 'pending'
                        ? 'bg-accent/20 text-black40'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ClipboardList className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No recent bookings found</p>
                <p className="text-sm">Bookings will appear here once customers start booking</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Stats</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-accent/10 rounded-lg">
              <div className="flex items-center space-x-3">
                <MapPin className="w-6 h-6 text-accent" />
                <div>
                  <p className="font-semibold text-gray-900">Total Trips</p>
                  <p className="text-sm text-gray-600">All trips scheduled</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-black40">{dashboardData.totalTrips}</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-gray-900">Pending Inquiries</p>
                  <p className="text-sm text-gray-600">Rental requests</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-green-600">{dashboardData.pendingReviews}</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-sky-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Route className="w-6 h-6 text-sky-600" />
                <div>
                  <p className="font-semibold text-gray-900">Active Routes</p>
                  <p className="text-sm text-gray-600">Available routes</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-sky-600">{dashboardData.totalRoutes}</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-accent/10 rounded-lg">
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-6 h-6 text-accent" />
                <div>
                  <p className="font-semibold text-gray-900">Occupancy Rate</p>
                  <p className="text-sm text-gray-600">Average booking rate</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-black40">{dashboardData.occupancyRate}%</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* System Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Alerts</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-accent/10 border border-accent rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-accent" />
              <div>
                <p className="font-medium text-black40">Low Seat Availability</p>
                <p className="text-sm text-black40">Mumbai → Goa route has only 5 seats left for tomorrow</p>
              </div>
            </div>
            <button className="text-black40 hover:text-black40 text-sm font-medium">
              View
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-accent/10 border border-accent rounded-lg">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-5 h-5 text-black40" />
              <div>
                <p className="font-medium text-black40">New Feature Available</p>
                <p className="text-sm text-black40">Real-time bus tracking is now live</p>
              </div>
            </div>
            <button className="text-black40 hover:text-black40 text-sm font-medium">
              Explore
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium text-green-800">System Update Complete</p>
                <p className="text-sm text-green-700">Latest security patches applied successfully</p>
              </div>
            </div>
            <button className="text-green-600 hover:text-green-700 text-sm font-medium">
              Details
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default DashboardPage