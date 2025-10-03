// src/services/authService.js
import { apiCall, AUTH_API } from './api';

// -------------------- Authentication APIs --------------------

// Register a new user
export const registerUser = async (userData) => {
  console.log("Attempting to register user:", userData.email);
  try {
    const response = await apiCall('post', AUTH_API.REGISTER, userData);
    console.log("✅ Registration successful:", response);
    return response;
  } catch (error) {
    let errMsg = 'Registration failed. Please try again.';
    if (error.response) {
      console.error('❌ Register API Backend Response:', error.response.data);
      errMsg = error.response.data || { message: errMsg };
    } else if (error.request) {
      console.error('❌ Register API No Response:', error.request);
      errMsg = { message: 'No response from server. Please check your network.' };
    } else {
      console.error('❌ Register API Setup Error:', error.message);
      errMsg = { message: error.message };
    }
    throw errMsg;
  }
};

// Login user
export const loginUser = async (credentials) => {
  console.log("Attempting to log in user:", credentials.email);
  try {
    const response = await apiCall('post', AUTH_API.LOGIN, credentials);
    console.log("✅ Login successful:", response);

    if (response.accessToken) localStorage.setItem('accessToken', response.accessToken);
    if (response.refreshToken) localStorage.setItem('refreshToken', response.refreshToken);
    if (response.user) localStorage.setItem('user', JSON.stringify(response.user));

    return response;
  } catch (error) {
    console.error("❌ Login API Error Response:", error?.response?.data || error?.message);
    throw error?.response?.data || { message: error?.message || 'Login failed. Please try again.' };
  }
};

// Logout user
export const logoutUser = async () => {
  console.log("Attempting to log out user.");
  try {
    await apiCall('post', AUTH_API.LOGOUT);
    console.log("✅ Logout API call successful.");
  } catch (error) {
    console.warn('Logout API error:', error?.response?.data || error.message);
  } finally {
    console.log("Clearing local storage tokens.");
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    return { message: 'Logged out successfully.' };
  }
};

// Refresh access token
export const refreshToken = async (refreshToken) => {
  console.log("Attempting to refresh access token.");
  try {
    const response = await apiCall('post', AUTH_API.REFRESH_TOKEN, { refreshToken });
    console.log("✅ Token refresh successful:", response);
    if (response.accessToken) localStorage.setItem('accessToken', response.accessToken);
    return response;
  } catch (error) {
    console.error("❌ Token refresh failed. Clearing tokens.", error?.response?.data || error?.message);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    throw error?.response?.data || { message: error?.message || 'Session expired. Please login again.' };
  }
};

// -------------------- Email & Password APIs --------------------

export const verifyEmail = async (token) => {
  console.log("Attempting to verify email with token.");
  try {
    const response = await apiCall('post', AUTH_API.VERIFY_EMAIL, { token });
    console.log("✅ Email verification successful.");
    return response;
  } catch (error) {
    console.error("❌ Email verification failed:", error?.response?.data || error?.message);
    throw error?.response?.data || { message: error?.message || 'Email verification failed.' };
  }
};

export const resendVerification = async (email) => {
  console.log("Attempting to resend verification email for:", email);
  try {
    const response = await apiCall('post', AUTH_API.RESEND_VERIFICATION, { email });
    console.log("✅ Resend verification successful.");
    return response;
  } catch (error) {
    console.error("❌ Failed to resend verification email:", error?.response?.data || error?.message);
    throw error?.response?.data || { message: error?.message || 'Failed to resend verification email.' };
  }
};

export const forgotPassword = async (email) => {
  console.log("Attempting forgot password for:", email);
  try {
    const response = await apiCall('post', AUTH_API.FORGOT_PASSWORD, { email });
    console.log("✅ Forgot password email sent successfully.");
    return response;
  } catch (error) {
    console.error("❌ Failed to send password reset email:", error?.response?.data || error?.message);
    throw error?.response?.data || { message: error?.message || 'Failed to send password reset email.' };
  }
};

export const resetPassword = async (resetData) => {
  console.log("Attempting to reset password for token:", resetData.token);
  try {
    const response = await apiCall('post', AUTH_API.RESET_PASSWORD, resetData);
    console.log("✅ Password reset successful.");
    return response;
  } catch (error) {
    console.error("❌ Failed to reset password:", error?.response?.data || error?.message);
    throw error?.response?.data || { message: error?.message || 'Failed to reset password.' };
  }
};

export const changePassword = async (passwordData) => {
  console.log("Attempting to change password.");
  try {
    const response = await apiCall('put', AUTH_API.CHANGE_PASSWORD, passwordData);
    console.log("✅ Password change successful.");
    return response;
  } catch (error) {
    console.error("❌ Failed to change password:", error?.response?.data || error?.message);
    throw error?.response?.data || { message: error?.message || 'Failed to change password.' };
  }
};

// -------------------- Profile APIs --------------------

export const getProfile = async () => {
  console.log("Attempting to fetch user profile.");
  try {
    const response = await apiCall('get', '/auth/me');
    console.log("✅ Profile fetched successfully:", response);
    return response;
  } catch (error) {
    console.error("❌ Failed to fetch user profile:", error?.response?.data || error?.message);
    throw error?.response?.data || { message: error?.message || 'Failed to fetch user profile.' };
  }
};

export const updateProfile = async (profileData) => {
  console.log("Attempting to update user profile:", profileData);
  try {
    const response = await apiCall('put', AUTH_API.UPDATE_PROFILE, profileData);
    console.log("✅ Profile updated successfully:", response);
    if (response.user) localStorage.setItem('user', JSON.stringify(response.user));
    return response;
  } catch (error) {
    console.error("❌ Failed to update profile:", error?.response?.data || error?.message);
    throw error?.response?.data || { message: error?.message || 'Failed to update profile.' };
  }
};

// -------------------- Wallet & Preferences --------------------

export const getWalletTransactions = async (params = {}) => {
  console.log("Attempting to fetch wallet transactions.");
  try {
    const response = await apiCall('get', '/users/wallet/transactions', null, { params });
    console.log("✅ Wallet transactions fetched successfully:", response);
    return response;
  } catch (error) {
    console.error("❌ Failed to fetch wallet transactions:", error?.response?.data || error?.message);
    throw error?.response?.data || { message: error?.message || 'Failed to fetch wallet transactions.' };
  }
};

export const updatePreferences = async (preferences) => {
  console.log("Attempting to update user preferences:", preferences);
  try {
    const response = await apiCall('put', '/users/preferences', preferences);
    console.log("✅ Preferences updated successfully:", response);
    return response;
  } catch (error) {
    console.error("❌ Failed to update preferences:", error?.response?.data || error?.message);
    throw error?.response?.data || { message: error?.message || 'Failed to update preferences.' };
  }
};

// -------------------- Session & Utility --------------------

export const checkSession = async () => {
  console.log("Attempting to check session.");
  try {
    const response = await apiCall('get', AUTH_API.CHECK_SESSION);
    console.log("✅ Session check successful.");
    return response;
  } catch (error) {
    console.error("❌ Session check failed:", error?.response?.data || error?.message);
    throw error?.response?.data || { message: error?.message || 'Session check failed.' };
  }
};

export const getStoredUser = () => {
  console.log("Attempting to get stored user from local storage.");
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('❌ Error parsing stored user:', error);
    return null;
  }
};

export const getStoredToken = () => {
  console.log("Attempting to get stored access token from local storage.");
  return localStorage.getItem('accessToken');
};

export const isAuthenticated = () => {
  const token = getStoredToken();
  const user = getStoredUser();
  return !!(token && user);
};
