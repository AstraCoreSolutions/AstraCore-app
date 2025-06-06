import { supabase } from '../../config/supabase.js'
import { debugLog, debugError } from '../../utils/helpers.js'

export const authAPI = {
  // Sign in user
  signIn: async (email, password) => {
    try {
      debugLog('Signing in user:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      debugLog('Sign in successful')
      return { success: true, data }
      
    } catch (error) {
      debugError('Sign in failed:', error)
      return { success: false, error: error.message }
    }
  },

  // Sign out user
  signOut: async () => {
    try {
      debugLog('Signing out user')
      
      const { error } = await supabase.auth.signOut()
      
      if (error) throw error
      
      debugLog('Sign out successful')
      return { success: true }
      
    } catch (error) {
      debugError('Sign out failed:', error)
      return { success: false, error: error.message }
    }
  },

  // Get current session
  getSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) throw error
      
      return { success: true, session }
      
    } catch (error) {
      debugError('Get session failed:', error)
      return { success: false, error: error.message }
    }
  },

  // Get current user
  getUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) throw error
      
      return { success: true, user }
      
    } catch (error) {
      debugError('Get user failed:', error)
      return { success: false, error: error.message }
    }
  },

  // Reset password
  resetPassword: async (email) => {
    try {
      debugLog('Resetting password for:', email)
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      
      if (error) throw error
      
      debugLog('Password reset email sent')
      return { success: true }
      
    } catch (error) {
      debugError('Password reset failed:', error)
      return { success: false, error: error.message }
    }
  },

  // Update password
  updatePassword: async (newPassword) => {
    try {
      debugLog('Updating password')
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) throw error
      
      debugLog('Password updated successfully')
      return { success: true }
      
    } catch (error) {
      debugError('Password update failed:', error)
      return { success: false, error: error.message }
    }
  },

  // Create user (admin only)
  createUser: async (userData) => {
    try {
      debugLog('Creating user:', userData.email)
      
      // This would need admin privileges in production
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
      
      debugLog('User created successfully')
      return { success: true, user: data.user }
      
    } catch (error) {
      debugError('User creation failed:', error)
      return { success: false, error: error.message }
    }
  },

  // Update user metadata
  updateUser: async (updates) => {
    try {
      debugLog('Updating user metadata')
      
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      })
      
      if (error) throw error
      
      debugLog('User metadata updated')
      return { success: true, user: data.user }
      
    } catch (error) {
      debugError('User metadata update failed:', error)
      return { success: false, error: error.message }
    }
  }
}

export default authAPI
