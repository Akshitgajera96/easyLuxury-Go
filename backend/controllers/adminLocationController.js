// FILE: backend/controllers/adminLocationController.js
/**
 * Admin Location Monitoring Controller
 * Handles admin-specific location monitoring, reminders, and analytics
 */

const BusLocationStatus = require('../models/busLocationStatusModel');
const LocationLog = require('../models/locationLogModel');
const Trip = require('../models/tripModel');
const Staff = require('../models/staffModel');
const Notification = require('../models/notificationModel');

/**
 * Get all monitored bus locations with status
 * GET /api/v1/admin/location-monitor/buses
 */
const getAllMonitoredBuses = async (req, res, next) => {
  try {
    const busStatuses = await BusLocationStatus.find({ 
      tripStarted: true, 
      tripCompleted: false 
    })
      .populate({
        path: 'trip',
        select: 'departureDateTime arrivalDateTime status route',
        populate: {
          path: 'route',
          select: 'sourceCity destinationCity'
        }
      })
      .populate('bus', 'busNumber operator registrationNumber')
      .populate('staff', 'name email phone designation')
      .sort({ lastUpdated: -1 });

    // Calculate real-time status for each bus
    const busesWithStatus = busStatuses.map(bus => {
      const status = bus.calculateStatus();
      return {
        _id: bus._id,
        trip: bus.trip,
        bus: bus.bus,
        staff: bus.staff,
        lastLocation: bus.lastLocation,
        lastUpdated: bus.lastUpdated,
        status: status,
        connectivityIssue: bus.connectivityIssue,
        remindersSent: bus.remindersSent,
        lastReminderSent: bus.lastReminderSent,
        tripStarted: bus.tripStarted
      };
    });

    // Calculate statistics
    const stats = {
      total: busesWithStatus.length,
      active: busesWithStatus.filter(b => b.status === 'active').length,
      sleep: busesWithStatus.filter(b => b.status === 'sleep').length,
      offline: busesWithStatus.filter(b => b.status === 'offline').length,
      needingAttention: busesWithStatus.filter(b => b.connectivityIssue).length
    };

    res.status(200).json({
      success: true,
      data: {
        buses: busesWithStatus,
        stats
      },
      message: 'Monitored buses fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get location status for a specific trip
 * GET /api/v1/admin/location-monitor/trip/:tripId
 */
const getTripLocationStatus = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const busStatus = await BusLocationStatus.findOne({ trip: tripId })
      .populate('trip', 'departureDateTime arrivalDateTime status route')
      .populate('bus', 'busNumber operator')
      .populate('staff', 'name email phone designation');

    if (!busStatus) {
      return res.status(404).json({
        success: false,
        message: 'Location status not found for this trip'
      });
    }

    // Get recent logs for this trip
    const logs = await LocationLog.getLogsForTrip(tripId, 20);

    res.status(200).json({
      success: true,
      data: {
        status: busStatus,
        recentLogs: logs
      },
      message: 'Trip location status fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send reminder to staff about location updates
 * POST /api/v1/admin/location-monitor/remind/:tripId
 */
const sendLocationReminder = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { message: customMessage } = req.body;

    const busStatus = await BusLocationStatus.findOne({ trip: tripId })
      .populate('trip', 'route')
      .populate('bus', 'busNumber')
      .populate('staff', 'name email phone');

    if (!busStatus) {
      return res.status(404).json({
        success: false,
        message: 'Bus location status not found'
      });
    }

    if (!busStatus.staff) {
      return res.status(400).json({
        success: false,
        message: 'No staff assigned to this trip'
      });
    }

    // Check if reminder was sent recently (within last 15 minutes)
    if (busStatus.lastReminderSent) {
      const minutesSinceLastReminder = (new Date() - busStatus.lastReminderSent) / (1000 * 60);
      if (minutesSinceLastReminder < 15) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${Math.ceil(15 - minutesSinceLastReminder)} more minutes before sending another reminder`,
          data: {
            minutesRemaining: Math.ceil(15 - minutesSinceLastReminder)
          }
        });
      }
    }

    // Create notification for staff
    const defaultMessage = `⚠️ Location Update Reminder: Your bus location for ${busStatus.bus.busNumber} is not updating regularly. Please check your GPS and internet connectivity.`;
    
    await Notification.create({
      user: busStatus.staff._id,
      type: 'system',
      title: 'Location Update Required',
      message: customMessage || defaultMessage,
      priority: 'high',
      metadata: {
        tripId: tripId,
        busId: busStatus.bus._id,
        reminderType: 'location_update'
      }
    });

    // Update reminder count and timestamp
    busStatus.remindersSent += 1;
    busStatus.lastReminderSent = new Date();
    await busStatus.save();

    // Log the reminder
    await LocationLog.logReminderSent(
      tripId,
      busStatus.bus._id,
      busStatus.staff._id,
      {
        name: busStatus.staff.name,
        email: busStatus.staff.email,
        phone: busStatus.staff.phone
      }
    );

    // Emit socket event to notify staff in real-time
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${busStatus.staff._id}`).emit('location_reminder', {
        title: 'Location Update Required',
        message: customMessage || defaultMessage,
        priority: 'high'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        remindersSent: busStatus.remindersSent,
        lastReminderSent: busStatus.lastReminderSent,
        staffNotified: {
          name: busStatus.staff.name,
          email: busStatus.staff.email
        }
      },
      message: 'Reminder sent successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get location monitoring dashboard statistics
 * GET /api/v1/admin/location-monitor/stats
 */
const getMonitoringStats = async (req, res, next) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get all active monitoring statuses
    const allStatuses = await BusLocationStatus.find({
      tripStarted: true,
      tripCompleted: false
    });

    // Calculate current status for each
    const statusCounts = {
      active: 0,
      sleep: 0,
      offline: 0,
      not_started: 0
    };

    allStatuses.forEach(bus => {
      const status = bus.calculateStatus();
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    // Get today's activity logs
    const todayLogs = await LocationLog.find({
      createdAt: { $gte: today }
    });

    // Count reminders sent today
    const remindersSentToday = todayLogs.filter(
      log => log.eventType === 'reminder_sent'
    ).length;

    // Count status changes today
    const statusChangesToday = todayLogs.filter(
      log => log.eventType === 'status_change'
    ).length;

    // Get buses needing attention (sleep or offline with connectivity issues)
    const busesNeedingAttention = allStatuses.filter(bus => {
      const status = bus.calculateStatus();
      return (status === 'sleep' || status === 'offline') && bus.connectivityIssue;
    }).length;

    // Get recent activity (last 50 logs)
    const recentActivity = await LocationLog.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('trip', 'route')
      .populate('bus', 'busNumber')
      .populate('staff', 'name');

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalMonitored: allStatuses.length,
          active: statusCounts.active,
          sleep: statusCounts.sleep,
          offline: statusCounts.offline,
          notStarted: statusCounts.not_started,
          needingAttention: busesNeedingAttention
        },
        todayStats: {
          remindersSent: remindersSentToday,
          statusChanges: statusChangesToday,
          logsCreated: todayLogs.length
        },
        recentActivity: recentActivity.slice(0, 10) // Latest 10 for dashboard
      },
      message: 'Monitoring statistics fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get activity logs with filters
 * GET /api/v1/admin/location-monitor/logs
 */
const getActivityLogs = async (req, res, next) => {
  try {
    const { 
      eventType, 
      tripId, 
      busId, 
      staffId, 
      limit = 100, 
      page = 1 
    } = req.query;

    const query = {};
    if (eventType) query.eventType = eventType;
    if (tripId) query.trip = tripId;
    if (busId) query.bus = busId;
    if (staffId) query.staff = staffId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      LocationLog.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .populate('trip', 'route')
        .populate('bus', 'busNumber operator')
        .populate('staff', 'name email'),
      LocationLog.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      },
      message: 'Activity logs fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manually update bus location status
 * PATCH /api/v1/admin/location-monitor/status/:tripId
 */
const updateBusStatus = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { status, notes } = req.body;

    if (!['active', 'sleep', 'offline', 'not_started'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: active, sleep, offline, or not_started'
      });
    }

    const busStatus = await BusLocationStatus.findOne({ trip: tripId });

    if (!busStatus) {
      return res.status(404).json({
        success: false,
        message: 'Bus location status not found'
      });
    }

    const previousStatus = busStatus.status;
    busStatus.status = status;
    await busStatus.save();

    // Log manual status update
    await LocationLog.create({
      trip: tripId,
      bus: busStatus.bus,
      staff: busStatus.staff,
      eventType: 'manual_update',
      previousStatus,
      newStatus: status,
      performedBy: req.user.email,
      notes: notes || `Manual status update by admin: ${previousStatus} → ${status}`
    });

    res.status(200).json({
      success: true,
      data: {
        previousStatus,
        newStatus: status,
        busStatus
      },
      message: 'Bus status updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMonitoredBuses,
  getTripLocationStatus,
  sendLocationReminder,
  getMonitoringStats,
  getActivityLogs,
  updateBusStatus
};
