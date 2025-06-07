import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button, Table, Card, Input, Modal, ActionButton } from '../../components/ui'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { supabase } from '../../config/supabase'
import toast from 'react-hot-toast'

const ClientsPage = () => {
  const [clients, setClients] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [clientToDelete, setClientToDelete] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [filters, setFilters] = useState({
    type: '',
    search: ''
  })

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      type: 'company',
      email: '',
      phone: '',
      ico: '',
      dic: '',
      address: '',
      city: '',
      postal_code: '',
      contact_person: '',
      notes: ''
    }
  })

  const watchType = watch('type')

  // Load clients from Supabase
  const loadClients = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          projects:projects(count)
        `)
        .order('name')

      if (error) throw error

      // Calculate projects count and total revenue
      const clientsWithStats = data?.map(client => ({
        ...client,
        projects_count: client.projects?.[0]?.count || 0,
        total_revenue: 0 // TODO: Calculate from projects/invoices
      })) || []

      setClients(clientsWithStats)
    } catch (error) {
      console.error('Error loading clients:', error)
      toast.error('Chyba při načítání klientů')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    if (editingClient) {
      Object.keys(editingClient).forEach(key => {
        setValue(key, editingClient[key] || '')
      })
    }
  }, [editingClient, setValue])

  const getFilteredClients = () => {
    return clients.filter(client => {
      // Type filter
      if (filters.type && client.type !== filters.type) {
        return false
      }
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const searchFields = [
          client.name,
          client.email,
          client.phone,
          client.city,
          client.contact_person
        ].filter(Boolean)
        
        const matchesSearch = searchFields.some(field => 
          field.toLowerCase().includes(searchLower)
        )
        
        if (!matchesSearch) return false
      }
      
      return true
    })
  }

  const getClientStats = () => {
    const total = clients.length
    const companies = clients.filter(c => c.type === 'company').length
    const individuals = clients.filter(c => c.type === 'individual').length
    const totalRevenue = clients.reduce((sum, c) => sum + (c.total_revenue || 0), 0)

    return { total, companies, individuals, totalRevenue }
  }

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      const clientData = {
        ...data,
        // Clean up company-specific fields for individuals
        ...(data.type === 'individual' && {
          ico: null,
          dic: null,
          contact_person: null
        })
      }

      let result
      if (editingClient) {
        // Update existing client
        result = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', editingClient.id)
          .select()
      } else {
        // Create new client
        result = await supabase
          .from('clients')
          .insert([clientData])
          .select()
      }

      if (result.error) throw result.error

      toast.success(editingClient ? 'Klient byl aktualizován' : 'Klient byl přidán')
      
      // Reload clients
      await loadClients()
      
      // Reset form and close modal
      reset()
      setShowAddModal(false)
      setEditingClient(null)
      
    } catch (error) {
      console.error('Error saving client:', error)
      toast.error('Chyba při ukládání klienta')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (client) => {
    setEditingClient(client)
    setShowAddModal(true)
  }

  const handleDeleteClick = (client) => {
    setClientToDelete(client)
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!clientToDelete) return

    setDeleteLoading(true)
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientToDelete.id)

      if (error) throw error

      toast.success('Klient byl smazán')
      await loadClients()
      setShowDeleteModal(false)
      setClientToDelete(null)
      
    } catch (error) {
      console.error('Error deleting client:', error)
      toast.error('Chyba při mazání klienta')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleAddNew = () => {
    setEditingClient(null)
    reset()
    setShowAddModal(true)
  }

  const filteredClients = getFilteredClients()
  const stats = getClientStats()

  const columns = [
    {
      key: 'name',
      title: 'Klient',
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">
            {row.type === 'company' ? 'Firma' : 'Fyzická osoba'}
          </div>
        </div>
      )
    },
    {
      key: 'contact',
      title: 'Kontakt',
      render: (_, row) => (
        <div>
          {row.email && (
            <div className="text-sm text-gray-900">{row.email}</div>
          )}
          {row.phone && (
            <div className="text-sm text-gray-500">{row.phone}</div>
          )}
        </div>
      )
    },
    {
      key: 'location',
      title: 'Lokace',
      render: (_, row) => (
        <div>
          {row.city && (
            <div className="text-sm text-gray-900">{row.city}</div>
          )}
          {row.postal_code && (
            <div className="text-sm text-gray-500">{row.postal_code}</div>
          )}
        </div>
      )
    },
    {
      key: 'ico',
      title: 'IČO/DIČ',
      render: (_, row) => (
        <div>
          {row.ico && (
            <div className="text-sm text-gray-900">IČO: {row.ico}</div>
          )}
          {row.dic && (
            <div className="text-sm text-gray-500">DIČ: {row.dic}</div>
          )}
        </div>
      )
    },
    {
      key: 'projects_count',
      title: 'Projekty',
      render: (value) => (
        <div className="text-center">
          <span className="text-lg font-semibold text-gray-900">{value || 0}</span>
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Akce',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <ActionButton
            icon="fas fa-eye"
            tooltip="Zobrazit detail"
            onClick={() => console.log('View client details', row)}
          />
          <ActionButton
            icon="fas fa-building"
            tooltip="Projekty klienta"
            onClick={() => console.log('View client projects', row)}
            variant="ghost"
          />
          <ActionButton
            icon="fas fa-edit"
            tooltip="Upravit"
            onClick={() => handleEdit(row)}
            variant="ghost"
          />
          <ActionButton
            icon="fas fa-trash"
            tooltip="Smazat"
            onClick={() => handleDeleteClick(row)}
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
          <h1 className="text-2xl font-bold text-gray-900">Klienti</h1>
          <p className="text-gray-600 mt-1">Správa klientů a zákazníků</p>
        </div>
        <Button onClick={handleAddNew} className="bg-primary-600 hover:bg-primary-700">
          <i className="fas fa-plus mr-2" />
          Přidat klienta
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Celkem klientů</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-users text-blue-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Firmy</p>
                <p className="text-2xl font-bold text-gray-900">{stats.companies}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-building text-green-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Fyzické osoby</p>
                <p className="text-2xl font-bold text-gray-900">{stats.individuals}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-user text-purple-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Celkový obrat</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-coins text-yellow-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtry</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Hledat klienta..."
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
              <option value="company">Firmy</option>
              <option value="individual">Fyzické osoby</option>
            </select>
            <Button
              variant="outline"
              onClick={() => setFilters({ type: '', search: '' })}
            >
              Vymazat filtry
            </Button>
          </div>
        </div>
      </Card>

      {/* Clients Table */}
      <Card>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Seznam klientů ({filteredClients.length})
          </h3>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <i className="fas fa-download mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <i className="fas fa-upload mr-2" />
              Import
            </Button>
          </div>
        </div>
        <Table
          data={filteredClients}
          columns={columns}
          loading={isLoading}
          emptyMessage="Žádní klienti nenalezeni"
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setEditingClient(null)
          reset()
        }}
        title={editingClient ? 'Upravit klienta' : 'Nový klient'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Název/Jméno *"
              {...register('name', { required: 'Název je povinný' })}
              error={errors.name?.message}
            />
            <select
              {...register('type')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="company">Firma</option>
              <option value="individual">Fyzická osoba</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="E-mail"
              type="email"
              {...register('email')}
            />
            <Input
              label="Telefon"
              {...register('phone')}
            />
          </div>

          {watchType === 'company' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="IČO"
                {...register('ico')}
              />
              <Input
                label="DIČ"
                {...register('dic')}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Adresa"
              {...register('address')}
            />
            <Input
              label="Město"
              {...register('city')}
            />
            <Input
              label="PSČ"
              {...register('postal_code')}
            />
          </div>

          {watchType === 'company' && (
            <Input
              label="Kontaktní osoba"
              {...register('contact_person')}
            />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poznámky
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Dodatečné informace o klientovi..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddModal(false)
                setEditingClient(null)
                reset()
              }}
            >
              Zrušit
            </Button>
            <Button
              type="submit"
              loading={submitting}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {editingClient ? 'Uložit změny' : 'Přidat klienta'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setClientToDelete(null)
        }}
        title="Smazat klienta"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Opravdu chcete smazat klienta "{clientToDelete?.name}"? Tato akce je nevratná.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false)
                setClientToDelete(null)
              }}
            >
              Zrušit
            </Button>
            <Button
              variant="danger"
              loading={deleteLoading}
              onClick={handleDelete}
            >
              Smazat
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ClientsPage
