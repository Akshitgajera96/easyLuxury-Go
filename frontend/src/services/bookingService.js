import apiClient from './apiClient';

class BookingService {
  // Create a new booking
  createBooking(bookingData) {
    return apiClient.post('/bookings', bookingData);
  }

  // Get user's bookings
  getUserBookings() {
    return apiClient.get('/bookings/mybookings');
  }

  // Get booking by ID
  getBookingById(bookingId) {
    return apiClient.get(`/bookings/${bookingId}`);
  }

  // Cancel a booking
  cancelBooking(bookingId, reason = '') {
    return apiClient.put(`/bookings/${bookingId}/cancel`, { reason });
  }
}

export default new BookingService();