// src/components/common/ConfirmCancelPopup.jsx
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle, Info, CheckCircle, AlertCircle } from "lucide-react";

const ConfirmCancelPopup = ({
  isOpen = false,
  title = "Are you sure?",
  message = "Do you want to proceed with this action?",
  type = "default",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isLoading = false,
  disableConfirm = false,
  disableCancel = false,
  size = "md",
  showIcon = true,
  overlayClickClose = true,
  escapeKeyClose = true,
}) => {
  // Handle escape key press
  useEffect(() => {
    if (!isOpen || !escapeKeyClose) return;

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        onCancel?.();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, [isOpen, escapeKeyClose, onCancel]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const getIcon = () => {
    switch (type) {
      case "danger":
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      case "success":
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case "info":
        return <Info className="w-6 h-6 text-blue-500" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-gray-500" />;
    }
  };

  const getButtonVariant = () => {
    switch (type) {
      case "danger":
        return "destructive";
      case "warning":
        return "warning";
      case "success":
        return "success";
      case "info":
        return "secondary";
      default:
        return "default";
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "max-w-sm";
      case "md":
        return "max-w-md";
      case "lg":
        return "max-w-lg";
      case "xl":
        return "max-w-xl";
      default:
        return "max-w-md";
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && overlayClickClose) {
      onCancel?.();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleOverlayClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
        >
          <motion.div
            className={`bg-white dark:bg-gray-800 p-6 rounded-2xl w-full ${getSizeClasses()} shadow-xl relative`}
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Close Button */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              disabled={disableCancel || isLoading}
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            {showIcon && (
              <div className="flex justify-center mb-4">
                {getIcon()}
              </div>
            )}

            {/* Title */}
            <h2
              id="modal-title"
              className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100 text-center"
            >
              {title}
            </h2>

            {/* Message */}
            <p
              id="modal-description"
              className="text-sm text-gray-600 dark:text-gray-300 mb-6 text-center"
            >
              {message}
            </p>

            {/* Actions */}
            <div className="flex justify-center gap-3 flex-col sm:flex-row">
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={disableCancel || isLoading}
                className="flex-1 sm:flex-none"
              >
                {cancelText}
              </Button>
              <Button
                variant={getButtonVariant()}
                onClick={onConfirm}
                disabled={disableConfirm || isLoading}
                loading={isLoading}
                className="flex-1 sm:flex-none"
              >
                {confirmText}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Add display name for better debugging
ConfirmCancelPopup.displayName = "ConfirmCancelPopup";

export default ConfirmCancelPopup;