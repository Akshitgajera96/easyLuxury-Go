import apiClient from './apiClient';

class TripService {
  // Search trips by source, destination, and date
  // searchParams: { from, to, date, days (optional, default: 3) }
  searchTrips(searchParams) {
    const params = {
      ...searchParams,
      days: searchParams.days || 3 // Default to 3 days
    };
    return apiClient.get('/trips/search', { params });
  }

  // Get trip by ID
  getTripById(tripId) {
    return apiClient.get(`/trips/${tripId}`);
  }

  // Get all trips (Public - shows available trips)
  getAllTrips(params = {}) {
    // Add default params to get upcoming trips
    const defaultParams = {
      limit: 100, // Get more trips
      ...params
    }
    return apiClient.get('/trips', { params: defaultParams });
  }

  // Create new trip (Admin only)
  createTrip(tripData) {
    return apiClient.post('/trips', tripData);
  }

  // Update trip details (Admin only)
  updateTrip(tripId, updateData) {
    return apiClient.put(`/trips/${tripId}`, updateData);
  }

  // Update trip status (Admin only)
  updateTripStatus(tripId, status) {
    return apiClient.patch(`/trips/${tripId}/status`, { status });
  }
}

export default new TripService();