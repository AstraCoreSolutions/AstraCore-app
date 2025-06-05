// Route paths
export const ROUTES = {
  // Public routes
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Protected routes
  DASHBOARD: '/dashboard',
  
  // Projects
  PROJECTS: '/projects',
  PROJECT_DETAIL: '/projects/:id',
  PROJECT_DIARY: '/projects/:id/diary',
  
  // Finance
  FINANCE: '/finance',
  
  // Invoices
  INVOICES: '/invoices',
  INVOICE_DETAIL: '/invoices/:id',
  
  // Employees
  EMPLOYEES: '/employees',
  EMPLOYEE_DETAIL: '/employees/:id',
  
  // Materials
  MATERIALS: '/materials',
  MATERIAL_DETAIL: '/materials/:id',
  
  // Equipment
  EQUIPMENT: '/equipment',
  EQUIPMENT_DETAIL: '/equipment/:id',
  
  // Clients
  CLIENTS: '/clients',
  CLIENT_DETAIL: '/clients/:id',
  
  // Suppliers
  SUPPLIERS: '/suppliers',
  SUPPLIER_DETAIL: '/suppliers/:id',
  
  // Vehicles
  VEHICLES: '/vehicles',
  VEHICLE_DETAIL: '/vehicles/:id',
  
  // Documents
  DOCUMENTS: '/documents',
  
  // Reports
  REPORTS: '/reports',
  
  // Settings
  SETTINGS: '/settings',
  SETTINGS_USERS: '/settings/users',
  SETTINGS_PROFILE: '/settings/profile',
  SETTINGS_COMPANY: '/settings/company',

  // Catch all
  NOT_FOUND: '*'
}

// Route metadata
export const ROUTE_METADATA = {
  [ROUTES.DASHBOARD]: {
    title: 'Dashboard',
    permission: 'dashboard',
    breadcrumb: ['Dashboard']
  },
  [ROUTES.PROJECTS]: {
    title: 'Projekty',
    permission: 'projects',
    breadcrumb: ['Dashboard', 'Projekty']
  },
  [ROUTES.PROJECT_DETAIL]: {
    title: 'Detail projektu',
    permission: 'projects',
    breadcrumb: ['Dashboard', 'Projekty', 'Detail']
  },
  [ROUTES.PROJECT_DIARY]: {
    title: 'Stavební deník',
    permission: 'projects',
    breadcrumb: ['Dashboard', 'Projekty', 'Detail', 'Deník']
  },
  [ROUTES.FINANCE]: {
    title: 'Finance & Účetnictví',
    permission: 'finance',
    breadcrumb: ['Dashboard', 'Finance']
  },
  [ROUTES.INVOICES]: {
    title: 'Faktury',
    permission: 'invoices',
    breadcrumb: ['Dashboard', 'Faktury']
  },
  [ROUTES.EMPLOYEES]: {
    title: 'Zaměstnanci',
    permission: 'employees',
    breadcrumb: ['Dashboard', 'Zaměstnanci']
  },
  [ROUTES.MATERIALS]: {
    title: 'Materiál',
    permission: 'materials',
    breadcrumb: ['Dashboard', 'Materiál']
  },
  [ROUTES.EQUIPMENT]: {
    title: 'Nářadí',
    permission: 'equipment',
    breadcrumb: ['Dashboard', 'Nářadí']
  },
  [ROUTES.CLIENTS]: {
    title: 'Klienti',
    permission: 'clients',
    breadcrumb: ['Dashboard', 'Klienti']
  },
  [ROUTES.SUPPLIERS]: {
    title: 'Dodavatelé',
    permission: 'suppliers',
    breadcrumb: ['Dashboard', 'Dodavatelé']
  },
  [ROUTES.VEHICLES]: {
    title: 'Vozový park',
    permission: 'vehicles',
    breadcrumb: ['Dashboard', 'Vozový park']
  },
  [ROUTES.DOCUMENTS]: {
    title: 'Dokumenty',
    permission: 'documents',
    breadcrumb: ['Dashboard', 'Dokumenty']
  },
  [ROUTES.REPORTS]: {
    title: 'Reporty',
    permission: 'reports',
    breadcrumb: ['Dashboard', 'Reporty']
  },
  [ROUTES.SETTINGS]: {
    title: 'Nastavení',
    permission: 'settings',
    breadcrumb: ['Dashboard', 'Nastavení']
  },
  [ROUTES.SETTINGS_USERS]: {
    title: 'Správa uživatelů',
    permission: 'users',
    breadcrumb: ['Dashboard', 'Nastavení', 'Uživatelé']
  }
}

// Helper functions
export const getRouteMetadata = (path) => {
  return ROUTE_METADATA[path] || {}
}

export const getRouteBreadcrumb = (path) => {
  const metadata = getRouteMetadata(path)
  return metadata.breadcrumb || []
}

export const getRoutePermission = (path) => {
  const metadata = getRouteMetadata(path)
  return metadata.permission || null
}

export const buildPath = (route, params = {}) => {
  let path = route
  
  // Replace route parameters
  Object.entries(params).forEach(([key, value]) => {
    path = path.replace(`:${key}`, value)
  })
  
  return path
}

// Navigation helpers
export const getProjectDetailPath = (projectId) => 
  buildPath(ROUTES.PROJECT_DETAIL, { id: projectId })

export const getProjectDiaryPath = (projectId) => 
  buildPath(ROUTES.PROJECT_DIARY, { id: projectId })

export const getEmployeeDetailPath = (employeeId) => 
  buildPath(ROUTES.EMPLOYEE_DETAIL, { id: employeeId })

export const getClientDetailPath = (clientId) => 
  buildPath(ROUTES.CLIENT_DETAIL, { id: clientId })

export const getInvoiceDetailPath = (invoiceId) => 
  buildPath(ROUTES.INVOICE_DETAIL, { id: invoiceId })

// Route guards configuration
export const ROUTE_GUARDS = {
  // Admin only routes
  ADMIN_ONLY: [
    ROUTES.FINANCE,
    ROUTES.INVOICES,
    ROUTES.REPORTS,
    ROUTES.SETTINGS_USERS
  ],
  
  // Manager and Admin routes
  MANAGER_ROUTES: [
    ROUTES.PROJECTS,
    ROUTES.EMPLOYEES,
    ROUTES.MATERIALS,
    ROUTES.EQUIPMENT,
    ROUTES.CLIENTS,
    ROUTES.SUPPLIERS,
    ROUTES.VEHICLES,
    ROUTES.DOCUMENTS
  ],
  
  // All authenticated users
  USER_ROUTES: [
    ROUTES.DASHBOARD,
    ROUTES.SETTINGS
  ]
}

export const isAdminRoute = (path) => {
  return ROUTE_GUARDS.ADMIN_ONLY.some(route => path.startsWith(route))
}

export const isManagerRoute = (path) => {
  return ROUTE_GUARDS.MANAGER_ROUTES.some(route => path.startsWith(route))
}

export const isUserRoute = (path) => {
  return ROUTE_GUARDS.USER_ROUTES.some(route => path.startsWith(route))
}
