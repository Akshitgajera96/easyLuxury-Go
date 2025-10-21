// FILE: backend/services/locationStatusScheduler.js
/**
 * Location Status Scheduler
 * Automatically updates bus location statuses based on lastUpdated time
 * Runs every 60 seconds to check and update statuses
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

    console.log(`🔄 [Location Scheduler] Checking ${busStatuses.length} active buses...`);

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
        
        console.log(`  ⚠️  Status changed: ${busStatus.bus} - ${previousStatus} → ${newStatus}`);
      }
    }

    if (updates.length > 0) {
      await Promise.all(updates);
      console.log(`✅ [Location Scheduler] Updated ${statusChanges} bus statuses`);
    } else {
      console.log(`✅ [Location Scheduler] All buses status up-to-date`);
    }

  } catch (error) {
    console.error('❌ [Location Scheduler] Error updating bus statuses:', error.message);
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

    if (busesNeedingAttention.length > 0) {
      console.log(`⚠️  [Location Scheduler] ${busesNeedingAttention.length} buses need attention:`);
      busesNeedingAttention.forEach(bus => {
        const minutesSinceUpdate = bus.lastUpdated 
          ? Math.floor((new Date() - bus.lastUpdated) / (1000 * 60))
          : 'N/A';
        console.log(`   - Bus ${bus.bus?.busNumber || 'Unknown'}: ${bus.status} (${minutesSinceUpdate} min since update)`);
      });
    }
  } catch (error) {
    console.error('❌ [Location Scheduler] Error checking buses needing attention:', error.message);
  }
};

/**
 * Initialize the location status scheduler
 * Runs every 60 seconds
 */
let schedulerInterval = null;

const startLocationScheduler = () => {
  if (schedulerInterval) {
    console.log('⚠️  [Location Scheduler] Already running');
    return;
  }

  console.log('🚀 [Location Scheduler] Starting location status monitor...');
  
  // Run immediately on start
  updateAllBusStatuses();
  
  // Then run every 60 seconds
  schedulerInterval = setInterval(async () => {
    await updateAllBusStatuses();
    await checkBusesNeedingAttention();
  }, 60000); // 60 seconds

  console.log('✅ [Location Scheduler] Location status monitor started (runs every 60s)');
};

/**
 * Stop the scheduler (useful for graceful shutdown)
 */
const stopLocationScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('🛑 [Location Scheduler] Location status monitor stopped');
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

      console.log(`✅ [Location Scheduler] Trip ${tripId} marked as completed`);
    }
  } catch (error) {
    console.error('❌ [Location Scheduler] Error marking trip completed:', error.message);
  }
};

module.exports = {
  startLocationScheduler,
  stopLocationScheduler,
  updateAllBusStatuses,
  checkBusesNeedingAttention,
  markTripCompleted
};
