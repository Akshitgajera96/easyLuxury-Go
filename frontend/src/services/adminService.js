import apiClient from './apiClient';

class AdminService {
  // Dashboard and analytics
  getDashboardAnalytics() {
    return apiClient.get('/admin/analytics/dashboard');
  }

  getDetailedAnalytics(dateRange = {}) {
    return apiClient.get('/admin/analytics/detailed', { params: dateRange });
  }

  getRevenueAnalytics() {
    return apiClient.get('/admin/analytics/revenue');
  }

  getBookingAnalytics() {
    return apiClient.get('/admin/analytics/bookings');
  }

  getUserAnalytics() {
    return apiClient.get('/admin/analytics/users');
  }

  getOperationalAnalytics() {
    return apiClient.get('/admin/analytics/operational');
  }

  // User management
  getUsersManagement() {
    return apiClient.get('/admin/users');
  }

  toggleUserStatus(userId) {
    return apiClient.patch(`/admin/users/${userId}/toggle-status`);
  }

  updateUserRole(userId, role) {
    return apiClient.patch(`/admin/users/${userId}/role`, { role });
  }

  deleteUser(userId) {
    return apiClient.delete(`/admin/users/${userId}`);
  }

  // System health
  getSystemHealth() {
    return apiClient.get('/admin/system/health');
  }

  // Staff Management
  addStaff(staffData) {
    return apiClient.post('/admin/staff/add', staffData);
  }

  getAllStaff(filters = {}) {
    return apiClient.get('/admin/staff', { params: filters });
  }

  approveStaff(staffId) {
    return apiClient.patch(`/admin/staff/${staffId}/approve`);
  }

  rejectStaff(staffId) {
    return apiClient.patch(`/admin/staff/${staffId}/reject`);
  }

  toggleStaffStatus(staffId) {
    return apiClient.patch(`/admin/staff/${staffId}/toggle-status`);
  }

  deleteStaff(staffId) {
    return apiClient.delete(`/admin/staff/${staffId}`);
  }

  // Booking Management
  getAllBookings(filters = {}) {
    return apiClient.get('/admin/bookings', { params: filters });
  }

  getBookingDetails(bookingId) {
    return apiClient.get(`/admin/bookings/${bookingId}`);
  }

  updateBookingStatus(bookingId, status) {
    return apiClient.patch(`/admin/bookings/${bookingId}/status`, { status });
  }

  // Staff Registration Management (New API)
  getPendingStaff() {
    return apiClient.get('/admin/staff/pending');
  }

  getPendingStaffCount() {
    return apiClient.get('/admin/staff/pending/count');
  }

  approveStaffRegistration(staffId, reason = null) {
    return apiClient.post(`/admin/staff/${staffId}/approve-registration`, { reason });
  }

  rejectStaffRegistration(staffId, reason = null) {
    return apiClient.post(`/admin/staff/${staffId}/reject-registration`, { reason });
  }

  cancelStaffRegistration(staffId, reason = null) {
    return apiClient.post(`/admin/staff/${staffId}/cancel-registration`, { reason });
  }

  // Notification Management
  getNotifications(unreadOnly = false, limit = 50) {
    return apiClient.get('/admin/notifications', { 
      params: { unreadOnly, limit } 
    });
  }

  getUnreadNotificationCount() {
    return apiClient.get('/admin/notifications/unread/count');
  }

  markNotificationAsRead(notificationId) {
    return apiClient.patch(`/admin/notifications/${notificationId}/read`);
  }

  markAllNotificationsAsRead() {
    return apiClient.patch('/admin/notifications/read-all');
  }

  deleteNotification(notificationId) {
    return apiClient.delete(`/admin/notifications/${notificationId}`);
  }

  // Location Monitoring
  getAllMonitoredBuses() {
    return apiClient.get('/admin/location-monitor/buses');
  }

  getMonitoringStats() {
    return apiClient.get('/admin/location-monitor/stats');
  }

  getTripLocationStatus(tripId) {
    return apiClient.get(`/admin/location-monitor/trip/${tripId}`);
  }

  sendLocationReminder(tripId, customMessage = null) {
    return apiClient.post(`/admin/location-monitor/remind/${tripId}`, { 
      message: customMessage 
    });
  }

  getActivityLogs(filters = {}) {
    return apiClient.get('/admin/location-monitor/logs', { params: filters });
  }

  updateBusStatus(tripId, status, notes = null) {
    return apiClient.patch(`/admin/location-monitor/status/${tripId}`, { 
      status, 
      notes 
    });
  }
}

export default new AdminService();