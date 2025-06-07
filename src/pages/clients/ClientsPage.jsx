import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button, Table, Card, Input, Modal, ActionButton } from '../../components/ui'
import { formatDate } from '../../utils/helpers'
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

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
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

  // Mock data - replace with real API calls
  useEffect(() => {
    const mockClients = [
      {
        id: 1,
        name: 'Stavební firma ABC s.r.o.',
        type: 'company',
        email: 'info@stavebni-abc.cz',
        phone: '+420 555 123 456',
        ico: '12345678',
        dic: 'CZ12345678',
        address: 'Průmyslová 123',
        city: 'Praha',
        postal_code: '110 00',
        contact_person: 'Ing. Petr Novák',
        notes: 'Dlouhodobý partner, přednostní klient',
        projects_count: 15,
        total_revenue: 2500000,
        last_project: '2024-01-10',
        created_at: '2023-01-15T10:00:00Z'
      },
      {
        id: 2,
        name: 'Developer XYZ a.s.',
        type: 'company',
        email: 'zakky@developer-xyz.cz',
        phone: '+420 555 987 654',
        ico: '87654321',
        dic: 'CZ87654321',
        address: 'Náměstí Míru 45',
        city: 'Brno',
        postal_code: '602 00',
        contact_person: 'Mgr. Jana Svobodová',
        notes: 'Specializace na bytové domy',
        projects_count: 8,
        total_revenue: 1800000,
        last_project: '2024-01-15',
        created_at: '2023-03-20T14:30:00Z'
      },
      {
        id: 3,
        name: 'František Novák',
        type: 'individual',
        email: 'f.novak@email.cz',
        phone: '+420 777 555 333',
        ico: null,
        dic: null,
        address: 'Rodinná 89',
        city: 'Ostrava',
        postal_code: '700 00',
        contact_person: null,
        notes: 'Stavba rodinného domu',
        projects_count: 1,
        total_revenue: 450000,
        last_project: '2023-12-05',
        created_at: '2023-11-01T09:15:00Z'
      }
    ]

    setTimeout(() => {
      setClients(mockClients)
      setIsLoading(false)
    }, 1000)
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
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newClient = {
        ...data,
        id: editingClient ? editingClient.id : Date.now(),
        projects_count: editingClient?.projects_count || 0,
        total_revenue: editingClient?.total_revenue || 0,
        last_project: editingClient?.last_project || null,
        created_at: editingClient?.created_at || new Date().toISOString()
      }

      if (editingClient) {
        setClients(prev => prev.map(c => c.id === editingClient.id ? newClient : c))
        toast.success('Klient upraven')
      } else {
        setClients(prev => [newClient, ...prev])
        toast.success('Klient přidán')
      }
      
      handleCloseModal()
    } catch (error) {
      toast.error('Chyba při ukládání')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setEditingClient(null)
    reset()
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
      await new Promise(resolve => setTimeout(resolve, 500))
      setClients(prev => prev.filter(c => c.id !== clientToDelete.id))
      toast.success('Klient smazán')
      setShowDeleteModal(false)
      setClientToDelete(null)
    } catch (error) {
      toast.error('Chyba při mazání')
    } finally {
      setDeleteLoading(false)
    }
  }

  const filteredClients = getFilteredClients()
  const stats = getClientStats()

  const columns = [
    {
      key: 'name',
      title: 'Klient',
      render: (value, row) => (
        <div>
          <div className="font-semibold text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">
            {row.type === 'company' ? (
              <>
                <i className="fas fa-building mr-1" />
                Firma • IČO: {row.ico}
              </>
            ) : (
              <>
                <i className="fas fa-user mr-1" />
                Fyzická osoba
              </>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'contact',
      title: 'Kontakt',
      render: (_, row) => (
        <div>
          <div className="text-sm">{row.email || '-'}</div>
          <div className="text-sm text-gray-500">{row.phone || '-'}</div>
          {row.contact_person && (
            <div className="text-xs text-gray-400">{row.contact_person}</div>
          )}
        </div>
      )
    },
    {
      key: 'location',
      title: 'Místo',
      render: (_, row) => (
        <div>
          <div className="text-sm">{row.city}</div>
          <div className="text-xs text-gray-500">{row.postal_code}</div>
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
      key: 'last_project',
      title: 'Poslední projekt',
      render: (value) => value ? formatDate(value) : '-'
    },
    {
      key: 'actions',
      title: 'Akce',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <ActionButton
            icon="fas fa-eye"
            tooltip="Zobrazit detail"
            onClick={() => console.log('View client', row)}
          />
          <ActionButton
            icon="fas fa-project-diagram"
            tooltip="Projekty klienta"
            onClick={() => console.log('View projects', row)}
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
          <p className="text-gray-600">CRM a správa klientských vztahů</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => console.log('Import clients')}
            icon="fas fa-upload"
          >
            Import
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            icon="fas fa-plus"
          >
            Přidat klienta
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-users text-blue-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Celkem klientů</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-building text-green-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Firmy</p>
              <p className="text-2xl font-bold text-green-600">{stats.companies}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-user text-yellow-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Fyzické osoby</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.individuals}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-coins text-purple-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Celkové tržby</p>
              <p className="text-lg font-bold text-purple-600">
                {new Intl.NumberFormat('cs-CZ', {
                  style: 'currency',
                  currency: 'CZK',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(stats.totalRevenue)}
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
              placeholder="Hledat klienty..."
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
              <option value="company">Firmy</option>
              <option value="individual">Fyzické osoby</option>
            </Input>

            <Button
              variant="outline"
              onClick={() => setFilters({ search: '', type: '' })}
              size="sm"
            >
              Vymazat filtry
            </Button>
          </div>
        </div>
      </Card>

      {/* Clients Table */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Seznam klientů ({filteredClients.length})
            </h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" icon="fas fa-download">
                Export
              </Button>
            </div>
          </div>
        </div>
        
        <Table
          columns={columns}
          data={filteredClients}
          loading={isLoading}
          emptyMessage="Žádní klienti nenalezeni"
          emptyIcon="fas fa-user-tie"
        />
      </Card>

      {/* Add/Edit Client Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        title={editingClient ? 'Upravit klienta' : 'Nový klient'}
        size="lg"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('name', { required: 'Název/jméno je povinné' })}
              label="Název firmy / Jméno a příjmení"
              type="text"
              placeholder="Stavební firma ABC s.r.o."
              error={errors.name?.message}
              required
            />
            
            <Input
              {...register('type')}
              label="Typ klienta"
              type="select"
            >
              <option value="company">Firma</option>
              <option value="individual">Fyzická osoba</option>
            </Input>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('email')}
              label="E-mail"
              type="email"
              placeholder="info@firma.cz"
            />
            
            <Input
              {...register('phone')}
              label="Telefon"
              type="tel"
              placeholder="+420 555 123 456"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('ico')}
              label="IČO"
              type="text"
              placeholder="12345678"
            />
            
            <Input
              {...register('dic')}
              label="DIČ"
              type="text"
              placeholder="CZ12345678"
            />
          </div>

          <Input
            {...register('address')}
            label="Adresa"
            type="text"
            placeholder="Průmyslová 123"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('city')}
              label="Město"
              type="text"
              placeholder="Praha"
            />
            
            <Input
              {...register('postal_code')}
              label="PSČ"
              type="text"
              placeholder="110 00"
            />
          </div>

          <Input
            {...register('contact_person')}
            label="Kontaktní osoba"
            type="text"
            placeholder="Ing. Petr Novák"
          />

          <Input
            {...register('notes')}
            label="Poznámky"
            type="textarea"
            rows={3}
            placeholder="Dodatečné informace o klientovi..."
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Smazat klienta"
        size="sm"
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
            >
              Smazat
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-red-600">
            <i className="fas fa-exclamation-triangle text-2xl" />
            <div>
              <p className="font-medium">Opravdu chcete smazat tohoto klienta?</p>
              <p className="text-sm text-gray-600 mt-1">
                Tato akce je nevratná a smaže všechna související data.
              </p>
            </div>
          </div>
          
          {clientToDelete && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium text-gray-900">{clientToDelete.name}</p>
              <p className="text-sm text-gray-600 mt-1">
                {clientToDelete.projects_count} projektů • {clientToDelete.email}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default ClientsPage
