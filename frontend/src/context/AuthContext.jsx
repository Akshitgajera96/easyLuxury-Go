// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  loginUser,
  registerUser,
  logoutUser,
  getProfile,
  refreshToken,
  getStoredUser,
  getStoredToken,
} from "../services/authService";
import { connectSocket, disconnectSocket } from "../socket/socket";

// Create context
const AuthContext = createContext();

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = getStoredToken();
        const storedUser = getStoredUser();

        if (token && storedUser) {
          console.log("Initializing auth with stored data.");
          setUser(storedUser);
          setIsAuthenticated(true);
          connectSocket();
        } else {
          console.log("No stored token or user found. Clearing auth state.");
          clearAuthState();
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        clearAuthState();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const clearAuthState = () => {
    console.log("Clearing authentication state.");
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    disconnectSocket();
  };

  const login = async (credentials) => {
    setLoading(true);
    try {
      console.log("Attempting to log in with credentials:", credentials);
      const res = await loginUser(credentials);
      if (res.success) {
        console.log("Login successful. Storing user and tokens.");
        setUser(res.user);
        setIsAuthenticated(true);
        localStorage.setItem("user", JSON.stringify(res.user));
        localStorage.setItem("accessToken", res.accessToken);
        localStorage.setItem("refreshToken", res.refreshToken);
        connectSocket();
        toast.success(res.message || "Logged in successfully");
        return { success: true };
      } else {
        console.error("Login failed:", res.error);
        toast.error(res.error || "Login failed");
        return { success: false, error: res.error };
      }
    } catch (error) {
      const msg = error?.message || "Login failed";
      console.error("Login failed with an exception:", error);
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      console.log("Attempting to register new user with data:", userData);
      const res = await registerUser(userData);
      if (res.success) {
        console.log("Registration successful. Storing user and tokens.");
        setUser(res.user);
        setIsAuthenticated(true);
        localStorage.setItem("user", JSON.stringify(res.user));
        localStorage.setItem("accessToken", res.accessToken);
        localStorage.setItem("refreshToken", res.refreshToken);
        connectSocket();
        toast.success(res.message || "Registration successful");
        return { success: true };
      } else {
        console.error("Registration failed:", res.error);
        toast.error(res.error || "Registration failed");
        return { success: false, error: res.error };
      }
    } catch (error) {
      const msg = error?.message || "Registration failed";
      console.error("Registration failed with an exception:", error);
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      console.log("Attempting to log out.");
      await logoutUser();
      clearAuthState();
      toast.info("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      clearAuthState();
      toast.info("Logged out");
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Default export for Vite HMR
export default AuthContext;