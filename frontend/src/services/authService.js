// src/services/authService.js
import { apiCall, AUTH_API } from './api';

// ✅ Register a new user
export const registerUser = async (userData) => {
  try {
    return await apiCall('post', AUTH_API.REGISTER, userData);
  } catch (error) {
    throw error || { message: 'Registration failed. Please try again.' };
  }
};

// ✅ Login user
export const loginUser = async (credentials) => {
  try {
    const response = await apiCall('post', AUTH_API.LOGIN, credentials);
    
    // Store tokens if available
    if (response.accessToken) {
      localStorage.setItem('accessToken', response.accessToken);
    }
    if (response.refreshToken) {
      localStorage.setItem('refreshToken', response.refreshToken);
    }
    if (response.user) {
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  } catch (error) {
    throw error || { message: 'Login failed. Please try again.' };
  }
};

// ✅ Logout user
export const logoutUser = async () => {
  try {
    // Call backend logout if needed
    await apiCall('post', AUTH_API.LOGOUT);
  } catch (error) {
    console.error('Logout API error:', error);
    // Continue with client-side cleanup even if API call fails
  } finally {
    // Always clear client-side storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    return { message: 'Logged out successfully.' };
  }
};

// ✅ Refresh access token
export const refreshToken = async (refreshToken) => {
  try {
    const response = await apiCall('post', AUTH_API.REFRESH_TOKEN, { refreshToken });
    
    if (response.accessToken) {
      localStorage.setItem('accessToken', response.accessToken);
    }
    
    return response;
  } catch (error) {
    // If refresh fails, clear storage and redirect to login
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    throw error || { message: 'Session expired. Please login again.' };
  }
};

// ✅ Verify email
export const verifyEmail = async (token) => {
  try {
    return await apiCall('post', AUTH_API.VERIFY_EMAIL, { token });
  } catch (error) {
    throw error || { message: 'Email verification failed.' };
  }
};

// ✅ Resend email verification
export const resendVerification = async (email) => {
  try {
    return await apiCall('post', AUTH_API.RESEND_VERIFICATION, { email });
  } catch (error) {
    throw error || { message: 'Failed to resend verification email.' };
  }
};

// ✅ Forgot password
export const forgotPassword = async (email) => {
  try {
    return await apiCall('post', AUTH_API.FORGOT_PASSWORD, { email });
  } catch (error) {
    throw error || { message: 'Failed to send password reset email.' };
  }
};

// ✅ Reset password
export const resetPassword = async (resetData) => {
  try {
    return await apiCall('post', AUTH_API.RESET_PASSWORD, resetData);
  } catch (error) {
    throw error || { message: 'Failed to reset password.' };
  }
};

// ✅ Get current user profile
export const getProfile = async () => {
  try {
    return await apiCall('get', AUTH_API.GET_ME);
  } catch (error) {
    throw error || { message: 'Failed to fetch user profile.' };
  }
};

// ✅ Update user profile
export const updateProfile = async (profileData) => {
  try {
    const response = await apiCall('put', AUTH_API.UPDATE_PROFILE, profileData);
    
    // Update local storage if user data is returned
    if (response.user) {
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  } catch (error) {
    throw error || { message: 'Failed to update profile.' };
  }
};

// ✅ Change password
export const changePassword = async (passwordData) => {
  try {
    return await apiCall('put', AUTH_API.CHANGE_PASSWORD, passwordData);
  } catch (error) {
    throw error || { message: 'Failed to change password.' };
  }
};

// ✅ Check session validity
export const checkSession = async () => {
  try {
    return await apiCall('get', AUTH_API.CHECK_SESSION);
  } catch (error) {
    throw error || { message: 'Session check failed.' };
  }
};

// ✅ Utility function to get stored user data
export const getStoredUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error parsing stored user:', error);
    return null;
  }
};

// ✅ Utility function to get stored token
export const getStoredToken = () => {
  return localStorage.getItem('accessToken');
};

// ✅ Utility function to check if user is authenticated
export const isAuthenticated = () => {
  const token = getStoredToken();
  const user = getStoredUser();
  return !!(token && user);
};