/**
 * Cross-tab authentication communication using BroadcastChannel
 * Falls back to localStorage events for browsers that don't support BroadcastChannel
 * Handles logout synchronization across all browser tabs
 */

const CHANNEL_NAME = 'easyluxury_auth_channel';

export const createAuthChannel = () => {
  let broadcastChannel = null;
  const listeners = new Set();

  // Try to create BroadcastChannel (not supported in all browsers)
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    broadcastChannel.onmessage = (event) => {
      listeners.forEach(fn => fn(event.data));
    };
  } catch (error) {
    // Fallback to localStorage event for older browsers
    window.addEventListener('storage', (event) => {
      if (event.key === CHANNEL_NAME && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          listeners.forEach(fn => fn(data));
        } catch (err) {
          console.error('Failed to parse storage event data:', err);
        }
      }
    });
  }

  return {
    /**
     * Post a message to all other tabs
     * @param {Object} data - Data to broadcast (e.g., { type: 'logout' })
     */
    post: (data) => {
      if (broadcastChannel) {
        broadcastChannel.postMessage(data);
      } else {
        // Fallback: Use localStorage to trigger storage event in other tabs
        localStorage.setItem(CHANNEL_NAME, JSON.stringify(data));
        // Immediately remove to allow future messages with same content
        localStorage.removeItem(CHANNEL_NAME);
      }
    },

    /**
     * Subscribe to messages from other tabs
     * @param {Function} callback - Function to call when message received
     * @returns {Function} Unsubscribe function
     */
    subscribe: (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },

    /**
     * Clean up resources
     */
    close: () => {
      if (broadcastChannel) {
        broadcastChannel.close();
      }
      listeners.clear();
    }
  };
};

export default createAuthChannel;
