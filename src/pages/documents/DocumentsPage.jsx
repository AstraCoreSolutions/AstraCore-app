import React, { useEffect, useState } from 'react'
import { Button, Table, Card, Input, Modal, ActionButton } from '../../components/ui'
import { formatDate, formatFileSize } from '../../utils/helpers'
import toast from 'react-hot-toast'

const DocumentsPage = () => {
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [filters, setFilters] = useState({
    type: '',
    project: '',
    search: ''
  })

  // Mock data
  useEffect(() => {
    const mockDocuments = [
      {
        id: 1,
        name: 'Stavební povolení - Dům Novák.pdf',
        type: 'permit',
        file_url: '/documents/stavebni-povoleni-novak.pdf',
        file_size: 2548192,
        project_name: 'Rodinný dům Novák',
        uploaded_by: 'Jan Dvořák',
        created_at: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        name: 'Technická zpráva - Office Building.docx',
        type: 'technical',
        file_url: '/documents/technicka-zprava-office.docx',
        file_size: 1024000,
        project_name: 'Office Building ABC',
        uploaded_by: 'Petr Svoboda',
        created_at: '2024-01-12T14:15:00Z'
      },
      {
        id: 3,
        name: 'Smlouva s dodavatelem - Heidelberg.pdf',
        type: 'contract',
        file_url: '/documents/smlouva-heidelberg.pdf',
        file_size: 512000,
        project_name: null,
        uploaded_by: 'Marie Nováková',
        created_at: '2024-01-10T09:45:00Z'
      }
    ]

    setTimeout(() => {
      setDocuments(mockDocuments)
      setIsLoading(false)
    }, 1000)
  }, [])

  const getFilteredDocuments = () => {
    return documents.filter(doc => {
      if (filters.type && doc.type !== filters.type) return false
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        return doc.name.toLowerCase().includes(searchLower) ||
               doc.project_name?.toLowerCase().includes(searchLower)
      }
      return true
    })
  }

  const handleUpload = async (files) => {
    setUploading(true)
    try {
      // Mock upload
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newDocs = Array.from(files).map(file => ({
        id: Date.now() + Math.random(),
        name: file.name,
        type: 'document',
        file_url: `/documents/${file.name}`,
        file_size: file.size,
        project_name: null,
        uploaded_by: 'Current User',
        created_at: new Date().toISOString()
      }))

      setDocuments(prev => [...newDocs, ...prev])
      toast.success(`${files.length} souborů nahráno`)
      setShowUploadModal(false)
    } catch (error) {
      toast.error('Chyba při nahrávání')
    } finally {
      setUploading(false)
    }
  }

  const columns = [
    {
      key: 'name',
      title: 'Dokument',
      render: (value, row) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
            <i className={`fas ${getFileIcon(row.name)} text-blue-600`} />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{formatFileSize(row.file_size)}</div>
          </div>
        </div>
      )
    },
    {
      key: 'type',
      title: 'Typ',
      render: (value) => {
        const types = {
          permit: 'Povolení',
          technical: 'Technický',
          contract: 'Smlouva',
          invoice: 'Faktura',
          document: 'Dokument'
        }
        return types[value] || value
      }
    },
    {
      key: 'project_name',
      title: 'Projekt',
      render: (value) => value || '-'
    },
    {
      key: 'uploaded_by',
      title: 'Nahrál',
      render: (value) => value
    },
    {
      key: 'created_at',
      title: 'Datum',
      render: (value) => formatDate(value)
    },
    {
      key: 'actions',
      title: 'Akce',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <ActionButton
            icon="fas fa-download"
            tooltip="Stáhnout"
            onClick={() => window.open(row.file_url, '_blank')}
          />
          <ActionButton
            icon="fas fa-eye"
            tooltip="Zobrazit"
            onClick={() => window.open(row.file_url, '_blank')}
            variant="ghost"
          />
          <ActionButton
            icon="fas fa-trash"
            tooltip="Smazat"
            onClick={() => console.log('Delete', row)}
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          />
        </div>
      )
    }
  ]

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase()
    const icons = {
      pdf: 'fa-file-pdf',
      doc: 'fa-file-word',
      docx: 'fa-file-word',
      xls: 'fa-file-excel',
      xlsx: 'fa-file-excel',
      jpg: 'fa-file-image',
      jpeg: 'fa-file-image',
      png: 'fa-file-image',
      txt: 'fa-file-alt'
    }
    return icons[ext] || 'fa-file'
  }

  const filteredDocuments = getFilteredDocuments()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dokumenty</h1>
          <p className="text-gray-600">Správa dokumentů a souborů</p>
        </div>
        <Button
          onClick={() => setShowUploadModal(true)}
          icon="fas fa-upload"
        >
          Nahrát dokumenty
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-file text-blue-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Celkem dokumentů</p>
              <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-file-pdf text-green-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">PDF soubory</p>
              <p className="text-2xl font-bold text-green-600">
                {documents.filter(d => d.name.endsWith('.pdf')).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-hard-drive text-yellow-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Velikost</p>
              <p className="text-lg font-bold text-yellow-600">
                {formatFileSize(documents.reduce((sum, d) => sum + d.file_size, 0))}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-calendar text-purple-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Tento měsíc</p>
              <p className="text-2xl font-bold text-purple-600">
                {documents.filter(d => {
                  const date = new Date(d.created_at)
                  const now = new Date()
                  return date.getMonth() === now.getMonth() && 
                         date.getFullYear() === now.getFullYear()
                }).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Filtry</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="text"
              placeholder="Hledat dokumenty..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              icon="fas fa-search"
            />
            
            <Input
              type="select"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">Všechny typy</option>
              <option value="permit">Povolení</option>
              <option value="technical">Technické</option>
              <option value="contract">Smlouvy</option>
              <option value="invoice">Faktury</option>
              <option value="document">Dokumenty</option>
            </Input>

            <Button
              variant="outline"
              onClick={() => setFilters({ search: '', type: '', project: '' })}
              size="sm"
            >
              Vymazat filtry
            </Button>
          </div>
        </div>
      </Card>

      {/* Documents Table */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Dokumenty ({filteredDocuments.length})
            </h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" icon="fas fa-download">
                Stáhnout vše
              </Button>
            </div>
          </div>
        </div>
        
        <Table
          columns={columns}
          data={filteredDocuments}
          loading={isLoading}
          emptyMessage="Žádné dokumenty nenalezeny"
          emptyIcon="fas fa-folder-open"
        />
      </Card>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Nahrát dokumenty"
        size="lg"
      >
        <div className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4" />
            <p className="text-lg text-gray-600 mb-2">Přetáhněte soubory sem nebo klikněte pro výběr</p>
            <p className="text-sm text-gray-500">Podporované formáty: PDF, DOC, XLS, JPG, PNG (max 10MB)</p>
            <input
              type="file"
              multiple
              className="hidden"
              id="file-upload"
              onChange={(e) => handleUpload(e.target.files)}
            />
            <label
              htmlFor="file-upload"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 cursor-pointer"
            >
              <i className="fas fa-folder-open mr-2" />
              Vybrat soubory
            </label>
          </div>

          {uploading && (
            <div className="text-center">
              <div className="spinner w-8 h-8 mx-auto mb-4" />
              <p className="text-gray-600">Nahrávám soubory...</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default DocumentsPage
