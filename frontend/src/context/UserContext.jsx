// src/context/UserContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { 
  getProfile, 
  updateProfile, 
  getStoredUser
} from "../services/authService";
import { useSocket } from "./SocketContext";
import toast from "react-hot-toast";

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const { user: authUser, isAuthenticated, updateUser: updateAuthUser } = useAuth();
  const { isConnected, onWalletUpdate } = useSocket();
  const [userDetails, setUserDetails] = useState(null);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Fetch user profile when authentication state changes
  useEffect(() => {
    const fetchUserData = async () => {
      if (isAuthenticated && authUser) {
        setLoading(true);
        try {
          // Try to get fresh data from API
          const profileResponse = await getProfile();
          setUserDetails(profileResponse.user);
          
          // Also load wallet transactions
          const transactionsResponse = await getWalletTransactions({ limit: 10 });
          setWalletTransactions(transactionsResponse.data || []);
          
        } catch (error) {
          console.error("Failed to fetch user data:", error);
          // Fallback to stored user data if API fails
          const storedUser = getStoredUser();
          if (storedUser) {
            setUserDetails(storedUser);
          }
          toast.error("Failed to load user data");
        } finally {
          setLoading(false);
        }
      } else {
        setUserDetails(null);
        setWalletTransactions([]);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isAuthenticated, authUser]);

  // Listen for real-time wallet updates
  useEffect(() => {
    if (!isConnected) return;

    const handleWalletUpdate = (transaction) => {
      setWalletTransactions(prev => [transaction, ...prev]);
      
      // Update user balance if included
      if (transaction.newBalance !== undefined && userDetails?.wallet) {
        setUserDetails(prev => ({
          ...prev,
          wallet: { ...prev.wallet, balance: transaction.newBalance }
        }));
      }
      
      toast.success(`Wallet ${transaction.type}: $${transaction.amount}`);
    };

    const unsubscribe = onWalletUpdate(handleWalletUpdate);
    return unsubscribe;
  }, [isConnected, userDetails?.wallet]);

  // Update user profile
  const updateUserProfile = async (profileData) => {
    setUpdating(true);
    try {
      const response = await updateProfile(profileData);
      setUserDetails(response.user);
      updateAuthUser(response.user); // Also update auth context
      toast.success("Profile updated successfully");
      return { success: true };
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error(error.message || "Failed to update profile");
      return { success: false, error: error.message };
    } finally {
      setUpdating(false);
    }
  };

  // Update user preferences
  const updateUserPreferences = async (preferences) => {
    setUpdating(true);
    try {
      const response = await updatePreferences(preferences);
      setUserDetails(prev => ({ ...prev, preferences: response.preferences }));
      toast.success("Preferences updated");
      return { success: true };
    } catch (error) {
      console.error("Failed to update preferences:", error);
      toast.error(error.message || "Failed to update preferences");
      return { success: false, error: error.message };
    } finally {
      setUpdating(false);
    }
  };

  // Refresh user data
  const refreshUserData = async () => {
    setLoading(true);
    try {
      const [profileResponse, transactionsResponse] = await Promise.all([
        getProfile(),
        getWalletTransactions({ limit: 10 })
      ]);
      
      setUserDetails(profileResponse.user);
      setWalletTransactions(transactionsResponse.data || []);
      toast.success("Data refreshed");
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      toast.error("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };

  // Update specific user field (optimistic update)
  const updateUserField = (field, value) => {
    setUserDetails(prev => prev ? { ...prev, [field]: value } : null);
  };

  // Update wallet balance locally (for optimistic updates)
  const updateWalletBalance = (amount, type = 'update') => {
    if (!userDetails?.wallet) return;

    const newBalance = type === 'add' 
      ? userDetails.wallet.balance + amount
      : type === 'subtract'
      ? userDetails.wallet.balance - amount
      : amount;

    setUserDetails(prev => ({
      ...prev,
      wallet: { ...prev.wallet, balance: newBalance }
    }));
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return userDetails?.role === role;
  };

  // Check if user has specific permission
  const hasPermission = (permission) => {
    return userDetails?.permissions?.includes(permission);
  };

  // Get user's full name
  const getFullName = () => {
    return userDetails?.name || `${userDetails?.firstName || ''} ${userDetails?.lastName || ''}`.trim();
  };

  // Get wallet balance
  const getWalletBalance = () => {
    return userDetails?.wallet?.balance || 0;
  };

  // Check if wallet has sufficient balance
  const hasSufficientBalance = (amount) => {
    return getWalletBalance() >= amount;
  };

  const value = {
    // State
    user: userDetails,
    walletTransactions,
    loading,
    updating,
    
    // Actions
    updateUserProfile,
    updateUserPreferences,
    updateUserField,
    updateWalletBalance,
    refreshUserData,
    
    // Utilities
    hasRole,
    hasPermission,
    getFullName,
    getWalletBalance,
    hasSufficientBalance,
    isAuthenticated
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;