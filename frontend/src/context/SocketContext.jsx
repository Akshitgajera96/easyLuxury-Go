/**
 * Socket Context for managing real-time WebSocket connections
 * Handles socket initialization, events, and connection state
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
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
  const { isAuthenticated, token } = useAuth();

  useEffect(() => {
    if (isAuthenticated && token) {
      // Initialize socket connection with improved config
      const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000', {
        auth: {
          token: token
        },
        transports: ['polling', 'websocket'], // Try polling first, then upgrade to websocket
        upgrade: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        setIsConnected(false);
        // Don't throw error - socket will retry
      });

      newSocket.on('reconnect_attempt', (attemptNumber) => {
        // Reconnecting...
      });

      newSocket.on('reconnect', (attemptNumber) => {
        setIsConnected(true);
      });

      newSocket.on('reconnect_failed', () => {
        setIsConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
      };
    } else {
      // Clean up socket if not authenticated
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }
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