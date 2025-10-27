/**
 * Keep-Alive Service
 * Prevents Render free tier from spinning down backend server
 * Pings the server every 10 minutes to keep it awake
 */

const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

class KeepAliveService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.failureCount = 0;
    this.maxFailures = 3;
  }

  /**
   * Start the keep-alive ping service
   */
  start() {
    if (this.isRunning) {
      if (import.meta.env.DEV) console.log('⏰ Keep-alive service already running');
      return;
    }

    if (import.meta.env.DEV) console.log('🚀 Starting keep-alive service - Pinging server every 10 minutes');
    
    // Initial ping
    this.ping();
    
    // Set up interval
    this.intervalId = setInterval(() => {
      this.ping();
    }, PING_INTERVAL);
    
    this.isRunning = true;
  }

  /**
   * Stop the keep-alive service
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      if (import.meta.env.DEV) console.log('🛑 Keep-alive service stopped');
    }
  }

  /**
   * Ping the backend server
   */
  async ping() {
    try {
      const pingUrl = `${BACKEND_URL.replace('/api/v1', '')}/ping`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(pingUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        this.failureCount = 0; // Reset failure count on success
        const data = await response.json();
        if (import.meta.env.DEV) console.log('✅ Keep-alive ping successful', new Date(data.timestamp).toLocaleTimeString());
      } else {
        this.handlePingFailure(`Server returned status: ${response.status}`);
      }
    } catch (error) {
      this.handlePingFailure(error.message);
    }
  }

  /**
   * Handle ping failures
   */
  handlePingFailure(errorMessage) {
    this.failureCount++;
    if (import.meta.env.DEV) console.warn(`⚠️ Keep-alive ping failed (${this.failureCount}/${this.maxFailures}):`, errorMessage);
    
    // If too many failures, stop the service to avoid console spam
    if (this.failureCount >= this.maxFailures) {
      if (import.meta.env.DEV) console.error('❌ Keep-alive service stopped due to repeated failures');
      this.stop();
    }
  }

  /**
   * Check if service is running
   */
  isActive() {
    return this.isRunning;
  }

  /**
   * Get failure count
   */
  getFailureCount() {
    return this.failureCount;
  }
}

// Create singleton instance
const keepAliveService = new KeepAliveService();

export default keepAliveService;
