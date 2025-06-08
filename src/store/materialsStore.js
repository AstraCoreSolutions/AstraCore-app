import { create } from 'zustand'
import { materialsApi } from '../services/api/materials'
import { debugLog, debugError } from '../utils/helpers'
import toast from 'react-hot-toast'

const useMaterialsStore = create((set, get) => ({
  // State
  materials: [],
  currentMaterial: null,
  materialUsageHistory: [],
  lowStockMaterials: [],
  categories: [],
  suppliers: [],
  isLoading: false,
  error: null,
  filters: {
    search: '',
    category: '',
    supplier: '',
    lowStock: false
  },

  // Actions
  setFilters: (newFilters) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters }
    }))
    // Reload materials with new filters
    get().loadMaterials()
  },

  clearFilters: () => {
    set({
      filters: {
        search: '',
        category: '',
        supplier: '',
        lowStock: false
      }
    })
    get().loadMaterials()
  },

  // Load all materials
  loadMaterials: async (forceRefresh = false) => {
    const state = get()
    
    if (state.isLoading && !forceRefresh) return
    
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Loading materials with filters:', state.filters)
      
      const { data, error } = await materialsApi.getAll(state.filters)
      
      if (error) throw new Error(error)
      
      set({ 
        materials: data || [],
        isLoading: false 
      })
      
      debugLog('Materials loaded:', data?.length)
    } catch (error) {
      debugError('Failed to load materials:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error('Nepodařilo se načíst materiály')
    }
  },

  // Load single material
  loadMaterial: async (id) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Loading material:', id)
      
      const { data, error } = await materialsApi.getById(id)
      
      if (error) throw new Error(error)
      
      set({ 
        currentMaterial: data,
        isLoading: false 
      })
      
      debugLog('Material loaded:', data?.name)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to load material:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error('Nepodařilo se načíst materiál')
      return { success: false, error: error.message }
    }
  },

  // Create new material
  createMaterial: async (materialData) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Creating material:', materialData.name)
      
      const { data, error } = await materialsApi.create(materialData)
      
      if (error) throw new Error(error)
      
      // Add to materials list
      set(state => ({
        materials: [data, ...state.materials],
        isLoading: false
      }))
      
      toast.success('Materiál byl úspěšně vytvořen')
      debugLog('Material created:', data.name)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to create material:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error('Nepodařilo se vytvořit materiál')
      return { success: false, error: error.message }
    }
  },

  // Update material
  updateMaterial: async (id, updates) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Updating material:', id)
      
      const { data, error } = await materialsApi.update(id, updates)
      
      if (error) throw new Error(error)
      
      // Update in materials list
      set(state => ({
        materials: state.materials.map(material => 
          material.id === id ? data : material
        ),
        currentMaterial: state.currentMaterial?.id === id ? data : state.currentMaterial,
        isLoading: false
      }))
      
      toast.success('Materiál byl úspěšně aktualizován')
      debugLog('Material updated:', data.name)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to update material:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error('Nepodařilo se aktualizovat materiál')
      return { success: false, error: error.message }
    }
  },

  // Delete material
  deleteMaterial: async (id) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Deleting material:', id)
      
      const { data, error } = await materialsApi.delete(id)
      
      if (error) throw new Error(error)
      
      // Remove from materials list
      set(state => ({
        materials: state.materials.filter(material => material.id !== id),
        currentMaterial: state.currentMaterial?.id === id ? null : state.currentMaterial,
        isLoading: false
      }))
      
      toast.success('Materiál byl úspěšně smazán')
      debugLog('Material deleted')
      return { success: true }
    } catch (error) {
      debugError('Failed to delete material:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error(error.message)
      return { success: false, error: error.message }
    }
  },

  // Update stock
  updateStock: async (id, quantity, operation = 'add', note = '') => {
    try {
      debugLog('Updating stock:', id, quantity, operation)
      
      const { data, error } = await materialsApi.updateStock(id, quantity, operation, note)
      
      if (error) throw new Error(error)
      
      // Update in materials list
      set(state => ({
        materials: state.materials.map(material => 
          material.id === id ? data : material
        ),
        currentMaterial: state.currentMaterial?.id === id ? data : state.currentMaterial
      }))
      
      const actionText = operation === 'add' ? 'přidáno' : 'odebráno'
      toast.success(`Skladová zásoba byla ${actionText}`)
      debugLog('Stock updated:', data.current_stock)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to update stock:', error)
      toast.error('Nepodařilo se aktualizovat skladovou zásobu')
      return { success: false, error: error.message }
    }
  },

  // Load low stock materials
  loadLowStockMaterials: async () => {
    try {
      debugLog('Loading low stock materials')
      
      const { data, error } = await materialsApi.getLowStock()
      
      if (error) throw new Error(error)
      
      set({ lowStockMaterials: data || [] })
      
      debugLog('Low stock materials loaded:', data?.length)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to load low stock materials:', error)
      return { success: false, error: error.message }
    }
  },

  // Load categories for filters
  loadCategories: async () => {
    try {
      debugLog('Loading categories')
      
      const { data, error } = await materialsApi.getCategories()
      
      if (error) throw new Error(error)
      
      set({ categories: data || [] })
      
      debugLog('Categories loaded:', data?.length)
    } catch (error) {
      debugError('Failed to load categories:', error)
    }
  },

  // Load suppliers for filters
  loadSuppliers: async () => {
    try {
      debugLog('Loading suppliers')
      
      const { data, error } = await materialsApi.getSuppliers()
      
      if (error) throw new Error(error)
      
      set({ suppliers: data || [] })
      
      debugLog('Suppliers loaded:', data?.length)
    } catch (error) {
      debugError('Failed to load suppliers:', error)
    }
  },

  // Search materials
  searchMaterials: async (searchTerm, filters = {}) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Searching materials:', searchTerm)
      
      const { data, error } = await materialsApi.search(searchTerm, filters)
      
      if (error) throw new Error(error)
      
      set({ 
        materials: data || [],
        isLoading: false 
      })
      
      debugLog('Search results:', data?.length)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to search materials:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      return { success: false, error: error.message }
    }
  },

  // Load material usage history
  loadMaterialUsageHistory: async (id) => {
    try {
      debugLog('Loading material usage history:', id)
      
      const { data, error } = await materialsApi.getUsageHistory(id)
      
      if (error) throw new Error(error)
      
      set({ materialUsageHistory: data || [] })
      
      debugLog('Material usage history loaded:', data?.length)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to load material usage history:', error)
      return { success: false, error: error.message }
    }
  },

  // Clear current material
  clearCurrentMaterial: () => {
    set({ 
      currentMaterial: null,
      materialUsageHistory: []
    })
  },

  // Get material by ID from current list
  getMaterialById: (id) => {
    const state = get()
    return state.materials.find(material => material.id === parseInt(id))
  },

  // Get materials overview statistics
  getMaterialsOverview: () => {
    const state = get()
    const materials = state.materials
    
    const totalValue = materials.reduce((sum, m) => 
      sum + (m.current_stock * (m.price_per_unit || 0)), 0
    )
    
    const lowStockCount = materials.filter(m => 
      m.current_stock < m.min_stock
    ).length
    
    return {
      total: materials.length,
      totalValue,
      lowStockCount,
      categories: [...new Set(materials.map(m => m.category))].filter(Boolean).length,
      inStock: materials.filter(m => m.current_stock > 0).length,
      outOfStock: materials.filter(m => m.current_stock === 0).length
    }
  }
}))

export default useMaterialsStore
