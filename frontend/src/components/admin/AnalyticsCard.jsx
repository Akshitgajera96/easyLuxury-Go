/**
 * Analytics card component for displaying key metrics and statistics
 */

import React from 'react'
import { motion } from 'framer-motion'

const AnalyticsCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'positive', // positive, negative, neutral
  icon,
  description,
  loading = false 
}) => {
  const changeConfig = {
    positive: {
      color: 'text-green-600',
      bg: 'bg-green-100',
      icon: '↗️'
    },
    negative: {
      color: 'text-red-600',
      bg: 'bg-red-100',
      icon: '↘️'
    },
    neutral: {
      color: 'text-gray-600',
      bg: 'bg-gray-100',
      icon: '➡️'
    }
  }

  const config = changeConfig[changeType]

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div className="flex justify-between items-start mb-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="w-8 h-8 bg-gray-200 rounded"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          {title}
        </h3>
        <span className="text-2xl">{icon}</span>
      </div>

      <div className="mb-2">
        <p className="text-3xl font-bold text-gray-900">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>

      {change !== undefined && (
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
            <span className="mr-1">{config.icon}</span>
            {change}%
          </span>
          <span className="text-sm text-gray-500">from last period</span>
        </div>
      )}

      {description && (
        <p className="text-sm text-gray-500 mt-2">{description}</p>
      )}
    </motion.div>
  )
}

export default AnalyticsCard