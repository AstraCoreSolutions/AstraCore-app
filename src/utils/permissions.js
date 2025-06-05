import { USER_ROLES, ROLE_PERMISSIONS } from './constants.js'

// Check if user has permission to access a module
export const hasPermission = (userRole, module) => {
  if (!userRole || !module) return false
  
  const permissions = ROLE_PERMISSIONS[userRole]
  return permissions && permissions.includes(module)
}

// Check if user is admin
export const isAdmin = (userRole) => {
  return userRole === USER_ROLES.ADMIN
}

// Check if user is manager or admin
export const isManagerOrAdmin = (userRole) => {
  return userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.MANAGER
}

// Check if user can view finances
export const canViewFinances = (userRole) => {
  return userRole === USER_ROLES.ADMIN
}

// Check if user can manage users
export const canManageUsers = (userRole) => {
  return userRole === USER_ROLES.ADMIN
}

// Check if user can edit project
export const canEditProject = (userRole, project, userId) => {
  // Admin can edit any project
  if (userRole === USER_ROLES.ADMIN) return true
  
  // Manager can edit projects they are assigned to
  if (userRole === USER_ROLES.MANAGER) {
    return project.manager_id === userId || project.created_by === userId
  }
  
  // Employee cannot edit projects
  return false
}

// Check if user can view project details
export const canViewProject = (userRole, project, userId) => {
  // Admin and manager can view all projects
  if (userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.MANAGER) {
    return true
  }
  
  // Employee can only view projects they are assigned to
  if (userRole === USER_ROLES.EMPLOYEE) {
    return project.assigned_employees?.includes(userId) || project.created_by === userId
  }
  
  return false
}

// Check if user can delete item
export const canDelete = (userRole, item, userId) => {
  // Only admin can delete
  if (userRole === USER_ROLES.ADMIN) return true
  
  // Manager can delete items they created
  if (userRole === USER_ROLES.MANAGER) {
    return item.created_by === userId
  }
  
  return false
}

// Check if user can create items
export const canCreate = (userRole, module) => {
  // Admin can create anything
  if (userRole === USER_ROLES.ADMIN) return true
  
  // Manager can create most things except financial records
  if (userRole === USER_ROLES.MANAGER) {
    const restrictedModules = ['finance', 'invoices', 'reports']
    return !restrictedModules.includes(module)
  }
  
  // Employee can only create limited items
  if (userRole === USER_ROLES.EMPLOYEE) {
    const allowedModules = ['attendance', 'project_diary']
    return allowedModules.includes(module)
  }
  
  return false
}

// Get allowed project statuses for user
export const getAllowedProjectStatuses = (userRole) => {
  if (userRole === USER_ROLES.ADMIN) {
    return ['planning', 'active', 'completed', 'cancelled', 'on_hold']
  }
  
  if (userRole === USER_ROLES.MANAGER) {
    return ['planning', 'active', 'on_hold']
  }
  
  // Employee cannot change project status
  return []
}

// Filter data based on user permissions
export const filterDataByPermissions = (data, userRole, userId, dataType) => {
  // Admin sees everything
  if (userRole === USER_ROLES.ADMIN) return data
  
  switch (dataType) {
    case 'projects':
      if (userRole === USER_ROLES.MANAGER) {
        return data // Manager sees all projects
      }
      if (userRole === USER_ROLES.EMPLOYEE) {
        return data.filter(project => 
          project.assigned_employees?.includes(userId) || 
          project.created_by === userId
        )
      }
      break
      
    case 'employees':
      if (userRole === USER_ROLES.MANAGER) {
        return data // Manager sees all employees
      }
      if (userRole === USER_ROLES.EMPLOYEE) {
        return data.filter(employee => employee.id === userId)
      }
      break
      
    case 'finance':
    case 'invoices':
      // Only admin can see financial data
      if (userRole === USER_ROLES.ADMIN) return data
      return []
      
    default:
      return data
  }
  
  return []
}

// Check if user can access dashboard widget
export const canAccessWidget = (userRole, widgetType) => {
  const widgetPermissions = {
    'financial_summary': [USER_ROLES.ADMIN],
    'project_stats': [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
    'employee_stats': [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
    'recent_projects': [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.EMPLOYEE],
    'my_tasks': [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.EMPLOYEE],
    'notifications': [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.EMPLOYEE]
  }
  
  const allowedRoles = widgetPermissions[widgetType]
  return allowedRoles ? allowedRoles.includes(userRole) : false
}

// Get navigation items for user role
export const getNavigationItems = (userRole) => {
  const allItems = [
    { key: 'dashboard', label: 'Dashboard', icon: 'fas fa-home', path: '/dashboard' },
    { key: 'projects', label: 'Projekty', icon: 'fas fa-building', path: '/projects' },
    { key: 'finance', label: 'Finance', icon: 'fas fa-coins', path: '/finance' },
    { key: 'invoices', label: 'Faktury', icon: 'fas fa-file-invoice', path: '/invoices' },
    { key: 'employees', label: 'Zaměstnanci', icon: 'fas fa-users', path: '/employees' },
    { key: 'materials', label: 'Materiál', icon: 'fas fa-boxes', path: '/materials' },
    { key: 'equipment', label: 'Nářadí', icon: 'fas fa-tools', path: '/equipment' },
    { key: 'clients', label: 'Klienti', icon: 'fas fa-user-tie', path: '/clients' },
    { key: 'suppliers', label: 'Dodavatelé', icon: 'fas fa-truck', path: '/suppliers' },
    { key: 'vehicles', label: 'Vozový park', icon: 'fas fa-car', path: '/vehicles' },
    { key: 'documents', label: 'Dokumenty', icon: 'fas fa-folder', path: '/documents' },
    { key: 'reports', label: 'Reporty', icon: 'fas fa-chart-bar', path: '/reports' },
    { key: 'settings', label: 'Nastavení', icon: 'fas fa-cog', path: '/settings' }
  ]
  
  return allItems.filter(item => hasPermission(userRole, item.key))
}

// Check if user can perform action on resource
export const canPerformAction = (userRole, action, resource, resourceData, userId) => {
  switch (action) {
    case 'create':
      return canCreate(userRole, resource)
      
    case 'edit':
      if (resource === 'projects') {
        return canEditProject(userRole, resourceData, userId)
      }
      return canCreate(userRole, resource)
      
    case 'delete':
      return canDelete(userRole, resourceData, userId)
      
    case 'view':
      if (resource === 'projects') {
        return canViewProject(userRole, resourceData, userId)
      }
      return hasPermission(userRole, resource)
      
    default:
      return false
  }
}

// Get error message for insufficient permissions
export const getPermissionErrorMessage = (action, resource) => {
  const actionLabels = {
    create: 'vytvořit',
    edit: 'upravit', 
    delete: 'smazat',
    view: 'zobrazit'
  }
  
  const resourceLabels = {
    projects: 'projekty',
    finance: 'finance',
    invoices: 'faktury',
    employees: 'zaměstnance',
    materials: 'materiál',
    equipment: 'nářadí',
    clients: 'klienty',
    suppliers: 'dodavatele',
    vehicles: 'vozový park',
    documents: 'dokumenty',
    reports: 'reporty',
    settings: 'nastavení'
  }
  
  const actionLabel = actionLabels[action] || action
  const resourceLabel = resourceLabels[resource] || resource
  
  return `Nemáte oprávnění ${actionLabel} ${resourceLabel}`
}
