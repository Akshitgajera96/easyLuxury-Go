// // src/routes/index.jsx
// import React, { lazy, Suspense } from "react";
// import { Routes, Route, Navigate, useLocation } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import { useUser } from "../context/UserContext";
// import LoadingSpinner from "../components/common/LoadingSpinner";
// import { AdminRoute, CaptainRoute, VerifiedEmailRoute } from "../components/common/ProtectedRoute";

// // Lazy-loaded pages for code splitting and better performance
// const Home = lazy(() => import("../pages/Home"));
// const Login = lazy(() => import("../pages/Login"));
// const Register = lazy(() => import("../pages/Register"));
// const Dashboard = lazy(() => import("../pages/Dashboard"));
// const BookingPage = lazy(() => import("../pages/BookingPage"));
// const WalletPage = lazy(() => import("../pages/WalletPage"));
// const ProfilePage = lazy(() => import("../pages/ProfilePage"));
// const RoutesPage = lazy(() => import("../pages/RoutesPage"));
// const BusesPage = lazy(() => import("../pages/BusesPage"));
// const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
// const CaptainDashboard = lazy(() => import("../pages/captain/CaptainDashboard"));
// const ForgotPassword = lazy(() => import("../pages/ForgotPassword"));
// const ResetPassword = lazy(() => import("../pages/ResetPassword"));
// const VerifyEmail = lazy(() => import("../pages/VerifyEmail"));
// const NotFound = lazy(() => import("../pages/NotFound"));

// // Route protection wrapper with role-based access
// const ProtectedRoute = ({ children, requiredRole, requiredPermissions = [] }) => {
//   const { isAuthenticated, loading: authLoading } = useAuth();
//   const { user, loading: userLoading } = useUser();
//   const location = useLocation();

//   if (authLoading || userLoading) {
//     return <LoadingSpinner message="Verifying access..." />;
//   }

//   if (!isAuthenticated) {
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   }

//   // Role-based access control
//   if (requiredRole && user?.role !== requiredRole) {
//     return <Navigate to="/unauthorized" replace />;
//   }

//   // Permission-based access control
//   if (requiredPermissions.length > 0) {
//     const userPermissions = user?.permissions || [];
//     const hasRequiredPermissions = requiredPermissions.every(permission =>
//       userPermissions.includes(permission)
//     );

//     if (!hasRequiredPermissions) {
//       return <Navigate to="/unauthorized" replace />;
//     }
//   }

//   return children;
// };

// // Public route wrapper (redirects to dashboard if already authenticated)
// const PublicRoute = ({ children }) => {
//   const { isAuthenticated, loading } = useAuth();
//   const location = useLocation();

//   if (loading) {
//     return <LoadingSpinner message="Checking authentication..." />;
//   }

//   if (isAuthenticated) {
//     const from = location.state?.from?.pathname || "/dashboard";
//     return <Navigate to={from} replace />;
//   }

//   return children;
// };

// // Loading component for suspense fallback
// const RouteLoading = () => (
//   <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
//     <LoadingSpinner message="Loading page..." size="large" />
//   </div>
// );

// const AppRoutes = () => {
//   return (
//     <Suspense fallback={<RouteLoading />}>
//       <Routes>
//         {/* Public Routes */}
//         <Route
//           path="/"
//           element={
//             <PublicRoute>
//               <Home />
//             </PublicRoute>
//           }
//         />

//         <Route
//           path="/login"
//           element={
//             <PublicRoute>
//               <Login />
//             </PublicRoute>
//           }
//         />

//         <Route
//           path="/register"
//           element={
//             <PublicRoute>
//               <Register />
//             </PublicRoute>
//           }
//         />

//         <Route
//           path="/forgot-password"
//           element={
//             <PublicRoute>
//               <ForgotPassword />
//             </PublicRoute>
//           }
//         />

//         <Route
//           path="/reset-password"
//           element={
//             <PublicRoute>
//               <ResetPassword />
//             </PublicRoute>
//           }
//         />

//         <Route
//           path="/verify-email"
//           element={
//             <PublicRoute>
//               <VerifyEmail />
//             </PublicRoute>
//           }
//         />

//         {/* Protected Routes - General Access */}
//         <Route
//           path="/dashboard"
//           element={
//             <ProtectedRoute>
//               <Dashboard />
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path="/booking"
//           element={
//             <ProtectedRoute>
//               <BookingPage />
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path="/booking/:bookingId"
//           element={
//             <ProtectedRoute>
//               <BookingPage />
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path="/wallet"
//           element={
//             <ProtectedRoute>
//               <WalletPage />
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path="/profile"
//           element={
//             <ProtectedRoute>
//               <ProfilePage />
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path="/routes"
//           element={
//             <ProtectedRoute>
//               <RoutesPage />
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path="/buses"
//           element={
//             <ProtectedRoute>
//               <BusesPage />
//             </ProtectedRoute>
//           }
//         />

//         {/* Email Verification Required Routes */}
//         <Route
//           path="/book-now"
//           element={
//             <VerifiedEmailRoute>
//               <BookingPage />
//             </VerifiedEmailRoute>
//           }
//         />

//         {/* Admin Routes */}
//         <Route
//           path="/admin/*"
//           element={
//             <AdminRoute>
//               <AdminDashboard />
//             </AdminRoute>
//           }
//         />

