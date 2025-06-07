import React, { useEffect, useState } from 'react'
import { Button, Table, Card, Input, Modal, ActionButton } from '../../components/ui'
import { formatDate, formatFileSize } from '../../utils/helpers'
import { supabase } from '../../config/supabase'
import toast from 'react-hot-toast'

const DocumentsPage = () => {
  const [documents, setDocuments] = useState([])
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadData, setUploadData] = useState({
    name: '',
    type: 'other',
    project_id: '',
    description: ''
  })
  const [filters, setFilters] = useState({
    type: '',
    project: '',
    search: ''
  })

  const documentTypes = [
    { value: 'permit', label: 'Stavební povolení' },
    { value: 'technical', label: 'Technická dokumentace' },
    { value: 'contract', label: 'Smlouvy' },
    { value: 'invoice', label: 'Faktury' },
    { value: 'photo', label: 'Fotografie' },
    { value: 'plan', label: 'Plány a výkresy' },
    { value: 'report', label: 'Zprávy' },
    { value: 'other', label: 'Ostatní' }
  ]

  // Load documents from Supabase
  const loadDocuments = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          project:projects(name),
          uploaded_by_user:profiles(first_name, last_name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const documentsWithDetails = data?.map(doc => ({
        ...doc,
        project_name: doc.project?.name || null,
        uploaded_by: doc.uploaded_by_user 
          ? `${doc.uploaded_by_user.first_name} ${doc.uploaded_by_user.last_name}`.trim()
          : 'Neznámý uživatel'
      })) || []

      setDocuments(documentsWithDetails)
    } catch (error) {
      console.error('Error loading documents:', error)
      toast.error('Chyba při načítání dokumentů')
    } finally {
      setIsLoading(false)
    }
  }

  // Load projects for dropdown
  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name')

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  useEffect(() => {
    loadDocuments()
    loadProjects()
  }, [])

  const getFilteredDocuments = () => {
    return documents.filter(doc => {
      // Type filter
      if (filters.type && doc.type !== filters.type) {
        return false
      }
      
      // Project filter
      if (filters.project && doc.project_id !== filters.project) {
        return false
      }
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const searchFields = [
          doc.name,
          doc.description,
          doc.project_name,
          doc.uploaded_by
        ].filter(Boolean)
        
        const matchesSearch = searchFields.some(field => 
          field.toLowerCase().includes(searchLower)
        )
        
        if (!matchesSearch) return false
      }
      
      return true
    })
  }

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setUploadData(prev => ({
        ...prev,
        name: file.name
      }))
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Vyberte soubor k nahrání')
      return
    }

    if (!uploadData.name.trim()) {
      toast.error('Zadejte název dokumentu')
      return
    }

    setUploading(true)
    try {
      // Generate unique filename
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `documents/${fileName}`

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      // Save document record to database
      const { error: dbError } = await supabase
        .from('documents')
        .insert([{
          name: uploadData.name,
          type: uploadData.type,
          description: uploadData.description,
          file_url: urlData.publicUrl,
          file_path: filePath,
          file_size: selectedFile.size,
          project_id: uploadData.project_id || null,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id
        }])

      if (dbError) throw dbError

      toast.success('Dokument byl nahrán')
      
      // Reset form and reload documents
      setShowUploadModal(false)
      setSelectedFile(null)
      setUploadData({
        name: '',
        type: 'other',
        project_id: '',
        description: ''
      })
      await loadDocuments()
      
    } catch (error) {
      console.error('Error uploading document:', error)
      toast.error('Chyba při nahrávání dokumentu')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (document) => {
    try {
      if (document.file_path) {
        // Download from Supabase Storage
        const { data, error } = await supabase.storage
          .from('documents')
          .download(document.file_path)

        if (error) throw error

        // Create download link
        const url = URL.createObjectURL(data)
        const a = document.createElement('a')
        a.href = url
        a.download = document.name
        a.click()
        URL.revokeObjectURL(url)
      } else if (document.file_url) {
        // Direct download from URL
        window.open(document.file_url, '_blank')
      }
    } catch (error) {
      console.error('Error downloading document:', error)
      toast.error('Chyba při stahování dokumentu')
    }
  }

  const handleDelete = async (document) => {
    if (!confirm(`Opravdu chcete smazat dokument "${document.name}"?`)) {
      return
    }

    try {
      // Delete file from storage
      if (document.file_path) {
        await supabase.storage
          .from('documents')
          .remove([document.file_path])
      }

      // Delete record from database
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', document.id)

      if (error) throw error

      toast.success('Dokument byl smazán')
      await loadDocuments()
      
    } catch (error) {
      console.error('Error deleting document:', error)
      toast.error('Chyba při mazání dokumentu')
    }
  }

  const getDocumentIcon = (type) => {
    const icons = {
      permit: 'fas fa-file-contract',
      technical: 'fas fa-file-alt',
      contract: 'fas fa-handshake',
      invoice: 'fas fa-file-invoice',
      photo: 'fas fa-image',
      plan: 'fas fa-drafting-compass',
      report: 'fas fa-chart-line',
      other: 'fas fa-file'
    }
    return icons[type] || icons.other
  }

  const filteredDocuments = getFilteredDocuments()

  const columns = [
    {
      key: 'name',
      title: 'Dokument',
      render: (value, row) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <i className={`${getDocumentIcon(row.type)} text-gray-600`} />
          </div>
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">
              {documentTypes.find(t => t.value === row.type)?.label || 'Ostatní'}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'project_name',
      title: 'Projekt',
      render: (value) => value || (
        <span className="text-gray-400 italic">Nepřiřazeno</span>
      )
    },
    {
      key: 'file_size',
      title: 'Velikost',
      render: (value) => formatFileSize(value)
    },
    {
      key: 'uploaded_by',
      title: 'Nahrál',
      render: (value) => value || 'Neznámý'
    },
    {
      key: 'created_at',
      title: 'Datum nahrání',
      render: (value) => formatDate(value)
    },
    {
      key: 'actions',
      title: 'Akce',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <ActionButton
            icon="fas fa-eye"
            tooltip="Zobrazit"
            onClick={() => window.open(row.file_url, '_blank')}
          />
          <ActionButton
            icon="fas fa-download"
            tooltip="Stáhnout"
            onClick={() => handleDownload(row)}
            variant="ghost"
          />
          <ActionButton
            icon="fas fa-trash"
            tooltip="Smazat"
            onClick={() => handleDelete(row)}
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          />
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dokumenty</h1>
          <p className="text-gray-600 mt-1">Správa dokumentů a souborů</p>
        </div>
        <Button 
          onClick={() => setShowUploadModal(true)} 
          className="bg-primary-600 hover:bg-primary-700"
        >
          <i className="fas fa-upload mr-2" />
          Nahrát dokument
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Celkem dokumentů</p>
                <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-file text-blue-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Tento měsíc</p>
                <p className="text-2xl font-bold text-gray-900">
                  {documents.filter(d => {
                    const docDate = new Date(d.created_at)
                    const now = new Date()
                    return docDate.getMonth() === now.getMonth() && docDate.getFullYear() === now.getFullYear()
                  }).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-calendar text-green-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Celková velikost</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatFileSize(documents.reduce((sum, d) => sum + (d.file_size || 0), 0))}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-hdd text-purple-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Typy dokumentů</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(documents.map(d => d.type)).size}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-tags text-yellow-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtry</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Hledat dokument..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              icon="fas fa-search"
            />
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Všechny typy</option>
              {documentTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <select
              value={filters.project}
              onChange={(e) => setFilters(prev => ({ ...prev, project: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Všechny projekty</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
            <Button
              variant="outline"
              onClick={() => setFilters({ type: '', project: '', search: '' })}
            >
              Vymazat filtry
            </Button>
          </div>
        </div>
      </Card>

      {/* Documents Table */}
      <Card>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Dokumenty ({filteredDocuments.length})
          </h3>
        </div>
        <Table
          data={filteredDocuments}
          columns={columns}
          loading={isLoading}
          emptyMessage="Žádné dokumenty nenalezeny"
        />
      </Card>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false)
          setSelectedFile(null)
          setUploadData({
            name: '',
            type: 'other',
            project_id: '',
            description: ''
          })
        }}
        title="Nahrát nový dokument"
        size="lg"
      >
        <div className="space-y-4">
          {/* File Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Soubor *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2" />
                <p className="text-gray-600">
                  {selectedFile ? selectedFile.name : 'Klikněte nebo přetáhněte soubor'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  PDF, DOC, XLS, JPG, PNG (max 10MB)
                </p>
              </label>
            </div>
          </div>

          {/* Document Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Název dokumentu *"
              value={uploadData.name}
              onChange={(e) => setUploadData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Zadejte název dokumentu"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Typ dokumentu
              </label>
              <select
                value={uploadData.type}
                onChange={(e) => setUploadData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {documentTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Projekt (volitelné)
            </label>
            <select
              value={uploadData.project_id}
              onChange={(e) => setUploadData(prev => ({ ...prev, project_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Nepřiřazovat k projektu</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Popis (volitelný)
            </label>
            <textarea
              value={uploadData.description}
              onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Dodatečné informace o dokumentu..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadModal(false)
                setSelectedFile(null)
                setUploadData({
                  name: '',
                  type: 'other',
                  project_id: '',
                  description: ''
                })
              }}
            >
              Zrušit
            </Button>
            <Button
              onClick={handleUpload}
              loading={uploading}
              disabled={!selectedFile || !uploadData.name.trim()}
              className="bg-primary-600 hover:bg-primary-700"
            >
              Nahrát dokument
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default DocumentsPage
