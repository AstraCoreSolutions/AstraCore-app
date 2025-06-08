import { supabase } from '../../config/supabase'
import { handleApiError } from '../utils/errorHandler'

/**
 * Vehicles API Service
 * Handles all vehicle-related operations including maintenance tracking
 */
export const vehiclesApi = {
  // Get all vehicles with optional filters
  async getAll(filters = {}) {
    try {
      let query = supabase
        .from('vehicles')
        .select(`
          *,
          assigned_to_user:profiles!vehicles_assigned_to_fkey(
            first_name,
            last_name,
            email
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
      if (filters.brand) {
        query = query.ilike('brand', `%${filters.brand}%`)
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%,license_plate.ilike.%${filters.search}%`)
      }
      if (filters.available) {
        query = query.eq('status', 'active').is('assigned_to', null)
      }
      if (filters.expiringInsurance) {
        const nextMonth = new Date()
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        query = query.lte('insurance_expiry', nextMonth.toISOString().split('T')[0])
      }
      if (filters.expiringSTK) {
        const nextMonth = new Date()
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        query = query.lte('stk_expiry', nextMonth.toISOString().split('T')[0])
      }

      const { data, error } = await query

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch vehicles')
    }
  },

  // Get vehicle by ID
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          assigned_to_user:profiles!vehicles_assigned_to_fkey(
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
      return handleApiError(error, 'Failed to fetch vehicle')
    }
  },

  // Create new vehicle
  async create(vehicleData) {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .insert([{
          ...vehicleData,
          status: vehicleData.status || 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select(`
          *,
          assigned_to_user:profiles!vehicles_assigned_to_fkey(
            first_name,
            last_name,
            email
          )
        `)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to create vehicle')
    }
  },

  // Update vehicle
  async update(id, updates) {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          assigned_to_user:profiles!vehicles_assigned_to_fkey(
            first_name,
            last_name,
            email
          )
        `)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to update vehicle')
    }
  },

  // Delete vehicle
  async delete(id) {
    try {
      // Check if vehicle is assigned to someone
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('assigned_to')
        .eq('id', id)
        .single()

      if (vehicle && vehicle.assigned_to) {
        return { 
          data: null, 
          error: 'Nelze smazat vozidlo které je přiřazeno zaměstnanci' 
        }
      }

      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { data: true, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to delete vehicle')
    }
  },

  // Assign vehicle to user
  async assignVehicle(id, assignedTo, notes = '') {
    try {
      // Check if vehicle is available
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('status, assigned_to')
        .eq('id', id)
        .single()

      if (!vehicle || vehicle.status !== 'active') {
        return { 
          data: null, 
          error: 'Vozidlo není k dispozici pro přiřazení' 
        }
      }

      if (vehicle.assigned_to) {
        return { 
          data: null, 
          error: 'Vozidlo je již přiřazeno jinému zaměstnanci' 
        }
      }

      const { data, error } = await supabase
        .from('vehicles')
        .update({
          assigned_to: assignedTo,
          notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          assigned_to_user:profiles!vehicles_assigned_to_fkey(
            first_name,
            last_name,
            email
          )
        `)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to assign vehicle')
    }
  },

  // Unassign vehicle
  async unassignVehicle(id) {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .update({
          assigned_to: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          assigned_to_user:profiles!vehicles_assigned_to_fkey(
            first_name,
            last_name,
            email
          )
        `)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to unassign vehicle')
    }
  },

  // Send vehicle to service
  async sendToService(id, serviceNotes = '') {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .update({
          status: 'service',
          assigned_to: null,
          notes: serviceNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          assigned_to_user:profiles!vehicles_assigned_to_fkey(
            first_name,
            last_name,
            email
          )
        `)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to send vehicle to service')
    }
  },

  // Return vehicle from service
  async returnFromService(id, serviceNotes = '') {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .update({
          status: 'active',
          notes: serviceNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          assigned_to_user:profiles!vehicles_assigned_to_fkey(
            first_name,
            last_name,
            email
          )
        `)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to return vehicle from service')
    }
  },

  // Get vehicle types
  async getTypes() {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('type')
        .not('type', 'is', null)

      if (error) throw error

      // Get unique types
      const types = [...new Set(data.map(vehicle => vehicle.type))].filter(Boolean)
      
      return { data: types, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch vehicle types')
    }
  },

  // Get vehicle brands
  async getBrands() {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('brand')
        .not('brand', 'is', null)

      if (error) throw error

      // Get unique brands
      const brands = [...new Set(data.map(vehicle => vehicle.brand))].filter(Boolean)
      
      return { data: brands, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch vehicle brands')
    }
  },

  // Search vehicles
  async search(searchTerm, filters = {}) {
    try {
      let query = supabase
        .from('vehicles')
        .select(`
          *,
          assigned_to_user:profiles!vehicles_assigned_to_fkey(
            first_name,
            last_name,
            email
          )
        `)

      // Apply search
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,license_plate.ilike.%${searchTerm}%,vin.ilike.%${searchTerm}%`)
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
      return handleApiError(error, 'Failed to search vehicles')
    }
  },

  // Get vehicles assigned to user
  async getByUser(userId) {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          assigned_to_user:profiles!vehicles_assigned_to_fkey(
            first_name,
            last_name,
            email
          )
        `)
        .eq('assigned_to', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch user vehicles')
    }
  },

  // Get vehicles with expiring documents
  async getExpiringDocuments() {
    try {
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      const nextMonthStr = nextMonth.toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .or(`insurance_expiry.lte.${nextMonthStr},stk_expiry.lte.${nextMonthStr}`)
        .order('insurance_expiry', { ascending: true })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch vehicles with expiring documents')
    }
  }
}

export default vehiclesApi
