import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Database table names
export const TABLES = {
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
  CLIENTS: 'clients',
  SUPPLIERS: 'suppliers',
  VEHICLES: 'vehicles',
  DOCUMENTS: 'documents',
  PROJECT_DIARY: 'project_diary',
  USERS: 'profiles'
}

export default supabase
