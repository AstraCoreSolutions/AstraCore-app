import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useSuppliersStore from '../../store/suppliersStore'
import useAuthStore from '../../store/authStore'
import { Button, Card, Modal, Spinner } from '../../components/ui'
import { usePermissions } from '../../components/common/ProtectedRoute'
import { formatCurrency, formatDate } from '../../utils/helpers'

const SuppliersPage = () => {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { 
    suppliers, 
    isLoading, 
    filters, 
    categories,
    cities,
    setFilters, 
    clearFilters, 
    loadSuppliers, 
    loadCategories,
    loadCities,
    deleteSupplier,
    updateRating,
    getSuppliersOverview 
  } = useSuppliersStore()
  const { hasPermission } = usePermissions()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Load data on mount
  useEffect(() => {
    loadSuppliers()
    loadCategories()
    loadCities()
  }, [loadSuppliers, loadCategories, loadCities])

  const overview = getSuppliersOverview()

  const handleCreateSupplier = () => {
    setSelectedSupplier(null)
    setShowCreateModal(true)
  }

  const handleEditSupplier = (supplier) => {
    setSelectedSupplier(supplier)
    setShowEditModal(true)
  }

  const handleViewSupplier = (supplier) => {
    setSelectedSupplier(supplier)
    setShowDetailModal(true)
  }

  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return
    
    const result = await deleteSupplier(selectedSupplier.id)
    if (result.success) {
      setShowDeleteConfirm(false)
      setSelectedSupplier(null)
    }
  }

  const confirmDelete = (supplier) => {
    setSelectedSupplier(supplier)
    setShowDeleteConfirm(true)
  }

  const handleFormSuccess = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setShowDetailModal(false)
    setSelectedSupplier(null)
    loadSuppliers(true)
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <i 
        key={i} 
        className={`fas fa-star ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} 
      />
    ))
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600'
      case 'inactive':
        return 'text-gray-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return 'fas fa-check-circle text-green-600'
      case 'inactive':
        return 'fas fa-pause-circle text-gray-600'
      default:
        return 'fas fa-question-circle text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dodavatelé</h1>
          <p className="text-gray-600 mt-1">Správa dodavatelů a partnerů</p>
        </div>
        {hasPermission('suppliers_create') && (
          <Button 
            onClick={handleCreateSupplier}
            className="bg-primary-600 hover:bg-primary-700"
          >
            <i className="fas fa-plus mr-2" />
            Přidat dodavatele
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
                <p className="text-sm font-medium text-gray-600">Kategorie</p>
                <p className="text-2xl font-bold text-purple-600">{overview.categories}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-tags text-purple-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Průměrné hodnocení</p>
                <p className="text-2xl font-bold text-yellow-600">{overview.avgRating}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-star text-yellow-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Průměrná splatnost</p>
                <p className="text-2xl font-bold text-orange-600">{overview.avgPaymentTerms} dní</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-calendar text-orange-600" />
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
                placeholder="Název, email, kontakt..."
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
                Město
              </label>
              <select
                value={filters.city}
                onChange={(e) => setFilters({ city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Všechna města</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min. hodnocení
              </label>
              <select
                value={filters.rating}
                onChange={(e) => setFilters({ rating: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Všechna hodnocení</option>
                <option value="5">5 hvězd</option>
                <option value="4">4+ hvězd</option>
                <option value="3">3+ hvězd</option>
                <option value="2">2+ hvězd</option>
                <option value="1">1+ hvězda</option>
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

      {/* Suppliers Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dodavatel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kontakt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hodnocení
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Splatnost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stav
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
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="text-center">
                      <i className="fas fa-truck text-4xl text-gray-300 mb-4" />
                      <p>Žádní dodavatelé</p>
                    </div>
                  </td>
                </tr>
              ) : (
                suppliers.map(supplier => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                          <i className="fas fa-building text-gray-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {supplier.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {supplier.category}
                            {supplier.ico && ` • IČO: ${supplier.ico}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {supplier.contact_person || supplier.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {supplier.email && (
                          <div>
                            <i className="fas fa-envelope mr-1" />
                            {supplier.email}
                          </div>
                        )}
                        {supplier.phone && (
                          <div>
                            <i className="fas fa-phone mr-1" />
                            {supplier.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex mr-2">
                          {renderStars(supplier.rating || 0)}
                        </div>
                        <span className="text-sm text-gray-500">
                          ({supplier.rating || 0}/5)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {supplier.payment_terms || 30} dní
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <i className={`${getStatusIcon(supplier.status)} mr-2`} />
                        <span className={`text-sm font-medium ${getStatusColor(supplier.status)}`}>
                          {supplier.status === 'active' ? 'Aktivní' : 'Neaktivní'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          onClick={() => handleViewSupplier(supplier)}
                          size="sm"
                          variant="ghost"
                          title="Zobrazit detail"
                        >
                          <i className="fas fa-eye" />
                        </Button>
                        {hasPermission('suppliers_update') && (
                          <Button
                            onClick={() => handleEditSupplier(supplier)}
                            size="sm"
                            variant="ghost"
                            title="Upravit"
                          >
                            <i className="fas fa-edit" />
                          </Button>
                        )}
                        {hasPermission('suppliers_delete') && (
                          <Button
                            onClick={() => confirmDelete(supplier)}
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
        title="Přidat dodavatele"
        size="lg"
      >
        <div className="p-6">
          <div className="text-center py-8">
            <i className="fas fa-plus text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">
              Formulář pro dodavatele bude implementován v další verzi
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
        title="Upravit dodavatele"
        size="lg"
      >
        <div className="p-6">
          <div className="text-center py-8">
            <i className="fas fa-edit text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">
              Formulář pro úpravu dodavatelů bude implementován v další verzi
            </p>
            <Button onClick={() => setShowEditModal(false)}>
              Zavřít
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Detail dodavatele"
        size="xl"
      >
        <div className="p-6">
          <div className="text-center py-8">
            <i className="fas fa-info-circle text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">
              Detail dodavatele bude implementován v další verzi
            </p>
            <Button onClick={() => setShowDetailModal(false)}>
              Zavřít
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Smazat dodavatele"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Opravdu chcete smazat dodavatele <strong>{selectedSupplier?.name}</strong>?
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
              onClick={handleDeleteSupplier}
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

export default SuppliersPage
