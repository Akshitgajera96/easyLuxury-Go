// src/context/UserContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { 
  getProfile, 
  updateProfile, 
  getStoredUser, 
  getWalletTransactions, 
  updatePreferences 
} from "../services/authService"; // ✅ all functions from authService
import { useSocket } from "./SocketContext";
import toast from "react-hot-toast";

// 1️⃣ Create context
const UserContext = createContext();

// 2️⃣ Hook to use context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
};

// 3️⃣ Provider
export const UserProvider = ({ children }) => {
  const { user: authUser, isAuthenticated, updateUser: updateAuthUser } = useAuth();
  // FIXED: Destructure the 'socket' object itself, not the non-existent 'onWalletUpdate' function.
  const { socket, isConnected } = useSocket();

  const [user, setUser] = useState(null);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Fetch user profile
  useEffect(() => {
    const fetchUserData = async () => {
      if (isAuthenticated && authUser) {
        setLoading(true);
        try {
          // OPTIMIZED: Fetch profile and transactions in parallel for better performance.
          const [profileRes, txRes] = await Promise.all([
            getProfile(),
            getWalletTransactions({ limit: 10 })
          ]);
          setUser(profileRes.user);
          setWalletTransactions(txRes.data || []);
        } catch (err) {
          console.error("Failed to fetch user data:", err);
          const stored = getStoredUser();
          if (stored) setUser(stored);
          toast.error("Failed to load user data");
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setWalletTransactions([]);
        setLoading(false);
      }
    };
    fetchUserData();
  }, [isAuthenticated, authUser]);

  // Real-time wallet updates
  useEffect(() => {
    // FIXED: Check for the actual socket object instead of just isConnected.
    if (!socket) return;

    // DEFINED: The handler function that was missing, which caused the crash.
    const handleWalletUpdate = (tx) => {
      console.log('✅ Real-time wallet update received:', tx);
      setWalletTransactions(prev => [tx, ...prev]);
      if (tx.newBalance !== undefined && user?.wallet) {
        setUser(prev => ({ ...prev, wallet: { ...prev.wallet, balance: tx.newBalance } }));
      }
      toast.success(`Wallet ${tx.type}: $${tx.amount}`);
    };
    
    // FIXED: Use the standard socket.on() method to listen for events.
    socket.on('walletUpdate', handleWalletUpdate);
    
    // FIXED: Return a cleanup function that uses socket.off() to prevent memory leaks.
    return () => {
      socket.off('walletUpdate', handleWalletUpdate);
    };
  }, [socket, user?.wallet]); // Depend on the socket instance.

  // Update profile
  const updateUserProfile = async (profileData) => {
    setUpdating(true);
    try {
      const res = await updateProfile(profileData);
      setUser(res.user);
      updateAuthUser(res.user);
      toast.success("Profile updated successfully");
      return { success: true };
    } catch (err) {
      console.error("Failed to update profile:", err);
      toast.error(err.message || "Failed to update profile");
      return { success: false, error: err.message };
    } finally {
      setUpdating(false);
    }
  };

  // Update preferences
  const updateUserPreferences = async (preferences) => {
    setUpdating(true);
    try {
      const res = await updatePreferences(preferences);
      setUser(prev => ({ ...prev, preferences: res.preferences }));
      toast.success("Preferences updated");
      return { success: true };
    } catch (err) {
      console.error("Failed to update preferences:", err);
      toast.error(err.message || "Failed to update preferences");
      return { success: false, error: err.message };
    } finally {
      setUpdating(false);
    }
  };

  // Refresh user data
  const refreshUserData = async () => {
    setLoading(true);
    try {
      const [profileRes, txRes] = await Promise.all([getProfile(), getWalletTransactions({ limit: 10 })]);
      setUser(profileRes.user);
      setWalletTransactions(txRes.data || []);
      toast.success("Data refreshed");
    } catch (err) {
      console.error("Failed to refresh user data:", err);
      toast.error("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };

  // Utilities
  const updateUserField = (field, value) => setUser(prev => prev ? { ...prev, [field]: value } : null);

  const updateWalletBalance = (amount, type = 'update') => {
    if (!user?.wallet) return;
    const newBalance = type === 'add' ? user.wallet.balance + amount
                     : type === 'subtract' ? user.wallet.balance - amount
                     : amount;
    setUser(prev => ({ ...prev, wallet: { ...prev.wallet, balance: newBalance } }));
  };

  const hasRole = (role) => user?.role === role;
  const hasPermission = (permission) => user?.permissions?.includes(permission);
  const getFullName = () => user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
  const getWalletBalance = () => user?.wallet?.balance || 0;
  const hasSufficientBalance = (amount) => getWalletBalance() >= amount;

  return (
    <UserContext.Provider value={{
      user,
      walletTransactions,
      loading,
      updating,
      updateUserProfile,
      updateUserPreferences,
      updateUserField,
      updateWalletBalance,
      refreshUserData,
      hasRole,
      hasPermission,
      getFullName,
      getWalletBalance,
      hasSufficientBalance,
      isAuthenticated
    }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;