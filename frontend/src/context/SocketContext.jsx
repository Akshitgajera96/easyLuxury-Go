// src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  initializeSocket,
  connectSocket,
  disconnectSocket,
  cleanupSocket,
  onConnectionChange,
  onBookingConfirmed,
  onSeatUpdate,
  onRefundStatus,
  onWalletUpdate,
  onBusStatusUpdate,
  onUserNotification,
} from "../socket/socket";
import toast from "react-hot-toast";

// Create context
const SocketContext = createContext();

// Custom hook
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used within a SocketProvider");
  return context;
};

// Provider component
export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log("SocketProvider mounted. Initializing socket.");
    initializeSocket();

    const unsubscribeConnection = onConnectionChange((connected) => {
      console.log(`Socket connection status changed: ${connected}`);
      setIsConnected(connected);
      if (connected) {
        toast.success("Connected to real-time updates");
      } else {
        toast.error("Disconnected from server");
      }
    });

    return () => {
      console.log("SocketProvider unmounting. Cleaning up.");
      unsubscribeConnection();
      cleanupSocket();
    };
  }, []);

  useEffect(() => {
    console.log("Auth state changed. isAuthenticated:", isAuthenticated, "User:", user);
    if (isAuthenticated && user) {
      console.log("User is authenticated. Attempting to connect socket.");
      connectSocket();
    } else {
      console.log("User is not authenticated. Disconnecting socket.");
      disconnectSocket();
      setIsConnected(false);
    }
  }, [isAuthenticated, user]);

  // Event listeners when connected
  useEffect(() => {
    if (!isConnected) {
      console.log("Not connected. Skipping event listener setup.");
      return;
    }

    console.log("Socket is connected. Setting up event listeners.");

    const unsubBooking = onBookingConfirmed((data) => {
      console.log("Event: onBookingConfirmed", data);
      toast.success(`Booking confirmed! Seat ${data.seatNumber}`);
    });

    const unsubSeat = onSeatUpdate((data) => {
      console.log("Event: onSeatUpdate", data);
      if (data.status === "booked") {
        toast(`Seat ${data.seatNumber} was booked`, { icon: "⚠️" });
      }
    });

    const unsubRefund = onRefundStatus((data) => {
      console.log("Event: onRefundStatus", data);
      if (data.status === "approved") toast.success(`Refund approved: $${data.amount}`);
      else if (data.status === "rejected") toast.error("Refund request rejected");
    });

    const unsubWallet = onWalletUpdate((data) => {
      console.log("Event: onWalletUpdate", data);
      if (data.type === "deposit") toast.success(`$${data.amount} added to wallet`);
    });

    const unsubBus = onBusStatusUpdate((data) => {
      console.log("Event: onBusStatusUpdate", data);
      if (data.status === "delayed") toast.error(`Bus ${data.busNumber} delayed: ${data.reason}`);
    });

    const unsubNotify = onUserNotification((data) => {
      console.log("Event: onUserNotification", data);
      toast(data.message, { icon: data.type === "alert" ? "⚠️" : "ℹ️" });
    });

    return () => {
      console.log("Cleaning up socket event listeners.");
      unsubBooking();
      unsubSeat();
      unsubRefund();
      unsubWallet();
      unsubBus();
      unsubNotify();
    };
  }, [isConnected]);

  const emitEvent = (event, data) => {
    if (!isConnected) {
      console.error(`Emit failed: Not connected to server for event "${event}".`);
      toast.error("Not connected to server");
      return false;
    }
    try {
      // Replace with your actual socket emit logic
      console.log(`Emit: ${event}`, data);
      // Example socket.emit: socket.emit(event, data);
      return true;
    } catch (err) {
      console.error(`Emit failed for event "${event}":`, err);
      toast.error("Failed to send update");
      return false;
    }
  };

  const reconnect = async () => {
    console.log("Attempting to reconnect.");
    try {
      await connectSocket();
      toast.success("Reconnected to server");
    } catch (err) {
      console.error("Reconnection failed:", err);
      toast.error("Reconnection failed");
    }
  };

  const value = {
    isConnected,
    emitEvent,
    reconnect,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

// Default export for HMR
export default SocketContext;