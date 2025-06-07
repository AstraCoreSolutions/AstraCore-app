import { supabase } from '../supabase'
import { handleApiError } from '../utils/errorHandler'

/**
 * Materials API Service
 * Handles all material-related operations
 */
export const materialsApi = {
  // Get all materials with optional filters
  async getAll(filters = {}) {
    try {
      let query = supabase
        .from('materials')
        .select(`
          *,
          supplier:suppliers(name),
          project:projects(name)
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.project_id) {
        query = query.eq('project_id', filters.project_id)
      }
      if (filters.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`)
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
        .select(`
          *,
          supplier:suppliers(*),
          project:projects(*),
          material_transactions(
            *,
            user:profiles(first_name, last_name)
          )
        `)
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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error

      // Log material creation
      await this.logTransaction(data.id, 'created', data.quantity, 'Material created')

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
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { data: null, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to delete material')
    }
  },

  // Update material quantity
  async updateQuantity(id, newQuantity, reason = '') {
    try {
      // Get current material
      const { data: material } = await this.getById(id)
      if (!material) throw new Error('Material not found')

      const oldQuantity = material.quantity
      const difference = newQuantity - oldQuantity

      // Update quantity
      const { data, error } = await supabase
        .from('materials')
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Log transaction
      const transactionType = difference > 0 ? 'added' : 'removed'
      await this.logTransaction(
        id, 
        transactionType, 
        Math.abs(difference), 
        reason || `Quantity ${transactionType}`
      )

      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to update material quantity')
    }
  },

  // Log material transaction
  async logTransaction(materialId, type, quantity, description = '') {
    try {
      const { data: user } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('material_transactions')
        .insert([{
          material_id: materialId,
          type,
          quantity,
          description,
          user_id: user?.user?.id,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to log material transaction')
    }
  },

  // Get material transactions
  async getTransactions(materialId) {
    try {
      const { data, error } = await supabase
        .from('material_transactions')
        .select(`
          *,
          user:profiles(first_name, last_name)
        `)
        .eq('material_id', materialId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch material transactions')
    }
  },

  // Get materials by project
  async getByProject(projectId) {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select(`
          *,
          supplier:suppliers(name)
        `)
        .eq('project_id', projectId)
        .order('name')

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch project materials')
    }
  },

  // Get materials by supplier
  async getBySupplier(supplierId) {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select(`
          *,
          project:projects(name)
        `)
        .eq('supplier_id', supplierId)
        .order('name')

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch supplier materials')
    }
  },

  // Get low stock materials
  async getLowStock() {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select(`
          *,
          supplier:suppliers(name),
          project:projects(name)
        `)
        .lt('quantity', supabase.raw('min_quantity'))
        .order('quantity')

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch low stock materials')
    }
  }
}

export default materialsApi
