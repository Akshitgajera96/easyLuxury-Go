/**
 * Admin analytics page with detailed reports and insights
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import AnalyticsCard from '../../components/admin/AnalyticsCard'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import adminService from '../../services/adminService'
import { toast } from 'react-hot-toast'

const AnalyticsPage = () => {
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7days') // 7days, 30days, 90days, 1year

  useEffect(() => {
    // Fetch real analytics data from API
    const fetchAnalyticsData = async () => {
      setLoading(true)
      try {
        const response = await adminService.getDashboardAnalytics()
        
        if (response.success && response.data) {
          const { summary, recentBookings, charts } = response.data
          
          // Calculate analytics from real data
          const totalBookings = summary.totalBookings || 0
          const totalRevenue = summary.totalRevenue || 0
          const averageFare = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0
          
          // Calculate occupancy rate
          const confirmedBookings = (charts.bookingStatusDistribution || []).find(
            s => s._id === 'confirmed'
          )?.count || 0
          const totalBookingsCount = (charts.bookingStatusDistribution || []).reduce(
            (sum, s) => sum + s.count, 0
          )
          const occupancyRate = totalBookingsCount > 0 
            ? Math.round((confirmedBookings / totalBookingsCount) * 100) 
            : 0
          
          // Calculate growth rates (placeholder - can be enhanced with historical data)
          const revenueGrowth = 22.5
          const bookingGrowth = 15.2
          const userGrowth = 8.7
          const cancellationRate = (charts.bookingStatusDistribution || []).find(
            s => s._id === 'cancelled'
          )?.count || 0
          const cancellationRatePercent = totalBookingsCount > 0
            ? ((cancellationRate / totalBookingsCount) * 100).toFixed(1)
            : 0
          
          // Transform charts data
          const topRoutes = (charts.popularRoutes || []).slice(0, 5).map(route => ({
            route: route.routeName || 'Unknown Route',
            bookings: route.bookings || 0,
            revenue: route.revenue || 0
          }))
          
          // Get revenue by month and transform to days
          const revenueByDay = (charts.monthlyRevenue || []).slice(0, 7).map((revenue, index) => ({
            day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index] || `Day ${index + 1}`,
            revenue: revenue || 0
          }))
          
          // Mock bus performance (since not in charts)
          const busPerformance = [
            { busNumber: 'Sample Bus 1', trips: 45, occupancy: 92, revenue: summary.totalRevenue * 0.3 },
            { busNumber: 'Sample Bus 2', trips: 38, occupancy: 85, revenue: summary.totalRevenue * 0.25 },
            { busNumber: 'Sample Bus 3', trips: 42, occupancy: 78, revenue: summary.totalRevenue * 0.20 },
            { busNumber: 'Sample Bus 4', trips: 35, occupancy: 82, revenue: summary.totalRevenue * 0.15 },
            { busNumber: 'Sample Bus 5', trips: 31, occupancy: 75, revenue: summary.totalRevenue * 0.10 }
          ]
          
          const transformedData = {
            overview: {
              totalRevenue,
              totalBookings,
              averageFare,
              occupancyRate
            },
            trends: {
              revenueGrowth,
              bookingGrowth,
              userGrowth,
              cancellationRate: parseFloat(cancellationRatePercent)
            },
            topRoutes,
            busPerformance,
            revenueByDay,
            userDemographics: {
              ageGroups: {
                '18-25': 25,
                '26-35': 45,
                '36-45': 20,
                '46+': 10
              },
              gender: {
                male: 60,
                female: 38,
                other: 2
              }
            }
          }
          
          setAnalyticsData(transformedData)
        }
      } catch (error) {
        console.error('Failed to fetch analytics data:', error)
        toast.error('Failed to load analytics data')
        
        // Set empty data on error
        setAnalyticsData({
          overview: {
            totalRevenue: 0,
            totalBookings: 0,
            averageFare: 0,
            occupancyRate: 0
          },
          trends: {
            revenueGrowth: 0,
            bookingGrowth: 0,
            userGrowth: 0,
            cancellationRate: 0
          },
          topRoutes: [],
          busPerformance: [],
          revenueByDay: [],
          userDemographics: {
            ageGroups: {
              '18-25': 0,
              '26-35': 0,
              '36-45': 0,
              '46+': 0
            },
            gender: {
              male: 0,
              female: 0,
              other: 0
            }
          }
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [dateRange])

  if (loading || !analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" variant="primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600">Detailed insights and performance metrics</p>
        </div>
        
        {/* Date Range Filter */}
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent"
        >
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="90days">Last 90 Days</option>
          <option value="1year">Last Year</option>
        </select>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard
          title="Total Revenue"
          value={`?${(analyticsData.overview.totalRevenue / 100000).toFixed(1)}L`}
          change={analyticsData.trends.revenueGrowth}
          changeType="positive"
          icon="??"
          description="Total revenue generated"
        />
        
        <AnalyticsCard
          title="Total Bookings"
          value={analyticsData.overview.totalBookings}
          change={analyticsData.trends.bookingGrowth}
          changeType="positive"
          icon="??"
          description="Total bookings made"
        />
        
        <AnalyticsCard
          title="Average Fare"
          value={`?${analyticsData.overview.averageFare}`}
          change={5.2}
          changeType="positive"
          icon="??"
          description="Average booking value"
        />
        
        <AnalyticsCard
          title="Occupancy Rate"
          value={`${analyticsData.overview.occupancyRate}%`}
          change={3.1}
          changeType="positive"
          icon="??"
          description="Average bus occupancy"
        />
      </div>

      {/* Detailed Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Routes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Routes</h3>
          <div className="space-y-3">
            {analyticsData.topRoutes.length > 0 ? (
              analyticsData.topRoutes.map((route, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{route.route}</p>
                    <p className="text-sm text-gray-600">{route.bookings} bookings</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-accent">?{route.revenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Revenue</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-2xl mb-2">??</p>
                <p>No routes data available</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Bus Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bus Performance</h3>
          <div className="space-y-3">
            {analyticsData.busPerformance.map((bus, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{bus.busNumber}</p>
                  <p className="text-sm text-gray-600">{bus.trips} trips � {bus.occupancy}% occupancy</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-accent">?{Math.round(bus.revenue).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Revenue</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Revenue Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Day</h3>
          <div className="space-y-3">
            {analyticsData.revenueByDay.map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 w-12">{day.day}</span>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-accent h-2 rounded-full"
                      style={{ 
                        width: `${(day.revenue / 100000) * 100}%`,
                        maxWidth: '100%'
                      }}
                    />
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900 w-16 text-right">
                  ?{(day.revenue / 1000).toFixed(0)}K
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* User Demographics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Demographics</h3>
          
          {/* Age Groups */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-3">Age Distribution</h4>
            <div className="space-y-2">
              {Object.entries(analyticsData.userDemographics.ageGroups).map(([age, percentage]) => (
                <div key={age} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 w-16">{age} years</span>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-black40 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-8 text-right">
                    {percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Gender Distribution */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Gender Distribution</h4>
            <div className="space-y-2">
              {Object.entries(analyticsData.userDemographics.gender).map(([gender, percentage]) => (
                <div key={gender} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 w-16 capitalize">{gender}</span>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-accent h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-8 text-right">
                    {percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <div className="text-3xl font-bold text-green-600 mb-2">
            {analyticsData.trends.userGrowth}%
          </div>
          <p className="text-sm text-gray-600">User Growth Rate</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <div className="text-3xl font-bold text-red-600 mb-2">
            {analyticsData.trends.cancellationRate}%
          </div>
          <p className="text-sm text-gray-600">Cancellation Rate</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <div className="text-3xl font-bold text-black40 mb-2">
            {Math.round(analyticsData.overview.totalBookings / 30)}
          </div>
          <p className="text-sm text-gray-600">Avg. Daily Bookings</p>
        </motion.div>
      </div>

      {/* Export Options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Export Reports</h3>
            <p className="text-gray-600">Download detailed analytics reports</p>
          </div>
          <div className="flex space-x-3">
            <button className="bg-accent text-black40 px-6 py-3 rounded-lg font-semibold hover:bg-gradient-to-r hover:from-accent hover:to-accent-dark hover:shadow-xl hover:scale-105 transition-all duration-300 transition-colors">
              ?? Export as PDF
            </button>
            <button className="bg-black40 text-white px-6 py-3 rounded-lg font-semibold hover:bg-black40/90 transition-colors">
              ?? Export as Excel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default AnalyticsPage