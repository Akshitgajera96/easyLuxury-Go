// src/components/common/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useUser } from "../../context/UserContext";
import LoadingSpinner from "./LoadingSpinner";
import { motion, AnimatePresence } from "framer-motion";

const ProtectedRoute = ({ 
  children, 
  requiredRole,   // ✅ added here
  requiredPermissions = [],
  redirectTo = "/login",
  showLoading = true,
  fallbackComponent: FallbackComponent = null
}) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { user, loading: userLoading } = useUser();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (authLoading || userLoading) {
    return showLoading ? (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner 
          message="Verifying access..." 
          size="medium" 
          variant="primary" 
        />
      </div>
    ) : null;
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    const redirectPath = location.pathname + location.search;
    localStorage.setItem("redirectAfterLogin", redirectPath);

    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  // Check role-based access
  if (requiredRole && user?.role !== requiredRole) {
    if (FallbackComponent) {
      return <FallbackComponent />;
    }

    return (
      <Navigate 
        to="/unauthorized" 
        replace 
        state={{ 
          from: location,
          requiredRole,
          userRole: user?.role 
        }} 
      />
    );
  }

  // Check permission-based access
  if (requiredPermissions.length > 0) {
    const userPermissions = user?.permissions || [];
    const hasRequiredPermissions = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasRequiredPermissions) {
      if (FallbackComponent) {
        return <FallbackComponent />;
      }

      return (
        <Navigate 
          to="/unauthorized" 
          replace 
          state={{ 
            from: location,
            requiredPermissions,
            userPermissions 
          }} 
        />
      );
    }
  }

  // If email verification is required but not verified
  if (user?.emailVerified === false && location.pathname !== "/verify-email") {
    return <Navigate to="/verify-email" replace state={{ from: location }} />;
  }

  // If all checks pass, render the children with animation
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Higher Order Component for protected routes
export const withProtectedRoute = (Component, options = {}) => {
  return function WithProtectedRoute(props) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
};

// Specific route protectors for common roles
export const AdminRoute = ({ children, ...props }) => (
  <ProtectedRoute requiredRole="admin" redirectTo="/unauthorized" {...props}>
    {children}
  </ProtectedRoute>
);

export const CaptainRoute = ({ children, ...props }) => (
  <ProtectedRoute requiredRole="captain" redirectTo="/unauthorized" {...props}>
    {children}
  </ProtectedRoute>
);

export const UserRoute = ({ children, ...props }) => (
  <ProtectedRoute requiredRole="user" redirectTo="/unauthorized" {...props}>
    {children}
  </ProtectedRoute>
);

// Permission-based route protector
export const withPermission = (permission, options = {}) => {
  return function WithPermissionRoute({ children, ...props }) {
    return (
      <ProtectedRoute 
        requiredPermissions={[permission]} 
        redirectTo="/unauthorized"
        {...options}
        {...props}
      >
        {children}
      </ProtectedRoute>
    );
  };
};

// Email verification required route
export const VerifiedEmailRoute = ({ children, ...props }) => (
  <ProtectedRoute 
    fallbackComponent={() => <Navigate to="/verify-email" replace />}
    {...props}
  >
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;
