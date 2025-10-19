import apiClient from './apiClient';

class BusService {
  // Get all buses (Admin only)
  getAllBuses(params = {}) {
    return apiClient.get('/buses', { params });
  }

  // Get bus by ID (Admin only)
  getBusById(busId) {
    return apiClient.get(`/buses/${busId}`);
  }

  // Create new bus (Admin only)
  createBus(busData) {
    return apiClient.post('/buses', busData);
  }

  // Update bus (Admin only)
  updateBus(busId, busData) {
    return apiClient.put(`/buses/${busId}`, busData);
  }

  // Delete bus (Admin only)
  deleteBus(busId) {
    return apiClient.delete(`/buses/${busId}`);
  }

  // Toggle bus status (Admin only)
  toggleBusStatus(busId) {
    return apiClient.patch(`/buses/${busId}/toggle-status`);
  }
}

export default new BusService();
