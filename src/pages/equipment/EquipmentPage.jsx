import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useEquipmentStore from '../../store/equipmentStore'
import useAuthStore from '../../store/authStore'
import { Button, Card, StatusBadge, Modal, Spinner } from '../../components/ui'
import { usePermissions } from '../../components/common/ProtectedRoute'
import { formatCurrency, formatDate } from '../../utils/helpers'
import { EQUIPMENT_STATUS, STATUS_LABELS, STATUS_COLORS } from '../../utils/constants'

const EquipmentPage = () => {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { 
    equipment, 
    isLoading, 
    filters, 
    categories,
    locations,
    setFilters, 
    clearFilters, 
    loadEquipment, 
    loadCategories,
    loadLocations,
    deleteEquipment,
    borrowEquipment,
    returnEquipment,
    sendToService,
    getEquipmentOverview 
  } = useEquipmentStore()
  const { hasPermission } = usePermissions()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Load data on mount
  useEffect(() => {
    loadEquipment()
    loadCategories()
    loadLocations()
  }, [loadEquipment, loadCategories, loadLocations])

  const overview = getEquipmentOverview()

  const handleCreateEquipment = () => {
    setSelectedEquipment(null)
    setShowCreateModal(true)
  }

  const handleEditEquipment = (equipment) => {
    setSelectedEquipment(equipment)
    setShowEditModal(true)
  }

  const handleBorrowEquipment = (equipment) => {
    setSelectedEquipment(equipment)
    setShowBorrowModal(true)
  }

  const handleReturnEquipment = async (equipment) => {
    const result = await returnEquipment(equipment.id, 'Vráceno')
    if (result.success) {
      loadEquipment(true)
    }
  }

  const handleSendToService = async (equipment) => {
    const result = await sendToService(equipment.id, 'Odesláno do servisu')
    if (result.success) {
      loadEquipment(true)
    }
  }

  const handleDeleteEquipment = async () => {
    if (!selectedEquipment) return
    
    const result = await deleteEquipment(selectedEquipment.id)
    if (result.success) {
      setShowDeleteConfirm(false)
      setSelectedEquipment(null)
    }
  }

  const confirmDelete = (equipment) => {
    setSelectedEquipment(equipment)
    setShowDeleteConfirm(true)
  }

  const handleFormSuccess = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setShowBorrowModal(false)
    setSelectedEquipment(null)
    loadEquipment(true)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case EQUIPMENT_STATUS.AVAILABLE:
        return 'fas fa-check-circle text-green-600'
      case EQUIPMENT_STATUS.BORROWED:
        return 'fas fa-user text-blue-600'
      case EQUIPMENT_STATUS.SERVICE:
        return 'fas fa-wrench text-orange-600'
      case EQUIPMENT_STATUS.RETIRED:
        return 'fas fa-times-circle text-red-600'
      default:
        return 'fas fa-question-circle text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nářadí a vybavení</h1>
          <p className="text-gray-600 mt-1">Správa nářadí, strojů a vybavení</p>
        </div>
        {hasPermission('equipment_create') && (
          <Button 
            onClick={handleCreateEquipment}
            className="bg-primary-600 hover:bg-primary-700"
          >
            <i className="fas fa-plus mr-2" />
            Přidat nářadí
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
                <p className="text-2xl font-bold text-green-600">{overview.available}</p>
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
                <p className="text-2xl font-bold text-blue-600">{overview.borrowed}</p>
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
                placeholder="Název, výrobce, model..."
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategorie
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Všechny kategorie</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
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
                <option value={EQUIPMENT_STATUS.AVAILABLE}>K dispozici</option>
                <option value={EQUIPMENT_STATUS.BORROWED}>Vypůjčeno</option>
                <option value={EQUIPMENT_STATUS.SERVICE}>V servisu</option>
                <option value={EQUIPMENT_STATUS.RETIRED}>Vyřazeno</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Umístění
              </label>
              <select
                value={filters.location}
                onChange={(e) => setFilters({ location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Všechna umístění</option>
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
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

      {/* Equipment Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nářadí
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stav
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Umístění
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vypůjčeno
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
              ) : equipment.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="text-center">
                      <i className="fas fa-tools text-4xl text-gray-300 mb-4" />
                      <p>Žádné nářadí</p>
                    </div>
                  </td>
                </tr>
              ) : (
                equipment.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                          <i className="fas fa-wrench text-gray-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.manufacturer} {item.model}
                            {item.serial_number && ` • SN: ${item.serial_number}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <i className={`${getStatusIcon(item.status)} mr-2`} />
                        <StatusBadge 
                          status={item.status}
                          statusLabels={STATUS_LABELS}
                          statusColors={STATUS_COLORS}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.location || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.status === EQUIPMENT_STATUS.BORROWED ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {item.borrowed_by_user?.first_name} {item.borrowed_by_user?.last_name}
                          </div>
                          <div className="text-gray-500">
                            {item.borrowed_date && formatDate(item.borrowed_date)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.current_value ? formatCurrency(item.current_value) : 
                       item.purchase_price ? formatCurrency(item.purchase_price) : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {item.status === EQUIPMENT_STATUS.AVAILABLE && (
                          <Button
                            onClick={() => handleBorrowEquipment(item)}
                            size="sm"
                            variant="ghost"
                            title="Vypůjčit"
                          >
                            <i className="fas fa-user-plus" />
                          </Button>
                        )}
                        {item.status === EQUIPMENT_STATUS.BORROWED && (
                          <Button
                            onClick={() => handleReturnEquipment(item)}
                            size="sm"
                            variant="ghost"
                            title="Vrátit"
                          >
                            <i className="fas fa-undo" />
                          </Button>
                        )}
                        {item.status !== EQUIPMENT_STATUS.SERVICE && (
                          <Button
                            onClick={() => handleSendToService(item)}
                            size="sm"
                            variant="ghost"
                            title="Do servisu"
                          >
                            <i className="fas fa-wrench" />
                          </Button>
                        )}
                        {hasPermission('equipment_update') && (
                          <Button
                            onClick={() => handleEditEquipment(item)}
                            size="sm"
                            variant="ghost"
                            title="Upravit"
                          >
                            <i className="fas fa-edit" />
                          </Button>
                        )}
                        {hasPermission('equipment_delete') && (
                          <Button
                            onClick={() => confirmDelete(item)}
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
        title="Přidat nářadí"
        size="lg"
      >
        <div className="p-6">
          <div className="text-center py-8">
            <i className="fas fa-plus text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">
              Formulář pro nářadí bude implementován v další verzi
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
        title="Upravit nářadí"
        size="lg"
      >
        <div className="p-6">
          <div className="text-center py-8">
            <i className="fas fa-edit text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">
              Formulář pro úpravu nářadí bude implementován v další verzi
            </p>
            <Button onClick={() => setShowEditModal(false)}>
              Zavřít
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showBorrowModal}
        onClose={() => setShowBorrowModal(false)}
        title="Vypůjčit nářadí"
        size="md"
      >
        <div className="p-6">
          <div className="text-center py-8">
            <i className="fas fa-user-plus text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">
              Formulář pro vypůjčení bude implementován v další verzi
            </p>
            <Button onClick={() => setShowBorrowModal(false)}>
              Zavřít
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Smazat nářadí"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Opravdu chcete smazat nářadí <strong>{selectedEquipment?.name}</strong>?
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
              onClick={handleDeleteEquipment}
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

export default EquipmentPage
