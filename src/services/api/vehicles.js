import { supabase, TABLES } from '../../config/supabase.js'
import { debugLog, debugError } from '../../utils/helpers.js'

export const vehiclesAPI = {
  // Get all vehicles
  getVehicles: async () => {
    try {
      debugLog('Fetching vehicles...')
      
      const { data, error } = await supabase
        .from(TABLES.VEHICLES)
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      debugLog('Vehicles fetched:', data?.length || 0)
      return { success: true, vehicles: data || [] }
      
    } catch (error) {
      debugError('Failed to fetch vehicles:', error)
      return { success: false, error: error.message }
    }
  },

  // Add vehicle
  addVehicle: async (vehicleData) => {
    try {
      debugLog('Adding vehicle:', vehicleData)
      
      const newVehicle = {
        ...vehicleData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from(TABLES.VEHICLES)
        .insert([newVehicle])
        .select()
        .single()
      
      if (error) throw error
      
      debugLog('Vehicle added:', data)
      return { success: true, vehicle: data }
      
    } catch (error) {
      debugError('Failed to add vehicle:', error)
      return { success: false, error: error.message }
    }
  },

  // Update vehicle
  updateVehicle: async (vehicleId, updates) => {
    try {
      debugLog('Updating vehicle:', vehicleId, updates)
      
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from(TABLES.VEHICLES)
        .update(updateData)
        .eq('id', vehicleId)
        .select()
        .single()
      
      if (error) throw error
      
      debugLog('Vehicle updated:', data)
      return { success: true, vehicle: data }
      
    } catch (error) {
      debugError('Failed to update vehicle:', error)
      return { success: false, error: error.message }
    }
  },

  // Delete vehicle
  deleteVehicle: async (vehicleId) => {
    try {
      debugLog('Deleting vehicle:', vehicleId)
      
      const { error } = await supabase
        .from(TABLES.VEHICLES)
        .delete()
        .eq('id', vehicleId)
      
      if (error) throw error
      
      debugLog('Vehicle deleted')
      return { success: true }
      
    } catch (error) {
      debugError('Failed to delete vehicle:', error)
      return { success: false, error: error.message }
    }
  }
}

export default vehiclesAPI
