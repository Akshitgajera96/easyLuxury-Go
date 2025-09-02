// src/services/adminService.js
import { apiCall, ADMIN_API, USER_API, BUS_API, BOOKING_API, REFUND_API, CAPTAIN_API } from './api';

// 📊 Get dashboard statistics
export const getDashboardStats = async () => {
  try {
    return await apiCall('get', ADMIN_API.STATS);
  } catch (error) {
    throw error || { message: 'Failed to fetch dashboard statistics' };
  }
};

// 👥 User Management

// Get all users with filtering and pagination
export const getAllUsers = async (params = {}) => {
  try {
    return await apiCall('get', USER_API.GET_ALL, null, { params });
  } catch (error) {
    throw error || { message: 'Failed to fetch users' };
  }
};

// Get user statistics
export const getUserStats = async () => {
  try {
    return await apiCall('get', USER_API.STATS);
  } catch (error) {
    throw error || { message: 'Failed to fetch user statistics' };
  }
};

// Delete user
export const deleteUser = async (userId) => {
  try {
    return await apiCall('delete', USER_API.DELETE(userId));
  } catch (error) {
    throw error || { message: 'Failed to delete user' };
  }
};

// 🚌 Bus Management

// Create new bus
export const createBus = async (busData) => {
  try {
    return await apiCall('post', BUS_API.CREATE, busData);
  } catch (error) {
    throw error || { message: 'Failed to create bus' };
  }
};

// Update bus
export const updateBus = async (busId, busData) => {
  try {
    return await apiCall('put', BUS_API.UPDATE(busId), busData);
  } catch (error) {
    throw error || { message: 'Failed to update bus' };
  }
};

// Delete bus
export const deleteBus = async (busId) => {
  try {
    return await apiCall('delete', BUS_API.DELETE(busId));
  } catch (error) {
    throw error || { message: 'Failed to delete bus' };
  }
};

// Update bus status
export const updateBusStatus = async (busId, statusData) => {
  try {
    return await apiCall('patch', BUS_API.UPDATE_STATUS(busId), statusData);
  } catch (error) {
    throw error || { message: 'Failed to update bus status' };
  }
};

// Get bus analytics
export const getBusAnalytics = async () => {
  try {
    return await apiCall('get', BUS_API.ANALYTICS);
  } catch (error) {
    throw error || { message: 'Failed to fetch bus analytics' };
  }
};

// Export buses data
export const exportBuses = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${BUS_API.EXPORT}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to export buses data');
    }
    
    const blob = await response.blob();
    return blob;
  } catch (error) {
    throw error || { message: 'Failed to export buses data' };
  }
};

// 👨‍✈️ Captain Management

// Register new captain
export const registerCaptain = async (captainData) => {
  try {
    return await apiCall('post', CAPTAIN_API.REGISTER, captainData);
  } catch (error) {
    throw error || { message: 'Failed to register captain' };
  }
};

// Get all captains
export const getAllCaptains = async (params = {}) => {
  try {
    return await apiCall('get', CAPTAIN_API.GET_ALL, null, { params });
  } catch (error) {
    throw error || { message: 'Failed to fetch captains' };
  }
};

// Get captain statistics
export const getCaptainStats = async () => {
  try {
    return await apiCall('get', CAPTAIN_API.GET_STATS);
  } catch (error) {
    throw error || { message: 'Failed to fetch captain statistics' };
  }
};

// Update captain
export const updateCaptain = async (captainId, captainData) => {
  try {
    return await apiCall('put', CAPTAIN_API.UPDATE(captainId), captainData);
  } catch (error) {
    throw error || { message: 'Failed to update captain' };
  }
};

// Delete captain
export const deleteCaptain = async (captainId) => {
  try {
    return await apiCall('delete', CAPTAIN_API.DELETE(captainId));
  } catch (error) {
    throw error || { message: 'Failed to delete captain' };
  }
};

// Assign bus to captain
export const assignBusToCaptain = async (captainId, busData) => {
  try {
    return await apiCall('patch', CAPTAIN_API.ASSIGN_BUS(captainId), busData);
  } catch (error) {
    throw error || { message: 'Failed to assign bus to captain' };
  }
};

// Remove bus from captain
export const removeBusFromCaptain = async (captainId, busData) => {
  try {
    return await apiCall('patch', CAPTAIN_API.REMOVE_BUS(captainId), busData);
  } catch (error) {
    throw error || { message: 'Failed to remove bus from captain' };
  }
};

// 📊 Booking Management (Admin)

// Get all bookings
export const getAllBookings = async (params = {}) => {
  try {
    return await apiCall('get', BOOKING_API.GET_ALL_BOOKINGS, null, { params });
  } catch (error) {
    throw error || { message: 'Failed to fetch all bookings' };
  }
};

// Get booking analytics
export const getBookingAnalytics = async () => {
  try {
    return await apiCall('get', BOOKING_API.ANALYTICS);
  } catch (error) {
    throw error || { message: 'Failed to fetch booking analytics' };
  }
};

// Export bookings data
export const exportBookings = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${BOOKING_API.EXPORT}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to export bookings data');
    }
    
    const blob = await response.blob();
    return blob;
  } catch (error) {
    throw error || { message: 'Failed to export bookings data' };
  }
};

// Update booking (admin)
export const updateBooking = async (bookingId, bookingData) => {
  try {
    return await apiCall('put', BOOKING_API.UPDATE(bookingId), bookingData);
  } catch (error) {
    throw error || { message: 'Failed to update booking' };
  }
};

// 💰 Refund Management (Admin)

// Get all refunds
export const getAllRefunds = async (params = {}) => {
  try {
    return await apiCall('get', REFUND_API.GET_ALL, null, { params });
  } catch (error) {
    throw error || { message: 'Failed to fetch refunds' };
  }
};

// Get refund statistics
export const getRefundStats = async () => {
  try {
    return await apiCall('get', REFUND_API.GET_STATS);
  } catch (error) {
    throw error || { message: 'Failed to fetch refund statistics' };
  }
};

// Process manual refund
export const processManualRefund = async (refundData) => {
  try {
    return await apiCall('post', REFUND_API.PROCESS_MANUAL, refundData);
  } catch (error) {
    throw error || { message: 'Failed to process manual refund' };
  }
};

// Update refund status
export const updateRefundStatus = async (refundId, statusData) => {
  try {
    return await apiCall('patch', REFUND_API.UPDATE_STATUS(refundId), statusData);
  } catch (error) {
    throw error || { message: 'Failed to update refund status' };
  }
};

// Export refunds data
export const exportRefunds = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${REFUND_API.EXPORT}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to export refunds data');
    }
    
    const blob = await response.blob();
    return blob;
  } catch (error) {
    throw error || { message: 'Failed to export refunds data' };
  }
};