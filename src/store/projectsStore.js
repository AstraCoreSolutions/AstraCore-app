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
  
  // Load all projects - BEZ JOINŮ
  loadProjects: async (userId, userRole) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Loading projects for user:', userId, 'role:', userRole)
      
      let query = supabase
        .from(TABLES.PROJECTS)
        .select('*')
        .order('created_at', { ascending: false })
      
      // Filter based on user role
      if (userRole === 'employee') {
        // Employee sees only assigned projects
        query = query.contains('assigned_employees', [userId])
      }
      
      const { data: projects, error } = await query
      
      if (error) throw error
      
      // Load related data separately
      const projectsWithRelations = await Promise.all(
        (projects || []).map(async (project) => {
          // Load client
          let client = null
          if (project.client_id) {
            const { data: clientData } = await supabase
              .from('clients')
              .select('id, name, email')
              .eq('id', project.client_id)
              .single()
            client = clientData
          }
          
          // Load manager
          let manager = null
          if (project.manager_id) {
            const { data: managerData } = await supabase
              .from('profiles')
              .select('id, first_name, last_name')
              .eq('id', project.manager_id)
              .single()
            manager = managerData
          }
          
          // Load creator
          let creator = null
          if (project.created_by) {
            const { data: creatorData } = await supabase
              .from('profiles')
              .select('id, first_name, last_name')
              .eq('id', project.created_by)
              .single()
            creator = creatorData
          }
          
          return {
            ...project,
            client,
            manager,
            creator
          }
        })
      )
      
      debugLog('Projects loaded:', projectsWithRelations?.length || 0)
      set({ projects: projectsWithRelations || [], isLoading: false })
      
    } catch (error) {
      debugError('Failed to load projects:', error)
      set({ error: error.message, isLoading: false })
    }
  },
  
  // Load single project - BEZ JOINŮ
  loadProject: async (projectId) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Loading project:', projectId)
      
      const { data: project, error } = await supabase
        .from(TABLES.PROJECTS)
        .select('*')
        .eq('id', projectId)
        .single()
      
      if (error) throw error
      
      // Load related data separately
      let client = null
      if (project.client_id) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('id, name, email, phone, address')
          .eq('id', project.client_id)
          .single()
        client = clientData
      }
      
      let manager = null
      if (project.manager_id) {
        const { data: managerData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, phone')
          .eq('id', project.manager_id)
          .single()
        manager = managerData
      }
      
      let creator = null
      if (project.created_by) {
        const { data: creatorData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .eq('id', project.created_by)
          .single()
        creator = creatorData
      }
      
      // Load assigned employees if they exist
      let assigned_employees_data = []
      if (project.assigned_employees && project.assigned_employees.length > 0) {
        const { data: employeesData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, position')
          .in('id', project.assigned_employees)
        assigned_employees_data = employeesData || []
      }
      
      const projectWithRelations = {
        ...project,
        client,
        manager,
        creator,
        assigned_employees_data
      }
      
      debugLog('Project loaded:', projectWithRelations)
      set({ currentProject: projectWithRelations, isLoading: false })
      
      return projectWithRelations
      
    } catch (error) {
      debugError('Failed to load project:', error)
      set({ error: error.message, isLoading: false })
      return null
    }
  },
  
  // Create new project - BEZ JOINŮ
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
      
      const { data: project, error } = await supabase
        .from(TABLES.PROJECTS)
        .insert([newProject])
        .select('*')
        .single()
      
      if (error) throw error
      
      // Load related data separately
      let client = null
      if (project.client_id) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('id, name, email')
          .eq('id', project.client_id)
          .single()
        client = clientData
      }
      
      let manager = null
      if (project.manager_id) {
        const { data: managerData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('id', project.manager_id)
          .single()
        manager = managerData
      }
      
      let creator = null
      if (project.created_by) {
        const { data: creatorData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('id', project.created_by)
          .single()
        creator = creatorData
      }
      
      const projectWithRelations = {
        ...project,
        client,
        manager,
        creator
      }
      
      debugLog('Project created:', projectWithRelations)
      
      // Add to projects list
      set(state => ({
        projects: [projectWithRelations, ...state.projects],
        isLoading: false
      }))
      
      return { success: true, project: projectWithRelations }
      
    } catch (error) {
      debugError('Failed to create project:', error)
      set({ error: error.message, isLoading: false })
      return { success: false, error: error.message }
    }
  },
  
  // Update project - BEZ JOINŮ
  updateProject: async (projectId, updates) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Updating project:', projectId, updates)
      
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }
      
      const { data: project, error } = await supabase
        .from(TABLES.PROJECTS)
        .update(updateData)
        .eq('id', projectId)
        .select('*')
        .single()
      
      if (error) throw error
      
      // Load related data separately
      let client = null
      if (project.client_id) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('id, name, email')
          .eq('id', project.client_id)
          .single()
        client = clientData
      }
      
      let manager = null
      if (project.manager_id) {
        const { data: managerData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('id', project.manager_id)
          .single()
        manager = managerData
      }
      
      let creator = null
      if (project.created_by) {
        const { data: creatorData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('id', project.created_by)
          .single()
        creator = creatorData
      }
      
      const projectWithRelations = {
        ...project,
        client,
        manager,
        creator
      }
      
      debugLog('Project updated:', projectWithRelations)
      
      // Update in projects list
      set(state => ({
        projects: state.projects.map(p => p.id === projectId ? projectWithRelations : p),
        currentProject: state.currentProject?.id === projectId ? projectWithRelations : state.currentProject,
        isLoading: false
      }))
      
      return { success: true, project: projectWithRelations }
      
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
  
  // Load project diary entries - BEZ JOINŮ
  loadProjectDiary: async (projectId) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Loading project diary for:', projectId)
      
      const { data: entries, error } = await supabase
        .from(TABLES.PROJECT_DIARY)
        .select('*')
        .eq('project_id', projectId)
        .order('entry_date', { ascending: false })
      
      if (error) throw error
      
      // Load authors separately
      const entriesWithAuthors = await Promise.all(
        (entries || []).map(async (entry) => {
          let author = null
          if (entry.author_id) {
            const { data: authorData } = await supabase
              .from('profiles')
              .select('id, first_name, last_name')
              .eq('id', entry.author_id)
              .single()
            author = authorData
          }
          
          return {
            ...entry,
            author
          }
        })
      )
      
      debugLog('Project diary loaded:', entriesWithAuthors?.length || 0, 'entries')
      set({ projectDiary: entriesWithAuthors || [], isLoading: false })
      
    } catch (error) {
      debugError('Failed to load project diary:', error)
      set({ error: error.message, isLoading: false })
    }
  },
  
  // Add diary entry - BEZ JOINŮ
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
      
      const { data: entry, error } = await supabase
        .from(TABLES.PROJECT_DIARY)
        .insert([newEntry])
        .select('*')
        .single()
      
      if (error) throw error
      
      // Load author separately
      let author = null
      if (entry.author_id) {
        const { data: authorData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('id', entry.author_id)
          .single()
        author = authorData
      }
      
      const entryWithAuthor = {
        ...entry,
        author
      }
      
      debugLog('Diary entry added:', entryWithAuthor)
      
      // Add to diary entries
      set(state => ({
        projectDiary: [entryWithAuthor, ...state.projectDiary],
        isLoading: false
      }))
      
      return { success: true, entry: entryWithAuthor }
      
    } catch (error) {
      debugError('Failed to add diary entry:', error)
      set({ error: error.message, isLoading: false })
      return { success: false, error: error.message }
    }
  },
  
  // Update diary entry - BEZ JOINŮ
  updateDiaryEntry: async (entryId, updates) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Updating diary entry:', entryId, updates)
      
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }
      
      const { data: entry, error } = await supabase
        .from(TABLES.PROJECT_DIARY)
        .update(updateData)
        .eq('id', entryId)
        .select('*')
        .single()
      
      if (error) throw error
      
      // Load author separately
      let author = null
      if (entry.author_id) {
        const { data: authorData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('id', entry.author_id)
          .single()
        author = authorData
      }
      
      const entryWithAuthor = {
        ...entry,
        author
      }
      
      debugLog('Diary entry updated:', entryWithAuthor)
      
      // Update in diary entries
      set(state => ({
        projectDiary: state.projectDiary.map(e => 
          e.id === entryId ? entryWithAuthor : e
        ),
        isLoading: false
      }))
      
      return { success: true, entry: entryWithAuthor }
      
    } catch (error) {
      debugError('Failed to update diary entry:', error)
      set({ error: error.message, isLoading: false })
      return { success: false, error: error.message }
    }
  },
  
  // Delete diary entry
  deleteDiaryEntry: async (entryId) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Deleting diary entry:', entryId)
      
      const { error } = await supabase
        .from(TABLES.PROJECT_DIARY)
        .delete()
        .eq('id', entryId)
      
      if (error) throw error
      
      debugLog('Diary entry deleted')
      
      // Remove from diary entries
      set(state => ({
        projectDiary: state.projectDiary.filter(e => e.id !== entryId),
        isLoading: false
      }))
      
      return { success: true }
      
    } catch (error) {
      debugError('Failed to delete diary entry:', error)
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
