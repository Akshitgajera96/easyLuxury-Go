/**
 * Reusable loading spinner component with different sizes and variants
 */

import React from 'react'
import { motion } from 'framer-motion'

const LoadingSpinner = ({ 
  size = 'md', 
  variant = 'primary',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const variantClasses = {
    primary: 'border-accent',
    secondary: 'border-black40',
    white: 'border-white',
    gray: 'border-gray-400'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-block ${sizeClasses[size]} ${variantClasses[variant]} border-2 border-t-transparent rounded-full animate-spin ${className}`}
    />
  )
}

export default LoadingSpinner