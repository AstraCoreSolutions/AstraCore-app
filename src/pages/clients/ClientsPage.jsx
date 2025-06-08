import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button, Card, Input, Table, Modal, StatCard } from '../../components/ui'
import { formatDate } from '../../utils/helpers'
import { supabase } from '../../config/supabase'
import toast from 'react-hot-toast'

const ClientsPage = () => {
  const [clients, setClients] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [clientToDelete, setClientToDelete] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    type: ''
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
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

  // Load clients on mount
  useEffect(() => {
    loadClients()
  }, [])

  // Load clients from Supabase
  const loadClients = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setClients(data || [])
    } catch (error) {
      console.error('Error loading clients:', error)
      toast.error('Chyba při načítání klientů')
      setClients([])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle form submission
  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      const clientData = {
        ...data,
        updated_at: new Date().toISOString()
      }

      if (editingClient) {
        // Update existing client
        const { error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', editingClient.id)

        if (error) throw error
        toast.success('Klient byl aktualizován')
      } else {
        // Create new client
        clientData.created_at = new Date().toISOString()

        const { error } = await supabase
          .from('clients')
          .insert([clientData])

        if (error) throw error
        toast.success('Klient byl přidán')
      }

      // Reload clients
      await loadClients()
      
      // Reset form and close modal
      reset()
      setShowAddModal(false)
      setEditingClient(null)
      
    } catch (error) {
      console.error('Error saving client:', error)
      toast.error('Chyba při ukládání klienta: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle edit
  const handleEdit = (client) => {
    setEditingClient(client)
    reset({
      name: client.name || '',
      type: client.type || 'company',
      email: client.email || '',
      phone: client.phone || '',
      ico: client.ico || '',
      dic: client.dic || '',
      address: client.address || '',
      city: client.city || '',
      postal_code: client.postal_code || '',
      contact_person: client.contact_person || '',
      notes: client.notes || ''
    })
    setShowAddModal(true)
  }

  // Handle delete click
  const handleDeleteClick = (client) => {
    setClientToDelete(client)
    setShowDeleteModal(true)
  }

  // Handle delete confirm
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
      toast.error('Chyba při mazání klienta: ' + error.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  // Handle add new
  const handleAddNew = () => {
    setEditingClient(null)
    reset({
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
    })
    setShowAddModal(true)
  }

  // Handle close modal
  const handleCloseModal = () => {
    setShowAddModal(false)
    setEditingClient(null)
    reset()
  }

  // Filter clients
  const getFilteredClients = () => {
    return clients.filter(client => {
      const matchesSearch = !filters.search || 
        client.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        client.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
        client.contact_person?.toLowerCase().includes(filters.search.toLowerCase())
      
      const matchesType = !filters.type || client.type === filters.type
      
      return matchesSearch && matchesType
    })
  }

  // Calculate statistics
  const getClientStats = () => {
    const total = clients.length
    const companies = clients.filter(c => c.type === 'company').length
    const individuals = clients.filter(c => c.type === 'individual').length
    const withProjects = 0 // TODO: Count clients with active projects
    
    return { total, companies, individuals, withProjects }
  }

  const filteredClients = getFilteredClients()
  const stats = getClientStats()

  const typeOptions = [
    { value: 'company', label: 'Firma' },
    { value: 'individual', label: 'Fyzická osoba' }
  ]

  const columns = [
    {
      key: 'name',
      title: 'Klient',
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">
            {row.type === 'company' ? 'Firma' : 'Fyzická osoba'}
            {row.ico && ` • IČO: ${row.ico}`}
          </div>
        </div>
      )
    },
    {
      key: 'contact_info',
      title: 'Kontakt',
      render: (_, row) => (
        <div>
          {row.email && (
            <div className="text-sm text-gray-900">{row.email}</div>
          )}
          {row.phone && (
            <div className="text-sm text-gray-500">{row.phone}</div>
          )}
          {row.contact_person && (
            <div className="text-sm text-gray-500">{row.contact_person}</div>
          )}
        </div>
      )
    },
    {
      key: 'address',
      title: 'Adresa',
      render: (_, row) => (
        <div className="text-sm">
          {row.address && <div>{row.address}</div>}
          {(row.city || row.postal_code) && (
            <div className="text-gray-500">
              {row.postal_code} {row.city}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'created_at',
      title: 'Vytvořen',
      render: (value) => formatDate(value)
    },
    {
      key: 'actions',
      title: 'Akce',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(row)}
            icon="fas fa-edit"
          >
            Upravit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDeleteClick(row)}
            icon="fas fa-trash"
            className="text-red-600 hover:text-red-700"
          >
            Smazat
          </Button>
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
          <p className="text-gray-600">Správa klientů a kontaktů</p>
        </div>
        <Button
          onClick={handleAddNew}
          icon="fas fa-plus"
        >
          Přidat klienta
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Celkem klientů"
          value={stats.total}
          icon="fas fa-users"
          trend="neutral"
        />
        <StatCard
          title="Firmy"
          value={stats.companies}
          icon="fas fa-building"
          trend="neutral"
        />
        <StatCard
          title="Fyzické osoby"
          value={stats.individuals}
          icon="fas fa-user"
          trend="neutral"
        />
        <StatCard
          title="S aktivními projekty"
          value={stats.withProjects}
          icon="fas fa-project-diagram"
          trend="positive"
        />
      </div>

      {/* Filters */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Filtry</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Hledat klienta..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              icon="fas fa-search"
            />
            
            <Input
              type="select"
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="">Všechny typy</option>
              {typeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Input>
            
            <Button
              variant="outline"
              onClick={() => setFilters({ search: '', type: '' })}
              icon="fas fa-times"
            >
              Vymazat filtry
            </Button>
          </div>
        </div>
      </Card>

      {/* Empty state */}
      {clients.length === 0 && !isLoading && (
        <Card className="text-center py-12">
          <i className="fas fa-users text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Zatím žádní klienti</h3>
          <p className="text-gray-600 mb-6">
            Začněte přidáním svého prvního klienta
          </p>
          <Button
            onClick={handleAddNew}
            icon="fas fa-plus"
            size="lg"
          >
            Přidat prvního klienta
          </Button>
        </Card>
      )}

      {/* Clients Table */}
      {clients.length > 0 && (
        <Card>
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Klienti ({filteredClients.length})
            </h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                icon="fas fa-download"
                disabled
              >
                Export (brzy)
              </Button>
            </div>
          </div>
          
          <Table
            columns={columns}
            data={filteredClients}
            loading={isLoading}
            emptyMessage="Žádní klienti nevyhovují filtrům"
            emptyIcon="fas fa-filter"
          />
        </Card>
      )}
      {/* Add/Edit Client Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        title={editingClient ? 'Upravit klienta' : 'Nový klient'}
        size="xl"
        footer={
          <>
            <Button
              variant="outline"
              onClick={handleCloseModal}
              disabled={submitting}
            >
              Zrušit
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              loading={submitting}
              icon="fas fa-save"
            >
              {editingClient ? 'Uložit změny' : 'Přidat klienta'}
            </Button>
          </>
        }
      >
        <form className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Základní údaje</h3>
              
              <Input
                {...register('name', { required: 'Název je povinný' })}
                label="Název / Jméno"
                error={errors.name?.message}
                required
                placeholder="Název firmy nebo jméno osoby"
              />
              
              <Input
                {...register('type', { required: 'Typ je povinný' })}
                label="Typ klienta"
                type="select"
                error={errors.type?.message}
                required
              >
                {typeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Input>
              
              <Input
                {...register('email', {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Neplatný formát e-mailu'
                  }
                })}
                label="E-mail"
                type="email"
                error={errors.email?.message}
                placeholder="email@example.com"
              />
              
              <Input
                {...register('phone')}
                label="Telefon"
                type="tel"
                placeholder="+420 777 123 456"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Identifikace</h3>
              
              <Input
                {...register('ico')}
                label="IČO"
                placeholder="12345678"
                helpText="Identifikační číslo organizace"
              />
              
              <Input
                {...register('dic')}
                label="DIČ"
                placeholder="CZ12345678"
                helpText="Daňové identifikační číslo"
              />
              
              <Input
                {...register('contact_person')}
                label="Kontaktní osoba"
                placeholder="Jméno kontaktní osoby"
                helpText="Pro firmy - hlavní kontakt"
              />
            </div>
          </div>

          {/* Address Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Adresa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  {...register('address')}
                  label="Ulice a číslo"
                  placeholder="Hlavní 123"
                />
              </div>
              
              <Input
                {...register('city')}
                label="Město"
                placeholder="Praha"
              />
              
              <Input
                {...register('postal_code')}
                label="PSČ"
                placeholder="12000"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Input
              {...register('notes')}
              label="Poznámky"
              type="textarea"
              rows={3}
              placeholder="Interní poznámky o klientovi..."
              helpText="Tyto poznámky jsou pouze pro interní použití"
            />
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Náhled kontaktních údajů</h4>
            <div className="text-sm text-gray-600">
              <div className="font-medium">
                {watch('name') || 'Název klienta'}
              </div>
              {watch('type') === 'company' && watch('ico') && (
                <div>IČO: {watch('ico')}</div>
              )}
              {watch('email') && (
                <div>{watch('email')}</div>
              )}
              {watch('phone') && (
                <div>{watch('phone')}</div>
              )}
              {watch('address') && (
                <div className="mt-2">
                  <div>{watch('address')}</div>
                  <div>{watch('postal_code')} {watch('city')}</div>
                </div>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Smazat klienta"
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteLoading}
            >
              Zrušit
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleteLoading}
              icon="fas fa-trash"
            >
              Smazat klienta
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
            <i className="fas fa-exclamation-triangle text-red-600 text-xl" />
          </div>
          
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Opravdu smazat klienta?
            </h3>
            <p className="text-gray-600">
              Chcete smazat klienta <strong>{clientToDelete?.name}</strong>?
            </p>
            <p className="text-sm text-red-600 mt-2">
              Tato akce je nevratná. Všechny související projekty a faktury zůstanou zachovány.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ClientsPage
