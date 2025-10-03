import axios from "axios";

// ✅ Dynamically fetch API base URL from .env
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ✅ Create axios instance with default config
export const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// ✅ Request interceptor to add auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response interceptor to handle common errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid → clear storage & redirect
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
    }
    console.error("❌ API Response Error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      config: error.config,
    });
    return Promise.reject(error);
  }
);

// ✅ Auth Endpoints
export const AUTH_API = {
  LOGIN: `/auth/login`,
  REGISTER: `/auth/register`,
  LOGOUT: `/auth/logout`,
  VERIFY_EMAIL: `/auth/verify-email`,
  RESEND_VERIFICATION: `/auth/resend-verification`,
  FORGOT_PASSWORD: `/auth/forgot-password`,
  RESET_PASSWORD: `/auth/reset-password`,
  REFRESH_TOKEN: `/auth/refresh-token`,
  UPDATE_PROFILE: `/auth/profile`,
  CHANGE_PASSWORD: `/auth/change-password`,
  CHECK_SESSION: `/auth/session`,
  // ME: `/auth/me`,
};

// ✅ User Endpoints
export const USER_API = {
  PROFILE: `/users/profile`,
  UPDATE: `/users/profile`,
  DELETE: (userId) => `/users/${userId}`,
  WALLET: `/users/wallet`,
  WALLET_TRANSACTIONS: `/users/wallet/transactions`,
  PREFERENCES: `/users/preferences`,
  GET_USER: (userId) => `/users/${userId}`,
  GET_ALL: `/users`,
  STATS: `/users/admin/stats`,
};

// ✅ Booking Endpoints
export const BOOKING_API = {
  CREATE: `/bookings`,
  GET_MY_BOOKINGS: `/bookings`,
  GET_ALL_BOOKINGS: `/bookings/all`,
  GET_BY_ID: (bookingId) => `/bookings/${bookingId}`,
  CANCEL: (bookingId) => `/bookings/${bookingId}/cancel`,
  CHECK_AVAILABILITY: `/bookings/check-availability`,
  GET_BUS_AVAILABILITY: (busId) => `/bookings/bus/${busId}/availability`,
  ANALYTICS: `/bookings/analytics`,
  EXPORT: `/bookings/export`,
  GET_USER_BOOKINGS: (userId) => `/bookings/user/${userId}`,
  UPDATE: (bookingId) => `/bookings/${bookingId}`,
};

// ✅ Bus Endpoints
export const BUS_API = {
  GET_ALL: `/buses`,
  GET_BY_ROUTE: `/buses/route`,
  GET_BY_ID: (busId) => `/buses/${busId}`,
  GET_AVAILABILITY: (busId) => `/buses/availability/${busId}`,
  CREATE: `/buses`,
  UPDATE: (busId) => `/buses/${busId}`,
  UPDATE_STATUS: (busId) => `/buses/${busId}/status`,
  DELETE: (busId) => `/buses/${busId}`,
  ANALYTICS: `/buses/admin/analytics`,
  EXPORT: `/buses/admin/export`,
};

// ✅ Captain Endpoints
export const CAPTAIN_API = {
  REGISTER: `/captains`,
  GET_ALL: `/captains`,
  GET_STATS: `/captains/stats`,
  GET_BY_ID: (captainId) => `/captains/${captainId}`,
  GET_AVAILABILITY: (captainId) => `/captains/${captainId}/availability`,
  UPDATE: (captainId) => `/captains/${captainId}`,
  UPDATE_AVAILABILITY: (captainId) => `/captains/${captainId}/availability`,
  ASSIGN_BUS: (captainId) => `/captains/${captainId}/assign-bus`,
  REMOVE_BUS: (captainId) => `/captains/${captainId}/remove-bus`,
  DELETE: (captainId) => `/captains/${captainId}`,
};

// ✅ Refund Endpoints
export const REFUND_API = {
  REQUEST: (ticketId) => `/refunds/request/${ticketId}`,
  GET_HISTORY: `/refunds/history`,
  GET_DETAILS: (refundId) => `/refunds/${refundId}`,
  PROCESS_MANUAL: `/refunds/admin/manual`,
  UPDATE_STATUS: (refundId) => `/refunds/admin/${refundId}/status`,
  GET_STATS: `/refunds/admin/stats`,
  EXPORT: `/refunds/admin/export`,
  GET_ALL: `/refunds/admin/all`,
};

// ✅ Utility function for API calls
export const apiCall = async (method, url, data = null, config = {}) => {
  try {
    const response = await API({ method, url, data, ...config });
    return response.data;
  } catch (err) {
    console.error("❌ API Call Error:", err);
    throw err.response?.data || { message: err.message };
  }
};

// ✅ Utility function to attach auth header
export const withAuthHeader = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export default API;
