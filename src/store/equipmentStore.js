import { create } from 'zustand'
import { equipmentApi } from '../services/api/equipment'
import { debugLog, debugError } from '../utils/helpers'
import toast from 'react-hot-toast'

const useEquipmentStore = create((set, get) => ({
  // State
  equipment: [],
  currentEquipment: null,
  borrowHistory: [],
  categories: [],
  locations: [],
  isLoading: false,
  error: null,
  filters: {
    search: '',
    category: '',
    status: '',
    location: '',
    available: false
  },

  // Actions
  setFilters: (newFilters) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters }
    }))
    // Reload equipment with new filters
    get().loadEquipment()
  },

  clearFilters: () => {
    set({
      filters: {
        search: '',
        category: '',
        status: '',
        location: '',
        available: false
      }
    })
    get().loadEquipment()
  },

  // Load all equipment
  loadEquipment: async (forceRefresh = false) => {
    const state = get()
    
    if (state.isLoading && !forceRefresh) return
    
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Loading equipment with filters:', state.filters)
      
      const { data, error } = await equipmentApi.getAll(state.filters)
      
      if (error) throw new Error(error)
      
      set({ 
        equipment: data || [],
        isLoading: false 
      })
      
      debugLog('Equipment loaded:', data?.length)
    } catch (error) {
      debugError('Failed to load equipment:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error('Nepodařilo se načíst nářadí')
    }
  },

  // Load single equipment
  loadEquipmentItem: async (id) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Loading equipment:', id)
      
      const { data, error } = await equipmentApi.getById(id)
      
      if (error) throw new Error(error)
      
      set({ 
        currentEquipment: data,
        isLoading: false 
      })
      
      debugLog('Equipment loaded:', data?.name)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to load equipment:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error('Nepodařilo se načíst nářadí')
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
      
      // Add to equipment list
      set(state => ({
        equipment: [data, ...state.equipment],
        isLoading: false
      }))
      
      toast.success('Nářadí bylo úspěšně vytvořeno')
      debugLog('Equipment created:', data.name)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to create equipment:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error('Nepodařilo se vytvořit nářadí')
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
      
      // Update in equipment list
      set(state => ({
        equipment: state.equipment.map(item => 
          item.id === id ? data : item
        ),
        currentEquipment: state.currentEquipment?.id === id ? data : state.currentEquipment,
        isLoading: false
      }))
      
      toast.success('Nářadí bylo úspěšně aktualizováno')
      debugLog('Equipment updated:', data.name)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to update equipment:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error('Nepodařilo se aktualizovat nářadí')
      return { success: false, error: error.message }
    }
  },

  // Delete equipment
  deleteEquipment: async (id) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Deleting equipment:', id)
      
      const { data, error } = await equipmentApi.delete(id)
      
      if (error) throw new Error(error)
      
      // Remove from equipment list
      set(state => ({
        equipment: state.equipment.filter(item => item.id !== id),
        currentEquipment: state.currentEquipment?.id === id ? null : state.currentEquipment,
        isLoading: false
      }))
      
      toast.success('Nářadí bylo úspěšně smazáno')
      debugLog('Equipment deleted')
      return { success: true }
    } catch (error) {
      debugError('Failed to delete equipment:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error(error.message)
      return { success: false, error: error.message }
    }
  },

  // Borrow equipment
  borrowEquipment: async (id, borrowedBy, notes = '') => {
    try {
      debugLog('Borrowing equipment:', id, borrowedBy)
      
      const { data, error } = await equipmentApi.borrowEquipment(id, borrowedBy, notes)
      
      if (error) throw new Error(error)
      
      // Update in equipment list
      set(state => ({
        equipment: state.equipment.map(item => 
          item.id === id ? data : item
        ),
        currentEquipment: state.currentEquipment?.id === id ? data : state.currentEquipment
      }))
      
      toast.success('Nářadí bylo úspěšně vypůjčeno')
      debugLog('Equipment borrowed')
      return { success: true, data }
    } catch (error) {
      debugError('Failed to borrow equipment:', error)
      toast.error(error.message || 'Nepodařilo se vypůjčit nářadí')
      return { success: false, error: error.message }
    }
  },

  // Return equipment
  returnEquipment: async (id, returnNotes = '') => {
    try {
      debugLog('Returning equipment:', id)
      
      const { data, error } = await equipmentApi.returnEquipment(id, returnNotes)
      
      if (error) throw new Error(error)
      
      // Update in equipment list
      set(state => ({
        equipment: state.equipment.map(item => 
          item.id === id ? data : item
        ),
        currentEquipment: state.currentEquipment?.id === id ? data : state.currentEquipment
      }))
      
      toast.success('Nářadí bylo úspěšně vráceno')
      debugLog('Equipment returned')
      return { success: true, data }
    } catch (error) {
      debugError('Failed to return equipment:', error)
      toast.error('Nepodařilo se vrátit nářadí')
      return { success: false, error: error.message }
    }
  },

  // Send equipment to service
  sendToService: async (id, serviceNotes = '') => {
    try {
      debugLog('Sending equipment to service:', id)
      
      const { data, error } = await equipmentApi.sendToService(id, serviceNotes)
      
      if (error) throw new Error(error)
      
      // Update in equipment list
      set(state => ({
        equipment: state.equipment.map(item => 
          item.id === id ? data : item
        ),
        currentEquipment: state.currentEquipment?.id === id ? data : state.currentEquipment
      }))
      
      toast.success('Nářadí bylo odesláno do servisu')
      debugLog('Equipment sent to service')
      return { success: true, data }
    } catch (error) {
      debugError('Failed to send equipment to service:', error)
      toast.error('Nepodařilo se odeslat nářadí do servisu')
      return { success: false, error: error.message }
    }
  },

  // Load categories for filters
  loadCategories: async () => {
    try {
      debugLog('Loading categories')
      
      const { data, error } = await equipmentApi.getCategories()
      
      if (error) throw new Error(error)
      
      set({ categories: data || [] })
      
      debugLog('Categories loaded:', data?.length)
    } catch (error) {
      debugError('Failed to load categories:', error)
    }
  },

  // Load locations for filters
  loadLocations: async () => {
    try {
      debugLog('Loading locations')
      
      const { data, error } = await equipmentApi.getLocations()
      
      if (error) throw new Error(error)
      
      set({ locations: data || [] })
      
      debugLog('Locations loaded:', data?.length)
    } catch (error) {
      debugError('Failed to load locations:', error)
    }
  },

  // Search equipment
  searchEquipment: async (searchTerm, filters = {}) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Searching equipment:', searchTerm)
      
      const { data, error } = await equipmentApi.search(searchTerm, filters)
      
      if (error) throw new Error(error)
      
      set({ 
        equipment: data || [],
        isLoading: false 
      })
      
      debugLog('Search results:', data?.length)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to search equipment:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      return { success: false, error: error.message }
    }
  },

  // Load borrow history
  loadBorrowHistory: async (id) => {
    try {
      debugLog('Loading borrow history:', id)
      
      const { data, error } = await equipmentApi.getBorrowHistory(id)
      
      if (error) throw new Error(error)
      
      set({ borrowHistory: data || [] })
      
      debugLog('Borrow history loaded:', data?.length)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to load borrow history:', error)
      return { success: false, error: error.message }
    }
  },

  // Get borrowed equipment by user
  getBorrowedByUser: async (userId) => {
    try {
      debugLog('Loading borrowed equipment by user:', userId)
      
      const { data, error } = await equipmentApi.getBorrowedByUser(userId)
      
      if (error) throw new Error(error)
      
      debugLog('Borrowed equipment loaded:', data?.length)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to load borrowed equipment:', error)
      return { success: false, error: error.message }
    }
  },

  // Clear current equipment
  clearCurrentEquipment: () => {
    set({ 
      currentEquipment: null,
      borrowHistory: []
    })
  },

  // Get equipment by ID from current list
  getEquipmentById: (id) => {
    const state = get()
    return state.equipment.find(item => item.id === parseInt(id))
  },

  // Get equipment overview statistics
  getEquipmentOverview: () => {
    const state = get()
    const equipment = state.equipment
    
    const totalValue = equipment.reduce((sum, e) => 
      sum + (e.current_value || e.purchase_price || 0), 0
    )
    
    return {
      total: equipment.length,
      available: equipment.filter(e => e.status === 'available').length,
      borrowed: equipment.filter(e => e.status === 'borrowed').length,
      inService: equipment.filter(e => e.status === 'service').length,
      retired: equipment.filter(e => e.status === 'retired').length,
      totalValue,
      categories: [...new Set(equipment.map(e => e.category))].filter(Boolean).length
    }
  }
}))

export default useEquipmentStore
