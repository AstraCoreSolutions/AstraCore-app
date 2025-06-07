import { supabase } from '../config/supabase.js'
import { debugLog, debugError } from '../utils/helpers.js'

export const uploadService = {
  // Upload file to Supabase Storage
  uploadFile: async (file, bucket = 'documents', path = '') => {
    try {
      debugLog('Uploading file:', file.name, 'to bucket:', bucket)
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = path ? `${path}/${fileName}` : fileName
      
      // Upload file
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (error) throw error
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)
      
      debugLog('File uploaded successfully:', publicUrl)
      
      return {
        success: true,
        data: {
          path: data.path,
          publicUrl,
          fileName,
          fileSize: file.size,
          fileType: file.type
        }
      }
      
    } catch (error) {
      debugError('Failed to upload file:', error)
      return { success: false, error: error.message }
    }
  },

  // Upload multiple files
  uploadFiles: async (files, bucket = 'documents', path = '') => {
    try {
      debugLog('Uploading multiple files:', files.length)
      
      const uploadPromises = Array.from(files).map(file => 
        uploadService.uploadFile(file, bucket, path)
      )
      
      const results = await Promise.all(uploadPromises)
      const successful = results.filter(r => r.success)
      const failed = results.filter(r => !r.success)
      
      debugLog('Upload results:', { successful: successful.length, failed: failed.length })
      
      return {
        success: failed.length === 0,
        successful: successful.map(r => r.data),
        failed: failed.map(r => r.error),
        total: files.length
      }
      
    } catch (error) {
      debugError('Failed to upload files:', error)
      return { success: false, error: error.message }
    }
  },

  // Delete file
  deleteFile: async (filePath, bucket = 'documents') => {
    try {
      debugLog('Deleting file:', filePath, 'from bucket:', bucket)
      
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath])
      
      if (error) throw error
      
      debugLog('File deleted successfully')
      return { success: true }
      
    } catch (error) {
      debugError('Failed to delete file:', error)
      return { success: false, error: error.message }
    }
  },

  // Validate file
  validateFile: (file, options = {}) => {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB
      allowedTypes = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'xls', 'xlsx']
    } = options
    
    const errors = []
    
    // Check file size
    if (file.size > maxSize) {
      errors.push(`Soubor je příliš velký. Maximální velikost je ${Math.round(maxSize / 1024 / 1024)}MB`)
    }
    
    // Check file type
    const fileExt = file.name.split('.').pop().toLowerCase()
    if (!allowedTypes.includes(fileExt)) {
      errors.push(`Nepodporovaný typ souboru. Povolené typy: ${allowedTypes.join(', ')}`)
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  },

  // Get file info
  getFileInfo: async (filePath, bucket = 'documents') => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(filePath.substring(0, filePath.lastIndexOf('/')), {
          search: filePath.substring(filePath.lastIndexOf('/') + 1)
        })
      
      if (error) throw error
      
      return { success: true, data: data[0] }
      
    } catch (error) {
      debugError('Failed to get file info:', error)
      return { success: false, error: error.message }
    }
  }
}

export default uploadService
