import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1',
  timeout: 60000, // Increased to 60 seconds for Render cold starts
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track first request for "waking up" detection
let isFirstRequest = true;

apiClient.interceptors.request.use(
  (config) => {
    // Track request start time for slow response detection
    config.metadata = { startTime: Date.now() };
    
    // 🔐 SECURE TOKEN HANDLING - Using sessionStorage for tab-scoped tokens
    // Role-aware token selection based on endpoint or explicit role
    let token = null;
    
    // Option 1: Explicitly set role in config (e.g., { role: 'admin' })
    if (config.role) {
      switch (config.role) {
        case 'admin':
          token = sessionStorage.getItem('adminToken');
          break;
        case 'staff':
          token = sessionStorage.getItem('staffToken');
          break;
        case 'user':
        case 'customer':
          token = sessionStorage.getItem('userToken');
          break;
      }
    } 
    // Option 2: Auto-detect based on URL
    else {
      const url = config.url || '';
      if (url.includes('/admin/')) {
        token = sessionStorage.getItem('adminToken');
      } else if (url.includes('/staff/')) {
        token = sessionStorage.getItem('staffToken');
      } else {
        // For general endpoints, use active role or fallback
        const activeRole = sessionStorage.getItem('activeRole');
        if (activeRole === 'admin') {
          token = sessionStorage.getItem('adminToken');
        } else if (activeRole === 'staff') {
          token = sessionStorage.getItem('staffToken');
        } else {
          token = sessionStorage.getItem('userToken');
        }
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    // Calculate response time for performance monitoring
    const duration = Date.now() - (response.config.metadata?.startTime || Date.now());
    
    // Log slow responses (> 3 seconds)
    if (duration > 3000) {
      console.warn(`⚠️ Slow API response: ${response.config.url} took ${duration}ms`);
    }
    
    // Mark that first request completed successfully
    if (isFirstRequest) {
      isFirstRequest = false;
      if (duration > 5000) {
        console.log('✅ Server woke up from cold start');
      }
    }
    
    return response.data;
  },
  (error) => {
    // Enhanced error handling with better messages
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error('❌ Request timeout - Server may be cold starting');
      error.isTimeout = true;
      error.message = 'Server is taking longer than expected. It may be starting up. Please try again.';
    }
    
    if (error.response?.status === 401) {
      // 🔐 SECURE TOKEN HANDLING - Clear all role-specific tokens from sessionStorage
      sessionStorage.removeItem('adminToken');
      sessionStorage.removeItem('staffToken');
      sessionStorage.removeItem('userToken');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('activeRole');
      sessionStorage.removeItem('adminUser');
      sessionStorage.removeItem('staffUser');
      sessionStorage.removeItem('customerUser');
      
      // Only redirect if we're not already on a login/pending page
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && 
          !currentPath.includes('/staff/login-pending') &&
          !currentPath.includes('/staff/pending') &&
          !currentPath.includes('/register')) {
        // Redirect to appropriate login page based on current route
        if (currentPath.includes('/admin')) {
          window.location.href = '/login'; // Admin login via main login page
        } else if (currentPath.includes('/staff')) {
          window.location.href = '/staff/login';
        } else {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;