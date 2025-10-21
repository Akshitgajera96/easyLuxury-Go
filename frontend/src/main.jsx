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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)