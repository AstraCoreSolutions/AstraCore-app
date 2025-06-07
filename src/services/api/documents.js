import { supabase } from '../supabase'
import { handleApiError } from '../utils/errorHandler'

/**
 * Documents API Service
 * Handles all document-related operations including file uploads
 */
export const documentsApi = {
  // Get all documents with optional filters
  async getAll(filters = {}) {
    try {
      let query = supabase
        .from('documents')
        .select(`
          *,
          project:projects(name),
          client:clients(name),
          supplier:suppliers(name),
          uploaded_by_user:profiles!documents_uploaded_by_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.project_id) {
        query = query.eq('project_id', filters.project_id)
      }
      if (filters.client_id) {
        query = query.eq('client_id', filters.client_id)
      }
      if (filters.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id)
      }
      if (filters.file_type) {
        query = query.eq('file_type', filters.file_type)
      }
      if (filters.is_public !== undefined) {
        query = query.eq('is_public', filters.is_public)
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch documents')
    }
  },

  // Get document by ID
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          project:projects(*),
          client:clients(*),
          supplier:suppliers(*),
          uploaded_by_user:profiles!documents_uploaded_by_fkey(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch document')
    }
  },

  // Create new document record
  async create(documentData) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .insert([{
          ...documentData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select(`
          *,
          project:projects(name),
          client:clients(name),
          supplier:suppliers(name),
          uploaded_by_user:profiles!documents_uploaded_by_fkey(first_name, last_name)
        `)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to create document record')
    }
  },

  // Update document
  async update(id, updates) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          project:projects(name),
          client:clients(name),
          supplier:suppliers(name),
          uploaded_by_user:profiles!documents_uploaded_by_fkey(first_name, last_name)
        `)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to update document')
    }
  },

  // Delete document
  async delete(id) {
    try {
      // First get the document to get file URL for deletion
      const { data: document } = await this.getById(id)
      
      if (document?.file_url) {
        // Extract file path from URL for storage deletion
        const filePath = document.file_url.split('/').pop()
        if (filePath) {
          await supabase.storage
            .from('documents')
            .remove([filePath])
        }
      }

      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { data: null, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to delete document')
    }
  },

  // Upload file to storage
  async uploadFile(file, folder = 'general') {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      return { 
        data: { 
          file_url: publicUrl, 
          file_path: filePath,
          file_name: fileName,
          original_name: file.name,
          file_size: file.size,
          file_type: file.type
        }, 
        error: null 
      }
    } catch (error) {
      return handleApiError(error, 'Failed to upload file')
    }
  },

  // Delete file from storage
  async deleteFile(filePath) {
    try {
      const { error } = await supabase.storage
        .from('documents')
        .remove([filePath])

      if (error) throw error
      return { data: null, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to delete file from storage')
    }
  },

  // Get documents by project
  async getByProject(projectId) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          uploaded_by_user:profiles!documents_uploaded_by_fkey(first_name, last_name)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch project documents')
    }
  },

  // Get documents by client
  async getByClient(clientId) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          project:projects(name),
          uploaded_by_user:profiles!documents_uploaded_by_fkey(first_name, last_name)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch client documents')
    }
  },

  // Get documents by supplier
  async getBySupplier(supplierId) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          uploaded_by_user:profiles!documents_uploaded_by_fkey(first_name, last_name)
        `)
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch supplier documents')
    }
  },

  // Get public documents
  async getPublic() {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          project:projects(name),
          uploaded_by_user:profiles!documents_uploaded_by_fkey(first_name, last_name)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch public documents')
    }
  },

  // Get document categories (for filters)
  async getCategories() {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('category')
        .not('category', 'is', null)

      if (error) throw error

      // Get unique categories
      const categories = [...new Set(data.map(doc => doc.category))].filter(Boolean)
      
      return { data: categories, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch document categories')
    }
  },

  // Search documents
  async search(searchTerm, filters = {}) {
    try {
      let query = supabase
        .from('documents')
        .select(`
          *,
          project:projects(name),
          client:clients(name),
          supplier:suppliers(name),
          uploaded_by_user:profiles!documents_uploaded_by_fkey(first_name, last_name)
        `)

      // Apply search
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
      }

      // Apply additional filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query = query.eq(key, value)
        }
      })

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to search documents')
    }
  }
}

export default documentsApi
