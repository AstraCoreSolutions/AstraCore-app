// AstraCore Solutions - Configuration

// Supabase Configuration
const SUPABASE_CONFIG = {
    URL: 'https://ikxwnpbljrsuclhmrgjw.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlreHducGJsanJzdWNsaG1yZ2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MzM5MDMsImV4cCI6MjA2NDEwOTkwM30.38VTFfklX_7ovgwMjQlcx2B7PheHbMGs6yFqygcciWo'
};

// App Configuration
const APP_CONFIG = {
    NAME: 'AstraCore Solutions',
    VERSION: '2.0.0',
    ENVIRONMENT: 'production',
    
    DEFAULTS: {
        CURRENCY: 'CZK',
        VAT_RATE: 21,
        INVOICE_DUE_DAYS: 14,
        DATE_FORMAT: 'cs-CZ',
        TIMEZONE: 'Europe/Prague'
    },
    
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 20,
        MAX_PAGE_SIZE: 100
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
    ATTENDANCE: 'attendance'
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

// Localization
const LOCALE = {
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
    
    CATEGORY_TEXT: {
        material: 'Materiál',
        labor: 'Práce',
        tools: 'Nářadí',
        fuel: 'Pohonné hmoty',
        office: 'Kancelář',
        insurance: 'Pojištění',
        vehicle: 'Vozidla',
        other: 'Ostatní'
    }
};

// Export configuration
window.AstraCore = {
    SUPABASE_CONFIG,
    APP_CONFIG,
    TABLES,
    STATUS_MAPPINGS,
    LOCALE
};

// Initialize Supabase client
let supabaseClient;
if (typeof supabase !== 'undefined') {
    try {
        const { createClient } = supabase;
        supabaseClient = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);
        window.supabaseClient = supabaseClient;
        console.log('✅ Supabase client initialized');
    } catch (error) {
        console.error('❌ Failed to initialize Supabase client:', error);
    }
}

console.log('✅ AstraCore configuration loaded');
