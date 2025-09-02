// src/pages/NotFound.jsx
import React from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Home, 
  Search, 
  HelpCircle, 
  Navigation,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const NotFound = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-8">
      <motion.div
        className="w-full max-w-2xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-8">
            <motion.div
              variants={itemVariants}
              className="flex justify-center mb-6"
            >
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-6xl font-bold">
                  404
                </div>
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold"
                >
                  !
                </motion.div>
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <CardTitle className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Lost in Space?
              </CardTitle>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <CardDescription className="text-lg text-gray-600 dark:text-gray-300">
                The page you're looking for seems to have taken a cosmic detour.
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error Message */}
            <motion.div 
              variants={itemVariants}
              className="text-center"
            >
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                Error Code: 404 - Page Not Found
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                The URL might be incorrect or the page may have been moved.
              </p>
            </motion.div>

            {/* Quick Actions */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <Button
                onClick={handleGoBack}
                variant="outline"
                className="w-full h-12"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="w-full h-12"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
            </motion.div>

            {/* Search Suggestion */}
            <motion.div 
              variants={itemVariants}
              className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg"
            >
              <div className="flex items-center mb-2">
                <Search className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Can't find what you're looking for?
                </h3>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Try using the search function or browse our popular pages below.
              </p>
            </motion.div>

            {/* Popular Links */}
            <motion.div 
              variants={itemVariants}
              className="space-y-3"
            >
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                Popular Pages:
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/"
                  className="flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Link>
                <Link
                  to="/booking"
                  className="flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Book Travel
                </Link>
                <Link
                  to="/routes"
                  className="flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Find Routes
                </Link>
                <Link
                  to="/help"
                  className="flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Help Center
                </Link>
              </div>
            </motion.div>
          </CardContent>

          <CardFooter className="flex justify-center pt-6 border-t border-gray-200 dark:border-gray-700">
            <motion.div
              variants={itemVariants}
              className="text-center"
            >
              <Link
                to="/"
                className="inline-flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-full font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                <Home className="w-5 h-5 mr-2" />
                Go to Homepage
              </Link>
            </motion.div>
          </CardFooter>
        </Card>

        {/* Floating Astronaut Animation */}
        <motion.div
          className="fixed bottom-8 right-8 opacity-10"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="text-6xl">🚀</div>
        </motion.div>

        {/* Background Stars */}
        <div className="fixed inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;