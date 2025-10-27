/**
 * Socket Context for managing real-time WebSocket connections
 * Handles socket initialization, events, and connection state
 */

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const { isAuthenticated, token } = useAuth();
  const connectionAttempts = useRef(0);
  const isInitializing = useRef(false);
  const initTimeoutRef = useRef(null);

  useEffect(() => {
    // Clear any pending initialization timeout
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = null;
    }

    if (isAuthenticated && token) {
      // Prevent duplicate initialization
      if (isInitializing.current) {
        return;
      }

      // Add small delay to allow auth state to fully stabilize
      // This prevents race conditions on initial page load
      initTimeoutRef.current = setTimeout(() => {
        isInitializing.current = true;
        connectionAttempts.current = 0;
        setConnectionError(null);

        const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';
        
        // Only log in development
        if (import.meta.env.DEV) {
          console.log('🔌 Initializing Socket.IO connection to:', socketUrl);
        }

        // Initialize socket connection with improved config
        const newSocket = io(socketUrl, {
          auth: {
            token: token
          },
          transports: ['polling', 'websocket'], // Try polling first, then upgrade to websocket
          upgrade: true,
          reconnection: true,
          reconnectionAttempts: 10, // Increased from 5
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
          autoConnect: true,
          forceNew: false, // Reuse existing connection if possible
          multiplex: true
        });

        newSocket.on('connect', () => {
          setIsConnected(true);
          setConnectionError(null);
          connectionAttempts.current = 0;
          if (import.meta.env.DEV) {
            console.log('✅ Socket.IO connected successfully');
          }
        });

        newSocket.on('disconnect', (reason) => {
          setIsConnected(false);
          if (import.meta.env.DEV) {
            console.log('🔌 Socket.IO disconnected:', reason);
          }
        });

        newSocket.on('connect_error', (error) => {
          setIsConnected(false);
          connectionAttempts.current++;
          
          // Only show error after multiple failed attempts
          if (connectionAttempts.current > 3) {
            setConnectionError(error.message);
            if (import.meta.env.DEV) {
              console.warn(`⚠️ Socket.IO connection error (attempt ${connectionAttempts.current}):`, error.message);
            }
          }
          // Don't throw error - socket will retry automatically
        });

        newSocket.on('reconnect_attempt', (attemptNumber) => {
          if (import.meta.env.DEV && attemptNumber === 1) {
            console.log('🔄 Socket.IO reconnecting...');
          }
        });

        newSocket.on('reconnect', (attemptNumber) => {
          setIsConnected(true);
          setConnectionError(null);
          connectionAttempts.current = 0;
          if (import.meta.env.DEV) {
            console.log('✅ Socket.IO reconnected successfully');
          }
        });

        newSocket.on('reconnect_failed', () => {
          setIsConnected(false);
          setConnectionError('Failed to connect to server after multiple attempts');
          if (import.meta.env.DEV) {
            console.error('❌ Socket.IO reconnection failed');
          }
        });

        setSocket(newSocket);
        isInitializing.current = false;
      }, 300); // 300ms delay to stabilize auth state

      return () => {
        if (initTimeoutRef.current) {
          clearTimeout(initTimeoutRef.current);
          initTimeoutRef.current = null;
        }
        isInitializing.current = false;
      };
    } else {
      // Clean up socket if not authenticated
      if (socket) {
        if (import.meta.env.DEV) {
          console.log('🔌 Disconnecting Socket.IO - user not authenticated');
        }
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setConnectionError(null);
        connectionAttempts.current = 0;
        isInitializing.current = false;
      }
    }

    // Cleanup function
    return () => {
      if (socket && socket.connected) {
        socket.disconnect();
      }
    };
  }, [isAuthenticated, token]);

  const joinTripRoom = (tripId) => {
    if (socket && isConnected) {
      socket.emit('join_trip', tripId);
    }
  };

  const leaveTripRoom = (tripId) => {
    if (socket && isConnected) {
      socket.emit('leave_trip', tripId);
    }
  };

  const lockSeats = (tripId, seats) => {
    if (socket && isConnected) {
      socket.emit('lock_seats', { tripId, seats });
    }
  };

  const releaseSeats = (tripId, seats) => {
    if (socket && isConnected) {
      socket.emit('release_seats', { tripId, seats });
    }
  };

  // Helper hook to subscribe to seat updates
  const useSeatUpdate = (callback) => {
    React.useEffect(() => {
      if (socket) {
        socket.on('seat-status-update', callback);
        socket.on('seats-locked', callback);
        socket.on('seats-unlocked', callback);
        socket.on('seats-booked', callback);
        
        return () => {
          socket.off('seat-status-update', callback);
          socket.off('seats-locked', callback);
          socket.off('seats-unlocked', callback);
          socket.off('seats-booked', callback);
        };
      }
    }, [socket, callback]);
  };

  const value = {
    socket,
    isConnected,
    connectionError,
    joinTripRoom,
    leaveTripRoom,
    lockSeats,
    releaseSeats,
    useSeatUpdate,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};