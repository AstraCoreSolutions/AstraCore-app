import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button, Table, Card, Input, Modal, StatusBadge, ActionButton, CurrencyCell, DateCell } from '../../components/ui'
import { VEHICLE_STATUS, STATUS_LABELS, STATUS_COLORS } from '../../utils/constants'
import { formatCurrency, formatDate } from '../../utils/helpers'
import { supabase } from '../../config/supabase'
import toast from 'react-hot-toast'

const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState([])
  const [employees, setEmployees] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [vehicleToDelete, setVehicleToDelete] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: ''
  })

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      type: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      license_plate: '',
      vin: '',
      fuel_type: 'diesel',
      status: VEHICLE_STATUS.ACTIVE,
      purchase_date: '',
      purchase_price: '',
      current_value: '',
      insurance_expiry: '',
      stk_expiry: '',
      assigned_to: '',
      notes: ''
    }
  })

  const vehicleTypes = [
    { value: 'car', label: 'Osobní auto' },
    { value: 'van', label: 'Dodávka' },
    { value: 'truck', label: 'Nákladní auto' },
    { value: 'trailer', label: 'Přívěs' },
    { value: 'machinery', label: 'Stavební stroj' },
    { value: 'other', label: 'Ostatní' }
  ]

  const fuelTypes = [
    { value: 'petrol', label: 'Benzín' },
    { value: 'diesel', label: 'Nafta' },
    { value: 'electric', label: 'Elektřina' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'lpg', label: 'LPG' },
    { value: 'other', label: 'Ostatní' }
  ]

  // Load vehicles from Supabase
  const loadVehicles = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          assigned_user:profiles!vehicles_assigned_to_fkey(first_name, last_name)
        `)
        .order('name')

      if (error) throw error

      const vehiclesWithDetails = data?.map(vehicle => ({
        ...vehicle,
        assigned_to_name: vehicle.assigned_user 
          ? `${vehicle.assigned_user.first_name} ${vehicle.assigned_user.last_name}`.trim()
          : null
      })) || []

      setVehicles(vehiclesWithDetails)
    } catch (error) {
      console.error('Error loading vehicles:', error)
      toast.error('Chyba při načítání vozového parku')
    } finally {
      setIsLoading(false)
    }
  }

  // Load employees for assignment dropdown
  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .order('first_name')

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error('Error loading employees:', error)
    }
  }

  useEffect(() => {
    loadVehicles()
    loadEmployees()
  }, [])

  useEffect(() => {
    if (editingVehicle) {
      Object.keys(editingVehicle).forEach(key => {
        if (key.includes('_date') || key.includes('_expiry')) {
          setValue(key, editingVehicle[key]?.split('T')[0])
        } else {
          setValue(key, editingVehicle[key] || '')
        }
      })
    }
  }, [editingVehicle, setValue])

  const getFilteredVehicles = () => {
    return vehicles.filter(vehicle => {
      // Type filter
      if (filters.type && vehicle.type !== filters.type) {
        return false
      }
      
      // Status filter
      if (filters.status && vehicle.status !== filters.status) {
        return false
      }
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const searchFields = [
          vehicle.name,
          vehicle.brand,
          vehicle.model,
          vehicle.license_plate,
          vehicle.assigned_to_name
        ].filter(Boolean)
        
        const matchesSearch = searchFields.some(field => 
          field.toLowerCase().includes(searchLower)
        )
        
        if (!matchesSearch) return false
      }
      
      return true
    })
  }

  const getVehicleStats = () => {
    const total = vehicles.length
    const active = vehicles.filter(v => v.status === VEHICLE_STATUS.ACTIVE).length
    const inService = vehicles.filter(v => v.status === VEHICLE_STATUS.SERVICE).length
    const totalValue = vehicles.reduce((sum, v) => sum + (v.current_value || 0), 0)
    const monthlyCosts = vehicles.reduce((sum, v) => sum + (v.monthly_costs || 0), 0)

    return { total, active, inService, totalValue, monthlyCosts }
  }

  const getExpiringDocuments = () => {
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    return vehicles.filter(vehicle => {
      const insuranceExpiry = vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry) : null
      const stkExpiry = vehicle.stk_expiry ? new Date(vehicle.stk_expiry) : null
      
      return (insuranceExpiry && insuranceExpiry <= thirtyDaysFromNow) ||
             (stkExpiry && stkExpiry <= thirtyDaysFromNow)
    })
  }

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      const vehicleData = {
        ...data,
        year: parseInt(data.year) || new Date().getFullYear(),
        purchase_price: parseFloat(data.purchase_price) || 0,
        current_value: parseFloat(data.current_value) || 0,
        assigned_to: data.assigned_to || null,
        purchase_date: data.purchase_date || null,
        insurance_expiry: data.insurance_expiry || null,
        stk_expiry: data.stk_expiry || null
      }

      let result
      if (editingVehicle) {
        // Update existing vehicle
        result = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', editingVehicle.id)
          .select()
      } else {
        // Create new vehicle
        result = await supabase
          .from('vehicles')
          .insert([vehicleData])
          .select()
      }

      if (result.error) throw result.error

      toast.success(editingVehicle ? 'Vozidlo bylo aktualizováno' : 'Vozidlo bylo přidáno')
      
      // Reload vehicles
      await loadVehicles()
      
      // Reset form and close modal
      reset()
      setShowAddModal(false)
      setEditingVehicle(null)
      
    } catch (error) {
      console.error('Error saving vehicle:', error)
      toast.error('Chyba při ukládání vozidla')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle)
    setShowAddModal(true)
  }

  const handleDeleteClick = (vehicle) => {
    setVehicleToDelete(vehicle)
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!vehicleToDelete) return

    setDeleteLoading(true)
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleToDelete.id)

      if (error) throw error

      toast.success('Vozidlo bylo smazáno')
      await loadVehicles()
      setShowDeleteModal(false)
      setVehicleToDelete(null)
      
    } catch (error) {
      console.error('Error deleting vehicle:', error)
      toast.error('Chyba při mazání vozidla')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleAddNew = () => {
    setEditingVehicle(null)
    reset()
    setShowAddModal(true)
  }

  const filteredVehicles = getFilteredVehicles()
  const stats = getVehicleStats()
  const expiringDocs = getExpiringDocuments()

  const columns = [
    {
      key: 'name',
      title: 'Vozidlo',
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">
            {row.brand} {row.model} ({row.year})
          </div>
        </div>
      )
    },
    {
      key: 'license_plate',
      title: 'SPZ',
      render: (value) => (
        <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded inline-block">
          {value}
        </div>
      )
    },
    {
      key: 'type',
      title: 'Typ',
      render: (value) => {
        const type = vehicleTypes.find(t => t.value === value)
        return type?.label || value
      }
    },
    {
      key: 'status',
      title: 'Stav',
      render: (value) => (
        <StatusBadge 
          status={value}
          statusLabels={STATUS_LABELS}
          statusColors={STATUS_COLORS}
        />
      )
    },
    {
      key: 'assigned_to_name',
      title: 'Přiřazeno',
      render: (value) => value || (
        <span className="text-gray-400 italic">Nepřiřazeno</span>
      )
    },
    {
      key: 'current_value',
      title: 'Hodnota',
      render: (value) => <CurrencyCell amount={value} />
    },
    {
      key: 'expiry_status',
      title: 'Platnost dokladů',
      render: (_, row) => {
        const now = new Date()
        const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        
        const insuranceExpiry = row.insurance_expiry ? new Date(row.insurance_expiry) : null
        const stkExpiry = row.stk_expiry ? new Date(row.stk_expiry) : null
        
        const insuranceExpiring = insuranceExpiry && insuranceExpiry <= thirtyDays
        const stkExpiring = stkExpiry && stkExpiry <= thirtyDays
        
        if (insuranceExpiring || stkExpiring) {
          return (
            <div className="text-red-600">
              <i className="fas fa-exclamation-triangle mr-1" />
              Expiruje
            </div>
          )
        }
        
        return (
          <div className="text-green-600">
            <i className="fas fa-check-circle mr-1" />
            V pořádku
          </div>
        )
      }
    },
    {
      key: 'actions',
      title: 'Akce',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <ActionButton
            icon="fas fa-eye"
            tooltip="Zobrazit detail"
            onClick={() => console.log('View vehicle details', row)}
          />
          <ActionButton
            icon="fas fa-gas-pump"
            tooltip="Tankování"
            onClick={() => console.log('Add fuel record', row)}
            variant="ghost"
          />
          <ActionButton
            icon="fas fa-wrench"
            tooltip="Servis"
            onClick={() => console.log('Add service record', row)}
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
          <h1 className="text-2xl font-bold text-gray-900">Vozový park</h1>
          <p className="text-gray-600 mt-1">Správa vozidel a strojů</p>
        </div>
        <Button onClick={handleAddNew} className="bg-primary-600 hover:bg-primary-700">
          <i className="fas fa-plus mr-2" />
          Přidat vozidlo
        </Button>
      </div>

      {/* Expiring Documents Alert */}
      {expiringDocs.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <div className="p-4">
            <div className="flex items-center">
              <i className="fas fa-exclamation-triangle text-red-600 mr-3" />
              <div>
                <h3 className="text-red-800 font-medium">
                  Upozornění: Expirující doklady
                </h3>
                <p className="text-red-700 text-sm">
                  {expiringDocs.length} vozidel má expirující pojištění nebo STK do 30 dní
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Celkem vozidel</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-car text-blue-600" />
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
                <p className="text-sm font-medium text-gray-600">Celková hodnota</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-coins text-purple-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Měsíční náklady</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.monthlyCosts)}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-chart-line text-yellow-600" />
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
              placeholder="Hledat vozidlo..."
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
              {vehicleTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Všechny stavy</option>
              <option value={VEHICLE_STATUS.ACTIVE}>{STATUS_LABELS[VEHICLE_STATUS.ACTIVE]}</option>
              <option value={VEHICLE_STATUS.SERVICE}>{STATUS_LABELS[VEHICLE_STATUS.SERVICE]}</option>
              <option value={VEHICLE_STATUS.RETIRED}>{STATUS_LABELS[VEHICLE_STATUS.RETIRED]}</option>
            </select>
            <Button
              variant="outline"
              onClick={() => setFilters({ type: '', status: '', search: '' })}
            >
              Vymazat filtry
            </Button>
          </div>
        </div>
      </Card>

      {/* Vehicles Table */}
      <Card>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Vozidla ({filteredVehicles.length})
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
          data={filteredVehicles}
          columns={columns}
          loading={isLoading}
          emptyMessage="Žádná vozidla nenalezena"
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setEditingVehicle(null)
          reset()
        }}
        title={editingVehicle ? 'Upravit vozidlo' : 'Nové vozidlo'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Název vozidla *"
              {...register('name', { required: 'Název je povinný' })}
              error={errors.name?.message}
            />
            <select
              {...register('type', { required: 'Typ je povinný' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Vyberte typ</option>
              {vehicleTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Značka"
              {...register('brand')}
            />
            <Input
              label="Model"
              {...register('model')}
            />
            <Input
              label="Rok výroby"
              type="number"
              min="1900"
              max={new Date().getFullYear() + 1}
              {...register('year')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="SPZ *"
              {...register('license_plate', { required: 'SPZ je povinná' })}
              error={errors.license_plate?.message}
              placeholder="1A2 3456"
            />
            <Input
              label="VIN"
              {...register('vin')}
            />
            <select
              {...register('fuel_type')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {fuelTypes.map(fuel => (
                <option key={fuel.value} value={fuel.value}>{fuel.label}</option>
              ))}
            </select>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Pojištění do"
              type="date"
              {...register('insurance_expiry')}
            />
            <Input
              label="STK do"
              type="date"
              {...register('stk_expiry')}
            />
            <select
              {...register('status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value={VEHICLE_STATUS.ACTIVE}>{STATUS_LABELS[VEHICLE_STATUS.ACTIVE]}</option>
              <option value={VEHICLE_STATUS.SERVICE}>{STATUS_LABELS[VEHICLE_STATUS.SERVICE]}</option>
              <option value={VEHICLE_STATUS.RETIRED}>{STATUS_LABELS[VEHICLE_STATUS.RETIRED]}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Přiřazeno zaměstnanci
            </label>
            <select
              {...register('assigned_to')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Nepřiřazeno</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.first_name} {employee.last_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poznámky
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Dodatečné informace o vozidle..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddModal(false)
                setEditingVehicle(null)
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
              {editingVehicle ? 'Uložit změny' : 'Přidat vozidlo'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setVehicleToDelete(null)
        }}
        title="Smazat vozidlo"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Opravdu chcete smazat vozidlo "{vehicleToDelete?.name}"? Tato akce je nevratná.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false)
                setVehicleToDelete(null)
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

export default VehiclesPage
