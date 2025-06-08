import { supabase } from '../../config/supabase'
import { handleApiError } from '../utils/errorHandler'

/**
 * Clients API Service
 * Handles all client-related operations
 */
export const clientsApi = {
  // Get all clients with optional filters
  async getAll(filters = {}) {
    try {
      let query = supabase
        .from('clients')
        .select(`
          *,
          projects:projects(
            id,
            name,
            status,
            start_date,
            end_date,
            budget
          )
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.type) {
        query = query.eq('type', filters.type)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,contact_person.ilike.%${filters.search}%`)
      }
      if (filters.city) {
        query = query.eq('city', filters.city)
      }

      const { data, error } = await query

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch clients')
    }
  },

  // Get client by ID
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          projects:projects(*),
          invoices:invoices(
            id,
            invoice_number,
            total_amount,
            status,
            issue_date,
            due_date
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch client')
    }
  },

  // Create new client
  async create(clientData) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([{
          ...clientData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select(`
          *,
          projects:projects(*)
        `)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to create client')
    }
  },

  // Update client
  async update(id, updates) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          projects:projects(*)
        `)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to update client')
    }
  },

  // Delete client
  async delete(id) {
    try {
      // Check if client has active projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id, status')
        .eq('client_id', id)
        .in('status', ['planning', 'active'])

      if (projects && projects.length > 0) {
        return { 
          data: null, 
          error: 'Nelze smazat klienta s aktivními projekty' 
        }
      }

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { data: true, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to delete client')
    }
  },

  // Get client statistics
  async getStatistics(id) {
    try {
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select(`
          *,
          projects:projects(
            id,
            status,
            budget,
            start_date,
            end_date
          ),
          invoices:invoices(
            id,
            total_amount,
            status,
            issue_date
          )
        `)
        .eq('id', id)
        .single()

      if (clientError) throw clientError

      // Calculate statistics
      const stats = {
        totalProjects: client.projects?.length || 0,
        activeProjects: client.projects?.filter(p => p.status === 'active').length || 0,
        completedProjects: client.projects?.filter(p => p.status === 'completed').length || 0,
        totalBudget: client.projects?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0,
        totalInvoiced: client.invoices?.reduce((sum, i) => sum + (i.total_amount || 0), 0) || 0,
        paidInvoices: client.invoices?.filter(i => i.status === 'paid').length || 0,
        pendingInvoices: client.invoices?.filter(i => i.status === 'pending').length || 0,
        overdueInvoices: client.invoices?.filter(i => i.status === 'overdue').length || 0
      }

      return { data: stats, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to get client statistics')
    }
  },

  // Get client projects
  async getProjects(id, filters = {}) {
    try {
      let query = supabase
        .from('projects')
        .select(`
          *,
          manager:profiles!projects_manager_id_fkey(
            first_name,
            last_name
          )
        `)
        .eq('client_id', id)
        .order('created_at', { ascending: false })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch client projects')
    }
  },

  // Get client invoices
  async getInvoices(id, filters = {}) {
    try {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          project:projects(name)
        `)
        .eq('client_id', id)
        .order('created_at', { ascending: false })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch client invoices')
    }
  },

  // Search clients
  async search(searchTerm, filters = {}) {
    try {
      let query = supabase
        .from('clients')
        .select(`
          *,
          projects:projects(id, name, status)
        `)

      // Apply search
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,contact_person.ilike.%${searchTerm}%,ico.ilike.%${searchTerm}%`)
      }

      // Apply additional filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query = query.eq(key, value)
        }
      })

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to search clients')
    }
  },

  // Get cities (for filters)
  async getCities() {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('city')
        .not('city', 'is', null)

      if (error) throw error

      // Get unique cities
      const cities = [...new Set(data.map(client => client.city))].filter(Boolean)
      
      return { data: cities, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch cities')
    }
  },

  // Validate ICO
  async validateICO(ico, excludeId = null) {
    try {
      let query = supabase
        .from('clients')
        .select('id, name')
        .eq('ico', ico)

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data, error } = await query

      if (error) throw error
      
      return { 
        data: { 
          isValid: data.length === 0,
          existingClient: data.length > 0 ? data[0] : null
        }, 
        error: null 
      }
    } catch (error) {
      return handleApiError(error, 'Failed to validate ICO')
    }
  }
}

export default clientsApi
