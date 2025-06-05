import { create } from 'zustand'
import { supabase, TABLES } from '../config/supabase.js'
import { PROJECT_STATUS } from '../utils/constants.js'
import { debugLog, debugError } from '../utils/helpers.js'

const useProjectsStore = create((set, get) => ({
  // State
  projects: [],
  currentProject: null,
  projectDiary: [],
  isLoading: false,
  error: null,
  filters: {
    status: '',
    client: '',
    manager: '',
    search: ''
  },
  
  // Actions
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => {
    debugError('Projects error:', error)
    set({ error })
  },
  
  clearError: () => set({ error: null }),
  
  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
  
  // Load all projects
  loadProjects: async (userId, userRole) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Loading projects for user:', userId, 'role:', userRole)
      
      let query = supabase
        .from(TABLES.PROJECTS)
        .select(`
          *,
          client:clients(id, name, email),
          manager:profiles!projects_manager_id_fkey(id, first_name, last_name)
        `)
        .order('created_at', { ascending: false })
      
      // Filter based on user role
      if (userRole === 'employee') {
        // Employee sees only assigned projects
        query = query.contains('assigned_employees', [userId])
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      debugLog('Projects loaded:', data?.length || 0)
      set({ projects: data || [], isLoading: false })
      
    } catch (error) {
      debugError('Failed to load projects:', error)
      set({ error: error.message, isLoading: false })
    }
  },
  
  // Load single project
  loadProject: async (projectId) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Loading project:', projectId)
      
      const { data, error } = await supabase
        .from(TABLES.PROJECTS)
        .select(`
          *,
          client:clients(id, name, email, phone, address),
          manager:profiles!projects_manager_id_fkey(id, first_name, last_name, email, phone),
          assigned_employees_data:profiles!inner(id, first_name, last_name, position)
        `)
        .eq('id', projectId)
        .single()
      
      if (error) throw error
      
      debugLog('Project loaded:', data)
      set({ currentProject: data, isLoading: false })
      
      return data
      
    } catch (error) {
      debugError('Failed to load project:', error)
      set({ error: error.message, isLoading: false })
      return null
    }
  },
  
  // Create new project
  createProject: async (projectData, creatorId) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Creating project:', projectData)
      
      const newProject = {
        ...projectData,
        status: PROJECT_STATUS.PLANNING,
        progress: 0,
        created_by: creatorId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from(TABLES.PROJECTS)
        .insert([newProject])
        .select(`
          *,
          client:clients(id, name, email),
          manager:profiles!projects_manager_id_fkey(id, first_name, last_name)
        `)
        .single()
      
      if (error) throw error
      
      debugLog('Project created:', data)
      
      // Add to projects list
      set(state => ({
        projects: [data, ...state.projects],
        isLoading: false
      }))
      
      return { success: true, project: data }
      
    } catch (error) {
      debugError('Failed to create project:', error)
      set({ error: error.message, isLoading: false })
      return { success: false, error: error.message }
    }
  },
  
  // Update project
  updateProject: async (projectId, updates) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Updating project:', projectId, updates)
      
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from(TABLES.PROJECTS)
        .update(updateData)
        .eq('id', projectId)
        .select(`
          *,
          client:clients(id, name, email),
          manager:profiles!projects_manager_id_fkey(id, first_name, last_name)
        `)
        .single()
      
      if (error) throw error
      
      debugLog('Project updated:', data)
      
      // Update in projects list
      set(state => ({
        projects: state.projects.map(p => p.id === projectId ? data : p),
        currentProject: state.currentProject?.id === projectId ? data : state.currentProject,
        isLoading: false
      }))
      
      return { success: true, project: data }
      
    } catch (error) {
      debugError('Failed to update project:', error)
      set({ error: error.message, isLoading: false })
      return { success: false, error: error.message }
    }
  },
  
  // Delete project
  deleteProject: async (projectId) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Deleting project:', projectId)
      
      const { error } = await supabase
        .from(TABLES.PROJECTS)
        .delete()
        .eq('id', projectId)
      
      if (error) throw error
      
      debugLog('Project deleted')
      
      // Remove from projects list
      set(state => ({
        projects: state.projects.filter(p => p.id !== projectId),
        currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
        isLoading: false
      }))
      
      return { success: true }
      
    } catch (error) {
      debugError('Failed to delete project:', error)
      set({ error: error.message, isLoading: false })
      return { success: false, error: error.message }
    }
  },
  
  // Load project diary entries
  loadProjectDiary: async (projectId) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Loading project diary for:', projectId)
      
      const { data, error } = await supabase
        .from(TABLES.PROJECT_DIARY)
        .select(`
          *,
          author:profiles(id, first_name, last_name)
        `)
        .eq('project_id', projectId)
        .order('entry_date', { ascending: false })
      
      if (error) throw error
      
      debugLog('Project diary loaded:', data?.length || 0, 'entries')
      set({ projectDiary: data || [], isLoading: false })
      
    } catch (error) {
      debugError('Failed to load project diary:', error)
      set({ error: error.message, isLoading: false })
    }
  },
  
  // Add diary entry
  addDiaryEntry: async (projectId, entryData, authorId) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Adding diary entry for project:', projectId)
      
      const newEntry = {
        project_id: projectId,
        author_id: authorId,
        ...entryData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from(TABLES.PROJECT_DIARY)
        .insert([newEntry])
        .select(`
          *,
          author:profiles(id, first_name, last_name)
        `)
        .single()
      
      if (error) throw error
      
      debugLog('Diary entry added:', data)
      
      // Add to diary entries
      set(state => ({
        projectDiary: [data, ...state.projectDiary],
        isLoading: false
      }))
      
      return { success: true, entry: data }
      
    } catch (error) {
      debugError('Failed to add diary entry:', error)
      set({ error: error.message, isLoading: false })
      return { success: false, error: error.message }
    }
  },
  
  // Update diary entry
  updateDiaryEntry: async (entryId, updates) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Updating diary entry:', entryId)
      
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from(TABLES.PROJECT_DIARY)
        .update(updateData)
        .eq('id', entryId)
        .select(`
          *,
          author:profiles(id, first_name, last_name)
        `)
        .single()
      
      if (error) throw error
      
      debugLog('Diary entry updated:', data)
      
      // Update in diary entries
      set(state => ({
        projectDiary: state.projectDiary.map(entry => 
          entry.id === entryId ? data : entry
        ),
        isLoading: false
      }))
      
      return { success: true, entry: data }
      
    } catch (error) {
      debugError('Failed to update diary entry:', error)
      set({ error: error.message, isLoading: false })
      return { success: false, error: error.message }
    }
  },
  
  // Get filtered projects
  getFilteredProjects: () => {
    const { projects, filters } = get()
    
    return projects.filter(project => {
      // Status filter
      if (filters.status && project.status !== filters.status) {
        return false
      }
      
      // Client filter
      if (filters.client && project.client_id !== filters.client) {
        return false
      }
      
      // Manager filter
      if (filters.manager && project.manager_id !== filters.manager) {
        return false
      }
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const searchFields = [
          project.name,
          project.description,
          project.client?.name,
          project.location
        ].filter(Boolean)
        
        const matchesSearch = searchFields.some(field => 
          field.toLowerCase().includes(searchLower)
        )
        
        if (!matchesSearch) return false
      }
      
      return true
    })
  },
  
  // Get project statistics
  getProjectStats: () => {
    const { projects } = get()
    
    return {
      total: projects.length,
      active: projects.filter(p => p.status === PROJECT_STATUS.ACTIVE).length,
      planning: projects.filter(p => p.status === PROJECT_STATUS.PLANNING).length,
      completed: projects.filter(p => p.status === PROJECT_STATUS.COMPLETED).length,
      overdue: projects.filter(p => 
        p.status === PROJECT_STATUS.ACTIVE && 
        p.end_date && 
        new Date(p.end_date) < new Date()
      ).length
    }
  },
  
  // Update project progress
  updateProgress: async (projectId, progress) => {
    return get().updateProject(projectId, { progress })
  },
  
  // Change project status
  changeStatus: async (projectId, status) => {
    const updates = { status }
    
    // If completing project, set progress to 100 and actual end date
    if (status === PROJECT_STATUS.COMPLETED) {
      updates.progress = 100
      updates.actual_end_date = new Date().toISOString()
    }
    
    return get().updateProject(projectId, updates)
  }
}))

export default useProjectsStore
