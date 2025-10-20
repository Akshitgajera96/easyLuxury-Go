// FILE: backend/constants/roles.js
/**
 * User role constants for role-based access control
 * Defines all available user roles in the system
 */

const ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  STAFF: 'staff'
};

const ROLE_HIERARCHY = {
  [ROLES.CUSTOMER]: 1,
  [ROLES.STAFF]: 2,
  [ROLES.ADMIN]: 3
};

// Helper function to check if user has required role or higher
const hasRequiredRole = (userRole, requiredRole) => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

module.exports = {
  ROLES,
  ROLE_HIERARCHY,
  hasRequiredRole
};