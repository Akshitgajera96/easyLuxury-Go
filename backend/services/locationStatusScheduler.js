// FILE: backend/services/locationStatusScheduler.js
/**
 * Location Status Scheduler
 * Automatically updates bus location statuses based on lastUpdated time
 * Runs every 2 minutes to check and update statuses (optimized for production)
 */

const BusLocationStatus = require('../models/busLocationStatusModel');
const LocationLog = require('../models/locationLogModel');

/**
 * Update all bus location statuses based on timing rules
 * < 2 minutes = active
 * 2-6 minutes = sleep  
 * > 10 minutes = offline
 */
const updateAllBusStatuses = async () => {
  try {
    // Get all active trips that are started but not completed
    const busStatuses = await BusLocationStatus.find({
      tripStarted: true,
      tripCompleted: false
    });

    if (busStatuses.length === 0) {
      return;
    }

    let statusChanges = 0;
    const updates = [];

    for (const busStatus of busStatuses) {
      const previousStatus = busStatus.status;
      
      // Calculate new status based on timing rules
      const newStatus = busStatus.calculateStatus();
      
      // Only update if status changed
      if (previousStatus !== newStatus) {
        busStatus.status = newStatus;
        
        // Mark connectivity issue for sleep/offline states
        if (newStatus === 'sleep' || newStatus === 'offline') {
          busStatus.connectivityIssue = true;
        } else if (newStatus === 'active') {
          busStatus.connectivityIssue = false;
        }

        updates.push(busStatus.save());

        // Log the status change
        await LocationLog.logStatusChange(
          busStatus.trip,
          busStatus.bus,
          busStatus.staff,
          previousStatus,
          newStatus,
          busStatus.lastLocation
        );

        statusChanges++;
      }
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }

  } catch (error) {
    console.error('[Location Scheduler] Error:', error.message);
  }
};

/**
 * Check for buses that need attention and could trigger auto-reminders
 * This is passive - just logs warnings. Admin sends manual reminders via API.
 */
const checkBusesNeedingAttention = async () => {
  try {
    const busesNeedingAttention = await BusLocationStatus.find({
      tripStarted: true,
      tripCompleted: false,
      status: { $in: ['sleep', 'offline'] },
      connectivityIssue: true
    }).populate('bus', 'busNumber');

    // Silent check - data is logged in LocationLog for admin dashboard
  } catch (error) {
    console.error('[Location Scheduler] Error checking buses:', error.message);
  }
};

/**
 * Initialize the location status scheduler
 * Runs every 60 seconds
 */
let schedulerInterval = null;

const startLocationScheduler = () => {
  if (schedulerInterval) {
    return;
  }
  
  // Run immediately on start
  updateAllBusStatuses();
  
  // Then run every 2 minutes (optimized for production)
  schedulerInterval = setInterval(async () => {
    await updateAllBusStatuses();
    await checkBusesNeedingAttention();
  }, 120000); // 120 seconds (2 minutes)
};

/**
 * Stop the scheduler (useful for graceful shutdown)
 */
const stopLocationScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
};

/**
 * Mark a trip as completed (stops monitoring)
 */
const markTripCompleted = async (tripId) => {
  try {
    const busStatus = await BusLocationStatus.findOne({ trip: tripId });
    
    if (busStatus) {
      busStatus.tripCompleted = true;
      busStatus.status = 'offline';
      await busStatus.save();

      // Log trip completion
      await LocationLog.create({
        trip: tripId,
        bus: busStatus.bus,
        staff: busStatus.staff,
        eventType: 'trip_completed',
        previousStatus: busStatus.status,
        newStatus: 'offline',
        performedBy: 'system',
        notes: 'Trip marked as completed'
      });
    }
  } catch (error) {
    console.error('[Location Scheduler] Error:', error.message);
  }
};

module.exports = {
  startLocationScheduler,
  stopLocationScheduler,
  updateAllBusStatuses,
  checkBusesNeedingAttention,
  markTripCompleted
};
