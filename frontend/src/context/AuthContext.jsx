// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { 
  loginUser, 
  registerUser, 
  logoutUser, 
  getProfile, 
  refreshToken, 
  getStoredUser, 
  getStoredToken,
  isAuthenticated as checkAuthStatus
} from "../services/authService";
import { connectSocket, disconnectSocket } from "../socket/socket";

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = getStoredToken();
      const storedUser = getStoredUser();
      
      if (token && storedUser) {
        // Verify token is still valid
        const isValid = await verifyToken(token);
        
        if (isValid) {
          setUser(storedUser);
          setIsAuthenticated(true);
          connectSocket(); // Connect socket on successful auth
        } else {
          // Try to refresh token
          await handleTokenRefresh();
        }
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      clearAuthState();
    } finally {
      setLoading(false);
    }
  };

  const verifyToken = async (token) => {
    try {
      // Simple token expiration check (you might want to decode JWT instead)
      // This is a basic check - in production, you'd verify with your backend
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleTokenRefresh = async () => {
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken');
      if (refreshTokenValue) {
        const response = await refreshToken(refreshTokenValue);
        if (response.accessToken) {
          const userProfile = await getProfile();
          setUser(userProfile.user);
          setIsAuthenticated(true);
          connectSocket();
          return true;
        }
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      clearAuthState();
      return false;
    }
  };

  const clearAuthState = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    disconnectSocket();
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await loginUser(credentials);
      
      if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
        connectSocket();
        toast.success("Logged in successfully");
        navigate("/dashboard");
        return { success: true };
      } else {
        toast.error(response.error || "Login failed");
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = error.message || "Login failed. Please try again.";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await registerUser(userData);
      
      if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
        connectSocket();
        toast.success("Registration successful");
        navigate("/dashboard");
        return { success: true };
      } else {
        toast.error(response.error || "Registration failed");
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = error.message || "Registration failed. Please try again.";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await logoutUser();
      clearAuthState();
      toast.info("Logged out successfully");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear local state even if API call fails
      clearAuthState();
      toast.info("Logged out");
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (userData) => {
    setUser(prevUser => ({ ...prevUser, ...userData }));
    localStorage.setItem('user', JSON.stringify({ ...user, ...userData }));
  };

  const refreshUserProfile = async () => {
    try {
      const userProfile = await getProfile();
      setUser(userProfile.user);
      localStorage.setItem('user', JSON.stringify(userProfile.user));
    } catch (error) {
      console.error("Failed to refresh user profile:", error);
      // If profile fetch fails, user might be logged out
      if (error.message.includes("auth") || error.message.includes("token")) {
        await handleTokenRefresh();
      }
    }
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  const hasPermission = (permission) => {
    return user?.permissions?.includes(permission);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUser,
    refreshUserProfile,
    hasRole,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Higher Order Component for protected routes
export const withAuth = (Component) => {
  return function WithAuthComponent(props) {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
      return <div>Loading...</div>;
    }
    
    if (!isAuthenticated) {
      navigate("/login");
      return null;
    }
    
    return <Component {...props} />;
  };
};

export default AuthContext;