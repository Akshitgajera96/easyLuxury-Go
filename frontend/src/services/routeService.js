import API, { apiCall, BUS_API } from "./api";
import { AUTH_API, USER_API } from './api';

// 🚏 Get all routes with filtering and pagination
export const getAllRoutes = async (params = {}) => {
  try {
    const response = await apiCall("get", BUS_API.GET_BY_ROUTE, null, { params });
    return response.data;
  } catch (error) {
    throw error || { message: "Failed to fetch routes" };
  }
};

export const getProfile = async () => {
  try {
    // ✅ Corrected URL
    const response = await apiCall('get', USER_API.ME || '/users/me');
    return response;
  } catch (error) {
    console.error('❌ Failed to fetch user profile:', error);
    throw error;
  }
};

// 📍 Get route suggestions for search/autocomplete
export const getRouteSuggestions = async (query, limit = 10) => {
  try {
    const response = await apiCall("get", BUS_API.GET_BY_ROUTE, null, {
      params: { search: query, limit },
    });
    return response.data;
  } catch (error) {
    throw error || { message: "Failed to fetch route suggestions" };
  }
};

// 🔍 Search routes with filters
// src/services/routeService.js
export const searchRoutes = async ({ from, to, date, passengers }) => {
  try {
    const params = { from, to, date, passengers }; // ✅ flat object
    const response = await apiCall('get', '/buses/search', null, { params });
    return response.data;
  } catch (error) {
    console.error("Search API error:", error?.response?.data || error?.message);
    throw error;
  }
};


// 📊 Get popular routes
export const getPopularRoutes = async (params = {}) => {
  console.log("Fetching popular routes with params:", params);
  try {
    const response = await apiCall('get', '/buses/popular', null, { params });
    return response.data; // ✅ return only data
  } catch (error) {
    console.error("Failed to fetch popular routes:", error?.response?.data || error?.message);
    throw error?.response?.data || { message: 'Failed to fetch popular routes' };
  }
};

// ✅ Featured routes
export const getFeaturedRoutes = async (params = {}) => {
  console.log("Fetching featured routes with params:", params);
  try {
    const response = await apiCall('get', '/buses/featured', null, { params });
    return response.data; // ✅ return only data
  } catch (error) {
    console.error("Failed to fetch featured routes:", error?.response?.data || error?.message);
    throw error?.response?.data || { message: 'Failed to fetch featured routes' };
  }
};


// 🗺️ Get routes with map data
export const getRoutesWithMap = async (bounds = null) => {
  try {
    const params = bounds
      ? {
          minLat: bounds.sw.lat,
          maxLat: bounds.ne.lat,
          minLng: bounds.sw.lng,
          maxLng: bounds.ne.lng,
        }
      : {};
    const response = await apiCall("get", `${BUS_API.GET_BY_ROUTE}/map`, null, { params });
    return response.data;
  } catch (error) {
    throw error || { message: "Failed to fetch routes with map data" };
  }
};

// 📅 Get routes by date range
export const getRoutesByDateRange = async (startDate, endDate, params = {}) => {
  try {
    return await apiCall("get", BUS_API.GET_BY_ROUTE, null, {
      params: { startDate, endDate, ...params },
    });
  } catch (error) {
    throw error || { message: "Failed to fetch routes by date range" };
  }
};

// 🚌 Get buses for a specific route
export const getBusesForRoute = async (from, to, date = null, params = {}) => {
  try {
    const queryParams = { from, to, date, ...params };
    Object.keys(queryParams).forEach(
      (key) => queryParams[key] === undefined && delete queryParams[key]
    );

    return await apiCall("get", BUS_API.GET_BY_ROUTE, null, { params: queryParams });
  } catch (error) {
    throw error || { message: "Failed to fetch buses for route" };
  }
};

// 📍 Get route distance and duration
export const getRouteInfo = async (from, to) => {
  try {
    return await apiCall("get", BUS_API.GET_BY_ROUTE, null, {
      params: { from, to, infoOnly: true },
    });
  } catch (error) {
    throw error || { message: "Failed to fetch route information" };
  }
};

// 🎯 Get routes with availability
export const getRoutesWithAvailability = async (from, to, date, passengers = 1) => {
  try {
    return await apiCall("get", BUS_API.GET_BY_ROUTE, null, {
      params: { from, to, date, passengers, availableOnly: true },
    });
  } catch (error) {
    throw error || { message: "Failed to fetch routes with availability" };
  }
};

// 🚌 Get all buses (used by BusesPage.jsx)
export const getAllBuses = async () => {
  try {
    const res = await API.get(BUS_API.GET_ALL);
    return res.data;
  } catch (error) {
    throw error || { message: "Failed to fetch all buses" };
  }
};

// 💰 Get route pricing information
export const getRoutePricing = async (routeId, travelDate, passengers = 1) => {
  try {
    const response = await apiCall("get", `${BUS_API.GET_BY_ROUTE}/pricing`, null, {
      params: { routeId, travelDate, passengers },
    });
    return response.data;
  } catch (error) {
    throw error || { message: "Failed to fetch route pricing" };
  }
};

// 📊 Get route statistics (admin only)
export const getRouteStats = async (period = "month") => {
  try {
    const response = await apiCall("get", `${BUS_API.GET_BY_ROUTE}/stats`, null, {
      params: { period },
    });
    return response.data;
  } catch (error) {
    throw error || { message: "Failed to fetch route statistics" };
  }
};

// 🗺️ Utility function to calculate route distance (client-side fallback)
export const calculateRouteDistance = (from, to) => {
  const routes = {
    "new-york-boston": { distance: 215, duration: 240, unit: "miles" },
    "los-angeles-san-francisco": { distance: 382, duration: 360, unit: "miles" },
    "chicago-detroit": { distance: 282, duration: 270, unit: "miles" },
    "miami-orlando": { distance: 235, duration: 210, unit: "miles" },
    "seattle-portland": { distance: 173, duration: 180, unit: "miles" },
  };

  const routeKey = `${from.toLowerCase()}-${to.toLowerCase()}`;
  return routes[routeKey] || { distance: 150, duration: 180, unit: "miles" };
};

// 🕒 Utility function to estimate travel time
export const estimateTravelTime = (distance, averageSpeed = 60) => {
  const hours = distance / averageSpeed;
  const minutes = Math.round((hours - Math.floor(hours)) * 60);
  return { hours: Math.floor(hours), minutes };
};
