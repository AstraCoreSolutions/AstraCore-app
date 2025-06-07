import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { materialsApi } from '../services/api/materials'
import { debugLog, debugError } from '../utils/helpers'

const useMaterialsStore = create(
  devtools(
    (set, get) => ({
      // State
      materials: [],
      currentMaterial: null,
      transactions: [],
      isLoading: false,
      error: null,
      filters: {
        category: '',
        project_id: '',
        supplier_id: '',
        status: '',
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
        debugError('Materials store error:', error)
        set({ error })
      },

      clearError: () => {
        set({ error: null })
      },

      setFilters: (newFilters) => {
        set(state => ({
          filters: { ...state.filters, ...newFilters },
          pagination: { ...state.pagination, page: 1 } // Reset page when filters change
        }))
      },

      clearFilters: () => {
        set({
          filters: {
            category: '',
            project_id: '',
            supplier_id: '',
            status: '',
            search: ''
          },
          pagination: { page: 1, limit: 20, total: 0 }
        })
      },

      // Load all materials
      loadMaterials: async (forceRefresh = false) => {
        const { materials, isLoading } = get()
        
        if (!forceRefresh && materials.length > 0 && !isLoading) {
          return { success: true }
        }

        set({ isLoading: true, error: null })

        try {
          debugLog('Loading materials...')
          
          const { filters } = get()
          const { data, error } = await materialsApi.getAll(filters)

          if (error) throw new Error(error)

          debugLog('Materials loaded:', data?.length)
          set({ 
            materials: data || [],
            isLoading: false,
            pagination: { ...get().pagination, total: data?.length || 0 }
          })

          return { success: true }
        } catch (error) {
          debugError('Failed to load materials:', error)
          set({ 
            error: error.message, 
            isLoading: false,
            materials: []
          })
          return { success: false, error: error.message }
        }
      },

      // Load material by ID
      loadMaterial: async (id) => {
        set({ isLoading: true, error: null })

        try {
          debugLog('Loading material:', id)
          
          const { data, error } = await materialsApi.getById(id)

          if (error) throw new Error(error)

          debugLog('Material loaded:', data?.name)
          set({ 
            currentMaterial: data,
            isLoading: false
          })

          return { success: true, data }
        } catch (error) {
          debugError('Failed to load material:', error)
          set({ 
            error: error.message, 
            isLoading: false,
            currentMaterial: null
          })
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

          debugLog('Material created:', data?.name)
          
          // Add to materials list
          set(state => ({
            materials: [data, ...state.materials],
            isLoading: false
          }))

          // Refresh the list to ensure consistency
          await get().loadMaterials(true)

          return { success: true, data }
        } catch (error) {
          debugError('Failed to create material:', error)
          set({ 
            error: error.message, 
            isLoading: false
          })
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

          debugLog('Material updated:', data?.name)
          
          // Update in materials list
          set(state => ({
            materials: state.materials.map(material => 
              material.id === id ? data : material
            ),
            currentMaterial: state.currentMaterial?.id === id ? data : state.currentMaterial,
            isLoading: false
          }))

          return { success: true, data }
        } catch (error) {
          debugError('Failed to update material:', error)
          set({ 
            error: error.message, 
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      // Delete material
      deleteMaterial: async (id) => {
        set({ isLoading: true, error: null })

        try {
          debugLog('Deleting material:', id)
          
          const { error } = await materialsApi.delete(id)

          if (error) throw new Error(error)

          debugLog('Material deleted')
          
          // Remove from materials list
          set(state => ({
            materials: state.materials.filter(material => material.id !== id),
            currentMaterial: state.currentMaterial?.id === id ? null : state.currentMaterial,
            isLoading: false
          }))

          return { success: true }
        } catch (error) {
          debugError('Failed to delete material:', error)
          set({ 
            error: error.message, 
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      // Update material quantity
      updateQuantity: async (id, newQuantity, reason = '') => {
        set({ isLoading: true, error: null })

        try {
          debugLog('Updating material quantity:', id, newQuantity)
          
          const { data, error } = await materialsApi.updateQuantity(id, newQuantity, reason)

          if (error) throw new Error(error)

          debugLog('Material quantity updated')
          
          // Update in materials list
          set(state => ({
            materials: state.materials.map(material => 
              material.id === id ? { ...material, quantity: newQuantity } : material
            ),
            currentMaterial: state.currentMaterial?.id === id ? 
              { ...state.currentMaterial, quantity: newQuantity } : 
              state.currentMaterial,
            isLoading: false
          }))

          return { success: true, data }
        } catch (error) {
          debugError('Failed to update material quantity:', error)
          set({ 
            error: error.message, 
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      // Load material transactions
      loadTransactions: async (materialId) => {
        set({ isLoading: true, error: null })

        try {
          debugLog('Loading material transactions:', materialId)
          
          const { data, error } = await materialsApi.getTransactions(materialId)

          if (error) throw new Error(error)

          debugLog('Material transactions loaded:', data?.length)
          set({ 
            transactions: data || [],
            isLoading: false
          })

          return { success: true, data }
        } catch (error) {
          debugError('Failed to load material transactions:', error)
          set({ 
            error: error.message, 
            isLoading: false,
            transactions: []
          })
          return { success: false, error: error.message }
        }
      },

      // Get materials by project
      loadProjectMaterials: async (projectId) => {
        set({ isLoading: true, error: null })

        try {
          debugLog('Loading project materials:', projectId)
          
          const { data, error } = await materialsApi.getByProject(projectId)

          if (error) throw new Error(error)

          debugLog('Project materials loaded:', data?.length)
          return { success: true, data }
        } catch (error) {
          debugError('Failed to load project materials:', error)
          set({ 
            error: error.message, 
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      // Get low stock materials
      loadLowStockMaterials: async () => {
        try {
          debugLog('Loading low stock materials')
          
          const { data, error } = await materialsApi.getLowStock()

          if (error) throw new Error(error)

          debugLog('Low stock materials loaded:', data?.length)
          return { success: true, data }
        } catch (error) {
          debugError('Failed to load low stock materials:', error)
          return { success: false, error: error.message }
        }
      },

      // Clear current material
      clearCurrentMaterial: () => {
        set({ currentMaterial: null })
      },

      // Reset store
      reset: () => {
        set({
          materials: [],
          currentMaterial: null,
          transactions: [],
          isLoading: false,
          error: null,
          filters: {
            category: '',
            project_id: '',
            supplier_id: '',
            status: '',
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
      name: 'materials-store'
    }
  )
)

export default useMaterialsStore
