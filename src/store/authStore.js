import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../config/supabase.js'
import { USER_ROLES } from '../utils/constants.js'
import { debugLog, debugError } from '../utils/helpers.js'

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      // Actions
      setUser: (user) => {
        debugLog('Setting user:', user)
        set({ user, isAuthenticated: !!user })
      },
      
      setProfile: (profile) => {
        debugLog('Setting profile:', profile)
        set({ profile })
      },
      
      setLoading: (isLoading) => {
        set({ isLoading })
      },
      
      setError: (error) => {
        debugError('Auth error:', error)
        set({ error })
      },
      
      clearError: () => {
        set({ error: null })
      },
      
      // Initialize auth listener
      initialize: async () => {
        debugLog('Initializing auth store...')
        set({ isLoading: true, error: null })
        
        try {
          // Get current session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          
          if (sessionError) throw sessionError
          
          if (session?.user) {
            debugLog('Found existing session')
            await get().handleAuthChange('SIGNED_IN', session)
          } else {
            debugLog('No existing session')
            set({ isLoading: false })
          }
          
          // Listen for auth changes
          supabase.auth.onAuthStateChange(async (event, session) => {
            debugLog('Auth state changed:', event)
            await get().handleAuthChange(event, session)
          })
          
        } catch (error) {
          debugError('Failed to initialize auth:', error)
          set({ error: error.message, isLoading: false })
        }
      },
      
      // Handle auth state changes
      handleAuthChange: async (event, session) => {
        set({ isLoading: true, error: null })
        
        try {
          if (event === 'SIGNED_IN' && session?.user) {
            // Set user
            set({ user: session.user, isAuthenticated: true })
            
            // Load user profile
            await get().loadProfile(session.user.id)
            
          } else if (event === 'SIGNED_OUT') {
            // Clear user data
            set({ 
              user: null, 
              profile: null, 
              isAuthenticated: false 
            })
          }
        } catch (error) {
          debugError('Error handling auth change:', error)
          set({ error: error.message })
        } finally {
          set({ isLoading: false })
        }
      },
      
      // Load user profile from database
      loadProfile: async (userId) => {
        try {
          debugLog('Loading profile for user:', userId)
          
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
          
          if (error) {
            // If profile doesn't exist, create one
            if (error.code === 'PGRST116') {
              debugLog('Profile not found, creating default profile')
              await get().createDefaultProfile(userId)
              return
            }
            throw error
          }
          
          debugLog('Profile loaded:', profile)
          set({ profile })
          
        } catch (error) {
          debugError('Failed to load profile:', error)
          set({ error: error.message })
        }
      },
      
      // Create default profile for new user
      createDefaultProfile: async (userId) => {
        try {
          const { user } = get()
          if (!user) return
          
          const defaultProfile = {
            id: userId,
            email: user.email,
            first_name: user.user_metadata?.first_name || '',
            last_name: user.user_metadata?.last_name || '',
            role: USER_ROLES.EMPLOYEE, // Default role
            avatar_url: null,
            phone: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          const { data: profile, error } = await supabase
            .from('profiles')
            .insert([defaultProfile])
            .select()
            .single()
          
          if (error) throw error
          
          debugLog('Default profile created:', profile)
          set({ profile })
          
        } catch (error) {
          debugError('Failed to create default profile:', error)
          set({ error: error.message })
        }
      },
      
      // Sign in with email and password
      signIn: async (email, password) => {
        set({ isLoading: true, error: null })
        
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          })
          
          if (error) throw error
          
          debugLog('Sign in successful')
          return { success: true }
          
        } catch (error) {
          debugError('Sign in failed:', error)
          
          let errorMessage = 'Chyba při přihlášení'
          
          switch (error.message) {
            case 'Invalid login credentials':
              errorMessage = 'Neplatné přihlašovací údaje'
              break
            case 'Email not confirmed':
              errorMessage = 'E-mail nebyl potvrzen'
              break
            case 'Too many requests':
              errorMessage = 'Příliš mnoho pokusů. Zkuste to později.'
              break
            default:
              errorMessage = error.message
          }
          
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage }
        }
      },
      
      // Sign out
      signOut: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const { error } = await supabase.auth.signOut()
          if (error) throw error
          
          debugLog('Sign out successful')
          return { success: true }
          
        } catch (error) {
          debugError('Sign out failed:', error)
          set({ error: error.message, isLoading: false })
          return { success: false, error: error.message }
        }
      },
      
      // Create new user (admin only)
      createUser: async (userData) => {
        set({ isLoading: true, error: null })
        
        try {
          const { profile } = get()
          
          // Check if current user is admin
          if (!profile || profile.role !== USER_ROLES.ADMIN) {
            throw new Error('Nemáte oprávnění vytvářet uživatele')
          }
          
          // Create auth user
          const { data, error: authError } = await supabase.auth.admin.createUser({
            email: userData.email,
            password: userData.password,
            email_confirm: true,
            user_metadata: {
              first_name: userData.first_name,
              last_name: userData.last_name
            }
          })
          
          if (authError) throw authError
          
          // Create profile
          const profileData = {
            id: data.user.id,
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: userData.role,
            phone: userData.phone || null,
            position: userData.position || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([profileData])
          
          if (profileError) throw profileError
          
          debugLog('User created successfully:', data.user.id)
          set({ isLoading: false })
          return { success: true, user: data.user }
          
        } catch (error) {
          debugError('Failed to create user:', error)
          set({ error: error.message, isLoading: false })
          return { success: false, error: error.message }
        }
      },
      
      // Update profile
      updateProfile: async (updates) => {
        set({ isLoading: true, error: null })
        
        try {
          const { user, profile } = get()
          if (!user || !profile) throw new Error('Uživatel není přihlášen')
          
          const updateData = {
            ...updates,
            updated_at: new Date().toISOString()
          }
          
          const { data, error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', user.id)
            .select()
            .single()
          
          if (error) throw error
          
          debugLog('Profile updated:', data)
          set({ profile: data, isLoading: false })
          return { success: true }
          
        } catch (error) {
          debugError('Failed to update profile:', error)
          set({ error: error.message, isLoading: false })
          return { success: false, error: error.message }
        }
      },
      
      // Reset password
      resetPassword: async (email) => {
        set({ isLoading: true, error: null })
        
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
          })
          
          if (error) throw error
          
          debugLog('Password reset email sent')
          set({ isLoading: false })
          return { success: true }
          
        } catch (error) {
          debugError('Failed to send reset email:', error)
          set({ error: error.message, isLoading: false })
          return { success: false, error: error.message }
        }
      },
      
      // Get user role
      getUserRole: () => {
        const { profile } = get()
        return profile?.role || null
      },
      
      // Check if user is admin
      isAdmin: () => {
        const { profile } = get()
        return profile?.role === USER_ROLES.ADMIN
      },
      
      // Check if user is manager or admin
      isManagerOrAdmin: () => {
        const { profile } = get()
        return profile?.role === USER_ROLES.ADMIN || profile?.role === USER_ROLES.MANAGER
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

export default useAuthStore
