import { create } from 'zustand'
import { clientsApi } from '../services/api/clients'
import { debugLog, debugError } from '../utils/helpers'
import toast from 'react-hot-toast'

const useClientsStore = create((set, get) => ({
  // State
  clients: [],
  currentClient: null,
  clientProjects: [],
  clientInvoices: [],
  clientStats: null,
  cities: [],
  isLoading: false,
  error: null,
  filters: {
    search: '',
    type: '',
    city: '',
    status: 'active'
  },

  // Actions
  setFilters: (newFilters) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters }
    }))
    // Reload clients with new filters
    get().loadClients()
  },

  clearFilters: () => {
    set({
      filters: {
        search: '',
        type: '',
        city: '',
        status: 'active'
      }
    })
    get().loadClients()
  },

  // Load all clients
  loadClients: async (forceRefresh = false) => {
    const state = get()
    
    if (state.isLoading && !forceRefresh) return
    
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Loading clients with filters:', state.filters)
      
      const { data, error } = await clientsApi.getAll(state.filters)
      
      if (error) throw new Error(error)
      
      set({ 
        clients: data || [],
        isLoading: false 
      })
      
      debugLog('Clients loaded:', data?.length)
    } catch (error) {
      debugError('Failed to load clients:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error('Nepodařilo se načíst klienty')
    }
  },

  // Load single client
  loadClient: async (id) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Loading client:', id)
      
      const { data, error } = await clientsApi.getById(id)
      
      if (error) throw new Error(error)
      
      set({ 
        currentClient: data,
        isLoading: false 
      })
      
      debugLog('Client loaded:', data?.name)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to load client:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error('Nepodařilo se načíst klienta')
      return { success: false, error: error.message }
    }
  },

  // Create new client
  createClient: async (clientData) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Creating client:', clientData.name)
      
      const { data, error } = await clientsApi.create(clientData)
      
      if (error) throw new Error(error)
      
      // Add to clients list
      set(state => ({
        clients: [data, ...state.clients],
        isLoading: false
      }))
      
      toast.success('Klient byl úspěšně vytvořen')
      debugLog('Client created:', data.name)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to create client:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error('Nepodařilo se vytvořit klienta')
      return { success: false, error: error.message }
    }
  },

  // Update client
  updateClient: async (id, updates) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Updating client:', id)
      
      const { data, error } = await clientsApi.update(id, updates)
      
      if (error) throw new Error(error)
      
      // Update in clients list
      set(state => ({
        clients: state.clients.map(client => 
          client.id === id ? data : client
        ),
        currentClient: state.currentClient?.id === id ? data : state.currentClient,
        isLoading: false
      }))
      
      toast.success('Klient byl úspěšně aktualizován')
      debugLog('Client updated:', data.name)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to update client:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error('Nepodařilo se aktualizovat klienta')
      return { success: false, error: error.message }
    }
  },

  // Delete client
  deleteClient: async (id) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Deleting client:', id)
      
      const { data, error } = await clientsApi.delete(id)
      
      if (error) throw new Error(error)
      
      // Remove from clients list
      set(state => ({
        clients: state.clients.filter(client => client.id !== id),
        currentClient: state.currentClient?.id === id ? null : state.currentClient,
        isLoading: false
      }))
      
      toast.success('Klient byl úspěšně smazán')
      debugLog('Client deleted')
      return { success: true }
    } catch (error) {
      debugError('Failed to delete client:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error(error.message)
      return { success: false, error: error.message }
    }
  },

  // Load client statistics
  loadClientStats: async (id) => {
    try {
      debugLog('Loading client statistics:', id)
      
      const { data, error } = await clientsApi.getStatistics(id)
      
      if (error) throw new Error(error)
      
      set({ clientStats: data })
      
      debugLog('Client statistics loaded')
      return { success: true, data }
    } catch (error) {
      debugError('Failed to load client statistics:', error)
      return { success: false, error: error.message }
    }
  },

  // Load client projects
  loadClientProjects: async (id, filters = {}) => {
    try {
      debugLog('Loading client projects:', id)
      
      const { data, error } = await clientsApi.getProjects(id, filters)
      
      if (error) throw new Error(error)
      
      set({ clientProjects: data || [] })
      
      debugLog('Client projects loaded:', data?.length)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to load client projects:', error)
      return { success: false, error: error.message }
    }
  },

  // Load client invoices
  loadClientInvoices: async (id, filters = {}) => {
    try {
      debugLog('Loading client invoices:', id)
      
      const { data, error } = await clientsApi.getInvoices(id, filters)
      
      if (error) throw new Error(error)
      
      set({ clientInvoices: data || [] })
      
      debugLog('Client invoices loaded:', data?.length)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to load client invoices:', error)
      return { success: false, error: error.message }
    }
  },

  // Search clients
  searchClients: async (searchTerm, filters = {}) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Searching clients:', searchTerm)
      
      const { data, error } = await clientsApi.search(searchTerm, filters)
      
      if (error) throw new Error(error)
      
      set({ 
        clients: data || [],
        isLoading: false 
      })
      
      debugLog('Search results:', data?.length)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to search clients:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      return { success: false, error: error.message }
    }
  },

  // Load cities for filters
  loadCities: async () => {
    try {
      debugLog('Loading cities')
      
      const { data, error } = await clientsApi.getCities()
      
      if (error) throw new Error(error)
      
      set({ cities: data || [] })
      
      debugLog('Cities loaded:', data?.length)
    } catch (error) {
      debugError('Failed to load cities:', error)
    }
  },

  // Validate ICO
  validateICO: async (ico, excludeId = null) => {
    try {
      const { data, error } = await clientsApi.validateICO(ico, excludeId)
      
      if (error) throw new Error(error)
      
      return { success: true, data }
    } catch (error) {
      debugError('Failed to validate ICO:', error)
      return { success: false, error: error.message }
    }
  },

  // Clear current client
  clearCurrentClient: () => {
    set({ 
      currentClient: null,
      clientProjects: [],
      clientInvoices: [],
      clientStats: null
    })
  },

  // Get client by ID from current list
  getClientById: (id) => {
    const state = get()
    return state.clients.find(client => client.id === parseInt(id))
  },

  // Get clients statistics
  getClientsOverview: () => {
    const state = get()
    const clients = state.clients
    
    return {
      total: clients.length,
      active: clients.filter(c => c.status === 'active').length,
      inactive: clients.filter(c => c.status === 'inactive').length,
      companies: clients.filter(c => c.type === 'company').length,
      individuals: clients.filter(c => c.type === 'individual').length
    }
  }
}))

export default useClientsStore
