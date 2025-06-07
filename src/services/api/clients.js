import { supabase, TABLES } from '../../config/supabase.js'
import { debugLog, debugError } from '../../utils/helpers.js'

export const clientsAPI = {
  // Get all clients
  getClients: async () => {
    try {
      debugLog('Fetching clients...')
      
      const { data, error } = await supabase
        .from(TABLES.CLIENTS)
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      debugLog('Clients fetched:', data?.length || 0)
      return { success: true, clients: data || [] }
      
    } catch (error) {
      debugError('Failed to fetch clients:', error)
      return { success: false, error: error.message }
    }
  },

  // Add client
  addClient: async (clientData) => {
    try {
      debugLog('Adding client:', clientData)
      
      const newClient = {
        ...clientData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from(TABLES.CLIENTS)
        .insert([newClient])
        .select()
        .single()
      
      if (error) throw error
      
      debugLog('Client added:', data)
      return { success: true, client: data }
      
    } catch (error) {
      debugError('Failed to add client:', error)
      return { success: false, error: error.message }
    }
  },

  // Update client
  updateClient: async (clientId, updates) => {
    try {
      debugLog('Updating client:', clientId, updates)
      
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from(TABLES.CLIENTS)
        .update(updateData)
        .eq('id', clientId)
        .select()
        .single()
      
      if (error) throw error
      
      debugLog('Client updated:', data)
      return { success: true, client: data }
      
    } catch (error) {
      debugError('Failed to update client:', error)
      return { success: false, error: error.message }
    }
  },

  // Delete client
  deleteClient: async (clientId) => {
    try {
      debugLog('Deleting client:', clientId)
      
      const { error } = await supabase
        .from(TABLES.CLIENTS)
        .delete()
        .eq('id', clientId)
      
      if (error) throw error
      
      debugLog('Client deleted')
      return { success: true }
      
    } catch (error) {
      debugError('Failed to delete client:', error)
      return { success: false, error: error.message }
    }
  },

  // Get client projects
  getClientProjects: async (clientId) => {
    try {
      debugLog('Fetching client projects:', clientId)
      
      const { data, error } = await supabase
        .from(TABLES.PROJECTS)
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      debugLog('Client projects fetched:', data?.length || 0)
      return { success: true, projects: data || [] }
      
    } catch (error) {
      debugError('Failed to fetch client projects:', error)
      return { success: false, error: error.message }
    }
  }
}

export default clientsAPI
