import { supabase } from '../supabase'
import { handleApiError } from '../utils/errorHandler'

/**
 * Equipment API Service
 * Handles all equipment-related operations
 */
export const equipmentApi = {
  // Get all equipment with optional filters
  async getAll(filters = {}) {
    try {
      let query = supabase
        .from('equipment')
        .select(`
          *,
          current_project:projects(name)
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.project_id) {
        query = query.eq('current_project_id', filters.project_id)
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch equipment')
    }
  },

  // Get equipment by ID
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select(`
          *,
          current_project:projects(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch equipment')
    }
  },

  // Create new equipment
  async create(equipmentData) {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .insert([{
          ...equipmentData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to create equipment')
    }
  },

  // Update equipment
  async update(id, updates) {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to update equipment')
    }
  },

  // Delete equipment
  async delete(id) {
    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { data: null, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to delete equipment')
    }
  },

  // Assign equipment to project
  async assignToProject(equipmentId, projectId) {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .update({
          current_project_id: projectId,
          status: 'in_use',
          updated_at: new Date().toISOString()
        })
        .eq('id', equipmentId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to assign equipment to project')
    }
  },

  // Return equipment from project
  async returnFromProject(equipmentId) {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .update({
          current_project_id: null,
          status: 'available',
          updated_at: new Date().toISOString()
        })
        .eq('id', equipmentId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to return equipment from project')
    }
  },

  // Update equipment status
  async updateStatus(equipmentId, status, notes = '') {
    try {
      const updates = {
        status,
        updated_at: new Date().toISOString()
      }

      if (notes) {
        updates.maintenance_notes = notes
      }

      if (status === 'maintenance') {
        updates.next_maintenance_date = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 90 days from now
      }

      const { data, error } = await supabase
        .from('equipment')
        .update(updates)
        .eq('id', equipmentId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to update equipment status')
    }
  },

  // Get equipment by project
  async getByProject(projectId) {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('current_project_id', projectId)
        .order('name')

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch project equipment')
    }
  },

  // Get available equipment
  async getAvailable() {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('status', 'available')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch available equipment')
    }
  },

  // Get equipment needing maintenance
  async getNeedingMaintenance() {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .or(`status.eq.maintenance,next_maintenance_date.lte.${today}`)
        .eq('is_active', true)
        .order('next_maintenance_date')

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch equipment needing maintenance')
    }
  }
}

export default equipmentApi
