import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button, Table, Card, Input, Modal, StatusBadge, ActionButton } from '../../components/ui'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { supabase } from '../../config/supabase'
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
      ico: '',
      dic: '',
      address: '',
      city: '',
      postal_code: '',
      contact_person: '',
      website: '',
      payment_terms: 30,
      rating: 3,
      status: 'active',
      notes: ''
    }
  })

  const supplierCategories = [
    'Beton a malta',
    'Cihly a bloky', 
    'Dřevo a materiály',
    'Ocel a kovy',
    'Izolace',
    'Střešní materiály',
    'Nářadí a stroje',
    'Elektromateriál',
    'Voda a topení',
    'Služby',
    'Doprava',
    'Ostatní'
  ]

  // Load suppliers from Supabase
  const loadSuppliers = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('suppliers')
        .select(`
          *,
          orders:material_purchases(count),
          total_orders:material_purchases(amount)
        `)
        .order('name')

      if (error) throw error

      const suppliersWithStats = data?.map(supplier => ({
        ...supplier,
        orders_count: supplier.orders?.[0]?.count || 0,
        total_amount: supplier.total_orders?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0
      })) || []

      setSuppliers(suppliersWithStats)
    } catch (error) {
      console.error('Error loading suppliers:', error)
      toast.error('Chyba při načítání dodavatelů')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSuppliers()
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
          supplier.contact_person,
          supplier.category
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
    const totalOrders = suppliers.reduce((sum, s) => sum + (s.orders_count || 0), 0)
    const totalAmount = suppliers.reduce((sum, s) => sum + (s.total_amount || 0), 0)

    return { total, active, inactive, totalOrders, totalAmount }
  }

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      const supplierData = {
        ...data,
        payment_terms: parseInt(data.payment_terms) || 30,
        rating: parseInt(data.rating) || 3
      }

      let result
      if (editingSupplier) {
        // Update existing supplier
        result = await supabase
          .from('suppliers')
          .update(supplierData)
          .eq('id', editingSupplier.id)
          .select()
      } else {
        // Create new supplier
        result = await supabase
          .from('suppliers')
          .insert([supplierData])
          .select()
      }

      if (result.error) throw result.error

      toast.success(editingSupplier ? 'Dodavatel byl aktualizován' : 'Dodavatel byl přidán')
      
      // Reload suppliers
      await loadSuppliers()
      
      // Reset form and close modal
      reset()
      setShowAddModal(false)
      setEditingSupplier(null)
      
    } catch (error) {
      console.error('Error saving supplier:', error)
      toast.error('Chyba při ukládání dodavatele')
    } finally {
      setSubmitting(false)
    }
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
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierToDelete.id)

      if (error) throw error

      toast.success('Dodavatel byl smazán')
      await loadSuppliers()
      setShowDeleteModal(false)
      setSupplierToDelete(null)
      
    } catch (error) {
      console.error('Error deleting supplier:', error)
      toast.error('Chyba při mazání dodavatele')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleAddNew = () => {
    setEditingSupplier(null)
    reset()
    setShowAddModal(true)
  }

  const filteredSuppliers = getFilteredSuppliers()
  const stats = getSupplierStats()

  const columns = [
    {
      key: 'name',
      title: 'Dodavatel',
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.category}</div>
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
          {row.contact_person && (
            <div className="text-sm text-gray-500">{row.contact_person}</div>
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
      key: 'rating',
      title: 'Hodnocení',
      render: (value) => (
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map(star => (
            <i
              key={star}
              className={`fas fa-star text-sm ${
                star <= value ? 'text-yellow-400' : 'text-gray-300'
              }`}
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
      key: 'total_amount',
      title: 'Celková částka',
      render: (value) => (
        <div className="text-right font-medium">
          {formatCurrency(value || 0)}
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
            onClick={() => console.log('View supplier details', row)}
          />
          <ActionButton
            icon="fas fa-shopping-cart"
            tooltip="Historie objednávek"
            onClick={() => console.log('View supplier orders', row)}
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
          <h1 className="text-2xl font-bold text-gray-900">Dodavatelé</h1>
          <p className="text-gray-600 mt-1">Správa dodavatelů a partnerů</p>
        </div>
        <Button onClick={handleAddNew} className="bg-primary-600 hover:bg-primary-700">
          <i className="fas fa-plus mr-2" />
          Přidat dodavatele
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Celkem</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-truck text-blue-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Aktivní</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-check-circle text-green-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Neaktivní</p>
                <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-pause-circle text-gray-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Objednávky</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-shopping-cart text-purple-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Obrat</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Hledat dodavatele..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              icon="fas fa-search"
            />
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Všechny kategorie</option>
              {supplierCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Všechny stavy</option>
              <option value="active">Aktivní</option>
              <option value="inactive">Neaktivní</option>
            </select>
            <Button
              variant="outline"
              onClick={() => setFilters({ category: '', status: '', search: '' })}
            >
              Vymazat filtry
            </Button>
          </div>
        </div>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Dodavatelé ({filteredSuppliers.length})
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
          data={filteredSuppliers}
          columns={columns}
          loading={isLoading}
          emptyMessage="Žádní dodavatelé nenalezeni"
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setEditingSupplier(null)
          reset()
        }}
        title={editingSupplier ? 'Upravit dodavatele' : 'Nový dodavatel'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Název dodavatele *"
              {...register('name', { required: 'Název je povinný' })}
              error={errors.name?.message}
            />
            <select
              {...register('category', { required: 'Kategorie je povinná' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Vyberte kategorii</option>
              {supplierCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Kontaktní osoba"
              {...register('contact_person')}
            />
            <Input
              label="Webové stránky"
              {...register('website')}
              placeholder="https://www.example.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Platební podmínky (dny)"
              type="number"
              {...register('payment_terms')}
              placeholder="30"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hodnocení
              </label>
              <select
                {...register('rating')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="1">1 hvězda</option>
                <option value="2">2 hvězdy</option>
                <option value="3">3 hvězdy</option>
                <option value="4">4 hvězdy</option>
                <option value="5">5 hvězd</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stav
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="active">Aktivní</option>
                <option value="inactive">Neaktivní</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poznámky
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Dodatečné informace o dodavateli..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddModal(false)
                setEditingSupplier(null)
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
              {editingSupplier ? 'Uložit změny' : 'Přidat dodavatele'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSupplierToDelete(null)
        }}
        title="Smazat dodavatele"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Opravdu chcete smazat dodavatele "{supplierToDelete?.name}"? Tato akce je nevratná.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false)
                setSupplierToDelete(null)
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

export default SuppliersPage
