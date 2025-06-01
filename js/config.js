// AstraCore Solutions - Configuration

// Supabase Configuration
const SUPABASE_CONFIG = {
    URL: 'https://ikxwnpbljrsuclhmrgjw.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlreHducGJsanJzdWNsaG1yZ2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MzM5MDMsImV4cCI6MjA2NDEwOTkwM30.38VTFfklX_7ovgwMjQlcx2B7PheHbMGs6yFqygcciWo'
};

// App Configuration
const APP_CONFIG = {
    NAME: 'AstraCore Solutions',
    VERSION: '1.0.0',
    ENVIRONMENT: 'development', // development, production
    
    // Default Settings
    DEFAULTS: {
        CURRENCY: 'CZK',
        VAT_RATE: 21,
        INVOICE_DUE_DAYS: 14,
        DATE_FORMAT: 'cs-CZ',
        TIMEZONE: 'Europe/Prague'
    },
    
    // Pagination
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 20,
        MAX_PAGE_SIZE: 100
    },
    
    // File Upload
    UPLOAD: {
        MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
        ALLOWED_TYPES: ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        MAX_FILES: 10
    },
    
    // Features
    FEATURES: {
        ENABLE_NOTIFICATIONS: true,
        ENABLE_REAL_TIME: true,
        ENABLE_ANALYTICS: true,
        ENABLE_EXPORT: true
    }
};

// Database Table Names
const TABLES = {
    PROJECTS: 'projects',
    TRANSACTIONS: 'transactions',
    INVOICES: 'invoices',
    EMPLOYEES: 'employees',
    EQUIPMENT: 'equipment',
    MATERIALS: 'materials',
    MATERIAL_PURCHASES: 'material_purchases',
    MATERIAL_USAGE: 'material_usage',
    EQUIPMENT_BORROWS: 'equipment_borrows',
    ATTENDANCE: 'attendance',
    COMPANY_SETTINGS: 'company_settings'
};

// Status Mappings
const STATUS_MAPPINGS = {
    PROJECT_STATUS: {
        PLANNING: 'planning',
        ACTIVE: 'active',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled'
    },
    
    INVOICE_STATUS: {
        PENDING: 'pending',
        PAID: 'paid',
        OVERDUE: 'overdue',
        CANCELLED: 'cancelled'
    },
    
    EMPLOYEE_STATUS: {
        ACTIVE: 'active',
        INACTIVE: 'inactive',
        TERMINATED: 'terminated'
    },
    
    EQUIPMENT_STATUS: {
        AVAILABLE: 'available',
        BORROWED: 'borrowed',
        SERVICE: 'service',
        RETIRED: 'retired'
    }
};

// Categories
const CATEGORIES = {
    TRANSACTION: {
        MATERIAL: 'material',
        LABOR: 'labor',
        TOOLS: 'tools',
        FUEL: 'fuel',
        OFFICE: 'office',
        INSURANCE: 'insurance',
        VEHICLE: 'vehicle',
        OTHER: 'other'
    },
    
    INCOME_TYPE: {
        INVOICING: 'invoicing',
        RENT: 'rent',
        VAT_REFUND: 'vat_refund',
        CREDIT_NOTE: 'credit_note',
        SUBSIDY: 'subsidy',
        CONSULTING: 'consulting',
        SERVICE: 'service',
        ASSET_SALE: 'asset_sale',
        INSURANCE: 'insurance',
        OTHER: 'other'
    },
    
    EQUIPMENT: {
        HAND_TOOLS: 'hand_tools',
        POWER_TOOLS: 'power_tools',
        MACHINERY: 'machinery',
        MEASURING: 'measuring',
        VEHICLES: 'vehicles',
        SAFETY: 'safety',
        IT: 'it'
    },
    
    MATERIAL: {
        CONSTRUCTION: 'construction',
        WOOD: 'wood',
        FASTENERS: 'fasteners',
        ELECTRICAL: 'electrical',
        PLUMBING: 'plumbing',
        FINISHING: 'finishing',
        INSULATION: 'insulation',
        WINDOWS_DOORS: 'windows_doors'
    }
};

