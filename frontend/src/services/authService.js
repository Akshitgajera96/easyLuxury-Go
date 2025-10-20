import apiClient from './apiClient';

class AuthService {
  async login(email, password) {
    const response = await apiClient.post('/auth/login', { email, password });
    // LocalStorage is handled by AuthContext
    return response;
  }

  async adminLogin(email, password) {
    const response = await apiClient.post('/auth/admin/login', { email, password });
    // LocalStorage is handled by AuthContext
    return response;
  }

  async staffLogin(email, password) {
    const response = await apiClient.post('/auth/staff/login', { email, password });
    // LocalStorage is handled by AuthContext
    return response;
  }

  async staffRegister(staffData) {
    const response = await apiClient.post('/auth/staff/register', staffData);
    return response;
  }

  async checkStaffLoginStatus(requestId) {
    return await apiClient.get(`/auth/staff/login-status/${requestId}`);
  }

  async register(userData) {
    return await apiClient.post('/auth/register', userData);
  }

  async logout() {
    try {
      // 🔐 SECURE TOKEN HANDLING - Clear all role-specific tokens from sessionStorage
      sessionStorage.removeItem('adminToken');
      sessionStorage.removeItem('staffToken');
      sessionStorage.removeItem('userToken');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('activeRole');
      sessionStorage.removeItem('adminUser');
      sessionStorage.removeItem('staffUser');
      sessionStorage.removeItem('customerUser');
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  getToken() {
    // 🔐 SECURE TOKEN HANDLING - Return any available token from sessionStorage
    return sessionStorage.getItem('adminToken') || 
           sessionStorage.getItem('staffToken') || 
           sessionStorage.getItem('userToken');
  }

  getCurrentUser() {
    // 🔐 SECURE TOKEN HANDLING - Get user from sessionStorage
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  hasRole(role) {
    const user = this.getCurrentUser();
    return user && user.role === role;
  }

  updateProfile(userData) {
    return apiClient.put('/users/profile', userData);
  }

  forgotPassword(email) {
    return apiClient.post('/auth/forgot-password', { email });
  }

  resetPassword(token, newPassword) {
    return apiClient.post('/auth/reset-password', { token, newPassword });
  }

  verifyEmail(token) {
    return apiClient.post('/auth/verify-email', { token });
  }
}

export const authService = new AuthService();
export default authService;