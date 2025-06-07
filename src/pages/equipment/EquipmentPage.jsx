import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button, Table, Card, Input, Modal, StatusBadge, ActionButton, CurrencyCell, DateCell } from '../../components/ui'
import { EQUIPMENT_STATUS, EQUIPMENT_CATEGORIES, STATUS_LABELS, STATUS_COLORS } from '../../utils/constants'
import { formatCurrency, formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

const EquipmentPage = () => {
  const [equipment, setEquipment] = useState([])
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
      notes: ''
    }
  })

  // Mock data - replace with real API calls
  useEffect(() => {
    const mockEquipment = [
      {
        id: 1,
        name: 'Úhlová bruska 230mm',
        category: 'Elektrické nářadí',
        manufacturer: 'Bosch',
        model: 'GWS 22-230 JH',
        serial_number: 'BS2023001',
        purchase_date: '2023-03-15',
        purchase_price: 3500,
        current_value: 2800,
        status: EQUIPMENT_STATUS.AVAILABLE,
        location: 'Sklad A - Regál 3',
        notes: 'V dobrém stavu, poslední servis 12/2023',
        borrowed_by: null,
        borrowed_date: null,
        last_service: '2023-12-10',
        next_service: '2024-06-10'
      },
      {
        id: 2,
        name: 'Stavební míchačka 200L',
        category: 'Stavební stroje',
        manufacturer: 'Altrad',
        model: 'B200E',
        serial_number: 'AT2022045',
        purchase_date: '2022-05-20',
        purchase_price: 15000,
        current_value: 12000,
        status: EQUIPMENT_STATUS.BORROWED,
        location: 'Projekt - Stavba domu Novák',
        notes: 'Vypůjčeno na projekt',
        borrowed_by: 'Jan Dvořák',
        borrowed_date: '2024-01-10',
        last_service: '2023-11-15',
        next_service: '2024-05-15'
      },
      {
        id: 3,
        name: 'Vrtací kladivo SDS-max',
        category: 'Elektrické nářadí',
        manufacturer: 'Makita',
        model: 'HR4013C',
        serial_number: 'MK2023078',
        purchase_date: '2023-08-10',
        purchase_price: 8500,
        current_value: 7200,
        status: EQUIPMENT_STATUS.SERVICE,
        location: 'Servis - Makita',
        notes: 'V servisu od 15.1.2024 - výměna ložisek',
        borrowed_by: null,
        borrowed_date: null,
        last_service: '2024-01-15',
        next_service: '2024-07-15'
      }
    ]

    setTimeout(() => {
      setEquipment(mockEquipment)
      setIsLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    if (editingEquipment) {
      Object.keys(editingEquipment).forEach(key => {
        if (key === 'purchase_date') {
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
          item.borrowed_by
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
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newEquipment = {
        ...data,
        id: editingEquipment ? editingEquipment.id : Date.now(),
        purchase_price: parseFloat(data.purchase_price) || 0,
        current_value: parseFloat(data.current_value) || 0,
        last_updated: new Date().toISOString()
      }

      if (editingEquipment) {
        setEquipment(prev => prev.map(e => e.id === editingEquipment.id ? newEquipment : e))
        toast.success('Nářadí upraveno')
      } else {
        setEquipment(prev => [newEquipment, ...prev])
        toast.success('Nářadí přidáno')
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
    setEditingEquipment(null)
    reset()
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
      await new Promise(resolve => setTimeout(resolve, 500))
      setEquipment(prev => prev.filter(e => e.id !== equipmentToDelete.id))
      toast.success('Nářadí smazáno')
      setShowDeleteModal(false)
      setEquipmentToDelete(null)
    } catch (error) {
      toast.error('Chyba při mazání')
    } finally {
      setDeleteLoading(false)
    }
  }

  const filteredEquipment = getFilteredEquipment()
  const stats = getEquipmentStats()

  const columns = [
    {
      key: 'name',
      title: 'Nářadí/Stroj',
      render: (value, row) => (
        <div>
          <div className="font-semibold text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">
            {row.manufacturer} {row.model}
          </div>
          <div className="text-xs text-gray-400">{row.serial_number}</div>
        </div>
      )
    },
    {
      key: 'category',
      title: 'Kategorie',
      render: (value) => value || '-'
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
          {row.borrowed_by && (
            <div className="text-xs text-gray-500 mt-1">
              Vypůjčil: {row.borrowed_by}
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
              onClick={() => console.log('Borrow equipment', row)}
              variant="ghost"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            />
          )}
          {row.status === EQUIPMENT_STATUS.BORROWED && (
            <ActionButton
              icon="fas fa-undo"
              tooltip="Vrátit"
              onClick={() => console.log('Return equipment', row)}
              variant="ghost"
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            />
          )}
          <ActionButton
            icon="fas fa-wrench"
            tooltip="Servis"
            onClick={() => console.log('Service equipment', row)}
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

  const statusOptions = [
    { value: '', label: 'Všechny stavy' },
    { value: EQUIPMENT_STATUS.AVAILABLE, label: STATUS_LABELS[EQUIPMENT_STATUS.AVAILABLE] },
    { value: EQUIPMENT_STATUS.BORROWED, label: STATUS_LABELS[EQUIPMENT_STATUS.BORROWED] },
    { value: EQUIPMENT_STATUS.SERVICE, label: STATUS_LABELS[EQUIPMENT_STATUS.SERVICE] },
    { value: EQUIPMENT_STATUS.RETIRED, label: STATUS_LABELS[EQUIPMENT_STATUS.RETIRED] }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nářadí & Stroje</h1>
          <p className="text-gray-600">Správa nářadí, strojů a jejich výpůjček</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => console.log('QR scan')}
            icon="fas fa-qrcode"
          >
            Skenovat QR
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            icon="fas fa-plus"
          >
            Přidat nářadí
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-tools text-blue-600 text-xl" />
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
              <p className="text-sm text-gray-600">K dispozici</p>
              <p className="text-2xl font-bold text-green-600">{stats.available}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-hand-paper text-yellow-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Vypůjčeno</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.borrowed}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-wrench text-red-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">V servisu</p>
              <p className="text-2xl font-bold text-red-600">{stats.inService}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-coins text-purple-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Celková hodnota</p>
              <p className="text-lg font-bold text-purple-600">{formatCurrency(stats.totalValue)}</p>
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
              placeholder="Hledat nářadí..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              icon="fas fa-search"
            />
            
            <Input
              type="select"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Input>

            <Input
              type="select"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">Všechny kategorie</option>
              {EQUIPMENT_CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Input>

            <Button
              variant="outline"
              onClick={() => setFilters({ search: '', status: '', category: '' })}
              size="sm"
            >
              Vymazat filtry
            </Button>
          </div>
        </div>
      </Card>

      {/* Equipment Table */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Inventář nářadí ({filteredEquipment.length})
            </h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" icon="fas fa-download">
                Export
              </Button>
              <Button variant="outline" size="sm" icon="fas fa-print">
                QR štítky
              </Button>
            </div>
          </div>
        </div>
        
        <Table
          columns={columns}
          data={filteredEquipment}
          loading={isLoading}
          emptyMessage="Žádné nářadí nenalezeno"
          emptyIcon="fas fa-tools"
        />
      </Card>

      {/* Add/Edit Equipment Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        title={editingEquipment ? 'Upravit nářadí' : 'Nové nářadí'}
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
              {editingEquipment ? 'Uložit změny' : 'Přidat nářadí'}
            </Button>
          </>
        }
      >
        <form className="space-y-6">
          <Input
            {...register('name', { required: 'Název je povinný' })}
            label="Název nářadí/stroje"
            type="text"
            placeholder="Úhlová bruska 230mm"
            error={errors.name?.message}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('category', { required: 'Kategorie je povinná' })}
              label="Kategorie"
              type="select"
              error={errors.category?.message}
              required
            >
              <option value="">Vyberte kategorii</option>
              {EQUIPMENT_CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Input>
            
            <Input
              {...register('status')}
              label="Stav"
              type="select"
            >
              {statusOptions.slice(1).map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Input>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              {...register('manufacturer')}
              label="Výrobce"
              type="text"
              placeholder="Bosch"
            />
            
            <Input
              {...register('model')}
              label="Model"
              type="text"
              placeholder="GWS 22-230 JH"
            />
            
            <Input
              {...register('serial_number')}
              label="Sériové číslo"
              type="text"
              placeholder="BS2023001"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              {...register('purchase_date')}
              label="Datum nákupu"
              type="date"
            />
            
            <Input
              {...register('purchase_price')}
              label="Pořizovací cena"
              type="number"
              step="0.01"
              placeholder="0.00"
              suffix="Kč"
            />
            
            <Input
              {...register('current_value')}
              label="Současná hodnota"
              type="number"
              step="0.01"
              placeholder="0.00"
              suffix="Kč"
            />
          </div>

          <Input
            {...register('location')}
            label="Umístění"
            type="text"
            placeholder="Sklad A - Regál 3"
          />

          <Input
            {...register('notes')}
            label="Poznámky"
            type="textarea"
            rows={3}
            placeholder="Dodatečné informace o nářadí..."
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Smazat nářadí"
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
              <p className="font-medium">Opravdu chcete smazat toto nářadí?</p>
              <p className="text-sm text-gray-600 mt-1">Tato akce je nevratná.</p>
            </div>
          </div>
          
          {equipmentToDelete && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium text-gray-900">{equipmentToDelete.name}</p>
              <p className="text-sm text-gray-600 mt-1">
                {equipmentToDelete.manufacturer} {equipmentToDelete.model}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default EquipmentPage
