/**
 * User Context for managing user profile and related data
 * Handles user profile updates, wallet balance, and saved passengers
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import { userService } from '../services/userService';
import { useAuth } from './AuthContext';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [savedPassengers, setSavedPassengers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Only load user data for regular users (not admin or staff)
    if (isAuthenticated && user && user.role === 'user') {
      loadUserData();
    } else {
      setProfile(null);
      setWalletBalance(0);
      setSavedPassengers([]);
    }
  }, [isAuthenticated, user]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // API client returns response.data directly via interceptor
      const [profileResponse, walletResponse, passengersResponse] = await Promise.all([
        userService.getProfile().catch(() => ({ data: null })),
        userService.getWalletBalance().catch(() => ({ data: { balance: 0 } })),
        userService.getSavedPassengers().catch(() => ({ data: [] }))
      ]);

      if (profileResponse?.data) {
        setProfile(profileResponse.data);
      }
      if (walletResponse?.data) {
        setWalletBalance(walletResponse.data.balance || 0);
      }
      if (passengersResponse?.data) {
        setSavedPassengers(passengersResponse.data || []);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await userService.updateProfile(profileData);
      // Backend returns: { success: true, data: { user }, message }
      if (response.success) {
        setProfile(response.data.user);
        // Also update user in localStorage
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { ...storedUser, ...response.data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, message: error.response?.data?.message || 'Profile update failed' };
    }
  };

  const addWalletBalance = async (amount) => {
    try {
      const response = await userService.addWalletBalance(amount);
      if (response.success) {
        setWalletBalance(prev => prev + amount);
        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { success: false, message: 'Failed to add wallet balance' };
    }
  };

  const addSavedPassenger = async (passengerData) => {
    try {
      const response = await userService.addSavedPassenger(passengerData);
      if (response.success) {
        setSavedPassengers(prev => [...prev, response.data]);
        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { success: false, message: 'Failed to add passenger' };
    }
  };

  const updateSavedPassenger = async (passengerId, passengerData) => {
    try {
      const response = await userService.updateSavedPassenger(passengerId, passengerData);
      if (response.success) {
        setSavedPassengers(prev => 
          prev.map(p => p._id === passengerId ? response.data : p)
        );
        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { success: false, message: 'Failed to update passenger' };
    }
  };

  const deleteSavedPassenger = async (passengerId) => {
    try {
      const response = await userService.deleteSavedPassenger(passengerId);
      if (response.success) {
        setSavedPassengers(prev => prev.filter(p => p._id !== passengerId));
        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { success: false, message: 'Failed to delete passenger' };
    }
  };

  const value = {
    profile,
    walletBalance,
    savedPassengers,
    loading,
    updateProfile,
    addWalletBalance,
    addSavedPassenger,
    updateSavedPassenger,
    deleteSavedPassenger,
    refreshUserData: loadUserData,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};