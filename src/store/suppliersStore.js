import { create } from 'zustand'
import { suppliersApi } from '../services/api/suppliers'
import { debugLog, debugError } from '../utils/helpers'
import toast from 'react-hot-toast'

const useSuppliersStore = create((set, get) => ({
  // State
  suppliers: [],
  currentSupplier: null,
  supplierMaterials: [],
  supplierStats: null,
  categories: [],
  cities: [],
  isLoading: false,
  error: null,
  filters: {
    search: '',
    category: '',
    status: 'active',
    city: '',
    rating: ''
  },

  // Actions
  setFilters: (newFilters) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters }
    }))
    // Reload suppliers with new filters
    get().loadSuppliers()
  },

  clearFilters: () => {
    set({
      filters: {
        search: '',
        category: '',
        status: 'active',
        city: '',
        rating: ''
      }
    })
    get().loadSuppliers()
  },

  // Load all suppliers
  loadSuppliers: async (forceRefresh = false) => {
    const state = get()
    
    if (state.isLoading && !forceRefresh) return
    
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Loading suppliers with filters:', state.filters)
      
      const { data, error } = await suppliersApi.getAll(state.filters)
      
      if (error) throw new Error(error)
      
      set({ 
        suppliers: data || [],
        isLoading: false 
      })
      
      debugLog('Suppliers loaded:', data?.length)
    } catch (error) {
      debugError('Failed to load suppliers:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error('Nepodařilo se načíst dodavatele')
    }
  },

  // Load single supplier
  loadSupplier: async (id) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Loading supplier:', id)
      
      const { data, error } = await suppliersApi.getById(id)
      
      if (error) throw new Error(error)
      
      set({ 
        currentSupplier: data,
        isLoading: false 
      })
      
      debugLog('Supplier loaded:', data?.name)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to load supplier:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error('Nepodařilo se načíst dodavatele')
      return { success: false, error: error.message }
    }
  },

  // Create new supplier
  createSupplier: async (supplierData) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Creating supplier:', supplierData.name)
      
      const { data, error } = await suppliersApi.create(supplierData)
      
      if (error) throw new Error(error)
      
      // Add to suppliers list
      set(state => ({
        suppliers: [data, ...state.suppliers],
        isLoading: false
      }))
      
      toast.success('Dodavatel byl úspěšně vytvořen')
      debugLog('Supplier created:', data.name)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to create supplier:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error('Nepodařilo se vytvořit dodavatele')
      return { success: false, error: error.message }
    }
  },

  // Update supplier
  updateSupplier: async (id, updates) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Updating supplier:', id)
      
      const { data, error } = await suppliersApi.update(id, updates)
      
      if (error) throw new Error(error)
      
      // Update in suppliers list
      set(state => ({
        suppliers: state.suppliers.map(supplier => 
          supplier.id === id ? data : supplier
        ),
        currentSupplier: state.currentSupplier?.id === id ? data : state.currentSupplier,
        isLoading: false
      }))
      
      toast.success('Dodavatel byl úspěšně aktualizován')
      debugLog('Supplier updated:', data.name)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to update supplier:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error('Nepodařilo se aktualizovat dodavatele')
      return { success: false, error: error.message }
    }
  },

  // Delete supplier
  deleteSupplier: async (id) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Deleting supplier:', id)
      
      const { data, error } = await suppliersApi.delete(id)
      
      if (error) throw new Error(error)
      
      // Remove from suppliers list
      set(state => ({
        suppliers: state.suppliers.filter(supplier => supplier.id !== id),
        currentSupplier: state.currentSupplier?.id === id ? null : state.currentSupplier,
        isLoading: false
      }))
      
      toast.success('Dodavatel byl úspěšně smazán')
      debugLog('Supplier deleted')
      return { success: true }
    } catch (error) {
      debugError('Failed to delete supplier:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error(error.message)
      return { success: false, error: error.message }
    }
  },

  // Update supplier rating
  updateRating: async (id, rating, notes = '') => {
    try {
      debugLog('Updating supplier rating:', id, rating)
      
      const { data, error } = await suppliersApi.updateRating(id, rating, notes)
      
      if (error) throw new Error(error)
      
      // Update in suppliers list
      set(state => ({
        suppliers: state.suppliers.map(supplier => 
          supplier.id === id ? data : supplier
        ),
        currentSupplier: state.currentSupplier?.id === id ? data : state.currentSupplier
      }))
      
      toast.success('Hodnocení dodavatele bylo aktualizováno')
      debugLog('Supplier rating updated')
      return { success: true, data }
    } catch (error) {
      debugError('Failed to update supplier rating:', error)
      toast.error(error.message || 'Nepodařilo se aktualizovat hodnocení')
      return { success: false, error: error.message }
    }
  },

  // Load categories for filters
  loadCategories: async () => {
    try {
      debugLog('Loading supplier categories')
      
      const { data, error } = await suppliersApi.getCategories()
      
      if (error) throw new Error(error)
      
      set({ categories: data || [] })
      
      debugLog('Supplier categories loaded:', data?.length)
    } catch (error) {
      debugError('Failed to load supplier categories:', error)
    }
  },

  // Load cities for filters
  loadCities: async () => {
    try {
      debugLog('Loading supplier cities')
      
      const { data, error } = await suppliersApi.getCities()
      
      if (error) throw new Error(error)
      
      set({ cities: data || [] })
      
      debugLog('Supplier cities loaded:', data?.length)
    } catch (error) {
      debugError('Failed to load supplier cities:', error)
    }
  },

  // Search suppliers
  searchSuppliers: async (searchTerm, filters = {}) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Searching suppliers:', searchTerm)
      
      const { data, error } = await suppliersApi.search(searchTerm, filters)
      
      if (error) throw new Error(error)
      
      set({ 
        suppliers: data || [],
        isLoading: false 
      })
      
      debugLog('Search results:', data?.length)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to search suppliers:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      return { success: false, error: error.message }
    }
  },

  // Load supplier statistics
  loadSupplierStats: async (id) => {
    try {
      debugLog('Loading supplier statistics:', id)
      
      const { data, error } = await suppliersApi.getStatistics(id)
      
      if (error) throw new Error(error)
      
      set({ supplierStats: data })
      
      debugLog('Supplier statistics loaded')
      return { success: true, data }
    } catch (error) {
      debugError('Failed to load supplier statistics:', error)
      return { success: false, error: error.message }
    }
  },

  // Load supplier materials
  loadSupplierMaterials: async (id) => {
    try {
      debugLog('Loading supplier materials:', id)
      
      const { data, error } = await suppliersApi.getMaterials(id)
      
      if (error) throw new Error(error)
      
      set({ supplierMaterials: data || [] })
      
      debugLog('Supplier materials loaded:', data?.length)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to load supplier materials:', error)
      return { success: false, error: error.message }
    }
  },

  // Validate ICO
  validateICO: async (ico, excludeId = null) => {
    try {
      const { data, error } = await suppliersApi.validateICO(ico, excludeId)
      
      if (error) throw new Error(error)
      
      return { success: true, data }
    } catch (error) {
      debugError('Failed to validate ICO:', error)
      return { success: false, error: error.message }
    }
  },

  // Get top rated suppliers
  getTopRated: async (limit = 10) => {
    try {
      debugLog('Loading top rated suppliers')
      
      const { data, error } = await suppliersApi.getTopRated(limit)
      
      if (error) throw new Error(error)
      
      debugLog('Top rated suppliers loaded:', data?.length)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to load top rated suppliers:', error)
      return { success: false, error: error.message }
    }
  },

  // Get suppliers by category
  getByCategory: async (category) => {
    try {
      debugLog('Loading suppliers by category:', category)
      
      const { data, error } = await suppliersApi.getByCategory(category)
      
      if (error) throw new Error(error)
      
      debugLog('Suppliers by category loaded:', data?.length)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to load suppliers by category:', error)
      return { success: false, error: error.message }
    }
  },

  // Clear current supplier
  clearCurrentSupplier: () => {
    set({ 
      currentSupplier: null,
      supplierMaterials: [],
      supplierStats: null
    })
  },

  // Get supplier by ID from current list
  getSupplierById: (id) => {
    const state = get()
    return state.suppliers.find(supplier => supplier.id === parseInt(id))
  },

  // Get suppliers overview statistics
  getSuppliersOverview: () => {
    const state = get()
    const suppliers = state.suppliers
    
    const avgRating = suppliers.length > 0 
      ? suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length 
      : 0
    
    return {
      total: suppliers.length,
      active: suppliers.filter(s => s.status === 'active').length,
      inactive: suppliers.filter(s => s.status === 'inactive').length,
      categories: [...new Set(suppliers.map(s => s.category))].filter(Boolean).length,
      avgRating: Math.round(avgRating * 10) / 10,
      topRated: suppliers.filter(s => s.rating >= 4).length,
      avgPaymentTerms: suppliers.length > 0 
        ? Math.round(suppliers.reduce((sum, s) => sum + (s.payment_terms || 30), 0) / suppliers.length)
        : 30
    }
  }
}))

export default useSuppliersStore
