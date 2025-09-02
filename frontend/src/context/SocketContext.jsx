// src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { 
  initializeSocket, 
  connectSocket, 
  disconnectSocket, 
  isSocketConnected,
  onConnectionChange,
  onBookingConfirmed,
  onSeatUpdate,
  onRefundStatus,
  onWalletUpdate,
  onBusStatusUpdate,
  onUserNotification,
  cleanupSocket
} from "../socket/socket";
import toast from "react-hot-toast";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
  const { user, isAuthenticated } = useAuth();

  // Initialize socket connection
  useEffect(() => {
    initializeSocket();
    
    const handleConnectionChange = (connected) => {
      setIsConnected(connected);
      if (connected) {
        setSocketId(getSocketId());
        toast.success("Connected to real-time updates");
      } else {
        setSocketId(null);
        toast.error("Disconnected from server");
      }
    };

    const unsubscribe = onConnectionChange(handleConnectionChange);

    return () => {
      unsubscribe();
      cleanupSocket();
    };
  }, []);

  // Connect/disconnect socket based on authentication
  useEffect(() => {
    if (isAuthenticated && user) {
      connectSocket().then(connected => {
        if (connected) {
          console.log("✅ Socket connected for user:", user._id);
        }
      });
    } else {
      disconnectSocket();
      setIsConnected(false);
      setSocketId(null);
    }

    return () => {
      if (!isAuthenticated) {
        disconnectSocket();
      }
    };
  }, [isAuthenticated, user]);

  // Setup event listeners when connected
  useEffect(() => {
    if (!isConnected) return;

    // Booking events
    const unsubscribeBooking = onBookingConfirmed((data) => {
      console.log("🎫 Booking confirmed:", data);
      toast.success(`Booking confirmed! Seat ${data.seatNumber}`);
    });

    // Seat events
    const unsubscribeSeat = onSeatUpdate((data) => {
      console.log("💺 Seat update:", data);
      if (data.status === 'booked') {
        toast(`Seat ${data.seatNumber} was just booked`, { icon: '⚠️' });
      }
    });

    // Refund events
    const unsubscribeRefund = onRefundStatus((data) => {
      console.log("💰 Refund status:", data);
      if (data.status === 'approved') {
        toast.success(`Refund approved: $${data.amount}`);
      } else if (data.status === 'rejected') {
        toast.error("Refund request was rejected");
      }
    });

    // Wallet events
    const unsubscribeWallet = onWalletUpdate((data) => {
      console.log("💳 Wallet update:", data);
      if (data.type === 'deposit') {
        toast.success(`$${data.amount} added to your wallet`);
      }
    });

    // Bus events
    const unsubscribeBus = onBusStatusUpdate((data) => {
      console.log("🚌 Bus status update:", data);
      if (data.status === 'delayed') {
        toast.error(`Bus ${data.busNumber} is delayed: ${data.reason}`);
      }
    });

    // User notifications
    const unsubscribeNotification = onUserNotification((data) => {
      console.log("🔔 User notification:", data);
      toast(data.message, { 
        icon: data.type === 'alert' ? '⚠️' : 'ℹ️' 
      });
    });

    // Cleanup listeners on disconnect
    return () => {
      unsubscribeBooking();
      unsubscribeSeat();
      unsubscribeRefund();
      unsubscribeWallet();
      unsubscribeBus();
      unsubscribeNotification();
    };
  }, [isConnected]);

  // Join user-specific room when connected
  useEffect(() => {
    if (isConnected && user?._id) {
      emitEvent('user:join', { userId: user._id });
      console.log("📡 Joined user room:", user._id);
    }
  }, [isConnected, user?._id]);

  // Emit events with connection check
  const emitEvent = (eventName, data) => {
    if (!isConnected) {
      toast.error("Not connected to server");
      return false;
    }
    
    try {
      emitEvent(eventName, data);
      return true;
    } catch (error) {
      console.error("Failed to emit event:", error);
      toast.error("Failed to send update");
      return false;
    }
  };

  // Reconnect manually
  const reconnect = async () => {
    try {
      const success = await connectSocket();
      if (success) {
        toast.success("Reconnecting...");
      }
      return success;
    } catch (error) {
      toast.error("Reconnection failed");
      return false;
    }
  };

  const value = {
    isConnected,
    socketId,
    emitEvent,
    reconnect,
    // Specific event emitters for common actions
    emitBookingRequest: (data) => emitEvent('booking:request', data),
    emitSeatUpdate: (data) => emitEvent('seats:update', data),
    emitRefundRequest: (data) => emitEvent('refund:request', data),
    emitWalletTransaction: (data) => emitEvent('wallet:transaction', data),
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
      {/* Connection status indicator */}
      {!isConnected && isAuthenticated && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '10px 16px',
          backgroundColor: '#ff4757',
          color: 'white',
          borderRadius: '8px',
          fontSize: '14px',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'white'
          }}></div>
          Disconnected from server
          <button 
            onClick={reconnect}
            style={{
              marginLeft: '12px',
              padding: '4px 8px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Reconnect
          </button>
        </div>
      )}
    </SocketContext.Provider>
  );
};

export default SocketContext;