// Localization
const LOCALE = {
    // Status Text
    STATUS_TEXT: {
        planning: 'Plánování',
        active: 'Aktivní',
        completed: 'Dokončeno',
        cancelled: 'Zrušeno',
        pending: 'Čekající',
        paid: 'Zaplaceno',
        overdue: 'Po splatnosti',
        available: 'K dispozici',
        borrowed: 'Vypůjčeno',
        service: 'V servisu',
        retired: 'Vyřazeno',
        inactive: 'Neaktivní',
        terminated: 'Ukončeno'
    },
    
    // Category Text
    CATEGORY_TEXT: {
        material: 'Materiál',
        labor: 'Práce',
        tools: 'Nářadí',
        fuel: 'Pohonné hmoty',
        office: 'Kancelář',
        insurance: 'Pojištění',
        vehicle: 'Vozidla',
        other: 'Ostatní',
        
        // Equipment categories
        hand_tools: 'Ruční nářadí',
        power_tools: 'Elektrické nářadí',
        machinery: 'Strojní technika',
        measuring: 'Měřicí přístroje',
        vehicles: 'Dopravní prostředky',
        safety: 'Ochranné pomůcky',
        it: 'IT technika',
        
        // Material categories
        construction: 'Stavební materiál',
        wood: 'Dřevo a desky',
        fasteners: 'Spojovací materiál',
        electrical: 'Elektroinstalace',
        plumbing: 'Voda a topení',
        finishing: 'Dokončovací práce',
        insulation: 'Izolace',
        windows_doors: 'Okna a dveře'
    },
    
    // Units
    UNITS: {
        kg: 'kg',
        m2: 'm²',
        m3: 'm³',
        m: 'm',
        ks: 'ks',
        balení: 'balení',
        pytel: 'pytel',
        role: 'role',
        litr: 'litr',
        hod: 'hod',
        den: 'den'
    }
};

// Error Messages
const ERROR_MESSAGES = {
    NETWORK: 'Chyba připojení k serveru',
    AUTH_FAILED: 'Neplatné přihlašovací údaje',
    PERMISSION_DENIED: 'Nemáte oprávnění k této akci',
    NOT_FOUND: 'Požadovaný záznam nebyl nalezen',
    VALIDATION_FAILED: 'Neplatná data',
    SERVER_ERROR: 'Chyba serveru',
    TIMEOUT: 'Časový limit vypršel',
    OFFLINE: 'Žádné připojení k internetu'
};

// Success Messages
const SUCCESS_MESSAGES = {
    SAVED: 'Úspěšně uloženo',
    DELETED: 'Úspěšně smazáno',
    UPDATED: 'Úspěšně aktualizováno',
    CREATED: 'Úspěšně vytvořeno',
    SENT: 'Úspěšně odesláno',
    UPLOADED: 'Úspěšně nahráno'
};

// API Endpoints (if using custom API)
const API_ENDPOINTS = {
    BASE_URL: '/api/v1',
    PROJECTS: '/projects',
    TRANSACTIONS: '/transactions',
    INVOICES: '/invoices',
    EMPLOYEES: '/employees',
    EQUIPMENT: '/equipment',
    MATERIALS: '/materials',
    REPORTS: '/reports',
    UPLOAD: '/upload'
};

// Export configuration for use in other modules
window.AstraCore = {
    SUPABASE_CONFIG,
    APP_CONFIG,
    TABLES,
    STATUS_MAPPINGS,
    CATEGORIES,
    LOCALE,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    API_ENDPOINTS
};

// Initialize Supabase client
let supabaseClient;
try {
    const { createClient } = supabase;
    supabaseClient = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);
    window.supabaseClient = supabaseClient;
    console.log('✅ Supabase client initialized');
} catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error);
}

// Global app state
window.appState = {
    currentUser: null,
    isAuthenticated: false,
    isLoading: false,
    currentPage: 'dashboard',
    data: {
        projects: [],
        transactions: [],
        invoices: [],
        employees: [],
        equipment: [],
        materials: [],
        materialPurchases: [],
        materialUsage: [],
        equipmentBorrows: [],
        attendance: []
    },
    cache: new Map(),
    settings: {
        theme: 'light',
        language: 'cs',
        notifications: true,
        autoSave: true
    }
};

// Environment-specific configuration
if (APP_CONFIG.ENVIRONMENT === 'development') {
    // Enable debug mode
    window.DEBUG = true;
    console.log('🚀 AstraCore Solutions - Development Mode');
    console.log('📊 Configuration loaded:', window.AstraCore);
} else {
    // Production mode
    window.DEBUG = false;
    console.log('🏭 AstraCore Solutions - Production Mode');
}
