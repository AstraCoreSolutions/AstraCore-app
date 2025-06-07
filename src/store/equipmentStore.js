import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { equipmentApi } from '../services/api/equipment'
import { debugLog, debugError } from '../utils/helpers'

const useEquipmentStore = create(
  devtools(
    (set, get) => ({
      // State
      equipment: [],
      currentEquipment: null,
      isLoading: false,
      error: null,
      filters: {
        category: '',
        status: '',
        project_id: '',
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
        debugError('Equipment store error:', error)
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
            status: '',
            project_id: '',
            search: ''
          },
          pagination: { page: 1, limit: 20, total: 0 }
        })
      },

      // Load all equipment
      loadEquipment: async (forceRefresh = false) => {
        const { equipment, isLoading } = get()
        
        if (!forceRefresh && equipment.length > 0 && !isLoading) {
          return { success: true }
        }

        set({ isLoading: true, error: null })

        try {
          debugLog('Loading equipment...')
          
          const { filters } = get()
          const { data, error } = await equipmentApi.getAll(filters)

          if (error) throw new Error(error)

          debugLog('Equipment loaded:', data?.length)
          set({ 
            equipment: data || [],
            isLoading: false,
            pagination: { ...get().pagination, total: data?.length || 0 }
          })

          return { success: true }
        } catch (error) {
          debugError('Failed to load equipment:', error)
          set({ 
            error: error.message, 
            isLoading: false,
            equipment: []
          })
          return { success: false, error: error.message }
        }
      },

      // Load equipment by ID
      loadEquipmentById: async (id) => {
        set({ isLoading: true, error: null })

        try {
          debugLog('Loading equipment:', id)
          
          const { data, error } = await equipmentApi.getById(id)

          if (error) throw new Error(error)

          debugLog('Equipment loaded:', data?.name)
          set({ 
            currentEquipment: data,
            isLoading: false
          })

          return { success: true, data }
        } catch (error) {
          debugError('Failed to load equipment:', error)
          set({ 
            error: error.message, 
            isLoading: false,
            currentEquipment: null
          })
          return { success: false, error: error.message }
        }
      },

      // Create new equipment
      createEquipment: async (equipmentData) => {
        set({ isLoading: true, error: null })

        try {
          debugLog('Creating equipment:', equipmentData.name)
          
          const { data, error } = await equipmentApi.create(equipmentData)

          if (error) throw new Error(error)

          debugLog('Equipment created:', data?.name)
          
          // Add to equipment list
          set(state => ({
            equipment: [data, ...state.equipment],
            isLoading: false
          }))

          return { success: true, data }
        } catch (error) {
          debugError('Failed to create equipment:', error)
          set({ 
            error: error.message, 
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      // Update equipment
      updateEquipment: async (id, updates) => {
        set({ isLoading: true, error: null })

        try {
          debugLog('Updating equipment:', id)
          
          const { data, error } = await equipmentApi.update(id, updates)

          if (error) throw new Error(error)

          debugLog('Equipment updated:', data?.name)
          
          // Update in equipment list
          set(state => ({
            equipment: state.equipment.map(item => 
              item.id === id ? data : item
            ),
            currentEquipment: state.currentEquipment?.id === id ? data : state.currentEquipment,
            isLoading: false
          }))

          return { success: true, data }
        } catch (error) {
          debugError('Failed to update equipment:', error)
          set({ 
            error: error.message, 
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      // Delete equipment
      deleteEquipment: async (id) => {
        set({ isLoading: true, error: null })

        try {
          debugLog('Deleting equipment:', id)
          
          const { error } = await equipmentApi.delete(id)

          if (error) throw new Error(error)

          debugLog('Equipment deleted')
          
          // Remove from equipment list
          set(state => ({
            equipment: state.equipment.filter(item => item.id !== id),
            currentEquipment: state.currentEquipment?.id === id ? null : state.currentEquipment,
            isLoading: false
          }))

          return { success: true }
        } catch (error) {
          debugError('Failed to delete equipment:', error)
          set({ 
            error: error.message, 
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      // Assign equipment to project
      assignToProject: async (equipmentId, projectId) => {
        set({ isLoading: true, error: null })

        try {
          debugLog('Assigning equipment to project:', equipmentId, projectId)
          
          const { data, error } = await equipmentApi.assignToProject(equipmentId, projectId)

          if (error) throw new Error(error)

          debugLog('Equipment assigned to project')
          
          // Update in equipment list
          set(state => ({
            equipment: state.equipment.map(item => 
              item.id === equipmentId ? data : item
            ),
            currentEquipment: state.currentEquipment?.id === equipmentId ? data : state.currentEquipment,
            isLoading: false
          }))

          return { success: true, data }
        } catch (error) {
          debugError('Failed to assign equipment to project:', error)
          set({ 
            error: error.message, 
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      // Return equipment from project
      returnFromProject: async (equipmentId) => {
        set({ isLoading: true, error: null })

        try {
          debugLog('Returning equipment from project:', equipmentId)
          
          const { data, error } = await equipmentApi.returnFromProject(equipmentId)

          if (error) throw new Error(error)

          debugLog('Equipment returned from project')
          
          // Update in equipment list
          set(state => ({
            equipment: state.equipment.map(item => 
              item.id === equipmentId ? data : item
            ),
            currentEquipment: state.currentEquipment?.id === equipmentId ? data : state.currentEquipment,
            isLoading: false
          }))

          return { success: true, data }
        } catch (error) {
          debugError('Failed to return equipment from project:', error)
          set({ 
            error: error.message, 
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      // Update equipment status
      updateStatus: async (equipmentId, status, notes = '') => {
        set({ isLoading: true, error: null })

        try {
          debugLog('Updating equipment status:', equipmentId, status)
          
          const { data, error } = await equipmentApi.updateStatus(equipmentId, status, notes)

          if (error) throw new Error(error)

          debugLog('Equipment status updated')
          
          // Update in equipment list
          set(state => ({
            equipment: state.equipment.map(item => 
              item.id === equipmentId ? data : item
            ),
            currentEquipment: state.currentEquipment?.id === equipmentId ? data : state.currentEquipment,
            isLoading: false
          }))

          return { success: true, data }
        } catch (error) {
          debugError('Failed to update equipment status:', error)
          set({ 
            error: error.message, 
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      // Load project equipment
      loadProjectEquipment: async (projectId) => {
        set({ isLoading: true, error: null })

        try {
          debugLog('Loading project equipment:', projectId)
          
          const { data, error } = await equipmentApi.getByProject(projectId)

          if (error) throw new Error(error)

          debugLog('Project equipment loaded:', data?.length)
          return { success: true, data }
        } catch (error) {
          debugError('Failed to load project equipment:', error)
          set({ 
            error: error.message, 
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      // Load available equipment
      loadAvailableEquipment: async () => {
        try {
          debugLog('Loading available equipment')
          
          const { data, error } = await equipmentApi.getAvailable()

          if (error) throw new Error(error)

          debugLog('Available equipment loaded:', data?.length)
          return { success: true, data }
        } catch (error) {
          debugError('Failed to load available equipment:', error)
          return { success: false, error: error.message }
        }
      },

      // Load equipment needing maintenance
      loadMaintenanceEquipment: async () => {
        try {
          debugLog('Loading equipment needing maintenance')
          
          const { data, error } = await equipmentApi.getNeedingMaintenance()

          if (error) throw new Error(error)

          debugLog('Maintenance equipment loaded:', data?.length)
          return { success: true, data }
        } catch (error) {
          debugError('Failed to load maintenance equipment:', error)
          return { success: false, error: error.message }
        }
      },

      // Clear current equipment
      clearCurrentEquipment: () => {
        set({ currentEquipment: null })
      },

      // Reset store
      reset: () => {
        set({
          equipment: [],
          currentEquipment: null,
          isLoading: false,
          error: null,
          filters: {
            category: '',
            status: '',
            project_id: '',
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
      name: 'equipment-store'
    }
  )
)

export default useEquipmentStore
