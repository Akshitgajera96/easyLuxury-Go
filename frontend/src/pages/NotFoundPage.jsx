/**
 * 404 Not Found page for undefined routes
 */

import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-sky-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        {/* Error Illustration */}
        <div className="mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-8xl mb-4"
          >
            ??
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-6xl font-bold text-black40 mb-2"
          >
            404
          </motion.div>
        </div>

        {/* Error Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-4 mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">Page Not Found</h1>
          <p className="text-lg text-gray-600">
            Oops! The page you're looking for seems to have taken a detour. 
            It might have been moved, deleted, or never existed in the first place.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-4"
        >
          <Link
            to="/"
            className="block w-full bg-accent text-gray-900 py-4 rounded-lg font-bold text-lg hover:bg-gradient-to-r hover:from-accent hover:to-accent-dark hover:shadow-xl hover:scale-105 transition-all duration-300 transition-colors shadow-lg"
          >
            Go Back Home
          </Link>
          
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/trips"
              className="bg-black40 text-gray-100 py-3 rounded-lg font-semibold hover:bg-black40/90 transition-colors block"
            >
              Search Trips
            </Link>
            <button
              onClick={() => window.history.back()}
              className="bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Go Back
            </button>
          </div>
        </motion.div>

        {/* Helpful Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 pt-8 border-t border-gray-200"
        >
          <p className="text-sm text-gray-600 mb-4">Here are some helpful links instead:</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link to="/" className="text-accent hover:text-accent font-medium">
              Home
            </Link>
            <Link to="/trips" className="text-accent hover:text-accent font-medium">
              Find Trips
            </Link>
            <Link to="/login" className="text-accent hover:text-accent font-medium">
              Login
            </Link>
            <Link to="/register" className="text-accent hover:text-accent font-medium">
              Sign Up
            </Link>
          </div>
        </motion.div>

        {/* Contact Support */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-8 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <p className="text-sm text-gray-600">
            Still can't find what you're looking for?{' '}
            <a href="mailto:support@easyluxury.com" className="text-accent hover:text-accent font-medium">
              Contact our support team
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default NotFoundPage