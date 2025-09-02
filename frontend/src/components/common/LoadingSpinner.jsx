// src/components/common/LoadingSpinner.jsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import PropTypes from "prop-types";

const LoadingSpinner = ({
  message = "Loading...",
  fullscreen = false,
  size = "medium",
  variant = "primary",
  overlay = true,
  className = "",
  messageClassName = "",
  spinnerClassName = "",
  showMessage = true,
  delay = 0,
}) => {
  const [show, setShow] = React.useState(delay === 0);

  React.useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setShow(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  const sizeClasses = {
    small: "w-8 h-8 border-2",
    medium: "w-16 h-16 border-4",
    large: "w-24 h-24 border-4",
    xl: "w-32 h-32 border-4"
  };

  const variantClasses = {
    primary: "border-blue-500 border-t-transparent",
    secondary: "border-gray-500 border-t-transparent",
    success: "border-green-500 border-t-transparent",
    warning: "border-yellow-500 border-t-transparent",
    danger: "border-red-500 border-t-transparent",
    light: "border-white border-t-transparent",
    dark: "border-gray-800 border-t-transparent"
  };

  const containerClasses = `
    flex flex-col items-center justify-center
    ${fullscreen ? "fixed inset-0 z-50" : "py-6"}
    ${overlay && fullscreen ? "bg-white bg-opacity-90 dark:bg-gray-900 dark:bg-opacity-90" : ""}
    ${className}
  `;

  const spinnerClasses = `
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    border-dotted rounded-full animate-spin mb-4
    ${spinnerClassName}
  `;

  const messageClasses = `
    text-base font-medium
    ${variant === 'light' ? 'text-white' : 'text-gray-700 dark:text-gray-300'}
    ${messageClassName}
  `;

  const spinner = (
    <motion.div
      className={spinnerClasses}
      role="status"
      aria-label="Loading"
      initial={{ rotate: 0, opacity: 0.5 }}
      animate={{ rotate: 360, opacity: 1 }}
      transition={{
        rotate: { duration: 1, repeat: Infinity, ease: "linear" },
        opacity: { duration: 0.3 }
      }}
    />
  );

  const content = (
    <>
      {spinner}
      {showMessage && (
        <motion.p
          className={messageClasses}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {message}
        </motion.p>
      )}
    </>
  );

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={containerClasses}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        role="alert"
        aria-live="polite"
        aria-busy="true"
      >
        {content}
      </motion.div>
    </AnimatePresence>
  );
};

// Dot spinner variant for inline loading
export const DotSpinner = ({ size = "medium", variant = "primary" }) => {
  const sizeClasses = {
    small: "w-2 h-2",
    medium: "w-3 h-3",
    large: "w-4 h-4"
  };

  const variantClasses = {
    primary: "bg-blue-500",
    secondary: "bg-gray-500",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500"
  };

  return (
    <div className="flex items-center justify-center space-x-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-full`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2
          }}
        />
      ))}
    </div>
  );
};

// Skeleton loader for content placeholders
export const SkeletonLoader = ({ 
  count = 1, 
  height = "h-4", 
  width = "w-full", 
  className = "" 
}) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className={`bg-gray-200 dark:bg-gray-700 rounded ${height} ${width} ${className}`}
          animate={{
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity
          }}
        />
      ))}
    </div>
  );
};

// Progress bar loader
export const ProgressBar = ({ 
  progress = 0, 
  variant = "primary",
  height = "h-2",
  className = "" 
}) => {
  const variantClasses = {
    primary: "bg-blue-500",
    secondary: "bg-gray-500",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500"
  };

  return (
    <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full ${height} ${className}`}>
      <motion.div
        className={`${variantClasses[variant]} ${height} rounded-full transition-all duration-300`}
        initial={{ width: "0%" }}
        animate={{ width: `${progress}%` }}
      />
    </div>
  );
};

LoadingSpinner.propTypes = {
  message: PropTypes.string,
  fullscreen: PropTypes.bool,
  size: PropTypes.oneOf(["small", "medium", "large", "xl"]),
  variant: PropTypes.oneOf(["primary", "secondary", "success", "warning", "danger", "light", "dark"]),
  overlay: PropTypes.bool,
  className: PropTypes.string,
  messageClassName: PropTypes.string,
  spinnerClassName: PropTypes.string,
  showMessage: PropTypes.bool,
  delay: PropTypes.number,
};

DotSpinner.propTypes = {
  size: PropTypes.oneOf(["small", "medium", "large"]),
  variant: PropTypes.oneOf(["primary", "secondary", "success", "warning", "danger"]),
};

SkeletonLoader.propTypes = {
  count: PropTypes.number,
  height: PropTypes.string,
  width: PropTypes.string,
  className: PropTypes.string,
};

ProgressBar.propTypes = {
  progress: PropTypes.number,
  variant: PropTypes.oneOf(["primary", "secondary", "success", "warning", "danger"]),
  height: PropTypes.string,
  className: PropTypes.string,
};

export default LoadingSpinner;