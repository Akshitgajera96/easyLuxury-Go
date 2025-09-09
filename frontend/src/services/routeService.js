// src/services/routeService.js
import { apiCall, BUS_API } from './api';

// 🚏 Get all routes with filtering and pagination
export const getAllRoutes = async (params = {}) => {
  try {
    return await apiCall('get', BUS_API.GET_BY_ROUTE, null, { params });
  } catch (error) {
    throw error || { message: 'Failed to fetch routes' };
  }
};

// 📍 Get route suggestions for search/autocomplete
export const getRouteSuggestions = async (query, limit = 10) => {
  try {
    return await apiCall('get', BUS_API.GET_BY_ROUTE, null, {
      params: { search: query, limit }
    });
  } catch (error) {
    throw error || { message: 'Failed to fetch route suggestions' };
  }
};

// 🔍 Search routes with filters
export const searchRoutes = async (filters = {}) => {
  try {
    const { from, to, date, sortBy, sortOrder, page, limit, ...otherFilters } = filters;
    
    const params = {
      routeFrom: from,
      routeTo: to,
      date,
      sortBy,
      sortOrder,
      page,
      limit,
      ...otherFilters
    };
    
    // Remove undefined params
    Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
    
    return await apiCall('get', BUS_API.GET_BY_ROUTE, null, { params });
  } catch (error) {
    throw error || { message: 'Failed to search routes' };
  }
};

// 📊 Get popular routes
export const getPopularRoutes = async (limit = 10) => {
  try {
    return await apiCall('get', '/buses/popular', null, { params: { limit } });
  } catch (error) {
    throw error || { message: 'Failed to fetch popular routes' };
  }
};

// ⭐ Get featured routes
export const getFeaturedRoutes = async () => {
  try {
    return await apiCall('get', '/buses/featured');
  } catch (error) {
    throw error || { message: 'Failed to fetch featured routes' };
  }
};


// 🗺️ Get routes with map data
export const getRoutesWithMap = async (bounds = null) => {
  try {
    const params = bounds ? { 
      minLat: bounds.sw.lat,
      maxLat: bounds.ne.lat,
      minLng: bounds.sw.lng,
      maxLng: bounds.ne.lng
    } : {};
    
    return await apiCall('get', `${BUS_API.GET_BY_ROUTE}/map`, null, { params });
  } catch (error) {
    throw error || { message: 'Failed to fetch routes with map data' };
  }
};


// 📅 Get routes by date range
export const getRoutesByDateRange = async (startDate, endDate, params = {}) => {
  try {
    return await apiCall('get', BUS_API.GET_BY_ROUTE, null, {
      params: { startDate, endDate, ...params }
    });
  } catch (error) {
    throw error || { message: 'Failed to fetch routes by date range' };
  }
};

// 🚌 Get buses for a specific route
export const getBusesForRoute = async (from, to, date = null, params = {}) => {
  try {
    const queryParams = {
      from,
      to,
      date,
      ...params
    };
    
    // Remove undefined params
    Object.keys(queryParams).forEach(key => queryParams[key] === undefined && delete queryParams[key]);
    
    return await apiCall('get', BUS_API.GET_BY_ROUTE, null, { params: queryParams });
  } catch (error) {
    throw error || { message: 'Failed to fetch buses for route' };
  }
};

// 📍 Get route distance and duration
export const getRouteInfo = async (from, to) => {
  try {
    return await apiCall('get', BUS_API.GET_BY_ROUTE, null, {
      params: { from, to, infoOnly: true }
    });
  } catch (error) {
    throw error || { message: 'Failed to fetch route information' };
  }
};

// 🎯 Get routes with availability
export const getRoutesWithAvailability = async (from, to, date, passengers = 1) => {
  try {
    return await apiCall('get', BUS_API.GET_BY_ROUTE, null, {
      params: { from, to, date, passengers, availableOnly: true }
    });
  } catch (error) {
    throw error || { message: 'Failed to fetch routes with availability' };
  }
};

// 💰 Get route pricing information
export const getRoutePricing = async (routeId, travelDate, passengers = 1) => {
  try {
    return await apiCall('get', `${BUS_API.GET_BY_ROUTE}/pricing`, null, {
      params: { routeId, travelDate, passengers }
    });
  } catch (error) {
    throw error || { message: 'Failed to fetch route pricing' };
  }
};

// 📊 Get route statistics (admin only)
export const getRouteStats = async (period = 'month') => {
  try {
    return await apiCall('get', `${BUS_API.GET_BY_ROUTE}/stats`, null, {
      params: { period }
    });
  } catch (error) {
    throw error || { message: 'Failed to fetch route statistics' };
  }
};

// 🗺️ Utility function to calculate route distance (client-side fallback)
export const calculateRouteDistance = (from, to) => {
  // This is a simplified client-side estimation
  // In a real app, you might use a mapping service API
  const routes = {
    'new-york-boston': { distance: 215, duration: 240, unit: 'miles' },
    'los-angeles-san-francisco': { distance: 382, duration: 360, unit: 'miles' },
    'chicago-detroit': { distance: 282, duration: 270, unit: 'miles' },
    'miami-orlando': { distance: 235, duration: 210, unit: 'miles' },
    'seattle-portland': { distance: 173, duration: 180, unit: 'miles' }
  };
  
  const routeKey = `${from.toLowerCase()}-${to.toLowerCase()}`;
  return routes[routeKey] || { distance: 150, duration: 180, unit: 'miles' };
};

// 🕒 Utility function to estimate travel time
export const estimateTravelTime = (distance, averageSpeed = 60) => {
  const hours = distance / averageSpeed;
  const minutes = Math.round((hours - Math.floor(hours)) * 60);
  return { hours: Math.floor(hours), minutes };
};