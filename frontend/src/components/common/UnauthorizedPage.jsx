// src/pages/Unauthorized.jsx
import React from "react";
import { useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const UnauthorizedPage = () => {
  const location = useLocation();
  const { requiredRole, userRole, requiredPermissions, userPermissions } = location.state || {};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
      >
        <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Access Denied
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          You don't have permission to access this page.
        </p>

        {requiredRole && (
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Required role: <strong>{requiredRole}</strong>
              <br />
              Your role: <strong>{userRole || "None"}</strong>
            </p>
          </div>
        )}

        {requiredPermissions && requiredPermissions.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Required permissions: <strong>{requiredPermissions.join(", ")}</strong>
            </p>
          </div>
        )}

        <Button asChild>
          <Link to="/" className="flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </Button>
      </motion.div>
    </div>
  );
};

export default UnauthorizedPage;