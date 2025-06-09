import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useMaterialsStore from '../../store/materialsStore'
import useAuthStore from '../../store/authStore'
import { Button, Card, Modal, Spinner } from '../../components/ui'
import { usePermissions } from '../../components/common/ProtectedRoute'
import { formatCurrency, formatDate } from '../../utils/helpers'

const MaterialsPage = () => {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { 
    materials, 
    isLoading, 
    filters, 
    categories,
    suppliers,
    setFilters, 
    clearFilters, 
    loadMaterials, 
    loadCategories,
    loadSuppliers,
    deleteMaterial,
    updateStock,
    getMaterialsOverview 
  } = useMaterialsStore()
  const { hasPermission } = usePermissions()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Load data on mount
  useEffect(() => {
    loadMaterials()
    loadCategories()
    loadSuppliers()
  }, [loadMaterials, loadCategories, loadSuppliers])

  const overview = getMaterialsOverview()

  const handleCreateMaterial = () => {
    setSelectedMaterial(null)
    setShowCreateModal(true)
  }

  const handleEditMaterial = (material) => {
    setSelectedMaterial(material)
    setShowEditModal(true)
  }

  const handleStockUpdate = (material) => {
    setSelectedMaterial(material)
    setShowStockModal(true)
  }

  const handleDeleteMaterial = async () => {
    if (!selectedMaterial) return
    
    const result = await deleteMaterial(selectedMaterial.id)
    if (result.success) {
      setShowDeleteConfirm(false)
      setSelectedMaterial(null)
    }
  }

  const confirmDelete = (material) => {
    setSelectedMaterial(material)
    setShowDeleteConfirm(true)
  }

  const handleFormSuccess = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setShowStockModal(false)
    setSelectedMaterial(null)
    loadMaterials(true)
  }

  const getStockStatusColor = (material) => {
    if (material.current_stock === 0) return 'text-red-600'
    if (material.current_stock <= material.min_stock) return 'text-orange-600'
    return 'text-green-600'
  }

  const getStockStatusIcon = (material) => {
    if (material.current_stock === 0) return 'fas fa-times-circle'
    if (material.current_stock <= material.min_stock) return 'fas fa-exclamation-triangle'
    return 'fas fa-check-circle'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Materiály</h1>
          <p className="text-gray-600 mt-1">Správa skladových zásob a materiálů</p>
        </div>
        {hasPermission('materials_create') && (
          <Button 
            onClick={handleCreateMaterial}
            className="bg-primary-600 hover:bg-primary-700"
          >
            <i className="fas fa-plus mr-2" />
            Přidat materiál
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
                <i className="fas fa-boxes text-blue-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Na skladě</p>
                <p className="text-2xl font-bold text-green-600">{overview.inStock}</p>
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
                <p className="text-sm font-medium text-gray-600">Vyprodáno</p>
                <p className="text-2xl font-bold text-red-600">{overview.outOfStock}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-times-circle text-red-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Nízké stavy</p>
                <p className="text-2xl font-bold text-orange-600">{overview.lowStockCount}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-orange-600" />
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
                placeholder="Název materiálu..."
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
                Dodavatel
              </label>
              <select
                value={filters.supplier}
                onChange={(e) => setFilters({ supplier: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Všichni dodavatelé</option>
                {suppliers.map(supplier => (
                  <option key={supplier} value={supplier}>{supplier}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.lowStock}
                  onChange={(e) => setFilters({ lowStock: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Pouze nízké stavy</span>
              </label>
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

      {/* Materials Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Materiál
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Skladem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cena/jednotka
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hodnota
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dodavatel
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
              ) : materials.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="text-center">
                      <i className="fas fa-boxes text-4xl text-gray-300 mb-4" />
                      <p>Žádné materiály</p>
                    </div>
                  </td>
                </tr>
              ) : (
                materials.map(material => (
                  <tr key={material.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                          <i className="fas fa-box text-gray-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {material.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {material.category} • {material.unit}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <i className={`${getStockStatusIcon(material)} ${getStockStatusColor(material)} mr-2`} />
                        <div>
                          <div className={`text-sm font-medium ${getStockStatusColor(material)}`}>
                            {material.current_stock} {material.unit}
                          </div>
                          <div className="text-xs text-gray-500">
                            Min: {material.min_stock} {material.unit}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {material.price_per_unit ? formatCurrency(material.price_per_unit) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {material.price_per_unit ? 
                        formatCurrency(material.current_stock * material.price_per_unit) : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {material.supplier || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          onClick={() => handleStockUpdate(material)}
                          size="sm"
                          variant="ghost"
                          title="Upravit sklad"
                        >
                          <i className="fas fa-warehouse" />
                        </Button>
                        {hasPermission('materials_update') && (
                          <Button
                            onClick={() => handleEditMaterial(material)}
                            size="sm"
                            variant="ghost"
                            title="Upravit"
                          >
                            <i className="fas fa-edit" />
                          </Button>
                        )}
                        {hasPermission('materials_delete') && (
                          <Button
                            onClick={() => confirmDelete(material)}
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
        title="Přidat materiál"
        size="lg"
      >
        <div className="p-6">
          <div className="text-center py-8">
            <i className="fas fa-plus text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">
              Formulář pro materiály bude implementován v další verzi
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
        title="Upravit materiál"
        size="lg"
      >
        <div className="p-6">
          <div className="text-center py-8">
            <i className="fas fa-edit text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">
              Formulář pro úpravu materiálů bude implementován v další verzi
            </p>
            <Button onClick={() => setShowEditModal(false)}>
              Zavřít
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
        title="Upravit skladové zásoby"
        size="md"
      >
        <div className="p-6">
          <div className="text-center py-8">
            <i className="fas fa-warehouse text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">
              Formulář pro úpravu zásob bude implementován v další verzi
            </p>
            <Button onClick={() => setShowStockModal(false)}>
              Zavřít
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Smazat materiál"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Opravdu chcete smazat materiál <strong>{selectedMaterial?.name}</strong>?
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
              onClick={handleDeleteMaterial}
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

export default MaterialsPage
