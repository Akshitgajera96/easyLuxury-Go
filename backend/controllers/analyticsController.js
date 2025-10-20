// FILE: backend/controllers/analyticsController.js
/**
 * Analytics controller handling HTTP requests for analytics operations
 * Routes: /api/v1/analytics/*
 */

const analyticsService = require('../services/analyticsService');

/**
 * Get comprehensive analytics report
 * GET /api/v1/analytics/comprehensive
 */
const getComprehensiveAnalytics = async (req, res, next) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;

    const [revenue, bookings, users, operational] = await Promise.all([
      analyticsService.getRevenueAnalytics(period, startDate, endDate),
      analyticsService.getBookingAnalytics(period),
      analyticsService.getUserAnalytics(),
      analyticsService.getOperationalAnalytics()
    ]);

    const comprehensiveReport = {
      period,
      dateRange: { startDate, endDate },
      revenue,
      bookings,
      users,
      operational,
      summary: {
        totalRevenue: revenue.totalRevenue,
        totalBookings: bookings.totalBookings,
        totalUsers: users.userStats.reduce((sum, stat) => sum + stat.count, 0),
        averageUtilization: operational.averageUtilization
      }
    };

    res.status(200).json({
      success: true,
      data: comprehensiveReport,
      message: 'Comprehensive analytics report generated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export analytics data
 * GET /api/v1/analytics/export
 */
const exportAnalyticsData = async (req, res, next) => {
  try {
    const { type, format = 'json', startDate, endDate } = req.query;

    let analyticsData;
    
    switch (type) {
      case 'revenue':
        analyticsData = await analyticsService.getRevenueAnalytics('daily', startDate, endDate);
        break;
      case 'bookings':
        analyticsData = await analyticsService.getBookingAnalytics('daily');
        break;
      case 'users':
        analyticsData = await analyticsService.getUserAnalytics();
        break;
      case 'operational':
        analyticsData = await analyticsService.getOperationalAnalytics();
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid analytics type. Use: revenue, bookings, users, or operational'
        });
    }

    if (format === 'csv') {
      // Convert to CSV format (simplified implementation)
      const csvData = convertToCSV(analyticsData);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}_analytics_${new Date().toISOString().split('T')[0]}.csv`);
      
      return res.send(csvData);
    }

    // Default JSON response
    res.status(200).json({
      success: true,
      data: analyticsData,
      message: `Analytics data for ${type} exported successfully`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Convert analytics data to CSV format
 * @param {object} data - Analytics data
 * @returns {string} CSV formatted data
 */
const convertToCSV = (data) => {
  // Simplified CSV conversion - in real app, use a proper CSV library
  if (data.revenueData) {
    const headers = ['Date', 'Total Revenue', 'Payment Methods'];
    const rows = data.revenueData.map(item => [
      item._id,
      item.totalRevenue,
      item.paymentMethods.map(pm => `${pm.method}: ₹${pm.revenue}`).join('; ')
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
  
  // Default fallback
  return JSON.stringify(data, null, 2);
};

/**
 * Get real-time analytics
 * GET /api/v1/analytics/realtime
 */
const getRealTimeAnalytics = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const [
      todayBookings,
      todayRevenue,
      activeUsers,
      pendingInquiries
    ] = await Promise.all([
      // Today's bookings
      require('../models/bookingModel').countDocuments({
        createdAt: { $gte: todayStart }
      }),
      
      // Today's revenue
      require('../models/transactionModel').aggregate([
        {
          $match: {
            type: 'debit',
            status: 'success',
            createdAt: { $gte: todayStart }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]),
      
      // Active users (logged in last 24 hours)
      require('../models/userModel').countDocuments({
        lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      
      // Pending rental inquiries
      require('../models/rentalInquiryModel').countDocuments({
        status: 'new'
      })
    ]);

    const realTimeData = {
      timestamp: now.toISOString(),
      metrics: {
        todayBookings,
        todayRevenue: todayRevenue[0]?.total || 0,
        activeUsers,
        pendingInquiries
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: now.toISOString()
      }
    };

    res.status(200).json({
      success: true,
      data: realTimeData,
      message: 'Real-time analytics fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getComprehensiveAnalytics,
  exportAnalyticsData,
  getRealTimeAnalytics
};