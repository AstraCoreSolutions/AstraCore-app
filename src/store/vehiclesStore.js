import { create } from 'zustand'
import { vehiclesApi } from '../services/api/vehicles'
import { debugLog, debugError } from '../utils/helpers'
import toast from 'react-hot-toast'

const useVehiclesStore = create((set, get) => ({
  // State
  vehicles: [],
  currentVehicle: null,
  expiringDocuments: [],
  types: [],
  brands: [],
  isLoading: false,
  error: null,
  filters: {
    search: '',
    type: '',
    status: '',
    brand: '',
    available: false,
    expiringInsurance: false,
    expiringSTK: false
  },

  // Actions
  setFilters: (newFilters) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters }
    }))
    // Reload vehicles with new filters
    get().loadVehicles()
  },

  clearFilters: () => {
    set({
      filters: {
        search: '',
        type: '',
        status: '',
        brand: '',
        available: false,
        expiringInsurance: false,
        expiringSTK: false
      }
    })
    get().loadVehicles()
  },

  // Load all vehicles
  loadVehicles: async (forceRefresh = false) => {
    const state = get()
    
    if (state.isLoading && !forceRefresh) return
    
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Loading vehicles with filters:', state.filters)
      
      const { data, error } = await vehiclesApi.getAll(state.filters)
      
      if (error) throw new Error(error)
      
      set({ 
        vehicles: data || [],
        isLoading: false 
      })
      
      debugLog('Vehicles loaded:', data?.length)
    } catch (error) {
      debugError('Failed to load vehicles:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error('Nepodařilo se načíst vozidla')
    }
  },

  // Load single vehicle
  loadVehicle: async (id) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Loading vehicle:', id)
      
      const { data, error } = await vehiclesApi.getById(id)
      
      if (error) throw new Error(error)
      
      set({ 
        currentVehicle: data,
        isLoading: false 
      })
      
      debugLog('Vehicle loaded:', data?.name)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to load vehicle:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error('Nepodařilo se načíst vozidlo')
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
      
      // Add to vehicles list
      set(state => ({
        vehicles: [data, ...state.vehicles],
        isLoading: false
      }))
      
      toast.success('Vozidlo bylo úspěšně vytvořeno')
      debugLog('Vehicle created:', data.name)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to create vehicle:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error('Nepodařilo se vytvořit vozidlo')
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
      
      // Update in vehicles list
      set(state => ({
        vehicles: state.vehicles.map(vehicle => 
          vehicle.id === id ? data : vehicle
        ),
        currentVehicle: state.currentVehicle?.id === id ? data : state.currentVehicle,
        isLoading: false
      }))
      
      toast.success('Vozidlo bylo úspěšně aktualizováno')
      debugLog('Vehicle updated:', data.name)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to update vehicle:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error('Nepodařilo se aktualizovat vozidlo')
      return { success: false, error: error.message }
    }
  },

  // Delete vehicle
  deleteVehicle: async (id) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Deleting vehicle:', id)
      
      const { data, error } = await vehiclesApi.delete(id)
      
      if (error) throw new Error(error)
      
      // Remove from vehicles list
      set(state => ({
        vehicles: state.vehicles.filter(vehicle => vehicle.id !== id),
        currentVehicle: state.currentVehicle?.id === id ? null : state.currentVehicle,
        isLoading: false
      }))
      
      toast.success('Vozidlo bylo úspěšně smazáno')
      debugLog('Vehicle deleted')
      return { success: true }
    } catch (error) {
      debugError('Failed to delete vehicle:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error(error.message)
      return { success: false, error: error.message }
    }
  },

  // Assign vehicle to user
  assignVehicle: async (id, assignedTo, notes = '') => {
    try {
      debugLog('Assigning vehicle:', id, assignedTo)
      
      const { data, error } = await vehiclesApi.assignVehicle(id, assignedTo, notes)
      
      if (error) throw new Error(error)
      
      // Update in vehicles list
      set(state => ({
        vehicles: state.vehicles.map(vehicle => 
          vehicle.id === id ? data : vehicle
        ),
        currentVehicle: state.currentVehicle?.id === id ? data : state.currentVehicle
      }))
      
      toast.success('Vozidlo bylo úspěšně přiřazeno')
      debugLog('Vehicle assigned')
      return { success: true, data }
    } catch (error) {
      debugError('Failed to assign vehicle:', error)
      toast.error(error.message || 'Nepodařilo se přiřadit vozidlo')
      return { success: false, error: error.message }
    }
  },

  // Unassign vehicle
  unassignVehicle: async (id) => {
    try {
      debugLog('Unassigning vehicle:', id)
      
      const { data, error } = await vehiclesApi.unassignVehicle(id)
      
      if (error) throw new Error(error)
      
      // Update in vehicles list
      set(state => ({
        vehicles: state.vehicles.map(vehicle => 
          vehicle.id === id ? data : vehicle
        ),
        currentVehicle: state.currentVehicle?.id === id ? data : state.currentVehicle
      }))
      
      toast.success('Vozidlo bylo úspěšně odebráno')
      debugLog('Vehicle unassigned')
      return { success: true, data }
    } catch (error) {
      debugError('Failed to unassign vehicle:', error)
      toast.error('Nepodařilo se odebrat vozidlo')
      return { success: false, error: error.message }
    }
  },

  // Send vehicle to service
  sendToService: async (id, serviceNotes = '') => {
    try {
      debugLog('Sending vehicle to service:', id)
      
      const { data, error } = await vehiclesApi.sendToService(id, serviceNotes)
      
      if (error) throw new Error(error)
      
      // Update in vehicles list
      set(state => ({
        vehicles: state.vehicles.map(vehicle => 
          vehicle.id === id ? data : vehicle
        ),
        currentVehicle: state.currentVehicle?.id === id ? data : state.currentVehicle
      }))
      
      toast.success('Vozidlo bylo odesláno do servisu')
      debugLog('Vehicle sent to service')
      return { success: true, data }
    } catch (error) {
      debugError('Failed to send vehicle to service:', error)
      toast.error('Nepodařilo se odeslat vozidlo do servisu')
      return { success: false, error: error.message }
    }
  },

  // Return vehicle from service
  returnFromService: async (id, serviceNotes = '') => {
    try {
      debugLog('Returning vehicle from service:', id)
      
      const { data, error } = await vehiclesApi.returnFromService(id, serviceNotes)
      
      if (error) throw new Error(error)
      
      // Update in vehicles list
      set(state => ({
        vehicles: state.vehicles.map(vehicle => 
          vehicle.id === id ? data : vehicle
        ),
        currentVehicle: state.currentVehicle?.id === id ? data : state.currentVehicle
      }))
      
      toast.success('Vozidlo bylo vráceno ze servisu')
      debugLog('Vehicle returned from service')
      return { success: true, data }
    } catch (error) {
      debugError('Failed to return vehicle from service:', error)
      toast.error('Nepodařilo se vrátit vozidlo ze servisu')
      return { success: false, error: error.message }
    }
  },

  // Load types for filters
  loadTypes: async () => {
    try {
      debugLog('Loading vehicle types')
      
      const { data, error } = await vehiclesApi.getTypes()
      
      if (error) throw new Error(error)
      
      set({ types: data || [] })
      
      debugLog('Vehicle types loaded:', data?.length)
    } catch (error) {
      debugError('Failed to load vehicle types:', error)
    }
  },

  // Load brands for filters
  loadBrands: async () => {
    try {
      debugLog('Loading vehicle brands')
      
      const { data, error } = await vehiclesApi.getBrands()
      
      if (error) throw new Error(error)
      
      set({ brands: data || [] })
      
      debugLog('Vehicle brands loaded:', data?.length)
    } catch (error) {
      debugError('Failed to load vehicle brands:', error)
    }
  },

  // Search vehicles
  searchVehicles: async (searchTerm, filters = {}) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Searching vehicles:', searchTerm)
      
      const { data, error } = await vehiclesApi.search(searchTerm, filters)
      
      if (error) throw new Error(error)
      
      set({ 
        vehicles: data || [],
        isLoading: false 
      })
      
      debugLog('Search results:', data?.length)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to search vehicles:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      return { success: false, error: error.message }
    }
  },

  // Get vehicles by user
  getVehiclesByUser: async (userId) => {
    try {
      debugLog('Loading vehicles by user:', userId)
      
      const { data, error } = await vehiclesApi.getByUser(userId)
      
      if (error) throw new Error(error)
      
      debugLog('User vehicles loaded:', data?.length)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to load user vehicles:', error)
      return { success: false, error: error.message }
    }
  },

  // Load vehicles with expiring documents
  loadExpiringDocuments: async () => {
    try {
      debugLog('Loading vehicles with expiring documents')
      
      const { data, error } = await vehiclesApi.getExpiringDocuments()
      
      if (error) throw new Error(error)
      
      set({ expiringDocuments: data || [] })
      
      debugLog('Expiring documents loaded:', data?.length)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to load expiring documents:', error)
      return { success: false, error: error.message }
    }
  },

  // Clear current vehicle
  clearCurrentVehicle: () => {
    set({ 
      currentVehicle: null
    })
  },

  // Get vehicle by ID from current list
  getVehicleById: (id) => {
    const state = get()
    return state.vehicles.find(vehicle => vehicle.id === parseInt(id))
  },

  // Get vehicles overview statistics
  getVehiclesOverview: () => {
    const state = get()
    const vehicles = state.vehicles
    
    const totalValue = vehicles.reduce((sum, v) => 
      sum + (v.current_value || v.purchase_price || 0), 0
    )
    
    return {
      total: vehicles.length,
      active: vehicles.filter(v => v.status === 'active').length,
      inService: vehicles.filter(v => v.status === 'service').length,
      retired: vehicles.filter(v => v.status === 'retired').length,
      assigned: vehicles.filter(v => v.assigned_to).length,
      available: vehicles.filter(v => v.status === 'active' && !v.assigned_to).length,
      totalValue,
      types: [...new Set(vehicles.map(v => v.type))].filter(Boolean).length
    }
  }
}))

export default useVehiclesStore
