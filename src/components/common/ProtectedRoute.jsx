import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { hasPermission } from '../../utils/permissions'
import LoadingScreen from './LoadingScreen'

const ProtectedRoute = ({ 
  children, 
  requiredPermission = null,
  requiredRole = null,
  fallbackPath = '/login',
  showLoading = true
}) => {
  const location = useLocation()
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    profile,
    getUserRole 
  } = useAuthStore()

  // Show loading screen while checking authentication
  if (isLoading && showLoading) {
    return <LoadingScreen message="Ověřuji přístup..." />
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ from: location }} 
        replace 
      />
    )
  }

  // Wait for profile to load
  if (!profile) {
    return showLoading ? (
      <LoadingScreen message="Načítám profil..." />
    ) : null
  }

  const userRole = getUserRole()

  // Check role requirement
  if (requiredRole && userRole !== requiredRole) {
    return (
      <Navigate 
        to="/dashboard" 
        state={{ 
          error: 'Nemáte oprávnění pro přístup k této stránce',
          from: location 
        }} 
        replace 
      />
    )
  }

  // Check permission requirement
  if (requiredPermission && !hasPermission(userRole, requiredPermission)) {
    return (
      <Navigate 
        to="/dashboard" 
        state={{ 
          error: 'Nemáte oprávnění pro přístup k této stránce',
          from: location 
        }} 
        replace 
      />
    )
  }

  // User has access, render children
  return children
}

// Higher-order component for protecting components
export const withProtection = (
  Component, 
  requiredPermission = null, 
  requiredRole = null
) => {
  return function ProtectedComponent(props) {
    return (
      <ProtectedRoute 
        requiredPermission={requiredPermission}
        requiredRole={requiredRole}
      >
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}

// Hook for checking permissions in components
export const usePermissions = () => {
  const { profile, getUserRole } = useAuthStore()
  const userRole = getUserRole()

  return {
    userRole,
    profile,
    hasPermission: (permission) => hasPermission(userRole, permission),
    isAdmin: () => userRole === 'admin',
    isManager: () => userRole === 'manager' || userRole === 'admin',
    isEmployee: () => userRole === 'employee'
  }
}

// Component for conditionally rendering content based on permissions
export const PermissionGate = ({ 
  permission, 
  role, 
  children, 
  fallback = null,
  requireAll = false 
}) => {
  const { hasPermission: checkPermission, userRole } = usePermissions()

  let hasAccess = true

  if (permission && role) {
    // Both permission and role specified
    if (requireAll) {
      // Require both conditions
      hasAccess = checkPermission(permission) && userRole === role
    } else {
      // Require either condition
      hasAccess = checkPermission(permission) || userRole === role
    }
  } else if (permission) {
    // Only permission specified
    hasAccess = checkPermission(permission)
  } else if (role) {
    // Only role specified
    hasAccess = userRole === role
  }

  return hasAccess ? children : fallback
}

// Admin only route
export const AdminRoute = ({ children }) => (
  <ProtectedRoute requiredRole="admin">
    {children}
  </ProtectedRoute>
)

// Manager or Admin route
export const ManagerRoute = ({ children }) => (
  <ProtectedRoute requiredPermission="projects">
    {children}
  </ProtectedRoute>
)

// Employee route (any authenticated user)
export const EmployeeRoute = ({ children }) => (
  <ProtectedRoute>
    {children}
  </ProtectedRoute>
)

export default ProtectedRoute
