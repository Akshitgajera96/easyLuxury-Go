import apiClient from './apiClient';

class RouteService {
  // Search routes by source and destination
  searchRoutes(searchParams) {
    return apiClient.get('/routes/search', { params: searchParams });
  }

  // Get all routes (Admin only)
  getAllRoutes(params = {}) {
    return apiClient.get('/routes', { params });
  }

  // Get route by ID (Admin only)
  getRouteById(routeId) {
    return apiClient.get(`/routes/${routeId}`);
  }

  // Create new route (Admin only)
  createRoute(routeData) {
    return apiClient.post('/routes', routeData);
  }

  // Update route (Admin only)
  updateRoute(routeId, routeData) {
    return apiClient.put(`/routes/${routeId}`, routeData);
  }

  // Delete route (Admin only)
  deleteRoute(routeId) {
    return apiClient.delete(`/routes/${routeId}`);
  }

  // Toggle dynamic pricing (Admin only)
  toggleDynamicPricing(routeId) {
    return apiClient.patch(`/routes/${routeId}/toggle-pricing`);
  }
}

export default new RouteService();
