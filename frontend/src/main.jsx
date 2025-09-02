// import React from 'react';
// import { Routes, Route, useLocation } from 'react-router-dom';
// import { motion, AnimatePresence } from 'framer-motion';
// import Home from './pages/Home';
// import Login from './pages/Login';
// import Register from './pages/Register';
// import Dashboard from './pages/Dashboard';
// import BookingPage from './pages/BookingPage';
// import WalletPage from './pages/WalletPage';
// import NotFound from './pages/NotFound';
// import ProtectedRoute from './components/common/ProtectedRoute';

// const pageVariants = {
//   initial: {
//     opacity: 0,
//     y: 20,
//   },
//   in: {
//     opacity: 1,
//     y: 0,
//   },
//   out: {
//     opacity: 0,
//     y: -20,
//   }
// };

// const pageTransition = {
//   type: "tween",
//   ease: "anticipate",
//   duration: 0.5
// };

// const AnimatedRoute = ({ children }) => {
//   return (
//     <motion.div
//       initial="initial"
//       animate="in"
//       exit="out"
//       variants={pageVariants}
//       transition={pageTransition}
//     >
//       {children}
//     </motion.div>
//   );
// };

// const AppRoutes = () => {
//   const location = useLocation();
  
//   return (
//     <AnimatePresence mode="wait">
//       <Routes location={location} key={location.pathname}>
//         <Route path="/" element={<AnimatedRoute><Home /></AnimatedRoute>} />
//         <Route path="/login" element={<AnimatedRoute><Login /></AnimatedRoute>} />
//         <Route path="/register" element={<AnimatedRoute><Register /></AnimatedRoute>} />
//         <Route 
//           path="/dashboard" 
//           element={
//             <ProtectedRoute>
//               <AnimatedRoute><Dashboard /></AnimatedRoute>
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/bookings" 
//           element={
//             <ProtectedRoute>
//               <AnimatedRoute><BookingPage /></AnimatedRoute>
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/wallet" 
//           element={
//             <ProtectedRoute>
//               <AnimatedRoute><WalletPage /></AnimatedRoute>
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/admin/*" 
//           element={
//             <ProtectedRoute adminOnly={true}>
//               <AnimatedRoute><AdminDashboard /></AnimatedRoute>
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/captain/*" 
//           element={
//             <ProtectedRoute captainOnly={true}>
//               <AnimatedRoute><CaptainDashboard /></AnimatedRoute>
//             </ProtectedRoute>
//           } 
//         />
//         <Route path="*" element={<AnimatedRoute><NotFound /></AnimatedRoute>} />
//       </Routes>
//     </AnimatePresence>
//   );
// };

// export default AppRoutes;


// src/main.jsx


import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { UserProvider } from "./context/UserContext";
import { SocketProvider } from "./context/SocketContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        {/* SocketProvider pehla */}
        <SocketProvider>
          {/* UserProvider pachhi */}
          <UserProvider>
            <App />
          </UserProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

