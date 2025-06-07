import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button, Table, Card, Input, Modal, StatusBadge, ActionButton, CurrencyCell, DateCell } from '../../components/ui'
import { VEHICLE_STATUS, STATUS_LABELS, STATUS_COLORS } from '../../utils/constants'
import { formatCurrency, formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState([])
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

  // Mock data - replace with real API calls
  useEffect(() => {
    const mockVehicles = [
      {
        id: 1,
        name: 'Dodávka Mercedes Sprinter',
        type: 'van',
        brand: 'Mercedes-Benz',
        model: 'Sprinter 316 CDI',
        year: 2020,
        license_plate: '1A2 3456',
        vin: 'WDB9061451234567',
        fuel_type: 'diesel',
        status: VEHICLE_STATUS.ACTIVE,
        purchase_date: '2020-03-15',
        purchase_price: 850000,
        current_value: 650000,
        insurance_expiry: '2024-12-31',
        stk_expiry: '2024-06-15',
        assigned_to: 'Jan Dvořák',
        notes: 'Hlavní pracovní vozidlo, dobný stav',
        mileage: 95000,
        last_service: '2023-12-10',
        next_service: '2024-06-10',
        fuel_consumption: 8.5,
        monthly_costs: 15000
      },
      {
        id: 2,
        name: 'Nákladní auto Iveco',
        type: 'truck',
        brand: 'Iveco',
        model: 'Daily 35S14',
        year: 2019,
        license_plate: '2B4 7890',
        vin: 'ZCFC351A201234567',
        fuel_type: 'diesel',
        status: VEHICLE_STATUS.ACTIVE,
        purchase_date: '2019-08-20',
        purchase_price: 1200000,
        current_value: 800000,
        insurance_expiry: '2024-11-30',
        stk_expiry: '2024-08-20',
        assigned_to: 'Tomáš Svoboda',
        notes: 'Pro přepravu těžkých materiálů',
        mileage: 120000,
        last_service: '2024-01-05',
        next_service: '2024-07-05',
        fuel_consumption: 12.0,
        monthly_costs: 18000
      },
      {
        id: 3,
        name: 'Osobní auto Škoda Octavia',
        type: 'car',
        brand: 'Škoda',
        model: 'Octavia Combi 2.0 TDI',
        year: 2021,
        license_plate: '3C5 1234',
        vin: 'TMBJF71Z6L1234567',
        fuel_type: 'diesel',
        status: VEHICLE_STATUS.SERVICE,
        purchase_date: '2021-05-10',
        purchase_price: 650000,
        current_value: 480000,
        insurance_expiry: '2024-10-15',
        stk_expiry: '2025-05-10',
        assigned_to: null,
        notes: 'V servisu - výměna spojky',
        mileage: 65000,
        last_service: '2024-01-15',
        next_service: '2024-07-15',
        fuel_consumption: 5.2,
        monthly_costs: 8000
      }
    ]

    setTimeout(() => {
      setVehicles(mockVehicles)
      setIsLoading(false)
    }, 1000)
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
          vehicle.assigned_to
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

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newVehicle = {
        ...data,
        id: editingVehicle ? editingVehicle.id : Date.now(),
        year: parseInt(data.year) || new Date().getFullYear(),
        purchase_price: parseFloat(data.purchase_price) || 0,
        current_value: parseFloat(data.current_value) || 0,
        mileage: editingVehicle?.mileage || 0,
        monthly_costs: editingVehicle?.monthly_costs || 0,
        created_at: editingVehicle?.created_at || new Date().toISOString()
      }

      if (editingVehicle) {
        setVehicles(prev => prev.map(v => v.id === editingVehicle.id ? newVehicle : v))
        toast.success('Vozidlo upraveno')
      } else {
        setVehicles(prev => [newVehicle, ...prev])
        toast.success('Vozidlo přidáno')
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
    setEditingVehicle(null)
    reset()
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
      await new Promise(resolve => setTimeout(resolve, 500))
      setVehicles(prev => prev.filter(v => v.id !== vehicleToDelete.id))
      toast.success('Vozidlo smazáno')
      setShowDeleteModal(false)
      setVehicleToDelete(null)
    } catch (error) {
      toast.error('Chyba při mazání')
    } finally {
      setDeleteLoading(false)
    }
  }

  const filteredVehicles = getFilteredVehicles()
  const stats = getVehicleStats()

  const columns = [
    {
      key: 'vehicle',
      title: 'Vozidlo',
      render: (_, row) => (
        <div>
          <div className="font-semibold text-gray-900">{row.name}</div>
          <div className="text-sm text-gray-500">
            {row.brand} {row.model} ({row.year})
          </div>
          <div className="text-xs text-gray-400 font-mono">{row.license_plate}</div>
        </div>
      )
    },
    {
      key: 'type',
      title: 'Typ',
      render: (value) => {
        const typeLabels = {
          car: 'Osobní',
          van: 'Dodávka',
          truck: 'Nákladní',
          machinery: 'Stroj'
        }
        return typeLabels[value] || value
      }
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
          {row.assigned_to && (
            <div className="text-xs text-gray-500 mt-1">
              Přidělen: {row.assigned_to}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'mileage',
      title: 'Najeto',
      render: (value) => value ? `${value.toLocaleString('cs-CZ')} km` : '-'
    },
    {
      key: 'stk_expiry',
      title: 'STK do',
      render: (value) => {
        if (!value) return '-'
        const isExpiring = new Date(value) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        return (
          <span className={isExpiring ? 'text-red-600 font-medium' : ''}>
            {formatDate(value)}
            {isExpiring && <i className="fas fa-exclamation-triangle ml-1 text-red-500" />}
          </span>
        )
      }
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
          <ActionButton
            icon="fas fa-gas-pump"
            tooltip="Tankování"
            onClick={() => console.log('Add fuel record', row)}
            variant="ghost"
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          />
          <ActionButton
            icon="fas fa-wrench"
            tooltip="Servis"
            onClick={() => console.log('Service record', row)}
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

  const vehicleTypes = [
    { value: 'car', label: 'Osobní auto' },
    { value: 'van', label: 'Dodávka' },
    { value: 'truck', label: 'Nákladní auto' },
    { value: 'machinery', label: 'Stavební stroj' }
  ]

  const fuelTypes = [
    { value: 'petrol', label: 'Benzín' },
    { value: 'diesel', label: 'Nafta' },
    { value: 'electric', label: 'Elektřina' },
    { value: 'hybrid', label: 'Hybrid' }
  ]

  const statusOptions = [
    { value: '', label: 'Všechny stavy' },
    { value: VEHICLE_STATUS.ACTIVE, label: STATUS_LABELS[VEHICLE_STATUS.ACTIVE] },
    { value: VEHICLE_STATUS.SERVICE, label: STATUS_LABELS[VEHICLE_STATUS.SERVICE] },
    { value: VEHICLE_STATUS.RETIRED, label: STATUS_LABELS[VEHICLE_STATUS.RETIRED] }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vozový park</h1>
          <p className="text-gray-600">Správa vozidel, tankování a servisu</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => console.log('Add fuel record')}
            icon="fas fa-gas-pump"
          >
            Tankování
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            icon="fas fa-plus"
          >
            Přidat vozidlo
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-car text-blue-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Celkem vozidel</p>
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
              <i className="fas fa-wrench text-yellow-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">V servisu</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.inService}</p>
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

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-calendar text-red-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Měsíční náklady</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(stats.monthlyCosts)}</p>
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
              placeholder="Hledat vozidla..."
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
              {vehicleTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Input>

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

            <Button
              variant="outline"
              onClick={() => setFilters({ search: '', type: '', status: '' })}
              size="sm"
            >
              Vymazat filtry
            </Button>
          </div>
        </div>
      </Card>

      {/* Vehicles Table */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Vozový park ({filteredVehicles.length})
            </h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" icon="fas fa-download">
                Export
              </Button>
              <Button variant="outline" size="sm" icon="fas fa-chart-line">
                Reporty
              </Button>
            </div>
          </div>
        </div>
        
        <Table
          columns={columns}
          data={filteredVehicles.map(vehicle => ({
            ...vehicle,
            _highlight: vehicle.stk_expiry && new Date(vehicle.stk_expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }))}
          loading={isLoading}
          emptyMessage="Žádná vozidla nenalezena"
          emptyIcon="fas fa-car"
        />
      </Card>

      {/* Add/Edit Vehicle Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        title={editingVehicle ? 'Upravit vozidlo' : 'Nové vozidlo'}
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
              {editingVehicle ? 'Uložit změny' : 'Přidat vozidlo'}
            </Button>
          </>
        }
      >
        <form className="space-y-6">
          <Input
            {...register('name', { required: 'Název vozidla je povinný' })}
            label="Název vozidla"
            type="text"
            placeholder="Dodávka Mercedes Sprinter"
            error={errors.name?.message}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('type', { required: 'Typ je povinný' })}
              label="Typ vozidla"
              type="select"
              error={errors.type?.message}
              required
            >
              <option value="">Vyberte typ</option>
              {vehicleTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Input>
            
            <Input
              {...register('fuel_type')}
              label="Typ paliva"
              type="select"
            >
              {fuelTypes.map(fuel => (
                <option key={fuel.value} value={fuel.value}>
                  {fuel.label}
                </option>
              ))}
            </Input>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              {...register('brand')}
              label="Značka"
              type="text"
              placeholder="Mercedes-Benz"
            />
            
            <Input
              {...register('model')}
              label="Model"
              type="text"
              placeholder="Sprinter 316 CDI"
            />
            
            <Input
              {...register('year')}
              label="Rok výroby"
              type="number"
              min="1900"
              max={new Date().getFullYear() + 1}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('license_plate', { required: 'SPZ je povinná' })}
              label="SPZ"
              type="text"
              placeholder="1A2 3456"
              error={errors.license_plate?.message}
              required
            />
            
            <Input
              {...register('vin')}
              label="VIN"
              type="text"
              placeholder="WDB9061451234567"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('insurance_expiry')}
              label="Pojištění do"
              type="date"
            />
            
            <Input
              {...register('stk_expiry')}
              label="STK do"
              type="date"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            
            <Input
              {...register('assigned_to')}
              label="Přiděleno"
              type="text"
              placeholder="Jan Novák"
            />
          </div>

          <Input
            {...register('notes')}
            label="Poznámky"
            type="textarea"
            rows={3}
            placeholder="Dodatečné informace o vozidle..."
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Smazat vozidlo"
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
              <p className="font-medium">Opravdu chcete smazat toto vozidlo?</p>
              <p className="text-sm text-gray-600 mt-1">Tato akce je nevratná.</p>
            </div>
          </div>
          
          {vehicleToDelete && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium text-gray-900">{vehicleToDelete.name}</p>
              <p className="text-sm text-gray-600 mt-1">
                {vehicleToDelete.brand} {vehicleToDelete.model} • {vehicleToDelete.license_plate}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default VehiclesPage
