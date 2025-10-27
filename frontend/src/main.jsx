/**
 * Main entry point for the React application
 * Sets up the root component with necessary providers
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import './enhanced-visibility.css'
import './modern-dark-theme.css'

// Suppress MetaMask and other browser extension errors
window.addEventListener('unhandledrejection', (event) => {
  // Check if error is related to MetaMask or browser extensions
  if (
    event.reason?.message?.includes('MetaMask') ||
    event.reason?.message?.includes('ethereum') ||
    event.reason?.message?.includes('extension not found')
  ) {
    // Suppress these errors as they're from browser extensions, not our app
    event.preventDefault()
    // Only log in development
    if (import.meta.env.DEV) {
      console.debug('Suppressed browser extension error:', event.reason?.message)
    }
  }
})

// Suppress Socket.IO connection errors in console (they're handled in SocketContext)
// This prevents ERR_CONNECTION_REFUSED from cluttering the console during startup
const originalConsoleError = console.error
console.error = (...args) => {
  // Filter out Socket.IO polling errors that are expected during connection attempts
  const errorString = args.join(' ')
  if (
    errorString.includes('polling-xhr.js') ||
    errorString.includes('ERR_CONNECTION_REFUSED') ||
    (errorString.includes('socket.io') && errorString.includes('transport=polling'))
  ) {
    // These are expected during initial connection and reconnection attempts
    // Socket.IO will retry automatically - we log these properly in SocketContext
    if (import.meta.env.DEV) {
      console.debug('Socket.IO connection attempt (expected during startup/reconnect)')
    }
    return
  }
  // Pass through all other errors
  originalConsoleError.apply(console, args)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)