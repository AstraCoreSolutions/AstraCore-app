import { supabase, TABLES } from '../../config/supabase.js'
import { debugLog, debugError } from '../../utils/helpers.js'

export const projectsAPI = {
  // Get all projects
  getProjects: async (userId, userRole) => {
    try {
      debugLog('Fetching projects for user:', userId, 'role:', userRole)
      
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
        query = query.contains('assigned_employees', [userId])
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      debugLog('Projects fetched:', data?.length || 0)
      return { success: true, projects: data || [] }
      
    } catch (error) {
      debugError('Failed to fetch projects:', error)
      return { success: false, error: error.message }
    }
  },

  // Get single project
  getProject: async (projectId) => {
    try {
      debugLog('Fetching project:', projectId)
      
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
      
      debugLog('Project fetched:', data)
      return { success: true, project: data }
      
    } catch (error) {
      debugError('Failed to fetch project:', error)
      return { success: false, error: error.message }
    }
  },

  // Create project
  createProject: async (projectData, creatorId) => {
    try {
      debugLog('Creating project:', projectData)
      
      const newProject = {
        ...projectData,
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
      return { success: true, project: data }
      
    } catch (error) {
      debugError('Failed to create project:', error)
      return { success: false, error: error.message }
    }
  },

  // Update project
  updateProject: async (projectId, updates) => {
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
      return { success: true, project: data }
      
    } catch (error) {
      debugError('Failed to update project:', error)
      return { success: false, error: error.message }
    }
  },

  // Delete project
  deleteProject: async (projectId) => {
    try {
      debugLog('Deleting project:', projectId)
      
      const { error } = await supabase
        .from(TABLES.PROJECTS)
        .delete()
        .eq('id', projectId)
      
      if (error) throw error
      
      debugLog('Project deleted')
      return { success: true }
      
    } catch (error) {
      debugError('Failed to delete project:', error)
      return { success: false, error: error.message }
    }
  },

  // Get project diary entries
  getProjectDiary: async (projectId) => {
    try {
      debugLog('Fetching project diary for:', projectId)
      
      const { data, error } = await supabase
        .from(TABLES.PROJECT_DIARY)
        .select(`
          *,
          author:profiles(id, first_name, last_name)
        `)
        .eq('project_id', projectId)
        .order('entry_date', { ascending: false })
      
      if (error) throw error
      
      debugLog('Project diary fetched:', data?.length || 0, 'entries')
      return { success: true, entries: data || [] }
      
    } catch (error) {
      debugError('Failed to fetch project diary:', error)
      return { success: false, error: error.message }
    }
  },

  // Add diary entry
  addDiaryEntry: async (projectId, entryData, authorId) => {
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
      return { success: true, entry: data }
      
    } catch (error) {
      debugError('Failed to add diary entry:', error)
      return { success: false, error: error.message }
    }
  },

  // Update diary entry
  updateDiaryEntry: async (entryId, updates) => {
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
      return { success: true, entry: data }
      
    } catch (error) {
      debugError('Failed to update diary entry:', error)
      return { success: false, error: error.message }
    }
  },

  // Delete diary entry
  deleteDiaryEntry: async (entryId) => {
    try {
      debugLog('Deleting diary entry:', entryId)
      
      const { error } = await supabase
        .from(TABLES.PROJECT_DIARY)
        .delete()
        .eq('id', entryId)
      
      if (error) throw error
      
      debugLog('Diary entry deleted')
      return { success: true }
      
    } catch (error) {
      debugError('Failed to delete diary entry:', error)
      return { success: false, error: error.message }
    }
  },

  // Get project statistics
  getProjectStats: async (userId, userRole) => {
    try {
      debugLog('Fetching project statistics')
      
      let query = supabase
        .from(TABLES.PROJECTS)
        .select('id, status, end_date, created_at')
      
      if (userRole === 'employee') {
        query = query.contains('assigned_employees', [userId])
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      const now = new Date()
      const stats = {
        total: data.length,
        active: data.filter(p => p.status === 'active').length,
        planning: data.filter(p => p.status === 'planning').length,
        completed: data.filter(p => p.status === 'completed').length,
        overdue: data.filter(p => 
          p.status === 'active' && 
          p.end_date && 
          new Date(p.end_date) < now
        ).length
      }
      
      debugLog('Project statistics:', stats)
      return { success: true, stats }
      
    } catch (error) {
      debugError('Failed to fetch project statistics:', error)
      return { success: false, error: error.message }
    }
  }
}

export default projectsAPI
