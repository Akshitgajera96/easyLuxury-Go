// FILE: backend/services/adminService.js
/**
 * Admin service handling administrative operations and analytics
 * Business logic for admin dashboard and management
 */

const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const Trip = require('../models/tripModel');
const Bus = require('../models/busModel');
const Route = require('../models/routeModel');
const Transaction = require('../models/transactionModel');
const RentalInquiry = require('../models/rentalInquiryModel');
const MESSAGES = require('../constants/messages');

/**
 * Get dashboard analytics and summary
 * @returns {object} Dashboard analytics data
 */
const getDashboardAnalytics = async () => {
  try {
    // Get counts for various entities
    const [
      totalUsers,
      totalBookings,
      totalTrips,
      totalBuses,
      totalRoutes,
      totalRevenue,
      pendingRentalInquiries
    ] = await Promise.all([
      User.countDocuments(),
      Booking.countDocuments(),
      Trip.countDocuments(),
      Bus.countDocuments({ isActive: true }),
      Route.countDocuments({ isActive: true }),
      Transaction.aggregate([
        {
          $match: {
            type: 'debit',
            status: 'success'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]),
      RentalInquiry.countDocuments({ status: 'new' })
    ]);

    // Get recent bookings
    const recentBookings = await Booking.find()
      .populate('user', 'name email')
      .populate('trip')
      .populate({
        path: 'trip',
        populate: [
          { path: 'bus' },
          { path: 'route' }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get revenue by month for the current year
    const currentYear = new Date().getFullYear();
    const revenueByMonth = await Transaction.aggregate([
      {
        $match: {
          type: 'debit',
          status: 'success',
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          revenue: { $sum: '$amount' },
          bookings: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Format revenue by month data
    const monthlyRevenue = Array(12).fill(0);
    revenueByMonth.forEach(item => {
      monthlyRevenue[item._id - 1] = item.revenue;
    });

    // Get booking status distribution
    const bookingStatusDistribution = await Booking.aggregate([
      {
        $group: {
          _id: '$bookingStatus',
          count: { $sum: 1 }
        }
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
          revenue: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { bookings: -1 }
      },
      {
        $limit: 5
      }
    ]);

    return {
      summary: {
        totalUsers,
        totalBookings,
        totalTrips,
        totalBuses,
        totalRoutes,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingRentalInquiries
      },
      charts: {
        monthlyRevenue,
        bookingStatusDistribution,
        popularRoutes
      },
      recentBookings
    };
  } catch (error) {
    console.error('Error getting dashboard analytics:', error);
    throw new Error('Failed to fetch dashboard analytics');
  }
};

/**
 * Get detailed analytics with date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {object} Detailed analytics data
 */
const getDetailedAnalytics = async (startDate, endDate) => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const [
      bookingsData,
      revenueData,
      userRegistrations,
      busUtilization
    ] = await Promise.all([
      // Bookings by date
      Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            revenue: { $sum: '$totalAmount' }
          }
        },
        {
          $sort: { '_id': 1 }
        }
      ]),

      // Revenue by payment method
      Transaction.aggregate([
        {
          $match: {
            type: 'debit',
            status: 'success',
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: '$paymentMethod',
            amount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),

      // User registrations by date
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id': 1 }
        }
      ]),

      // Bus utilization
      Trip.aggregate([
        {
          $match: {
            departureDateTime: { $gte: start, $lte: end }
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
            _id: '$bus.busNumber',
            busName: { $first: '$bus.busName' },
            totalTrips: { $sum: 1 },
            totalSeats: { $first: '$bus.totalSeats' },
            bookedSeats: { $sum: { $size: '$bookedSeats' } }
          }
        },
        {
          $project: {
            busNumber: '$_id',
            busName: 1,
            totalTrips: 1,
            utilization: {
              $multiply: [
                { $divide: ['$bookedSeats', { $multiply: ['$totalSeats', '$totalTrips'] }] },
                100
              ]
            }
          }
        },
        {
          $sort: { utilization: -1 }
        }
      ])
    ]);

    return {
      bookingsOverTime: bookingsData,
      revenueByPaymentMethod: revenueData,
      userRegistrationsOverTime: userRegistrations,
      busUtilization
    };
  } catch (error) {
    console.error('Error getting detailed analytics:', error);
    throw new Error('Failed to fetch detailed analytics');
  }
};

/**
 * Get user management data
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {object} Users and pagination info
 */
const getUsersManagement = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const users = await User.find()
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await User.countDocuments();

  // Get user statistics
  const userStats = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    statistics: userStats
  };
};

/**
 * Toggle user active status
 * @param {string} userId - User ID
 * @returns {object} Updated user
 */
const toggleUserStatus = async (userId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }

  user.isActive = !user.isActive;
  await user.save();

  return await User.findById(userId).select('-password');
};

/**
 * Get system health status
 * @returns {object} System health information
 */
const getSystemHealth = async () => {
  try {
    // Database connection check
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    // Memory usage
    const memoryUsage = process.memoryUsage();

    // Uptime
    const uptime = process.uptime();

    // Active connections (simplified - in real app, you might want more detailed metrics)
    const activeSockets = require('../services/socketService').getActiveConnectionsCount?.() || 0;

    return {
      database: dbStatus,
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024)
      },
      uptime: Math.round(uptime),
      activeConnections: activeSockets,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting system health:', error);
    throw new Error('Failed to fetch system health');
  }
};

/**
 * Get all bookings for admin management
 * @param {object} filters - Filter criteria
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {object} Bookings and pagination info
 */
const getAllBookings = async (filters = {}, page = 1, limit = 10) => {
  const query = {};

  // Apply filters
  if (filters.status) {
    query.bookingStatus = filters.status;
  }
  if (filters.paymentStatus) {
    query.paymentStatus = filters.paymentStatus;
  }
  if (filters.tripId) {
    query.trip = filters.tripId;
  }
  if (filters.userId) {
    query.user = filters.userId;
  }
  if (filters.startDate && filters.endDate) {
    query.createdAt = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  }

  const skip = (page - 1) * limit;

  const bookings = await Booking.find(query)
    .populate('user', 'name email phone')
    .populate({
      path: 'trip',
      populate: [
        { path: 'bus' },
        { path: 'route' }
      ]
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Booking.countDocuments(query);

  return {
    bookings,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Update booking status (admin/staff)
 * @param {string} bookingId - Booking ID
 * @param {string} status - New booking status
 * @returns {object} Updated booking
 */
const updateBookingStatus = async (bookingId, status) => {
  const booking = await Booking.findById(bookingId);
  
  if (!booking) {
    throw new Error('Booking not found');
  }

  booking.bookingStatus = status;
  await booking.save();

  await booking.populate('user', 'name email phone');
  await booking.populate({
    path: 'trip',
    populate: [
      { path: 'bus' },
      { path: 'route' }
    ]
  });

  return booking;
};

/**
 * Get booking details by ID (admin/staff)
 * @param {string} bookingId - Booking ID
 * @returns {object} Booking data
 */
const getBookingDetails = async (bookingId) => {
  const booking = await Booking.findById(bookingId)
    .populate('user', 'name email phone walletBalance')
    .populate({
      path: 'trip',
      populate: [
        { path: 'bus' },
        { path: 'route' }
      ]
    });

  if (!booking) {
    throw new Error('Booking not found');
  }

  return booking;
};

module.exports = {
  getDashboardAnalytics,
  getDetailedAnalytics,
  getUsersManagement,
  toggleUserStatus,
  getSystemHealth,
  getAllBookings,
  updateBookingStatus,
  getBookingDetails
};