import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button, Table, Card, Input, Modal, StatusBadge, ActionButton, CurrencyCell, DateCell } from '../../components/ui'
import { EQUIPMENT_STATUS, EQUIPMENT_CATEGORIES, STATUS_LABELS, STATUS_COLORS } from '../../utils/constants'
import { formatCurrency, formatDate } from '../../utils/helpers'
import { supabase } from '../../config/supabase'
import toast from 'react-hot-toast'

const EquipmentPage = () => {
  const [equipment, setEquipment] = useState([])
  const [employees, setEmployees] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [equipmentToDelete, setEquipmentToDelete] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: ''
  })

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      category: '',
      manufacturer: '',
      model: '',
      serial_number: '',
      purchase_date: '',
      purchase_price: '',
      current_value: '',
      status: EQUIPMENT_STATUS.AVAILABLE,
      location: '',
      borrowed_by: '',
      notes: ''
    }
  })

  // Load equipment from Supabase
  const loadEquipment = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('equipment')
        .select(`
          *,
          borrowed_by_user:profiles!equipment_borrowed_by_fkey(first_name, last_name)
        `)
        .order('name')

      if (error) throw error

      const equipmentWithDetails = data?.map(item => ({
        ...item,
        borrowed_by_name: item.borrowed_by_user 
          ? `${item.borrowed_by_user.first_name} ${item.borrowed_by_user.last_name}`.trim()
          : null
      })) || []

      setEquipment(equipmentWithDetails)
    } catch (error) {
      console.error('Error loading equipment:', error)
      toast.error('Chyba při načítání nářadí')
    } finally {
      setIsLoading(false)
    }
  }

  // Load employees for borrowing dropdown
  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'employee')
        .order('first_name')

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error('Error loading employees:', error)
    }
  }

  useEffect(() => {
    loadEquipment()
    loadEmployees()
  }, [])

  useEffect(() => {
    if (editingEquipment) {
      Object.keys(editingEquipment).forEach(key => {
        if (key.includes('_date')) {
          setValue(key, editingEquipment[key]?.split('T')[0])
        } else {
          setValue(key, editingEquipment[key] || '')
        }
      })
    }
  }, [editingEquipment, setValue])

  const getFilteredEquipment = () => {
    return equipment.filter(item => {
      // Status filter
      if (filters.status && item.status !== filters.status) {
        return false
      }
      
      // Category filter
      if (filters.category && item.category !== filters.category) {
        return false
      }
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const searchFields = [
          item.name,
          item.manufacturer,
          item.model,
          item.serial_number,
          item.location,
          item.borrowed_by_name
        ].filter(Boolean)
        
        const matchesSearch = searchFields.some(field => 
          field.toLowerCase().includes(searchLower)
        )
        
        if (!matchesSearch) return false
      }
      
      return true
    })
  }

  const getEquipmentStats = () => {
    const total = equipment.length
    const available = equipment.filter(e => e.status === EQUIPMENT_STATUS.AVAILABLE).length
    const borrowed = equipment.filter(e => e.status === EQUIPMENT_STATUS.BORROWED).length
    const inService = equipment.filter(e => e.status === EQUIPMENT_STATUS.SERVICE).length
    const totalValue = equipment.reduce((sum, e) => sum + (e.current_value || 0), 0)

    return { total, available, borrowed, inService, totalValue }
  }

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      const equipmentData = {
        ...data,
        purchase_price: parseFloat(data.purchase_price) || 0,
        current_value: parseFloat(data.current_value) || 0,
        borrowed_by: data.borrowed_by || null,
        purchase_date: data.purchase_date || null
      }

      let result
      if (editingEquipment) {
        // Update existing equipment
        result = await supabase
          .from('equipment')
          .update(equipmentData)
          .eq('id', editingEquipment.id)
          .select()
      } else {
        // Create new equipment
        result = await supabase
          .from('equipment')
          .insert([equipmentData])
          .select()
      }

      if (result.error) throw result.error

      toast.success(editingEquipment ? 'Nářadí bylo aktualizováno' : 'Nářadí bylo přidáno')
      
      // Reload equipment
      await loadEquipment()
      
      // Reset form and close modal
      reset()
      setShowAddModal(false)
      setEditingEquipment(null)
      
    } catch (error) {
      console.error('Error saving equipment:', error)
      toast.error('Chyba při ukládání nářadí')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (item) => {
    setEditingEquipment(item)
    setShowAddModal(true)
  }

  const handleDeleteClick = (item) => {
    setEquipmentToDelete(item)
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!equipmentToDelete) return

    setDeleteLoading(true)
    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', equipmentToDelete.id)

      if (error) throw error

      toast.success('Nářadí bylo smazáno')
      await loadEquipment()
      setShowDeleteModal(false)
      setEquipmentToDelete(null)
      
    } catch (error) {
      console.error('Error deleting equipment:', error)
      toast.error('Chyba při mazání nářadí')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleBorrow = async (item) => {
    const employeeId = prompt('ID zaměstnance pro vypůjčení:')
    if (!employeeId) return

    try {
      const { error } = await supabase
        .from('equipment')
        .update({
          status: EQUIPMENT_STATUS.BORROWED,
          borrowed_by: employeeId,
          borrowed_at: new Date().toISOString()
        })
        .eq('id', item.id)

      if (error) throw error

      toast.success('Nářadí bylo vypůjčeno')
      await loadEquipment()
      
    } catch (error) {
      console.error('Error borrowing equipment:', error)
      toast.error('Chyba při vypůjčování nářadí')
    }
  }

  const handleReturn = async (item) => {
    try {
      const { error } = await supabase
        .from('equipment')
        .update({
          status: EQUIPMENT_STATUS.AVAILABLE,
          borrowed_by: null,
          borrowed_at: null,
          returned_at: new Date().toISOString()
        })
        .eq('id', item.id)

      if (error) throw error

      toast.success('Nářadí bylo vráceno')
      await loadEquipment()
      
    } catch (error) {
      console.error('Error returning equipment:', error)
      toast.error('Chyba při vracení nářadí')
    }
  }

  const handleService = async (item) => {
    try {
      const { error } = await supabase
        .from('equipment')
        .update({
          status: EQUIPMENT_STATUS.SERVICE,
          borrowed_by: null
        })
        .eq('id', item.id)

      if (error) throw error

      toast.success('Nářadí bylo odesláno do servisu')
      await loadEquipment()
      
    } catch (error) {
      console.error('Error sending equipment to service:', error)
      toast.error('Chyba při odesílání do servisu')
    }
  }

  const handleAddNew = () => {
    setEditingEquipment(null)
    reset()
    setShowAddModal(true)
  }

  const filteredEquipment = getFilteredEquipment()
  const stats = getEquipmentStats()

  const columns = [
    {
      key: 'name',
      title: 'Nářadí',
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.category}</div>
        </div>
      )
    },
    {
      key: 'details',
      title: 'Detaily',
      render: (_, row) => (
        <div>
          <div className="text-sm text-gray-900">
            {row.manufacturer} {row.model}
          </div>
          {row.serial_number && (
            <div className="text-sm text-gray-500">SN: {row.serial_number}</div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      title: 'Stav',
      render: (value, row) => (
        <div>
          <StatusBadge 
            status={value}
            statusLabels={STATUS_LABELS}
            statusColors={STATUS_COLORS}
          />
          {value === EQUIPMENT_STATUS.BORROWED && row.borrowed_by_name && (
            <div className="text-xs text-gray-500 mt-1">
              Vypůjčeno: {row.borrowed_by_name}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'location',
      title: 'Umístění',
      render: (value) => (
        <div className="max-w-xs">
          <p className="truncate text-sm">{value || '-'}</p>
        </div>
      )
    },
    {
      key: 'current_value',
      title: 'Současná hodnota',
      render: (value) => <CurrencyCell amount={value} />
    },
    {
      key: 'actions',
      title: 'Akce',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          {row.status === EQUIPMENT_STATUS.AVAILABLE && (
            <ActionButton
              icon="fas fa-hand-paper"
              tooltip="Vypůjčit"
              onClick={() => handleBorrow(row)}
              variant="ghost"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            />
          )}
          {row.status === EQUIPMENT_STATUS.BORROWED && (
            <ActionButton
              icon="fas fa-undo"
              tooltip="Vrátit"
              onClick={() => handleReturn(row)}
              variant="ghost"
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            />
          )}
          <ActionButton
            icon="fas fa-wrench"
            tooltip="Servis"
            onClick={() => handleService(row)}
            variant="ghost"
            className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
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
          <h1 className="text-2xl font-bold text-gray-900">Nářadí</h1>
          <p className="text-gray-600 mt-1">Správa nářadí a vybavení</p>
        </div>
        <Button onClick={handleAddNew} className="bg-primary-600 hover:bg-primary-700">
          <i className="fas fa-plus mr-2" />
          Přidat nářadí
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
                <i className="fas fa-tools text-blue-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">K dispozici</p>
                <p className="text-2xl font-bold text-green-600">{stats.available}</p>
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
                <p className="text-sm font-medium text-gray-600">Vypůjčeno</p>
                <p className="text-2xl font-bold text-orange-600">{stats.borrowed}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-hand-paper text-orange-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">V servisu</p>
                <p className="text-2xl font-bold text-red-600">{stats.inService}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-wrench text-red-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Hodnota</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-coins text-purple-600" />
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
              placeholder="Hledat nářadí..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              icon="fas fa-search"
            />
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Všechny stavy</option>
              <option value={EQUIPMENT_STATUS.AVAILABLE}>{STATUS_LABELS[EQUIPMENT_STATUS.AVAILABLE]}</option>
              <option value={EQUIPMENT_STATUS.BORROWED}>{STATUS_LABELS[EQUIPMENT_STATUS.BORROWED]}</option>
              <option value={EQUIPMENT_STATUS.SERVICE}>{STATUS_LABELS[EQUIPMENT_STATUS.SERVICE]}</option>
              <option value={EQUIPMENT_STATUS.RETIRED}>{STATUS_LABELS[EQUIPMENT_STATUS.RETIRED]}</option>
            </select>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Všechny kategorie</option>
              {EQUIPMENT_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <Button
              variant="outline"
              onClick={() => setFilters({ status: '', category: '', search: '' })}
            >
              Vymazat filtry
            </Button>
          </div>
        </div>
      </Card>

      {/* Equipment Table */}
      <Card>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Nářadí ({filteredEquipment.length})
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
          data={filteredEquipment}
          columns={columns}
          loading={isLoading}
          emptyMessage="Žádné nářadí nenalezeno"
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setEditingEquipment(null)
          reset()
        }}
        title={editingEquipment ? 'Upravit nářadí' : 'Nové nářadí'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Název nářadí *"
              {...register('name', { required: 'Název je povinný' })}
              error={errors.name?.message}
            />
            <select
              {...register('category', { required: 'Kategorie je povinná' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Vyberte kategorii</option>
              {EQUIPMENT_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Výrobce"
              {...register('manufacturer')}
            />
            <Input
              label="Model"
              {...register('model')}
            />
            <Input
              label="Sériové číslo"
              {...register('serial_number')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Datum nákupu"
              type="date"
              {...register('purchase_date')}
            />
            <Input
              label="Nákupní cena"
              type="number"
              step="0.01"
              {...register('purchase_price')}
            />
            <Input
              label="Současná hodnota"
              type="number"
              step="0.01"
              {...register('current_value')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              {...register('status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value={EQUIPMENT_STATUS.AVAILABLE}>{STATUS_LABELS[EQUIPMENT_STATUS.AVAILABLE]}</option>
              <option value={EQUIPMENT_STATUS.BORROWED}>{STATUS_LABELS[EQUIPMENT_STATUS.BORROWED]}</option>
              <option value={EQUIPMENT_STATUS.SERVICE}>{STATUS_LABELS[EQUIPMENT_STATUS.SERVICE]}</option>
              <option value={EQUIPMENT_STATUS.RETIRED}>{STATUS_LABELS[EQUIPMENT_STATUS.RETIRED]}</option>
            </select>
            <Input
              label="Umístění"
              {...register('location')}
              placeholder="Kde se nářadí nachází"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poznámky
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Dodatečné informace o nářadí..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddModal(false)
                setEditingEquipment(null)
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
              {editingEquipment ? 'Uložit změny' : 'Přidat nářadí'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setEquipmentToDelete(null)
        }}
        title="Smazat nářadí"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Opravdu chcete smazat nářadí "{equipmentToDelete?.name}"? Tato akce je nevratná.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false)
                setEquipmentToDelete(null)
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

export default EquipmentPage
