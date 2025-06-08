import { supabase, TABLES } from '../../config/supabase.js'
import { debugLog, debugError } from '../../utils/helpers.js'

export const projectsAPI = {
  // Get all projects - BEZ JOINŮ
  getProjects: async (userId, userRole) => {
    try {
      debugLog('Fetching projects for user:', userId, 'role:', userRole)
      
      let query = supabase
        .from(TABLES.PROJECTS)
        .select('*')
        .order('created_at', { ascending: false })
      
      // Filter based on user role
      if (userRole === 'employee') {
        query = query.contains('assigned_employees', [userId])
      }
      
      const { data: projects, error } = await query
      
      if (error) throw error
      
      // Separately load related data
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
          
          return {
            ...project,
            client,
            manager
          }
        })
      )
      
      debugLog('Projects fetched:', projectsWithRelations?.length || 0)
      return { success: true, projects: projectsWithRelations }
      
    } catch (error) {
      debugError('Failed to fetch projects:', error)
      return { success: false, error: error.message }
    }
  },

  // Get single project - BEZ JOINŮ
  getProject: async (projectId) => {
    try {
      debugLog('Fetching project:', projectId)
      
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
      
      const projectWithRelations = {
        ...project,
        client,
        manager
      }
      
      debugLog('Project fetched:', projectWithRelations)
      return { success: true, project: projectWithRelations }
      
    } catch (error) {
      debugError('Failed to fetch project:', error)
      return { success: false, error: error.message }
    }
  },

  // Create project - BEZ JOINŮ
  createProject: async (projectData, creatorId) => {
    try {
      debugLog('Creating project:', projectData)
      
      const newProject = {
        ...projectData,
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
      
      // Load related data
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
      
      const projectWithRelations = {
        ...project,
        client,
        manager
      }
      
      debugLog('Project created:', projectWithRelations)
      return { success: true, project: projectWithRelations }
      
    } catch (error) {
      debugError('Failed to create project:', error)
      return { success: false, error: error.message }
    }
  },

  // Update project - BEZ JOINŮ
  updateProject: async (projectId, updates) => {
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
      
      // Load related data
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
      
      const projectWithRelations = {
        ...project,
        client,
        manager
      }
      
      debugLog('Project updated:', projectWithRelations)
      return { success: true, project: projectWithRelations }
      
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

  // Get project diary entries - BEZ JOINŮ
  getProjectDiary: async (projectId) => {
    try {
      debugLog('Fetching project diary for project:', projectId)
      
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
      
      debugLog('Project diary entries fetched:', entriesWithAuthors?.length || 0)
      return { success: true, entries: entriesWithAuthors }
      
    } catch (error) {
      debugError('Failed to fetch project diary:', error)
      return { success: false, error: error.message }
    }
  },

  // Create diary entry - BEZ JOINŮ
  createDiaryEntry: async (entryData, authorId) => {
    try {
      debugLog('Creating diary entry:', entryData)
      
      const newEntry = {
        ...entryData,
        author_id: authorId,
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
      
      debugLog('Diary entry created:', entryWithAuthor)
      return { success: true, entry: entryWithAuthor }
      
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
      return { success: true, entry: entryWithAuthor }
      
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