//         <Route
//           path="/admin/dashboard"
//           element={
//             <AdminRoute>
//               <AdminDashboard />
//             </AdminRoute>
//           }
//         />

//         <Route
//           path="/admin/users"
//           element={
//             <AdminRoute>
//               <AdminDashboard />
//             </AdminRoute>
//           }
//         />

//         <Route
//           path="/admin/buses"
//           element={
//             <AdminRoute>
//               <AdminDashboard />
//             </AdminRoute>
//           }
//         />

//         <Route
//           path="/admin/reports"
//           element={
//             <AdminRoute>
//               <AdminDashboard />
//             </AdminRoute>
//           }
//         />

//         {/* Captain Routes */}
//         <Route
//           path="/captain/*"
//           element={
//             <CaptainRoute>
//               <CaptainDashboard />
//             </CaptainRoute>
//           }
//         />

//         <Route
//           path="/captain/dashboard"
//           element={
//             <CaptainRoute>
//               <CaptainDashboard />
//             </CaptainRoute>
//           }
//         />

//         <Route
//           path="/captain/schedule"
//           element={
//             <CaptainRoute>
//               <CaptainDashboard />
//             </CaptainRoute>
//           }
//         />

//         {/* Error Pages */}
//         <Route path="/unauthorized" element={<NotFound type="unauthorized" />} />
//         <Route path="/not-verified" element={<NotFound type="not-verified" />} />
//         <Route path="/maintenance" element={<NotFound type="maintenance" />} />

//         {/* 404 - Catch All Route */}
//         <Route path="*" element={<NotFound />} />
//       </Routes>
//     </Suspense>
//   );
// };

// export default AppRoutes;

// // Utility function for programmatic navigation with route protection
// export const useProtectedNavigation = () => {
//   const { isAuthenticated } = useAuth();
//   const { user } = useUser();

//   const canAccess = (path, requiredRole = null, requiredPermissions = []) => {
//     if (!isAuthenticated) return false;

//     if (requiredRole && user?.role !== requiredRole) return false;

//     if (requiredPermissions.length > 0) {
//       const userPermissions = user?.permissions || [];
//       return requiredPermissions.every(permission =>
//         userPermissions.includes(permission)
//       );
//     }

//     return true;
//   };

//   return { canAccess };
// };

// // Route configuration for navigation menus
// export const routeConfig = {
//   public: [
//     { path: "/", label: "Home", showWhenAuth: false },
//     { path: "/login", label: "Login", showWhenAuth: false },
//     { path: "/register", label: "Register", showWhenAuth: false }
//   ],
//   protected: [
//     { path: "/dashboard", label: "Dashboard", icon: "dashboard" },
//     { path: "/booking", label: "Book Travel", icon: "booking" },
//     { path: "/routes", label: "Find Routes", icon: "routes" },
//     { path: "/buses", label: "Browse Buses", icon: "buses" },
//     { path: "/wallet", label: "Wallet", icon: "wallet" },
//     { path: "/profile", label: "Profile", icon: "profile" }
//   ],
//   admin: [
//     { path: "/admin/dashboard", label: "Admin Dashboard", icon: "admin" },
//     { path: "/admin/users", label: "User Management", icon: "users" },
//     { path: "/admin/buses", label: "Bus Management", icon: "buses" },
//     { path: "/admin/reports", label: "Reports", icon: "reports" }
//   ],
//   captain: [
//     { path: "/captain/dashboard", label: "Captain Dashboard", icon: "dashboard" },
//     { path: "/captain/schedule", label: "My Schedule", icon: "schedule" }
//   ]
// };

import React, { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ProtectedRoute from "../components/common/ProtectedRoute";
import BusesPage from "../pages/BusesPage";

const Home = lazy(() => import("../pages/Home"));
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const BookingPage = lazy(() => import("../pages/BookingPage"));
const WalletPage = lazy(() => import("../pages/WalletPage"));
const NotFound = lazy(() => import("../pages/NotFound"));

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};
const pageTransition = { type: "tween", ease: "anticipate", duration: 0.5 };

const AnimatedRoute = ({ children }) => (
  <motion.div
    initial="initial"
    animate="in"
    exit="out"
    variants={pageVariants}
    transition={pageTransition}
  >
    {children}
  </motion.div>
);

const RouteLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <LoadingSpinner message="Loading page..." size="large" />
  </div>
);

const AppRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<RouteLoading />}>
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <AnimatedRoute>
                <Home />
              </AnimatedRoute>
            }
          />
          <Route
            path="/login"
            element={
              <AnimatedRoute>
                <Login />
              </AnimatedRoute>
            }
          />
          <Route
            path="/register"
            element={
              <AnimatedRoute>
                <Register />
              </AnimatedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AnimatedRoute>
                  <Dashboard />
                </AnimatedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <AnimatedRoute>
                  <BookingPage />
                </AnimatedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <AnimatedRoute>
                  <WalletPage />
                </AnimatedRoute>
              </ProtectedRoute>
            }
          />
          import BusesPage from "../pages/BusesPage";
          <Route
            path="/buses"
            element={
              <ProtectedRoute>
                <AnimatedRoute>
                  <BusesPage />
                </AnimatedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={
              <AnimatedRoute>
                <NotFound />
              </AnimatedRoute>
            }
          />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

export default AppRoutes;
