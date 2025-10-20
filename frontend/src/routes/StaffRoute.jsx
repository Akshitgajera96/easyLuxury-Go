/**
 * Staff-only route component
 * Redirects non-staff users to their respective home pages
 */

import React from 'react'
import PrivateRoute from './PrivateRoute'

const StaffRoute = ({ children }) => {
  return (
    <PrivateRoute requiredRole="staff">
      {children}
    </PrivateRoute>
  )
}

export default StaffRoute
