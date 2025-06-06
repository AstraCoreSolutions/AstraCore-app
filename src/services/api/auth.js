import { supabase } from '../../config/supabase.js'
import { debugLog, debugError } from '../../utils/helpers.js'

export const authAPI = {
  // Sign in user
  signIn: async (email, password) => {
    try {
      debugLog('API: Signing in user:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      debugLog('API: Sign in successful')
      return { success: true, data }
      
    } catch (error) {
      debugError('API: Sign in failed:', error)
      return { success: false, error: error.message }
    }
  },

  // Sign out user
  signOut: async () => {
    try {
      debugLog('API: Signing out user')
      
      const { error } = await supabase.auth.signOut()
      
      if (error) throw error
      
      debugLog('API: Sign out successful')
      return { success: true }
      
    } catch (error) {
      debugError('API: Sign out failed:', error)
      return { success: false, error: error.message }
    }
  },

  // Get current session
  getSession: async () => {
    try {
      const { data, error } = await supabase.auth.getSession()
      
      if (error) throw error
      
      return { success: true, session: data.session }
      
    } catch (error) {
      debugError('API: Get session failed:', error)
      return { success: false, error: error.message }
    }
  },

  // Reset password
  resetPassword: async (email) => {
    try {
      debugLog('API: Resetting password for:', email)
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      
      if (error) throw error
      
      debugLog('API: Password reset email sent')
      return { success: true }
      
    } catch (error) {
      debugError('API: Password reset failed:', error)
      return { success: false, error: error.message }
    }
  },

  // Update password
  updatePassword: async (newPassword) => {
    try {
      debugLog('API: Updating password')
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) throw error
      
      debugLog('API: Password updated successfully')
      return { success: true }
      
    } catch (error) {
      debugError('API: Password update failed:', error)
      return { success: false, error: error.message }
    }
  },

  // Create new user (admin only)
  createUser: async (userData) => {
    try {
      debugLog('API: Creating new user:', userData.email)
      
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          first_name: userData.first_name,
          last_name: userData.last_name
        }
      })
      
      if (error) throw error
      
      debugLog('API: User created successfully')
      return { success: true, user: data.user }
      
    } catch (error) {
      debugError('API: User creation failed:', error)
      return { success: false, error: error.message }
    }
  },

  // Get user profile
  getProfile: async (userId) => {
    try {
      debugLog('API: Getting profile for user:', userId)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      
      debugLog('API: Profile retrieved successfully')
      return { success: true, profile: data }
      
    } catch (error) {
      debugError('API: Get profile failed:', error)
      return { success: false, error: error.message }
    }
  },

  // Update user profile
  updateProfile: async (userId, updates) => {
    try {
      debugLog('API: Updating profile for user:', userId)
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()
      
      if (error) throw error
      
      debugLog('API: Profile updated successfully')
      return { success: true, profile: data }
      
    } catch (error) {
      debugError('API: Profile update failed:', error)
      return { success: false, error: error.message }
    }
  },

  // Create user profile
  createProfile: async (profileData) => {
    try {
      debugLog('API: Creating profile:', profileData.id)
      
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          ...profileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (error) throw error
      
      debugLog('API: Profile created successfully')
      return { success: true, profile: data }
      
    } catch (error) {
      debugError('API: Profile creation failed:', error)
      return { success: false, error: error.message }
    }
  },

  // Get all users (admin only)
  getUsers: async () => {
    try {
      debugLog('API: Getting all users')
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      debugLog('API: Users retrieved successfully:', data.length)
      return { success: true, users: data }
      
    } catch (error) {
      debugError('API: Get users failed:', error)
      return { success: false, error: error.message }
    }
  },

  // Delete user (admin only)
  deleteUser: async (userId) => {
    try {
      debugLog('API: Deleting user:', userId)
      
      // First delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)
      
      if (profileError) throw profileError
      
      // Then delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)
      
      if (authError) throw authError
      
      debugLog('API: User deleted successfully')
      return { success: true }
      
    } catch (error) {
      debugError('API: User deletion failed:', error)
      return { success: false, error: error.message }
    }
  }
}

export default authAPI
