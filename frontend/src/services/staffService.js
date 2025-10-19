import apiClient from './apiClient';

class StaffService {
  // ❌ REMOVED DUPLICATE: Staff login is handled by authService.staffLogin()
  // That method calls /auth/staff/login with proper approval checks
  // DO NOT use /staff/login endpoint (it doesn't exist anymore)

  // Create new staff member (Admin only)
  createStaff(staffData) {
    return apiClient.post('/staff', staffData);
  }

  // Get all staff (Admin only)
  getAllStaff(params = {}) {
    return apiClient.get('/staff', { params });
  }

  // Get available drivers (Admin only)
  getAvailableDrivers() {
    return apiClient.get('/staff/drivers/available');
  }

  // Get staff by ID (Admin only)
  getStaffById(staffId) {
    return apiClient.get(`/staff/${staffId}`);
  }

  // Update staff (Admin only)
  updateStaff(staffId, staffData) {
    return apiClient.put(`/staff/${staffId}`, staffData);
  }

  // Delete staff (Admin only)
  deleteStaff(staffId) {
    return apiClient.delete(`/staff/${staffId}`);
  }

  // Toggle staff status (Admin only)
  toggleStaffStatus(staffId) {
    return apiClient.patch(`/staff/${staffId}/toggle-status`);
  }

  // Assign bus to staff (Admin only)
  assignBusToStaff(staffId, busId) {
    return apiClient.patch(`/staff/${staffId}/assign-bus`, { busId });
  }

  // Get all bookings (Staff accessible)
  getAllBookings(params = {}) {
    return apiClient.get('/staff/bookings', { params });
  }

  // Get booking details (Staff accessible)
  getBookingDetails(bookingId) {
    return apiClient.get(`/staff/bookings/${bookingId}`);
  }

  // Update booking status (Staff accessible)
  updateBookingStatus(bookingId, status) {
    return apiClient.patch(`/staff/bookings/${bookingId}/status`, { status });
  }
}

export default new StaffService();