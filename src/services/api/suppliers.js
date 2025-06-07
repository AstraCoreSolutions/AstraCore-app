import { supabase, TABLES } from '../../config/supabase.js'
import { debugLog, debugError } from '../../utils/helpers.js'

export const suppliersAPI = {
  // Get all suppliers
  getSuppliers: async () => {
    try {
      debugLog('Fetching suppliers...')
      
      const { data, error } = await supabase
        .from(TABLES.SUPPLIERS)
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      debugLog('Suppliers fetched:', data?.length || 0)
      return { success: true, suppliers: data || [] }
      
    } catch (error) {
      debugError('Failed to fetch suppliers:', error)
      return { success: false, error: error.message }
    }
  },

  // Add supplier
  addSupplier: async (supplierData) => {
    try {
      debugLog('Adding supplier:', supplierData)
      
      const newSupplier = {
        ...supplierData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from(TABLES.SUPPLIERS)
        .insert([newSupplier])
        .select()
        .single()
      
      if (error) throw error
      
      debugLog('Supplier added:', data)
      return { success: true, supplier: data }
      
    } catch (error) {
      debugError('Failed to add supplier:', error)
      return { success: false, error: error.message }
    }
  },

  // Update supplier
  updateSupplier: async (supplierId, updates) => {
    try {
      debugLog('Updating supplier:', supplierId, updates)
      
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from(TABLES.SUPPLIERS)
        .update(updateData)
        .eq('id', supplierId)
        .select()
        .single()
      
      if (error) throw error
      
      debugLog('Supplier updated:', data)
      return { success: true, supplier: data }
      
    } catch (error) {
      debugError('Failed to update supplier:', error)
      return { success: false, error: error.message }
    }
  },

  // Delete supplier
  deleteSupplier: async (supplierId) => {
    try {
      debugLog('Deleting supplier:', supplierId)
      
      const { error } = await supabase
        .from(TABLES.SUPPLIERS)
        .delete()
        .eq('id', supplierId)
      
      if (error) throw error
      
      debugLog('Supplier deleted')
      return { success: true }
      
    } catch (error) {
      debugError('Failed to delete supplier:', error)
      return { success: false, error: error.message }
    }
  }
}

export default suppliersAPI
