/**
 * Admin-only route component
 * Redirects non-admin users to their respective home pages
 */

import React from 'react'
import PrivateRoute from './PrivateRoute'

const AdminRoute = ({ children }) => {
  return (
    <PrivateRoute requiredRole="admin">
      {children}
    </PrivateRoute>
  )
}

export default AdminRoute