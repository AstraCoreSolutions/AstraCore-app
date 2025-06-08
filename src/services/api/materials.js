import { supabase } from '../../config/supabase'
import { handleApiError } from '../utils/errorHandler'

/**
 * Materials API Service
 * Handles all material-related operations including inventory management
 */
export const materialsApi = {
  // Get all materials with optional filters
  async getAll(filters = {}) {
    try {
      let query = supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.supplier) {
        query = query.ilike('supplier', `%${filters.supplier}%`)
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,category.ilike.%${filters.search}%`)
      }
      if (filters.lowStock) {
        query = query.lt('current_stock', supabase.raw('min_stock'))
      }

      const { data, error } = await query

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch materials')
    }
  },

  // Get material by ID
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch material')
    }
  },

  // Create new material
  async create(materialData) {
    try {
      const { data, error } = await supabase
        .from('materials')
        .insert([{
          ...materialData,
          current_stock: materialData.current_stock || 0,
          min_stock: materialData.min_stock || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to create material')
    }
  },

  // Update material
  async update(id, updates) {
    try {
      const { data, error } = await supabase
        .from('materials')
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
      return handleApiError(error, 'Failed to update material')
    }
  },

  // Delete material
  async delete(id) {
    try {
      // Check if material is used in any project
      const { data: usage, error: usageError } = await supabase
        .from('material_usage')
        .select('id')
        .eq('material_id', id)
        .limit(1)

      if (usageError && !usageError.message.includes('does not exist')) {
        throw usageError
      }

      if (usage && usage.length > 0) {
        return { 
          data: null, 
          error: 'Nelze smazat materiál který je používán v projektech' 
        }
      }

      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { data: true, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to delete material')
    }
  },

  // Update stock (add or remove)
  async updateStock(id, quantity, operation = 'add', note = '') {
    try {
      // Get current material
      const { data: material, error: fetchError } = await supabase
        .from('materials')
        .select('current_stock, name')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      let newStock
      if (operation === 'add') {
        newStock = material.current_stock + quantity
      } else if (operation === 'remove') {
        newStock = Math.max(0, material.current_stock - quantity)
      } else {
        newStock = quantity // set absolute value
      }

      // Update stock
      const { data, error } = await supabase
        .from('materials')
        .update({
          current_stock: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to update stock')
    }
  },

  // Get low stock materials
  async getLowStock() {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .lt('current_stock', supabase.raw('min_stock'))
        .order('current_stock', { ascending: true })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch low stock materials')
    }
  },

  // Get material categories
  async getCategories() {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('category')
        .not('category', 'is', null)

      if (error) throw error

      // Get unique categories
      const categories = [...new Set(data.map(material => material.category))].filter(Boolean)
      
      return { data: categories, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch categories')
    }
  },

  // Get suppliers
  async getSuppliers() {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('supplier')
        .not('supplier', 'is', null)

      if (error) throw error

      // Get unique suppliers
      const suppliers = [...new Set(data.map(material => material.supplier))].filter(Boolean)
      
      return { data: suppliers, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch suppliers')
    }
  },

  // Search materials
  async search(searchTerm, filters = {}) {
    try {
      let query = supabase
        .from('materials')
        .select('*')

      // Apply search
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,supplier.ilike.%${searchTerm}%`)
      }

      // Apply additional filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (key === 'lowStock' && value) {
            query = query.lt('current_stock', supabase.raw('min_stock'))
          } else {
            query = query.eq(key, value)
          }
        }
      })

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to search materials')
    }
  },

  // Get material usage history
  async getUsageHistory(id) {
    try {
      const { data, error } = await supabase
        .from('material_usage')
        .select(`
          *,
          project:projects(name)
        `)
        .eq('material_id', id)
        .order('created_at', { ascending: false })

      if (error && !error.message.includes('does not exist')) {
        throw error
      }

      return { data: data || [], error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch material usage history')
    }
  },

  // Get materials for project
  async getByProject(projectId) {
    try {
      const { data, error } = await supabase
        .from('material_usage')
        .select(`
          *,
          material:materials(*)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error && !error.message.includes('does not exist')) {
        throw error
      }

      return { data: data || [], error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch project materials')
    }
  }
}

export default materialsApi
