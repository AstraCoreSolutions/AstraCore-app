// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager', 
  EMPLOYEE: 'employee'
}

// Role permissions
export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    'dashboard', 'projects', 'finance', 'invoices', 'employees',
    'materials', 'equipment', 'clients', 'suppliers', 'vehicles',
    'documents', 'reports', 'settings', 'users'
  ],
  [USER_ROLES.MANAGER]: [
    'dashboard', 'projects', 'employees', 'materials', 'equipment',
    'clients', 'suppliers', 'vehicles', 'documents'
  ],
  [USER_ROLES.EMPLOYEE]: [
    'dashboard', 'projects'
  ]
}

// Project statuses
export const PROJECT_STATUS = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  ON_HOLD: 'on_hold'
}

// Invoice statuses
export const INVOICE_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled'
}

// Transaction types
export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense'
}

// Employee statuses
export const EMPLOYEE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  TERMINATED: 'terminated'
}

// Equipment statuses
export const EQUIPMENT_STATUS = {
  AVAILABLE: 'available',
  BORROWED: 'borrowed',
  SERVICE: 'service',
  RETIRED: 'retired'
}

// Vehicle statuses
export const VEHICLE_STATUS = {
  ACTIVE: 'active',
  SERVICE: 'service',
  RETIRED: 'retired'
}

// Czech translations
export const STATUS_LABELS = {
  // Projects
  [PROJECT_STATUS.PLANNING]: 'Plánování',
  [PROJECT_STATUS.ACTIVE]: 'Aktivní',
  [PROJECT_STATUS.COMPLETED]: 'Dokončeno',
  [PROJECT_STATUS.CANCELLED]: 'Zrušeno',
  [PROJECT_STATUS.ON_HOLD]: 'Pozastaveno',
  
  // Invoices
  [INVOICE_STATUS.DRAFT]: 'Koncept',
  [INVOICE_STATUS.PENDING]: 'Čekající',
  [INVOICE_STATUS.PAID]: 'Zaplaceno',
  [INVOICE_STATUS.OVERDUE]: 'Po splatnosti',
  [INVOICE_STATUS.CANCELLED]: 'Zrušeno',
  
  // Transactions
  [TRANSACTION_TYPES.INCOME]: 'Příjem',
  [TRANSACTION_TYPES.EXPENSE]: 'Výdaj',
  
  // Employees
  [EMPLOYEE_STATUS.ACTIVE]: 'Aktivní',
  [EMPLOYEE_STATUS.INACTIVE]: 'Neaktivní',
  [EMPLOYEE_STATUS.TERMINATED]: 'Ukončeno',
  
  // Equipment
  [EQUIPMENT_STATUS.AVAILABLE]: 'K dispozici',
  [EQUIPMENT_STATUS.BORROWED]: 'Vypůjčeno',
  [EQUIPMENT_STATUS.SERVICE]: 'V servisu',
  [EQUIPMENT_STATUS.RETIRED]: 'Vyřazeno',
  
  // Vehicles
  [VEHICLE_STATUS.ACTIVE]: 'Aktivní',
  [VEHICLE_STATUS.SERVICE]: 'V servisu',
  [VEHICLE_STATUS.RETIRED]: 'Vyřazeno',
  
  // Roles
  [USER_ROLES.ADMIN]: 'Administrátor',
  [USER_ROLES.MANAGER]: 'Stavbyvedoucí',
  [USER_ROLES.EMPLOYEE]: 'Zaměstnanec'
}

// Status colors for badges
export const STATUS_COLORS = {
  // Projects
  [PROJECT_STATUS.PLANNING]: 'info',
  [PROJECT_STATUS.ACTIVE]: 'success',
  [PROJECT_STATUS.COMPLETED]: 'secondary',
  [PROJECT_STATUS.CANCELLED]: 'danger',
  [PROJECT_STATUS.ON_HOLD]: 'warning',
  
  // Invoices
  [INVOICE_STATUS.DRAFT]: 'secondary',
  [INVOICE_STATUS.PENDING]: 'warning',
  [INVOICE_STATUS.PAID]: 'success',
  [INVOICE_STATUS.OVERDUE]: 'danger',
  [INVOICE_STATUS.CANCELLED]: 'danger',
  
  // Employees
  [EMPLOYEE_STATUS.ACTIVE]: 'success',
  [EMPLOYEE_STATUS.INACTIVE]: 'warning',
  [EMPLOYEE_STATUS.TERMINATED]: 'danger',
  
  // Equipment
  [EQUIPMENT_STATUS.AVAILABLE]: 'success',
  [EQUIPMENT_STATUS.BORROWED]: 'info',
  [EQUIPMENT_STATUS.SERVICE]: 'warning',
  [EQUIPMENT_STATUS.RETIRED]: 'danger',
  
  // Vehicles
  [VEHICLE_STATUS.ACTIVE]: 'success',
  [VEHICLE_STATUS.SERVICE]: 'warning',
  [VEHICLE_STATUS.RETIRED]: 'danger'
}

// Categories
export const MATERIAL_CATEGORIES = [
  'Beton a malta',
  'Cihly a bloky',
  'Dřevo a materiály',
  'Ocel a kovy',
  'Izolace',
  'Střešní materiály',
  'Nástroje a spojovací materiál',
  'Elektromateriál',
  'Voda a topení',
  'Malířské potřeby',
  'Ostatní'
]

export const EQUIPMENT_CATEGORIES = [
  'Ruční nářadí',
  'Elektrické nářadí',
  'Stavební stroje',
  'Měřící technika',
  'Ochranné pomůcky',
  'Lešení a podpěry',
  'Ostatní'
]

export const EXPENSE_CATEGORIES = [
  'Materiál',
  'Mzdy',
  'Nářadí',
  'Pohonné hmoty',
  'Servis',
  'Pojištění',
  'Kancelář',
  'Marketing',
  'Ostatní'
]

// App configuration
export const APP_CONFIG = {
  NAME: 'AstraCore Solutions',
  VERSION: '2.0.0',
  DOMAIN: 'astracore.pro',
  DEFAULT_CURRENCY: 'CZK',
  DEFAULT_VAT_RATE: 21,
  DEFAULT_INVOICE_DUE_DAYS: 14,
  PAGINATION_SIZE: 20,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'xls', 'xlsx']
}
