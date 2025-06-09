import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useClientsStore from '../../store/clientsStore'
import useAuthStore from '../../store/authStore'
import { Button, Card, StatusBadge, Modal, Spinner } from '../../components/ui'
import { usePermissions } from '../../components/common/ProtectedRoute'
import { formatDate, formatCurrency } from '../../utils/helpers'

// Import components directly
import ClientForm from './components/ClientForm'
import ClientDetail from './components/ClientDetail'

const ClientsPage = () => {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { 
    clients, 
    isLoading, 
    filters, 
    cities,
    setFilters, 
    clearFilters, 
    loadClients, 
    loadCities,
    deleteClient,
    getClientsOverview 
  } = useClientsStore()
  const { hasPermission } = usePermissions()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Load data on mount
  useEffect(() => {
    loadClients()
    loadCities()
  }, [loadClients, loadCities])

  const overview = getClientsOverview()

  const handleCreateClient = () => {
    setSelectedClient(null)
    setShowCreateModal(true)
  }

  const handleEditClient = (client) => {
    setSelectedClient(client)
    setShowEditModal(true)
  }

  const handleViewClient = (client) => {
    setSelectedClient(client)
    setShowDetailModal(true)
  }

  const handleDeleteClient = async () => {
    if (!selectedClient) return
    
    const result = await deleteClient(selectedClient.id)
    if (result.success) {
      setShowDeleteConfirm(false)
      setSelectedClient(null)
    }
  }

  const confirmDelete = (client) => {
    setSelectedClient(client)
    setShowDeleteConfirm(true)
  }

  const handleFormSuccess = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setSelectedClient(null)
    loadClients(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Klienti</h1>
          <p className="text-gray-600 mt-1">Správa klientů a zákazníků</p>
        </div>
        {hasPermission('clients_create') && (
          <Button 
            onClick={handleCreateClient}
            className="bg-primary-600 hover:bg-primary-700"
          >
            <i className="fas fa-plus mr-2" />
            Přidat klienta
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Celkem</p>
                <p className="text-2xl font-bold text-gray-900">{overview.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-users text-blue-600" />
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
                <p className="text-sm font-medium text-gray-600">Firmy</p>
                <p className="text-2xl font-bold text-purple-600">{overview.companies}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-building text-purple-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Fyzické osoby</p>
                <p className="text-2xl font-bold text-orange-600">{overview.individuals}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-user text-orange-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                Typ
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Všechny typy</option>
                <option value="company">Firma</option>
                <option value="individual">Fyzická osoba</option>
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

      {/* Clients Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Klient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kontakt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Projekty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vytvořeno
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akce
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <Spinner size="lg" />
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <div className="text-center">
                      <i className="fas fa-users text-4xl text-gray-300 mb-4" />
                      <p>Žádní klienti</p>
                    </div>
                  </td>
                </tr>
              ) : (
                clients.map(client => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                          <i className={`fas ${client.type === 'company' ? 'fa-building' : 'fa-user'} text-primary-600`} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {client.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {client.type === 'company' ? 'Firma' : 'Fyzická osoba'}
                            {client.ico && ` • IČO: ${client.ico}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {client.contact_person || client.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {client.email && (
                          <div>
                            <i className="fas fa-envelope mr-1" />
                            {client.email}
                          </div>
                        )}
                        {client.phone && (
                          <div>
                            <i className="fas fa-phone mr-1" />
                            {client.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {client.projects?.length || 0} projektů
                      </div>
                      <div className="text-sm text-gray-500">
                        {client.projects?.filter(p => p.status === 'active').length || 0} aktivních
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(client.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          onClick={() => handleViewClient(client)}
                          size="sm"
                          variant="ghost"
                          title="Zobrazit detail"
                        >
                          <i className="fas fa-eye" />
                        </Button>
                        {hasPermission('clients_update') && (
                          <Button
                            onClick={() => handleEditClient(client)}
                            size="sm"
                            variant="ghost"
                            title="Upravit"
                          >
                            <i className="fas fa-edit" />
                          </Button>
                        )}
                        {hasPermission('clients_delete') && (
                          <Button
                            onClick={() => confirmDelete(client)}
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

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Přidat nového klienta"
        size="lg"
      >
        <ClientForm
          onSuccess={handleFormSuccess}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Upravit klienta"
        size="lg"
      >
        <ClientForm
          client={selectedClient}
          onSuccess={handleFormSuccess}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Detail klienta"
        size="xl"
      >
        {selectedClient && (
          <ClientDetail
            client={selectedClient}
            onEdit={() => {
              setShowDetailModal(false)
              handleEditClient(selectedClient)
            }}
            onClose={() => setShowDetailModal(false)}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Smazat klienta"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Opravdu chcete smazat klienta <strong>{selectedClient?.name}</strong>?
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
              onClick={handleDeleteClient}
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

export default ClientsPage
