import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useVehiclesStore from '../../store/vehiclesStore'
import useAuthStore from '../../store/authStore'
import { Button, Card, StatusBadge, Modal, Spinner } from '../../components/ui'
import { usePermissions } from '../../components/common/ProtectedRoute'
import { formatCurrency, formatDate } from '../../utils/helpers'
import { VEHICLE_STATUS, STATUS_LABELS, STATUS_COLORS } from '../../utils/constants'

const VehiclesPage = () => {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { 
    vehicles, 
    isLoading, 
    filters, 
    types,
    brands,
    expiringDocuments,
    setFilters, 
    clearFilters, 
    loadVehicles, 
    loadTypes,
    loadBrands,
    loadExpiringDocuments,
    deleteVehicle,
    assignVehicle,
    unassignVehicle,
    sendToService,
    returnFromService,
    getVehiclesOverview 
  } = useVehiclesStore()
  const { hasPermission } = usePermissions()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Load data on mount
  useEffect(() => {
    loadVehicles()
    loadTypes()
    loadBrands()
    loadExpiringDocuments()
  }, [loadVehicles, loadTypes, loadBrands, loadExpiringDocuments])

  const overview = getVehiclesOverview()

  const handleCreateVehicle = () => {
    setSelectedVehicle(null)
    setShowCreateModal(true)
  }

  const handleEditVehicle = (vehicle) => {
    setSelectedVehicle(vehicle)
    setShowEditModal(true)
  }

  const handleAssignVehicle = (vehicle) => {
    setSelectedVehicle(vehicle)
    setShowAssignModal(true)
  }

  const handleUnassignVehicle = async (vehicle) => {
    const result = await unassignVehicle(vehicle.id)
    if (result.success) {
      loadVehicles(true)
    }
  }

  const handleSendToService = async (vehicle) => {
    const result = await sendToService(vehicle.id, 'Odesláno do servisu')
    if (result.success) {
      loadVehicles(true)
    }
  }

  const handleReturnFromService = async (vehicle) => {
    const result = await returnFromService(vehicle.id, 'Vráceno ze servisu')
    if (result.success) {
      loadVehicles(true)
    }
  }

  const handleDeleteVehicle = async () => {
    if (!selectedVehicle) return
    
    const result = await deleteVehicle(selectedVehicle.id)
    if (result.success) {
      setShowDeleteConfirm(false)
      setSelectedVehicle(null)
    }
  }

  const confirmDelete = (vehicle) => {
    setSelectedVehicle(vehicle)
    setShowDeleteConfirm(true)
  }

  const handleFormSuccess = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setShowAssignModal(false)
    setSelectedVehicle(null)
    loadVehicles(true)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case VEHICLE_STATUS.ACTIVE:
        return 'fas fa-check-circle text-green-600'
      case VEHICLE_STATUS.SERVICE:
        return 'fas fa-wrench text-orange-600'
      case VEHICLE_STATUS.RETIRED:
        return 'fas fa-times-circle text-red-600'
      default:
        return 'fas fa-question-circle text-gray-600'
    }
  }

  const isDocumentExpiring = (date) => {
    if (!date) return false
    const expiryDate = new Date(date)
    const today = new Date()
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    return expiryDate <= nextMonth && expiryDate >= today
  }

  const isDocumentExpired = (date) => {
    if (!date) return false
    const expiryDate = new Date(date)
    const today = new Date()
    return expiryDate < today
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vozidla</h1>
          <p className="text-gray-600 mt-1">Správa firemních vozidel a dokumentů</p>
        </div>
        {hasPermission('vehicles_create') && (
          <Button 
            onClick={handleCreateVehicle}
            className="bg-primary-600 hover:bg-primary-700"
          >
            <i className="fas fa-plus mr-2" />
            Přidat vozidlo
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Celkem</p>
                <p className="text-2xl font-bold text-gray-900">{overview.total}</p>
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
                <p className="text-2xl font-bold text-green-600">{overview.active}</p>
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
                <p className="text-sm font-medium text-gray-600">Přiřazené</p>
                <p className="text-2xl font-bold text-blue-600">{overview.assigned}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-user text-blue-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">V servisu</p>
                <p className="text-2xl font-bold text-orange-600">{overview.inService}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-wrench text-orange-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Hodnota</p>
                <p className="text-xl font-bold text-purple-600">{formatCurrency(overview.totalValue)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-coins text-purple-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Expiring Documents Alert */}
      {expiringDocuments && expiringDocuments.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <div className="p-6">
            <div className="flex items-center">
              <i className="fas fa-exclamation-triangle text-orange-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-orange-900">
                  Pozor! Expirující dokumenty
                </h3>
                <p className="text-orange-700 mt-1">
                  {expiringDocuments.length} vozidel má expirující nebo prošlé dokumenty
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hledat
              </label>
              <input
                type="text"
                placeholder="Název, značka, SPZ..."
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Typ
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Všechny typy</option>
                {types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Značka
              </label>
              <select
                value={filters.brand}
                onChange={(e) => setFilters({ brand: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Všechny značky</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stav
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Všechny stavy</option>
                <option value={VEHICLE_STATUS.ACTIVE}>Aktivní</option>
                <option value={VEHICLE_STATUS.SERVICE}>V servisu</option>
                <option value={VEHICLE_STATUS.RETIRED}>Vyřazené</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={clearFilters}
                variant="outline"
                className="w-full"
              >
                <i className="fas fa-times mr-2" />
                Vymazat filtry
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Vehicles Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vozidlo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stav
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Přiřazeno
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dokumenty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hodnota
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akce
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <Spinner size="lg" />
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="text-center">
                      <i className="fas fa-car text-4xl text-gray-300 mb-4" />
                      <p>Žádná vozidla</p>
                    </div>
                  </td>
                </tr>
              ) : (
                vehicles.map(vehicle => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                          <i className="fas fa-car text-gray-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {vehicle.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {vehicle.brand} {vehicle.model} • {vehicle.license_plate}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <i className={`${getStatusIcon(vehicle.status)} mr-2`} />
                        <StatusBadge 
                          status={vehicle.status}
                          statusLabels={STATUS_LABELS}
                          statusColors={STATUS_COLORS}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {vehicle.assigned_to_user ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {vehicle.assigned_to_user.first_name} {vehicle.assigned_to_user.last_name}
                          </div>
                          <div className="text-gray-500">
                            {vehicle.assigned_to_user.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Nepřiřazeno</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {vehicle.insurance_expiry && (
                          <div className={`flex items-center ${
                            isDocumentExpired(vehicle.insurance_expiry) ? 'text-red-600' :
                            isDocumentExpiring(vehicle.insurance_expiry) ? 'text-orange-600' : 'text-gray-500'
                          }`}>
                            <i className="fas fa-shield-alt mr-1" />
                            Pojištění: {formatDate(vehicle.insurance_expiry)}
                          </div>
                        )}
                        {vehicle.stk_expiry && (
                          <div className={`flex items-center ${
                            isDocumentExpired(vehicle.stk_expiry) ? 'text-red-600' :
                            isDocumentExpiring(vehicle.stk_expiry) ? 'text-orange-600' : 'text-gray-500'
                          }`}>
                            <i className="fas fa-certificate mr-1" />
                            STK: {formatDate(vehicle.stk_expiry)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vehicle.current_value ? formatCurrency(vehicle.current_value) : 
                       vehicle.purchase_price ? formatCurrency(vehicle.purchase_price) : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {vehicle.status === VEHICLE_STATUS.ACTIVE && !vehicle.assigned_to && (
                          <Button
                            onClick={() => handleAssignVehicle(vehicle)}
                            size="sm"
                            variant="ghost"
                            title="Přiřadit"
                          >
                            <i className="fas fa-user-plus" />
                          </Button>
                        )}
                        {vehicle.assigned_to && (
                          <Button
                            onClick={() => handleUnassignVehicle(vehicle)}
                            size="sm"
                            variant="ghost"
                            title="Odebrat přiřazení"
                          >
                            <i className="fas fa-user-minus" />
                          </Button>
                        )}
                        {vehicle.status === VEHICLE_STATUS.ACTIVE && (
                          <Button
                            onClick={() => handleSendToService(vehicle)}
                            size="sm"
                            variant="ghost"
                            title="Do servisu"
                          >
                            <i className="fas fa-wrench" />
                          </Button>
                        )}
                        {vehicle.status === VEHICLE_STATUS.SERVICE && (
                          <Button
                            onClick={() => handleReturnFromService(vehicle)}
                            size="sm"
                            variant="ghost"
                            title="Vrátit ze servisu"
                          >
                            <i className="fas fa-undo" />
                          </Button>
                        )}
                        {hasPermission('vehicles_update') && (
                          <Button
                            onClick={() => handleEditVehicle(vehicle)}
                            size="sm"
                            variant="ghost"
                            title="Upravit"
                          >
                            <i className="fas fa-edit" />
                          </Button>
                        )}
                        {hasPermission('vehicles_delete') && (
                          <Button
                            onClick={() => confirmDelete(vehicle)}
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            title="Smazat"
                          >
                            <i className="fas fa-trash" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Přidat vozidlo"
        size="lg"
      >
        <div className="p-6">
          <div className="text-center py-8">
            <i className="fas fa-plus text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">
              Formulář pro vozidla bude implementován v další verzi
            </p>
            <Button onClick={() => setShowCreateModal(false)}>
              Zavřít
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Upravit vozidlo"
        size="lg"
      >
        <div className="p-6">
          <div className="text-center py-8">
            <i className="fas fa-edit text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">
              Formulář pro úpravu vozidel bude implementován v další verzi
            </p>
            <Button onClick={() => setShowEditModal(false)}>
              Zavřít
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Přiřadit vozidlo"
        size="md"
      >
        <div className="p-6">
          <div className="text-center py-8">
            <i className="fas fa-user-plus text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">
              Formulář pro přiřazení bude implementován v další verzi
            </p>
            <Button onClick={() => setShowAssignModal(false)}>
              Zavřít
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Smazat vozidlo"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Opravdu chcete smazat vozidlo <strong>{selectedVehicle?.name}</strong>?
            Tato akce nelze vrátit zpět.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              onClick={() => setShowDeleteConfirm(false)}
              variant="outline"
            >
              Zrušit
            </Button>
            <Button
              onClick={handleDeleteVehicle}
              variant="danger"
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
