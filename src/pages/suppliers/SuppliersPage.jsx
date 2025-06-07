import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button, Table, Card, Input, Modal, ActionButton, StatusBadge } from '../../components/ui'
import { formatDate, formatCurrency } from '../../utils/helpers'
import toast from 'react-hot-toast'

const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [supplierToDelete, setSupplierToDelete] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    search: ''
  })

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      category: '',
      email: '',
      phone: '',
      website: '',
      ico: '',
      dic: '',
      address: '',
      city: '',
      postal_code: '',
      contact_person: '',
      payment_terms: '30',
      status: 'active',
      rating: '5',
      notes: ''
    }
  })

  // Mock data - replace with real API calls
  useEffect(() => {
    const mockSuppliers = [
      {
        id: 1,
        name: 'Heidelberg Cement s.r.o.',
        category: 'Beton a malta',
        email: 'objednavky@heidelberg.cz',
        phone: '+420 235 012 345',
        website: 'www.heidelbergcement.cz',
        ico: '11223344',
        dic: 'CZ11223344',
        address: 'Průmyslová 50',
        city: 'Praha',
        postal_code: '140 00',
        contact_person: 'Ing. Pavel Kratochvíl',
        payment_terms: 30,
        status: 'active',
        rating: 5,
        notes: 'Hlavní dodavatel cementu, spolehlivý partner',
        orders_count: 45,
        total_spent: 850000,
        last_order: '2024-01-12',
        created_at: '2023-01-10T10:00:00Z'
      },
      {
        id: 2,
        name: 'Wienerberger spol. s r.o.',
        category: 'Cihly a bloky',
        email: 'prodej@wienerberger.cz',
        phone: '+420 271 019 111',
        website: 'www.wienerberger.cz',
        ico: '55667788',
        dic: 'CZ55667788',
        address: 'Na Příkopech 14',
        city: 'Praha',
        postal_code: '110 00',
        contact_person: 'Bc. Jana Nováková',
        payment_terms: 14,
        status: 'active',
        rating: 4,
        notes: 'Kvalitní cihly, rychlé dodání',
        orders_count: 28,
        total_spent: 420000,
        last_order: '2024-01-08',
        created_at: '2023-02-15T14:30:00Z'
      },
      {
        id: 3,
        name: 'Pila Hradec s.r.o.',
        category: 'Dřevo a materiály',
        email: 'info@pila-hradec.cz',
        phone: '+420 495 123 456',
        website: 'www.pila-hradec.cz',
        ico: '99887766',
        dic: 'CZ99887766',
        address: 'Lesní 89',
        city: 'Hradec Králové',
        postal_code: '500 02',
        contact_person: 'Tomáš Svoboda',
        payment_terms: 21,
        status: 'active',
        rating: 4,
        notes: 'Místní dodavatel řeziva, dobré ceny',
        orders_count: 15,
        total_spent: 180000,
        last_order: '2023-12-20',
        created_at: '2023-05-10T09:15:00Z'
      },
      {
        id: 4,
        name: 'Nářadí ProTool s.r.o.',
        category: 'Nářadí a stroje',
        email: 'eshop@protool.cz',
        phone: '+420 587 654 321',
        website: 'www.protool.cz',
        ico: '44332211',
        dic: 'CZ44332211',
        address: 'Technická 15',
        city: 'Brno',
        postal_code: '612 00',
        contact_person: 'Mgr. Petr Dvořák',
        payment_terms: 7,
        status: 'inactive',
        rating: 3,
        notes: 'Drahé, ale kvalitní nářadí. Využíváme zřídka.',
        orders_count: 8,
        total_spent: 95000,
        last_order: '2023-11-05',
        created_at: '2023-08-20T16:45:00Z'
      }
    ]

    setTimeout(() => {
      setSuppliers(mockSuppliers)
      setIsLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    if (editingSupplier) {
      Object.keys(editingSupplier).forEach(key => {
        setValue(key, editingSupplier[key] || '')
      })
    }
  }, [editingSupplier, setValue])

  const getFilteredSuppliers = () => {
    return suppliers.filter(supplier => {
      // Category filter
      if (filters.category && supplier.category !== filters.category) {
        return false
      }
      
      // Status filter
      if (filters.status && supplier.status !== filters.status) {
        return false
      }
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const searchFields = [
          supplier.name,
          supplier.email,
          supplier.phone,
          supplier.city,
          supplier.contact_person
        ].filter(Boolean)
        
        const matchesSearch = searchFields.some(field => 
          field.toLowerCase().includes(searchLower)
        )
        
        if (!matchesSearch) return false
      }
      
      return true
    })
  }

  const getSupplierStats = () => {
    const total = suppliers.length
    const active = suppliers.filter(s => s.status === 'active').length
    const inactive = suppliers.filter(s => s.status === 'inactive').length
    const totalSpent = suppliers.reduce((sum, s) => sum + (s.total_spent || 0), 0)
    const avgRating = suppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / suppliers.length

    return { total, active, inactive, totalSpent, avgRating }
  }

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newSupplier = {
        ...data,
        id: editingSupplier ? editingSupplier.id : Date.now(),
        payment_terms: parseInt(data.payment_terms) || 30,
        rating: parseInt(data.rating) || 5,
        orders_count: editingSupplier?.orders_count || 0,
        total_spent: editingSupplier?.total_spent || 0,
        last_order: editingSupplier?.last_order || null,
        created_at: editingSupplier?.created_at || new Date().toISOString()
      }

      if (editingSupplier) {
        setSuppliers(prev => prev.map(s => s.id === editingSupplier.id ? newSupplier : s))
        toast.success('Dodavatel upraven')
      } else {
        setSuppliers(prev => [newSupplier, ...prev])
        toast.success('Dodavatel přidán')
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
    setEditingSupplier(null)
    reset()
  }

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier)
    setShowAddModal(true)
  }

  const handleDeleteClick = (supplier) => {
    setSupplierToDelete(supplier)
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!supplierToDelete) return

    setDeleteLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setSuppliers(prev => prev.filter(s => s.id !== supplierToDelete.id))
      toast.success('Dodavatel smazán')
      setShowDeleteModal(false)
      setSupplierToDelete(null)
    } catch (error) {
      toast.error('Chyba při mazání')
    } finally {
      setDeleteLoading(false)
    }
  }

  const filteredSuppliers = getFilteredSuppliers()
  const stats = getSupplierStats()

  const columns = [
    {
      key: 'name',
      title: 'Dodavatel',
      render: (value, row) => (
        <div>
          <div className="font-semibold text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.category}</div>
          <div className="text-xs text-gray-400">IČO: {row.ico}</div>
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
      key: 'rating',
      title: 'Hodnocení',
      render: (value) => (
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <i 
              key={i} 
              className={`fas fa-star ${i < value ? 'text-yellow-400' : 'text-gray-300'}`}
            />
          ))}
          <span className="ml-2 text-sm text-gray-600">({value}/5)</span>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Stav',
      render: (value) => (
        <StatusBadge 
          status={value}
          statusLabels={{
            active: 'Aktivní',
            inactive: 'Neaktivní'
          }}
          statusColors={{
            active: 'badge-success',
            inactive: 'badge-warning'
          }}
        />
      )
    },
    {
      key: 'orders_count',
      title: 'Objednávky',
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
            onClick={() => console.log('View supplier', row)}
          />
          <ActionButton
            icon="fas fa-shopping-cart"
            tooltip="Historie objednávek"
            onClick={() => console.log('View orders', row)}
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

  const categories = [
    'Beton a malta',
    'Cihly a bloky', 
    'Dřevo a materiály',
    'Ocel a kovy',
    'Izolace',
    'Střešní materiály',
    'Nářadí a stroje',
    'Elektromateriál',
    'Voda a topení',
    'Ostatní'
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dodavatelé</h1>
          <p className="text-gray-600">Správa dodavatelů a objednávek</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => console.log('Generate order')}
            icon="fas fa-shopping-cart"
          >
            Nová objednávka
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            icon="fas fa-plus"
          >
            Přidat dodavatele
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-truck text-blue-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Celkem</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-check-circle text-green-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Aktivní</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-pause-circle text-yellow-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Neaktivní</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.inactive}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-coins text-purple-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Celkem utraceno</p>
              <p className="text-lg font-bold text-purple-600">{formatCurrency(stats.totalSpent)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-star text-orange-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Průměrné hodnocení</p>
              <p className="text-2xl font-bold text-orange-600">{stats.avgRating?.toFixed(1) || 0}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              type="text"
              placeholder="Hledat dodavatele..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              icon="fas fa-search"
            />
            
            <Input
              type="select"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">Všechny kategorie</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Input>

            <Input
              type="select"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">Všechny stavy</option>
              <option value="active">Aktivní</option>
              <option value="inactive">Neaktivní</option>
            </Input>

            <Button
              variant="outline"
              onClick={() => setFilters({ search: '', category: '', status: '' })}
              size="sm"
            >
              Vymazat filtry
            </Button>
          </div>
        </div>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Seznam dodavatelů ({filteredSuppliers.length})
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
          data={filteredSuppliers}
          loading={isLoading}
          emptyMessage="Žádní dodavatelé nenalezeni"
          emptyIcon="fas fa-truck"
        />
      </Card>

      {/* Add/Edit Supplier Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        title={editingSupplier ? 'Upravit dodavatele' : 'Nový dodavatel'}
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
              {editingSupplier ? 'Uložit změny' : 'Přidat dodavatele'}
            </Button>
          </>
        }
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('name', { required: 'Název firmy je povinný' })}
              label="Název firmy"
              type="text"
              placeholder="Stavební materiály s.r.o."
              error={errors.name?.message}
              required
            />
            
            <Input
              {...register('category')}
              label="Kategorie"
              type="select"
            >
              <option value="">Vyberte kategorii</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Input>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('email')}
              label="E-mail"
              type="email"
              placeholder="objednavky@firma.cz"
            />
            
            <Input
              {...register('phone')}
              label="Telefon"
              type="tel"
              placeholder="+420 555 123 456"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            
            <Input
              {...register('website')}
              label="Web"
              type="url"
              placeholder="www.firma.cz"
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
            placeholder="Ing. Pavel Novák"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              {...register('payment_terms')}
              label="Platební podmínky"
              type="number"
              placeholder="30"
              suffix="dní"
            />
            
            <Input
              {...register('status')}
              label="Stav"
              type="select"
            >
              <option value="active">Aktivní</option>
              <option value="inactive">Neaktivní</option>
            </Input>
            
            <Input
              {...register('rating')}
              label="Hodnocení"
              type="select"
            >
              <option value="5">⭐⭐⭐⭐⭐ (5)</option>
              <option value="4">⭐⭐⭐⭐ (4)</option>
              <option value="3">⭐⭐⭐ (3)</option>
              <option value="2">⭐⭐ (2)</option>
              <option value="1">⭐ (1)</option>
            </Input>
          </div>

          <Input
            {...register('notes')}
            label="Poznámky"
            type="textarea"
            rows={3}
            placeholder="Dodatečné informace o dodavateli..."
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Smazat dodavatele"
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
              <p className="font-medium">Opravdu chcete smazat tohoto dodavatele?</p>
              <p className="text-sm text-gray-600 mt-1">
                Tato akce je nevratná a smaže všechna související data.
              </p>
            </div>
          </div>
          
          {supplierToDelete && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium text-gray-900">{supplierToDelete.name}</p>
              <p className="text-sm text-gray-600 mt-1">
                {supplierToDelete.orders_count} objednávek • {supplierToDelete.email}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default SuppliersPage
