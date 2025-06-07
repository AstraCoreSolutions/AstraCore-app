import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { suppliersApi } from '../services/api/suppliers'
import { debugLog, debugError } from '../utils/helpers'

const useSuppliersStore = create(
  devtools(
    (set, get) => ({
      // State
      suppliers: [],
      currentSupplier: null,
      isLoading: false,
      error: null,
      filters: {
        category: '',
        city: '',
        is_active: true,
        search: ''
      },
      pagination: {
        page: 1,
        limit: 20,
        total: 0
      },

      // Actions
      setLoading: (isLoading) => {
        set({ isLoading })
      },

      setError: (error) => {
        debugError('Suppliers store error:', error)
        set({ error })
      },

      clearError: () => {
        set({ error: null })
      },

      setFilters: (newFilters) => {
        set(state => ({
          filters: { ...state.filters, ...newFilters },
          pagination: { ...state.pagination, page: 1 }
        }))
      },

      clearFilters: () => {
        set({
          filters: {
            category: '',
            city: '',
            is_active: true,
            search: ''
          },
          pagination: { page: 1, limit: 20, total: 0 }
        })
      },

      // Load all suppliers
      loadSuppliers: async (forceRefresh = false) => {
        const { suppliers, isLoading } = get()
        
        if (!forceRefresh && suppliers.length > 0 && !isLoading) {
          return { success: true }
        }

        set({ isLoading: true, error: null })

        try {
          debugLog('Loading suppliers...')
          
          const { filters } = get()
          const { data, error } = await suppliersApi.getAll(filters)

          if (error) throw new Error(error)

          debugLog('Suppliers loaded:', data?.length)
          set({ 
            suppliers: data || [],
            isLoading: false,
            pagination: { ...get().pagination, total: data?.length || 0 }
          })

          return { success: true }
        } catch (error) {
          debugError('Failed to load suppliers:', error)
          set({ 
            error: error.message, 
            isLoading: false,
            suppliers: []
          })
          return { success: false, error: error.message }
        }
      },

      // Load supplier by ID
      loadSupplierById: async (id) => {
        set({ isLoading: true, error: null })

        try {
          debugLog('Loading supplier:', id)
          
          const { data, error } = await suppliersApi.getById(id)

          if (error) throw new Error(error)

          debugLog('Supplier loaded:', data?.name)
          set({ 
            currentSupplier: data,
            isLoading: false
          })

          return { success: true, data }
        } catch (error) {
          debugError('Failed to load supplier:', error)
          set({ 
            error: error.message, 
            isLoading: false,
            currentSupplier: null
          })
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

          debugLog('Supplier created:', data?.name)
          
          // Add to suppliers list
          set(state => ({
            suppliers: [data, ...state.suppliers],
            isLoading: false
          }))

          return { success: true, data }
        } catch (error) {
          debugError('Failed to create supplier:', error)
          set({ 
            error: error.message, 
            isLoading: false
          })
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

          debugLog('Supplier updated:', data?.name)
          
          // Update in suppliers list
          set(state => ({
            suppliers: state.suppliers.map(supplier => 
              supplier.id === id ? data : supplier
            ),
            currentSupplier: state.currentSupplier?.id === id ? data : state.currentSupplier,
            isLoading: false
          }))

          return { success: true, data }
        } catch (error) {
          debugError('Failed to update supplier:', error)
          set({ 
            error: error.message, 
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      // Delete supplier
      deleteSupplier: async (id) => {
        set({ isLoading: true, error: null })

        try {
          debugLog('Deleting supplier:', id)
          
          const { error } = await suppliersApi.delete(id)

          if (error) throw new Error(error)

          debugLog('Supplier deleted')
          
          // Remove from suppliers list
          set(state => ({
            suppliers: state.suppliers.filter(supplier => supplier.id !== id),
            currentSupplier: state.currentSupplier?.id === id ? null : state.currentSupplier,
            isLoading: false
          }))

          return { success: true }
        } catch (error) {
          debugError('Failed to delete supplier:', error)
          set({ 
            error: error.message, 
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      // Deactivate supplier (soft delete)
      deactivateSupplier: async (id) => {
        set({ isLoading: true, error: null })

        try {
          debugLog('Deactivating supplier:', id)
          
          const { data, error } = await suppliersApi.update(id, { is_active: false })

          if (error) throw new Error(error)

          debugLog('Supplier deactivated')
          
          // Update in suppliers list
          set(state => ({
            suppliers: state.suppliers.map(supplier => 
              supplier.id === id ? data : supplier
            ),
            currentSupplier: state.currentSupplier?.id === id ? data : state.currentSupplier,
            isLoading: false
          }))

          return { success: true, data }
        } catch (error) {
          debugError('Failed to deactivate supplier:', error)
          set({ 
            error: error.message, 
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      // Activate supplier
      activateSupplier: async (id) => {
        set({ isLoading: true, error: null })

        try {
          debugLog('Activating supplier:', id)
          
          const { data, error } = await suppliersApi.update(id, { is_active: true })

          if (error) throw new Error(error)

          debugLog('Supplier activated')
          
          // Update in suppliers list
          set(state => ({
            suppliers: state.suppliers.map(supplier => 
              supplier.id === id ? data : supplier
            ),
            currentSupplier: state.currentSupplier?.id === id ? data : state.currentSupplier,
            isLoading: false
          }))

          return { success: true, data }
        } catch (error) {
          debugError('Failed to activate supplier:', error)
          set({ 
            error: error.message, 
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      // Load active suppliers only
      loadActiveSuppliers: async () => {
        try {
          debugLog('Loading active suppliers')
          
          const { data, error } = await suppliersApi.getActive()

          if (error) throw new Error(error)

          debugLog('Active suppliers loaded:', data?.length)
          return { success: true, data }
        } catch (error) {
          debugError('Failed to load active suppliers:', error)
          return { success: false, error: error.message }
        }
      },

      // Load suppliers by category
      loadSuppliersByCategory: async (category) => {
        try {
          debugLog('Loading suppliers by category:', category)
          
          const { data, error } = await suppliersApi.getByCategory(category)

          if (error) throw new Error(error)

          debugLog('Category suppliers loaded:', data?.length)
          return { success: true, data }
        } catch (error) {
          debugError('Failed to load suppliers by category:', error)
          return { success: false, error: error.message }
        }
      },

      // Get supplier statistics
      getSupplierStatistics: async (supplierId) => {
        try {
          debugLog('Getting supplier statistics:', supplierId)
          
          const { data, error } = await suppliersApi.getStatistics(supplierId)

          if (error) throw new Error(error)

          debugLog('Supplier statistics loaded')
          return { success: true, data }
        } catch (error) {
          debugError('Failed to get supplier statistics:', error)
          return { success: false, error: error.message }
        }
      },

      // Load supplier materials
      loadSupplierMaterials: async (supplierId) => {
        try {
          debugLog('Loading supplier materials:', supplierId)
          
          const { data, error } = await suppliersApi.getMaterials(supplierId)

          if (error) throw new Error(error)

          debugLog('Supplier materials loaded:', data?.length)
          return { success: true, data }
        } catch (error) {
          debugError('Failed to load supplier materials:', error)
          return { success: false, error: error.message }
        }
      },

      // Load supplier transactions
      loadSupplierTransactions: async (supplierId) => {
        try {
          debugLog('Loading supplier transactions:', supplierId)
          
          const { data, error } = await suppliersApi.getTransactions(supplierId)

          if (error) throw new Error(error)

          debugLog('Supplier transactions loaded:', data?.length)
          return { success: true, data }
        } catch (error) {
          debugError('Failed to load supplier transactions:', error)
          return { success: false, error: error.message }
        }
      },

      // Get supplier categories
      getCategories: async () => {
        try {
          debugLog('Getting supplier categories')
          
          const { data, error } = await suppliersApi.getCategories()

          if (error) throw new Error(error)

          debugLog('Supplier categories loaded:', data?.length)
          return { success: true, data }
        } catch (error) {
          debugError('Failed to get supplier categories:', error)
          return { success: false, error: error.message }
        }
      },

      // Search suppliers
      searchSuppliers: async (searchTerm) => {
        set({ isLoading: true, error: null })

        try {
          debugLog('Searching suppliers:', searchTerm)
          
          const { data, error } = await suppliersApi.search(searchTerm)

          if (error) throw new Error(error)

          debugLog('Supplier search results:', data?.length)
          set({ 
            suppliers: data || [],
            isLoading: false
          })

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

      // Clear current supplier
      clearCurrentSupplier: () => {
        set({ currentSupplier: null })
      },

      // Reset store
      reset: () => {
        set({
          suppliers: [],
          currentSupplier: null,
          isLoading: false,
          error: null,
          filters: {
            category: '',
            city: '',
            is_active: true,
            search: ''
          },
          pagination: {
            page: 1,
            limit: 20,
            total: 0
          }
        })
      }
    }),
    {
      name: 'suppliers-store'
    }
  )
)

export default useSuppliersStore
