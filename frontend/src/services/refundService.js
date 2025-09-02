// src/services/refundService.js
import { apiCall, REFUND_API } from './api';

// 📥 Request refund for a ticket
export const requestRefund = async (ticketId, refundData) => {
  try {
    return await apiCall('post', REFUND_API.REQUEST(ticketId), refundData);
  } catch (error) {
    throw error || { message: 'Refund request failed' };
  }
};

// 📄 Get user's refund history
export const getRefundHistory = async (params = {}) => {
  try {
    return await apiCall('get', REFUND_API.GET_HISTORY, null, { params });
  } catch (error) {
    throw error || { message: 'Unable to fetch refund history' };
  }
};

// 🔍 Get refund details by ID
export const getRefundDetails = async (refundId) => {
  try {
    return await apiCall('get', REFUND_API.GET_DETAILS(refundId));
  } catch (error) {
    throw error || { message: 'Failed to fetch refund details' };
  }
};

// 🛠️ Process manual refund (admin only)
export const processManualRefund = async (refundData) => {
  try {
    return await apiCall('post', REFUND_API.PROCESS_MANUAL, refundData);
  } catch (error) {
    throw error || { message: 'Failed to process manual refund' };
  }
};

// 📊 Get refund statistics (admin only)
export const getRefundStats = async () => {
  try {
    return await apiCall('get', REFUND_API.GET_STATS);
  } catch (error) {
    throw error || { message: 'Failed to fetch refund statistics' };
  }
};

// 📋 Get all refunds with filtering (admin only)
export const getAllRefunds = async (params = {}) => {
  try {
    return await apiCall('get', REFUND_API.GET_ALL, null, { params });
  } catch (error) {
    throw error || { message: 'Failed to fetch refunds' };
  }
};

// 🎯 Update refund status (admin only)
export const updateRefundStatus = async (refundId, statusData) => {
  try {
    return await apiCall('patch', REFUND_API.UPDATE_STATUS(refundId), statusData);
  } catch (error) {
    throw error || { message: 'Failed to update refund status' };
  }
};

// 📤 Export refunds data (admin only)
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

// 💰 Calculate refund amount (client-side estimation)
export const calculateRefundAmount = (bookingAmount, cancellationPolicy, hoursBeforeDeparture) => {
  const now = new Date();
  const departureTime = new Date(bookingAmount.departureTime);
  const hoursDiff = (departureTime - now) / (1000 * 60 * 60);
  
  let refundPercentage = 0;
  
  switch (cancellationPolicy) {
    case 'flexible':
      refundPercentage = hoursDiff > 24 ? 100 : hoursDiff > 6 ? 80 : 50;
      break;
    case 'moderate':
      refundPercentage = hoursDiff > 48 ? 100 : hoursDiff > 24 ? 70 : hoursDiff > 6 ? 40 : 0;
      break;
    case 'strict':
      refundPercentage = hoursDiff > 72 ? 100 : hoursDiff > 24 ? 50 : 0;
      break;
    default:
      refundPercentage = hoursDiff > 24 ? 80 : hoursDiff > 6 ? 50 : 0;
  }
  
  const refundAmount = (bookingAmount.totalAmount * refundPercentage) / 100;
  const processingFee = refundAmount > 0 ? Math.min(50, refundAmount * 0.1) : 0;
  const finalAmount = Math.max(0, refundAmount - processingFee);
  
  return {
    refundAmount: finalAmount,
    refundPercentage,
    processingFee,
    cancellationPolicy,
    hoursBeforeDeparture: Math.max(0, hoursDiff)
  };
};

// 📝 Get refund reasons (predefined list)
export const getRefundReasons = () => {
  return [
    { id: 'change_of_plans', label: 'Change of plans', requiresDetails: true },
    { id: 'bus_delayed', label: 'Bus was delayed/cancelled', requiresDetails: false },
    { id: 'sickness', label: 'Illness or emergency', requiresDetails: true },
    { id: 'double_booking', label: 'Accidental double booking', requiresDetails: false },
    { id: 'schedule_conflict', label: 'Schedule conflict', requiresDetails: true },
    { id: 'other', label: 'Other reason', requiresDetails: true }
  ];
};

// ⏰ Check if refund is possible
export const isRefundPossible = (departureTime, bookingStatus) => {
  if (bookingStatus !== 'confirmed') return false;
  
  const now = new Date();
  const departure = new Date(departureTime);
  const hoursDiff = (departure - now) / (1000 * 60 * 60);
  
  // Allow refunds up to 1 hour before departure
  return hoursDiff > 1;
};