// FILE: backend/services/analyticsService.js
/**
 * Analytics service for advanced data analysis and reporting
 * Business logic for comprehensive analytics and insights
 */

const Booking = require('../models/bookingModel');
const Trip = require('../models/tripModel');
const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');
const Route = require('../models/routeModel');

/**
 * Get revenue analytics
 * @param {string} period - Time period (daily, weekly, monthly, yearly)
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {object} Revenue analytics data
 */
const getRevenueAnalytics = async (period = 'monthly', startDate, endDate) => {
  try {
    let groupFormat, matchFilter = {};

    // Set date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchFilter.createdAt = { $gte: start, $lte: end };
    } else {
      // Default to last 30 days if no date range provided
      const defaultStart = new Date();
      defaultStart.setDate(defaultStart.getDate() - 30);
      matchFilter.createdAt = { $gte: defaultStart };
    }

    // Set grouping format based on period
    switch (period) {
      case 'daily':
        groupFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        groupFormat = '%Y-%U';
        break;
      case 'yearly':
        groupFormat = '%Y';
        break;
      case 'monthly':
      default:
        groupFormat = '%Y-%m';
        break;
    }

    const revenueData = await Transaction.aggregate([
      {
        $match: {
          ...matchFilter,
          type: 'debit',
          status: 'success'
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: groupFormat, date: '$createdAt' } },
            paymentMethod: '$paymentMethod'
          },
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          totalRevenue: { $sum: '$revenue' },
          paymentMethods: {
            $push: {
              method: '$_id.paymentMethod',
              revenue: '$revenue',
              transactions: '$transactions'
            }
          }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    return {
      period,
      revenueData,
      totalRevenue: revenueData.reduce((sum, item) => sum + item.totalRevenue, 0),
      totalTransactions: revenueData.reduce((sum, item) => 
        sum + item.paymentMethods.reduce((methodSum, method) => methodSum + method.transactions, 0), 0
      )
    };
  } catch (error) {
    console.error('Error getting revenue analytics:', error);
    throw new Error('Failed to fetch revenue analytics');
  }
};

/**
 * Get booking analytics
 * @param {string} period - Time period (daily, weekly, monthly, yearly)
 * @returns {object} Booking analytics data
 */
const getBookingAnalytics = async (period = 'monthly') => {
  try {
    let groupFormat;

    switch (period) {
      case 'daily':
        groupFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        groupFormat = '%Y-%U';
        break;
      case 'yearly':
        groupFormat = '%Y';
        break;
      case 'monthly':
      default:
        groupFormat = '%Y-%m';
        break;
    }

    const bookingData = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } // Last year
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: groupFormat, date: '$createdAt' } },
            status: '$bookingStatus'
          },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          totalBookings: { $sum: '$count' },
          totalRevenue: { $sum: '$revenue' },
          statusBreakdown: {
            $push: {
              status: '$_id.status',
              count: '$count',
              revenue: '$revenue'
            }
          }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Get popular routes
    const popularRoutes = await Booking.aggregate([
      {
        $lookup: {
          from: 'trips',
          localField: 'trip',
          foreignField: '_id',
          as: 'trip'
        }
      },
      {
        $unwind: '$trip'
      },
      {
        $lookup: {
          from: 'routes',
          localField: 'trip.route',
          foreignField: '_id',
          as: 'route'
        }
      },
      {
        $unwind: '$route'
      },
      {
        $group: {
          _id: '$route._id',
          routeName: { $first: '$route.routeName' },
          bookings: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          avgPassengers: { $avg: { $size: '$seats' } }
        }
      },
      {
        $sort: { bookings: -1 }
      },
      {
        $limit: 10
      }
    ]);

    return {
      period,
      bookingData,
      popularRoutes,
      totalBookings: bookingData.reduce((sum, item) => sum + item.totalBookings, 0),
      totalRevenue: bookingData.reduce((sum, item) => sum + item.totalRevenue, 0)
    };
  } catch (error) {
    console.error('Error getting booking analytics:', error);
    throw new Error('Failed to fetch booking analytics');
  }
};

/**
 * Get user analytics
 * @returns {object} User analytics data
 */
const getUserAnalytics = async () => {
  try {
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          avgWalletBalance: { $avg: '$walletBalance' }
        }
      }
    ]);

    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $limit: 12
      }
    ]);

    const userActivity = await Booking.aggregate([
      {
        $group: {
          _id: '$user',
          totalBookings: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
          lastBooking: { $max: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userName: '$user.name',
          userEmail: '$user.email',
          totalBookings: 1,
          totalSpent: 1,
          lastBooking: 1
        }
      },
      {
        $sort: { totalSpent: -1 }
      },
      {
        $limit: 10
      }
    ]);

    return {
      userStats,
      userGrowth,
      topUsers: userActivity
    };
  } catch (error) {
    console.error('Error getting user analytics:', error);
    throw new Error('Failed to fetch user analytics');
  }
};

/**
 * Get operational analytics
 * @returns {object} Operational analytics data
 */
const getOperationalAnalytics = async () => {
  try {
    const busUtilization = await Trip.aggregate([
      {
        $match: {
          departureDateTime: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        }
      },
      {
        $lookup: {
          from: 'buses',
          localField: 'bus',
          foreignField: '_id',
          as: 'bus'
        }
      },
      {
        $unwind: '$bus'
      },
      {
        $group: {
          _id: '$bus._id',
          busNumber: { $first: '$bus.busNumber' },
          busName: { $first: '$bus.busName' },
          totalTrips: { $sum: 1 },
          totalSeats: { $first: '$bus.totalSeats' },
          bookedSeats: { $sum: { $size: '$bookedSeats' } },
          totalRevenue: { $sum: { $multiply: ['$currentFare', { $size: '$bookedSeats' }] } }
        }
      },
      {
        $project: {
          busNumber: 1,
          busName: 1,
          totalTrips: 1,
          utilization: {
            $multiply: [
              { $divide: ['$bookedSeats', { $multiply: ['$totalSeats', '$totalTrips'] }] },
              100
            ]
          },
          revenuePerSeat: {
            $divide: ['$totalRevenue', '$bookedSeats']
          },
          totalRevenue: 1
        }
      },
      {
        $sort: { utilization: -1 }
      }
    ]);

    const routePerformance = await Route.aggregate([
      {
        $lookup: {
          from: 'trips',
          localField: '_id',
          foreignField: 'route',
          as: 'trips'
        }
      },
      {
        $project: {
          routeName: { $concat: ['$source.city', ' to ', '$destination.city'] },
          totalTrips: { $size: '$trips' },
          totalDistance: '$distance',
          baseFare: 1,
          isActive: 1
        }
      },
      {
        $match: {
          totalTrips: { $gt: 0 }
        }
      },
      {
        $sort: { totalTrips: -1 }
      }
    ]);

    return {
      busUtilization,
      routePerformance,
      averageUtilization: busUtilization.reduce((sum, bus) => sum + bus.utilization, 0) / busUtilization.length,
      totalRevenue: busUtilization.reduce((sum, bus) => sum + bus.totalRevenue, 0)
    };
  } catch (error) {
    console.error('Error getting operational analytics:', error);
    throw new Error('Failed to fetch operational analytics');
  }
};

module.exports = {
  getRevenueAnalytics,
  getBookingAnalytics,
  getUserAnalytics,
  getOperationalAnalytics
};