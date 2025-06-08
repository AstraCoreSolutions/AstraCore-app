import { supabase, TABLES } from '../../config/supabase.js'
import { debugLog, debugError } from '../../utils/helpers.js'

export const projectsAPI = {
  // Get all projects - OPRAVENO
  getProjects: async (userId, userRole) => {
    try {
      debugLog('Fetching projects for user:', userId, 'role:', userRole)
      
      let query = supabase
        .from(TABLES.PROJECTS)
        .select(`
          *,
          client:clients(id, name, email),
          manager:manager_id(id, first_name, last_name),
          creator:created_by(id, first_name, last_name)
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

  // Get single project - OPRAVENO
  getProject: async (projectId) => {
    try {
      debugLog('Fetching project:', projectId)
      
      const { data, error } = await supabase
        .from(TABLES.PROJECTS)
        .select(`
          *,
          client:clients(id, name, email, phone, address),
          manager:manager_id(id, first_name, last_name, email, phone),
          creator:created_by(id, first_name, last_name, email)
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

  // Create project - OPRAVENO
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
          manager:manager_id(id, first_name, last_name),
          creator:created_by(id, first_name, last_name)
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

  // Update project - OPRAVENO
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
          manager:manager_id(id, first_name, last_name),
          creator:created_by(id, first_name, last_name)
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
      debugLog('Fetching project diary for project:', projectId)
      
      const { data, error } = await supabase
        .from(TABLES.PROJECT_DIARY)
        .select(`
          *,
          author:author_id(id, first_name, last_name)
        `)
        .eq('project_id', projectId)
        .order('entry_date', { ascending: false })
      
      if (error) throw error
      
      debugLog('Project diary entries fetched:', data?.length || 0)
      return { success: true, entries: data || [] }
      
    } catch (error) {
      debugError('Failed to fetch project diary:', error)
      return { success: false, error: error.message }
    }
  },

  // Create diary entry
  createDiaryEntry: async (entryData, authorId) => {
    try {
      debugLog('Creating diary entry:', entryData)
      
      const newEntry = {
        ...entryData,
        author_id: authorId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from(TABLES.PROJECT_DIARY)
        .insert([newEntry])
        .select(`
          *,
          author:author_id(id, first_name, last_name)
        `)
        .single()
      
      if (error) throw error
      
      debugLog('Diary entry created:', data)
      return { success: true, entry: data }
      
    } catch (error) {
      debugError('Failed to create diary entry:', error)
      return { success: false, error: error.message }
    }
  },

  // Update diary entry
  updateDiaryEntry: async (entryId, updates) => {
    try {
      debugLog('Updating diary entry:', entryId, updates)
      
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
          author:author_id(id, first_name, last_name)
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
