import { supabase } from '../../config/supabase'
import { handleApiError } from '../utils/errorHandler'

/**
 * Suppliers API Service
 * Handles all supplier-related operations including rating and performance tracking
 */
export const suppliersApi = {
  // Get all suppliers with optional filters
  async getAll(filters = {}) {
    try {
      let query = supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.rating) {
        query = query.gte('rating', filters.rating)
      }
      if (filters.city) {
        query = query.eq('city', filters.city)
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,contact_person.ilike.%${filters.search}%,ico.ilike.%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch suppliers')
    }
  },

  // Get supplier by ID
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch supplier')
    }
  },

  // Create new supplier
  async create(supplierData) {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([{
          ...supplierData,
          status: supplierData.status || 'active',
          rating: supplierData.rating || 5,
          payment_terms: supplierData.payment_terms || 30,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to create supplier')
    }
  },

  // Update supplier
  async update(id, updates) {
    try {
      const { data, error } = await supabase
        .from('suppliers')
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
      return handleApiError(error, 'Failed to update supplier')
    }
  },

  // Delete supplier
  async delete(id) {
    try {
      // Check if supplier has materials or is referenced elsewhere
      const { data: materials, error: materialsError } = await supabase
        .from('materials')
        .select('id')
        .eq('supplier', id)
        .limit(1)

      if (materialsError && !materialsError.message.includes('does not exist')) {
        throw materialsError
      }

      if (materials && materials.length > 0) {
        return { 
          data: null, 
          error: 'Nelze smazat dodavatele který je používán u materiálů' 
        }
      }

      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { data: true, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to delete supplier')
    }
  },

  // Update supplier rating
  async updateRating(id, rating, notes = '') {
    try {
      if (rating < 1 || rating > 5) {
        return { data: null, error: 'Hodnocení musí být mezi 1 a 5' }
      }

      const { data, error } = await supabase
        .from('suppliers')
        .update({
          rating,
          notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to update supplier rating')
    }
  },

  // Get supplier categories
  async getCategories() {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('category')
        .not('category', 'is', null)

      if (error) throw error

      // Get unique categories
      const categories = [...new Set(data.map(supplier => supplier.category))].filter(Boolean)
      
      return { data: categories, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch categories')
    }
  },

  // Get supplier cities
  async getCities() {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('city')
        .not('city', 'is', null)

      if (error) throw error

      // Get unique cities
      const cities = [...new Set(data.map(supplier => supplier.city))].filter(Boolean)
      
      return { data: cities, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch cities')
    }
  },

  // Search suppliers
  async search(searchTerm, filters = {}) {
    try {
      let query = supabase
        .from('suppliers')
        .select('*')

      // Apply search
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,contact_person.ilike.%${searchTerm}%,ico.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
      }

      // Apply additional filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (key === 'rating') {
            query = query.gte('rating', value)
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
      return handleApiError(error, 'Failed to search suppliers')
    }
  },

  // Get supplier statistics
  async getStatistics(id) {
    try {
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single()

      if (supplierError) throw supplierError

      // Get materials from this supplier
      const { data: materials, error: materialsError } = await supabase
        .from('materials')
        .select('*')
        .eq('supplier', supplier.name)

      if (materialsError && !materialsError.message.includes('does not exist')) {
        throw materialsError
      }

      // Calculate statistics
      const stats = {
        totalMaterials: materials?.length || 0,
        totalValue: materials?.reduce((sum, m) => sum + (m.current_stock * (m.price_per_unit || 0)), 0) || 0,
        avgDeliveryTime: supplier.payment_terms || 0,
        rating: supplier.rating || 0,
        lastOrder: null, // This would come from orders table if implemented
        totalOrders: 0 // This would come from orders table if implemented
      }

      return { data: stats, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to get supplier statistics')
    }
  },

  // Get materials by supplier
  async getMaterials(id) {
    try {
      // First get supplier name
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('name')
        .eq('id', id)
        .single()

      if (supplierError) throw supplierError

      // Then get materials
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('supplier', supplier.name)
        .order('created_at', { ascending: false })

      if (error && !error.message.includes('does not exist')) {
        throw error
      }

      return { data: data || [], error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch supplier materials')
    }
  },

  // Validate ICO
  async validateICO(ico, excludeId = null) {
    try {
      let query = supabase
        .from('suppliers')
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
          existingSupplier: data.length > 0 ? data[0] : null
        }, 
        error: null 
      }
    } catch (error) {
      return handleApiError(error, 'Failed to validate ICO')
    }
  },

  // Get top rated suppliers
  async getTopRated(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('status', 'active')
        .order('rating', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch top rated suppliers')
    }
  },

  // Get suppliers by category
  async getByCategory(category) {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('category', category)
        .eq('status', 'active')
        .order('rating', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch suppliers by category')
    }
  }
}

export default suppliersApi
