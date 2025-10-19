/**
 * Reusable confirmation dialog component
 * Handles confirm/cancel actions with smooth animations
 */

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ConfirmDialog = ({
  isOpen = false,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'warning',
  isLoading = false
}) => {
  const typeConfig = {
    warning: {
      bg: 'bg-accent/10',
      border: 'border-accent',
      icon: '⚠️',
      confirmButton: 'bg-accent hover:bg-gradient-to-r hover:from-accent hover:to-accent-dark hover:shadow-xl hover:scale-105 transition-all duration-300/90'
    },
    danger: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: '❌',
      confirmButton: 'bg-gradient-to-r from-error to-error-dark shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 hover:bg-red-700'
    },
    info: {
      bg: 'bg-accent/10',
      border: 'border-accent',
      icon: 'ℹ️',
      confirmButton: 'bg-black40 hover:bg-black40'
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: '✅',
      confirmButton: 'bg-gradient-to-r from-success to-success-dark shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 hover:bg-green-700'
    }
  }

  const config = typeConfig[type]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`bg-white rounded-xl shadow-xl max-w-md w-full ${config.bg} ${config.border} border-2`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{config.icon}</span>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              </div>
              
              <p className="text-gray-600 mb-6">{message}</p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={onCancel}
                  disabled={isLoading}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`px-4 py-2 text-white ${config.confirmButton} rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2`}
                >
                  {isLoading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ConfirmDialog