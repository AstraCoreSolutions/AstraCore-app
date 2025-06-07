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
      initialized: false,
      
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
        const { initialized } = get()
        if (initialized) {
          debugLog('Auth already initialized')
          return
        }
        
        debugLog('Initializing auth store...')
        set({ isLoading: true, error: null })
        
        try {
          // Add timeout to prevent infinite loading
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Initialization timeout after 10 seconds')), 10000)
          })
          
          const initPromise = async () => {
            // Get current session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()
            
            if (sessionError) throw sessionError
            
            if (session?.user) {
              debugLog('Found existing session for user:', session.user.email)
              set({ 
                user: session.user, 
                isAuthenticated: true,
                isLoading: false,
                initialized: true
              })
              
              // Load profile separately without blocking initialization
              get().loadProfile(session.user.id).catch(error => {
                debugError('Failed to load profile during init:', error)
              })
              
            } else {
              debugLog('No existing session found')
              set({ 
                isLoading: false,
                initialized: true 
              })
            }
          }
          
          await Promise.race([initPromise(), timeoutPromise])
          
          // Listen for auth changes AFTER successful initialization
          supabase.auth.onAuthStateChange(async (event, session) => {
            debugLog('Auth state changed:', event)
            try {
              await get().handleAuthChange(event, session)
            } catch (error) {
              debugError('Error in auth state change handler:', error)
            }
          })
          
        } catch (error) {
          debugError('Failed to initialize auth:', error)
          set({ 
            error: error.message, 
            isLoading: false,
            initialized: true // Mark as initialized even on error to prevent retries
          })
        }
      },
      
      // Handle auth state changes
      handleAuthChange: async (event, session) => {
        debugLog('Handling auth change:', event, session?.user?.email)
        
        try {
          if (event === 'SIGNED_IN' && session?.user) {
            set({ 
              user: session.user, 
              isAuthenticated: true,
              error: null
            })
            
            // Load profile
            await get().loadProfile(session.user.id)
            
          } else if (event === 'SIGNED_OUT') {
            set({ 
              user: null, 
              profile: null, 
              isAuthenticated: false,
              error: null
            })
          }
        } catch (error) {
          debugError('Error handling auth change:', error)
          set({ error: error.message })
        }
      },
      
      // Load user profile from database
      loadProfile: async (userId) => {
        if (!userId) {
          debugError('No userId provided to loadProfile')
          return
        }
        
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
          
          debugLog('Profile loaded successfully:', profile?.email)
          set({ profile })
          
        } catch (error) {
          debugError('Failed to load profile:', error)
          // Don't set error state for profile loading failures during init
          // set({ error: error.message })
        }
      },
      
      // Create default profile for new user
      createDefaultProfile: async (userId) => {
        try {
          const { user } = get()
          if (!user) {
            debugError('No user found for creating default profile')
            return
          }
          
          debugLog('Creating default profile for user:', user.email)
          
          const defaultProfile = {
            id: userId,
            email: user.email,
            first_name: user.user_metadata?.first_name || '',
            last_name: user.user_metadata?.last_name || '',
            role: USER_ROLES.EMPLOYEE, // Default role
            avatar_url: null,
            phone: null,
            position: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          const { data: profile, error } = await supabase
            .from('profiles')
            .insert([defaultProfile])
            .select()
            .single()
          
          if (error) throw error
          
          debugLog('Default profile created successfully')
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
          debugLog('Attempting sign in for:', email)
          
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password
          })
          
          if (error) throw error
          
          debugLog('Sign in successful')
          set({ isLoading: false })
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
          set({ isLoading: false })
          return { success: true }
          
        } catch (error) {
          debugError('Sign out failed:', error)
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
          
          debugLog('Profile updated successfully')
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
