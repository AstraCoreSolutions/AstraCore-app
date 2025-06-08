import { supabase } from '../../config/supabase'
import { handleApiError } from '../utils/errorHandler'

/**
 * Equipment API Service
 * Handles all equipment-related operations including borrowing system
 */
export const equipmentApi = {
  // Get all equipment with optional filters
  async getAll(filters = {}) {
    try {
      let query = supabase
        .from('equipment')
        .select(`
          *,
          borrowed_by_user:profiles!equipment_borrowed_by_fkey(
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`)
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,manufacturer.ilike.%${filters.search}%,model.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%`)
      }
      if (filters.available) {
        query = query.eq('status', 'available')
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
          borrowed_by_user:profiles!equipment_borrowed_by_fkey(
            first_name,
            last_name,
            email
          )
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
          status: equipmentData.status || 'available',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select(`
          *,
          borrowed_by_user:profiles!equipment_borrowed_by_fkey(
            first_name,
            last_name,
            email
          )
        `)
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
        .select(`
          *,
          borrowed_by_user:profiles!equipment_borrowed_by_fkey(
            first_name,
            last_name,
            email
          )
        `)
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
      // Check if equipment is currently borrowed
      const { data: equipment } = await supabase
        .from('equipment')
        .select('status, borrowed_by')
        .eq('id', id)
        .single()

      if (equipment && equipment.status === 'borrowed') {
        return { 
          data: null, 
          error: 'Nelze smazat vypůjčené nářadí' 
        }
      }

      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { data: true, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to delete equipment')
    }
  },

  // Borrow equipment
  async borrowEquipment(id, borrowedBy, notes = '') {
    try {
      // Check if equipment is available
      const { data: equipment } = await supabase
        .from('equipment')
        .select('status')
        .eq('id', id)
        .single()

      if (!equipment || equipment.status !== 'available') {
        return { 
          data: null, 
          error: 'Nářadí není k dispozici pro půjčení' 
        }
      }

      // Update equipment status
      const { data, error } = await supabase
        .from('equipment')
        .update({
          status: 'borrowed',
          borrowed_by: borrowedBy,
          borrowed_date: new Date().toISOString().split('T')[0],
          notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          borrowed_by_user:profiles!equipment_borrowed_by_fkey(
            first_name,
            last_name,
            email
          )
        `)
        .single()

      if (error) throw error

      // Log the borrowing (if you have equipment_borrows table)
      try {
        await supabase
          .from('equipment_borrows')
          .insert([{
            equipment_id: id,
            borrowed_by: borrowedBy,
            borrowed_date: new Date().toISOString().split('T')[0],
            notes: notes,
            created_at: new Date().toISOString()
          }])
      } catch (logError) {
        // Log error but don't fail the main operation
        console.warn('Failed to log equipment borrow:', logError)
      }

      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to borrow equipment')
    }
  },

  // Return equipment
  async returnEquipment(id, returnNotes = '') {
    try {
      // Update equipment status
      const { data, error } = await supabase
        .from('equipment')
        .update({
          status: 'available',
          borrowed_by: null,
          borrowed_date: null,
          notes: returnNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          borrowed_by_user:profiles!equipment_borrowed_by_fkey(
            first_name,
            last_name,
            email
          )
        `)
        .single()

      if (error) throw error

      // Update the borrow record (if you have equipment_borrows table)
      try {
        await supabase
          .from('equipment_borrows')
          .update({
            returned_date: new Date().toISOString().split('T')[0],
            return_notes: returnNotes,
            updated_at: new Date().toISOString()
          })
          .eq('equipment_id', id)
          .is('returned_date', null)
      } catch (logError) {
        // Log error but don't fail the main operation
        console.warn('Failed to update equipment borrow record:', logError)
      }

      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to return equipment')
    }
  },

  // Send equipment to service
  async sendToService(id, serviceNotes = '') {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .update({
          status: 'service',
          borrowed_by: null,
          borrowed_date: null,
          notes: serviceNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          borrowed_by_user:profiles!equipment_borrowed_by_fkey(
            first_name,
            last_name,
            email
          )
        `)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to send equipment to service')
    }
  },

  // Get equipment categories
  async getCategories() {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('category')
        .not('category', 'is', null)

      if (error) throw error

      // Get unique categories
      const categories = [...new Set(data.map(equipment => equipment.category))].filter(Boolean)
      
      return { data: categories, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch categories')
    }
  },

  // Get equipment locations
  async getLocations() {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('location')
        .not('location', 'is', null)

      if (error) throw error

      // Get unique locations
      const locations = [...new Set(data.map(equipment => equipment.location))].filter(Boolean)
      
      return { data: locations, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch locations')
    }
  },

  // Search equipment
  async search(searchTerm, filters = {}) {
    try {
      let query = supabase
        .from('equipment')
        .select(`
          *,
          borrowed_by_user:profiles!equipment_borrowed_by_fkey(
            first_name,
            last_name,
            email
          )
        `)

      // Apply search
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,manufacturer.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,serial_number.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
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
      return handleApiError(error, 'Failed to search equipment')
    }
  },

  // Get borrowing history
  async getBorrowHistory(id) {
    try {
      const { data, error } = await supabase
        .from('equipment_borrows')
        .select(`
          *,
          borrower:profiles!equipment_borrows_borrowed_by_fkey(
            first_name,
            last_name,
            email
          )
        `)
        .eq('equipment_id', id)
        .order('created_at', { ascending: false })

      if (error && !error.message.includes('does not exist')) {
        throw error
      }

      return { data: data || [], error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch borrow history')
    }
  },

  // Get borrowed equipment by user
  async getBorrowedByUser(userId) {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select(`
          *,
          borrowed_by_user:profiles!equipment_borrowed_by_fkey(
            first_name,
            last_name,
            email
          )
        `)
        .eq('borrowed_by', userId)
        .eq('status', 'borrowed')
        .order('borrowed_date', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch borrowed equipment')
    }
  }
}

export default equipmentApi
