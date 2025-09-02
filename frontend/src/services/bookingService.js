// src/services/bookingService.js
import { apiCall, BOOKING_API } from './api';

// ✅ Create a new booking
export const createBooking = async (bookingData) => {
  try {
    return await apiCall('post', BOOKING_API.CREATE, bookingData);
  } catch (error) {
    throw error || { message: 'Failed to create booking' };
  }
};

// ✅ Get user's bookings with filtering and pagination
export const getMyBookings = async (params = {}) => {
  try {
    return await apiCall('get', BOOKING_API.GET_MY_BOOKINGS, null, { params });
  } catch (error) {
    throw error || { message: 'Failed to fetch bookings' };
  }
};

// ✅ Get all bookings (admin only)
export const getAllBookings = async (params = {}) => {
  try {
    return await apiCall('get', BOOKING_API.GET_ALL_BOOKINGS, null, { params });
  } catch (error) {
    throw error || { message: 'Failed to fetch all bookings' };
  }
};

// ✅ Get booking by ID
export const getBookingById = async (bookingId) => {
  try {
    return await apiCall('get', BOOKING_API.GET_BY_ID(bookingId));
  } catch (error) {
    throw error || { message: 'Failed to fetch booking details' };
  }
};

// ✅ Cancel a booking
export const cancelBooking = async (bookingId) => {
  try {
    return await apiCall('post', BOOKING_API.CANCEL(bookingId));
  } catch (error) {
    throw error || { message: 'Failed to cancel booking' };
  }
};

// ✅ Check seat availability
export const checkSeatAvailability = async (availabilityData) => {
  try {
    return await apiCall('post', BOOKING_API.CHECK_AVAILABILITY, availabilityData);
  } catch (error) {
    throw error || { message: 'Failed to check seat availability' };
  }
};

// ✅ Get bus availability for specific date
export const getBusAvailability = async (busId, date) => {
  try {
    return await apiCall('get', BOOKING_API.GET_BUS_AVAILABILITY(busId), null, {
      params: { date }
    });
  } catch (error) {
    throw error || { message: 'Failed to fetch bus availability' };
  }
};

// ✅ Get user's bookings (admin or same user)
export const getUserBookings = async (userId, params = {}) => {
  try {
    return await apiCall('get', BOOKING_API.GET_USER_BOOKINGS(userId), null, { params });
  } catch (error) {
    throw error || { message: 'Failed to fetch user bookings' };
  }
};

// ✅ Update booking (admin only)
export const updateBooking = async (bookingId, updateData) => {
  try {
    return await apiCall('put', BOOKING_API.UPDATE(bookingId), updateData);
  } catch (error) {
    throw error || { message: 'Failed to update booking' };
  }
};

// ✅ Get booking analytics (admin only)
export const getBookingAnalytics = async () => {
  try {
    return await apiCall('get', BOOKING_API.ANALYTICS);
  } catch (error) {
    throw error || { message: 'Failed to fetch booking analytics' };
  }
};

// ✅ Export bookings data (admin only)
export const exportBookings = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${BOOKING_API.EXPORT}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to export bookings');
    }
    
    const blob = await response.blob();
    return blob;
  } catch (error) {
    throw error || { message: 'Failed to export bookings' };
  }
};

// ✅ Download ticket as PDF
export const downloadTicketPDF = async (bookingId) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${BOOKING_API.GET_BY_ID(bookingId)}/ticket`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to download ticket');
    }
    
    const blob = await response.blob();
    return blob;
  } catch (error) {
    throw error || { message: 'Failed to download ticket' };
  }
};