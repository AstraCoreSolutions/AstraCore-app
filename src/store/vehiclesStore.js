import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { vehiclesApi } from '../services/api/vehicles'
import { debugLog, debugError } from '../utils/helpers'

const useVehiclesStore = create(
  devtools(
    (set, get) => ({
      // State
      vehicles: [],
      currentVehicle: null,
      isLoading: false,
      error: null,
      filters: {
        status: '',
        fuel_type: '',
        project_id: '',
        driver_id: '',
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
        debugError('Vehicles store error:', error)
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
            status: '',
            fuel_type: '',
            project_id: '',
            driver_id: '',
            search: ''
          },
          pagination: { page: 1, limit: 20, total: 0 }
        })
      },

      // Load all vehicles
      loadVehicles: async (forceRefresh = false) => {
        const { vehicles, isLoading } = get()
        
        if (!forceRefresh && vehicles.length > 0 && !isLoading) {
          return { success: true }
        }

        set({ isLoading: true, error: null })

        try {
          debugLog('Loading vehicles...')
          
          const { filters } = get()
          const { data, error } = await vehiclesApi.getAll(filters)

          if (error) throw new Error(error)

          debugLog('Vehicles loaded:', data?.length)
          set({ 
            vehicles: data || [],
            isLoading: false,
            pagination: { ...get().pagination, total: data?.length || 0 }
          })

          return { success: true }
        } catch (error) {
          debugError('Failed to load vehicles:', error)
          set({ 
            error: error.message, 
            isLoading: false,
            vehicles: []
          })
          return { success: false, error: error.message }
        }
      },

      // Load vehicle by ID
      loadVehicleById: async (id) => {
        set({ isLoading: true, error: null })

        try {
          debugLog('Loading vehicle:', id)
          
          const { data, error } = await vehiclesApi.getById(id)

          if (error) throw new Error(error)

          debugLog('Vehicle loaded:', data?.name)
          set({ 
            currentVehicle: data,
            isLoading: false
          })

          return { success: true, data }
        } catch (error) {
          debugError('Failed to load vehicle:', error)
          set({ 
            error: error.message, 
            isLoading: false,
            currentVehicle: null
          })
          return { success: false, error: error.message }
        }
      },

      // Create new vehicle
      createVehicle: async (vehicleData) => {
        set({ isLoading: true, error: null })

        try {
          debugLog('Creating vehicle:', vehicleData.name)
          
          const { data, error } = await vehiclesApi.create(vehicleData)

          if (error) throw new Error(error)

          debugLog('Vehicle created:', data?.name)
          
          // Add to vehicles list
          set(state => ({
            vehicles: [data, ...state.vehicles],
            isLoading: false
          }))

          return { success: true, data }
        } catch (error) {
          debugError('Failed to create vehicle:', error)
          set({ 
            error: error.message, 
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      // Update vehicle
      updateVehicle: async (id, updates) => {
        set({ isLoading: true, error: null })

        try {
          debugLog('Updating vehicle:', id)
          
          const { data, error } = await vehiclesApi.update(id, updates)

          if (error) throw new Error(error)

          debugLog('Vehicle updated:', data?.name)
          
          // Update in vehicles list
          set(state => ({
            vehicles: state.vehicles.map(vehicle => 
              vehicle.id === id ? data : vehicle
            ),
            currentVehicle: state.currentVehicle?.id === id ? data : state.currentVehicle,
            isLoading: false
          }))

          return { success: true, data }
        } catch (error) {
          debugError('Failed to update vehicle:', error)
          set({ 
            error: error.message, 
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      // Delete vehicle
      deleteVehicle: async (id) => {
        set({ isLoading: true, error: null })

        try {
          debugLog('Deleting vehicle:', id)
          
          const { error } = await vehiclesApi.delete(id)

          if (error) throw new Error(error)

          debugLog('Vehicle deleted')
          
          // Remove from vehicles list
          set(state => ({
            vehicles: state.vehicles.filter(vehicle => vehicle.id !== id),
            currentVehicle: state.currentVehicle?.id === id ? null : state.currentVehicle,
            isLoading: false
          }))

          return { success: true }
        } catch (error) {
          debugError('Failed to delete vehicle:', error)
          set({ 
            error: error.message, 
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      // Assign vehicle to driver
      assignToDriver: async (vehicleId, driverId) => {
        set({ isLoading: true, error: null })

        try {
          debugLog('Assigning vehicle to driver:', vehicleId, driverId)
          
          const { data, error } = await vehiclesApi.assignToDriver(vehicleId, driverId)

          if (error) throw new Error(error)

          debugLog('Vehicle assigned to driver')
          
          // Update in vehicles list
          set(state => ({
            vehicles: state.vehicles.map(vehicle => 
              vehicle.id === vehicleId ? data : vehicle
            ),
            currentVehicle: state.currentVehicle?.id === vehicleId ? data : state.currentVehicle,
            isLoading: false
          }))

          return { success: true, data }
        } catch (error) {
          debugError('Failed to assign vehicle to driver:', error)
          set({ 
            error: error.message, 
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      // Assign vehicle to project
      assignToProject: async (vehicleId, projectId) => {
        set({ isLoading: true, error: null })

        try {
          debugLog('Assigning vehicle to project:', vehicleId, projectId)
          
          const { data, error } = await vehiclesApi.assignToProject(vehicleId, projectId)

          if (error) throw new Error(error)

          debugLog('Vehicle assigned to project')
          
          // Update in vehicles list
          set(state => ({
            vehicles: state.vehicles.map(vehicle => 
              vehicle.id === vehicleId ? data : vehicle
            ),
            currentVehicle: state.currentVehicle?.id === vehicleId ? data : state.currentVehicle,
            isLoading: false
          }))

          return { success: true, data }
        } catch (error) {
          debugError('Failed to assign vehicle to project:', error)
          set({ 
            error: error.message, 
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      // Return vehicle
      returnVehicle: async (vehicleId) => {
        set({ isLoading: true, error: null })

        try {
          debugLog('Returning vehicle:', vehicleId)
          
          const { data, error } = await vehiclesApi.returnVehicle(vehicleId)

          if (error) throw new Error(error)

          debugLog('Vehicle returned')
          
          // Update in vehicles list
          set(state => ({
            vehicles: state.vehicles.map(vehicle => 
              vehicle.id === vehicleId ? data : vehicle
            ),
            currentVehicle: state.currentVehicle?.id === vehicleId ? data : state.currentVehicle,
            isLoading: false
          }))

          return { success: true, data }
        } catch (error) {
          debugError('Failed to return vehicle:', error)
          set({ 
            error: error.message, 
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      // Update vehicle status
      updateStatus: async (vehicleId, status, notes = '') => {
        set({ isLoading: true, error: null })

        try {
          debugLog('Updating vehicle status:', vehicleId, status)
          
          const { data, error } = await vehiclesApi.updateStatus(vehicleId, status, notes)

          if (error) throw new Error(error)

          debugLog('Vehicle status updated')
          
          // Update in vehicles list
          set(state => ({
            vehicles: state.vehicles.map(vehicle => 
              vehicle.id === vehicleId ? data : vehicle
            ),
            currentVehicle: state.currentVehicle?.id === vehicleId ? data : state.currentVehicle,
            isLoading: false
          }))

          return { success: true, data }
        } catch (error) {
          debugError('Failed to update vehicle status:', error)
          set({ 
            error: error.message, 
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      // Update mileage
      updateMileage: async (vehicleId, newMileage) => {
        set({ isLoading: true, error: null })

        try {
          debugLog('Updating vehicle mileage:', vehicleId, newMileage)
          
          const { data, error } = await vehiclesApi.updateMileage(vehicleId, newMileage)

          if (error) throw new Error(error)

          debugLog('Vehicle mileage updated')
          
          // Update in vehicles list
          set(state => ({
            vehicles: state.vehicles.map(vehicle => 
              vehicle.id === vehicleId ? data : vehicle
            ),
            currentVehicle: state.currentVehicle?.id === vehicleId ? data : state.currentVehicle,
            isLoading: false
          }))

          return { success: true, data }
        } catch (error) {
          debugError('Failed to update vehicle mileage:', error)
          set({ 
            error: error.message, 
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      // Load available vehicles
      loadAvailableVehicles: async () => {
        try {
          debugLog('Loading available vehicles')
          
          const { data, error } = await vehiclesApi.getAvailable()

          if (error) throw new Error(error)

          debugLog('Available vehicles loaded:', data?.length)
          return { success: true, data }
        } catch (error) {
          debugError('Failed to load available vehicles:', error)
          return { success: false, error: error.message }
        }
      },

      // Load vehicles needing maintenance
      loadMaintenanceVehicles: async () => {
        try {
          debugLog('Loading vehicles needing maintenance')
          
          const { data, error } = await vehiclesApi.getNeedingMaintenance()

          if (error) throw new Error(error)

          debugLog('Maintenance vehicles loaded:', data?.length)
          return { success: true, data }
        } catch (error) {
          debugError('Failed to load maintenance vehicles:', error)
          return { success: false, error: error.message }
        }
      },

      // Load project vehicles
      loadProjectVehicles: async (projectId) => {
        try {
          debugLog('Loading project vehicles:', projectId)
          
          const { data, error } = await vehiclesApi.getByProject(projectId)

          if (error) throw new Error(error)

          debugLog('Project vehicles loaded:', data?.length)
          return { success: true, data }
        } catch (error) {
          debugError('Failed to load project vehicles:', error)
          return { success: false, error: error.message }
        }
      },

      // Clear current vehicle
      clearCurrentVehicle: () => {
        set({ currentVehicle: null })
      },

      // Reset store
      reset: () => {
        set({
          vehicles: [],
          currentVehicle: null,
          isLoading: false,
          error: null,
          filters: {
            status: '',
            fuel_type: '',
            project_id: '',
            driver_id: '',
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
      name: 'vehicles-store'
    }
  )
)

export default useVehiclesStore
