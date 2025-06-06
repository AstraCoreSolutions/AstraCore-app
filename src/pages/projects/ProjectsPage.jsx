import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import useProjectsStore from '../../store/projectsStore'
import { Button, Table, Card, Input, StatusBadge, ProgressCell, ActionButton, Modal } from '../../components/ui'
import { usePermissions } from '../../components/common/ProtectedRoute'
import { PROJECT_STATUS, STATUS_LABELS, STATUS_COLORS } from '../../utils/constants'
import { formatDate, isDatePast } from '../../utils/helpers'
import { ROUTES } from '../../config/routes'

const ProjectsPage = () => {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { 
    projects, 
    loadProjects, 
    deleteProject,
    filters, 
    setFilters, 
    getFilteredProjects,
    getProjectStats,
    isLoading 
  } = useProjectsStore()
  const { userRole, hasPermission } = usePermissions()

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Load projects on mount
  useEffect(() => {
    if (profile?.id) {
      loadProjects(profile.id, userRole)
    }
  }, [profile?.id, userRole, loadProjects])

  const filteredProjects = getFilteredProjects()
  const stats = getProjectStats()

  // Table columns
  const columns = [
    {
      key: 'name',
      title: 'Projekt',
      render: (value, row) => (
        <div>
          <div className="font-semibold text-gray-900">{value}</div>
          {row.description && (
            <div className="text-sm text-gray-500 truncate max-w-xs">
              {row.description}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'client',
      title: 'Klient',
      render: (value) => value?.name || '-'
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
      key: 'progress',
      title: 'Progress',
      render: (value) => (
        <ProgressCell progress={value || 0} />
      )
    },
    {
      key: 'end_date',
      title: 'Termín dokončení',
      render: (value, row) => {
        if (!value) return '-'
        const isPast = isDatePast(value) && row.status === PROJECT_STATUS.ACTIVE
        return (
          <span className={isPast ? 'text-red-600 font-medium' : ''}>
            {formatDate(value)}
            {isPast && <i className="fas fa-exclamation-triangle ml-1 text-red-500" />}
          </span>
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
            onClick={() => navigate(`/projects/${row.id}`)}
          />
          {hasPermission('projects') && (
            <>
              <ActionButton
                icon="fas fa-book"
                tooltip="Stavební deník"
                onClick={() => navigate(`/projects/${row.id}/diary`)}
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
            </>
          )}
        </div>
      )
    }
  ]

  const handleDeleteClick = (project) => {
    setProjectToDelete(project)
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!projectToDelete) return

    setDeleteLoading(true)
    try {
      const result = await deleteProject(projectToDelete.id)
      if (result.success) {
        setShowDeleteModal(false)
        setProjectToDelete(null)
        // Toast will be shown by the store
      }
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleEdit = (project) => {
    // TODO: Implement edit modal
    console.log('Edit project:', project)
  }

  const handleRowClick = (project) => {
    navigate(`/projects/${project.id}`)
  }

  const statusOptions = [
    { value: '', label: 'Všechny stavy' },
    { value: PROJECT_STATUS.PLANNING, label: STATUS_LABELS[PROJECT_STATUS.PLANNING] },
    { value: PROJECT_STATUS.ACTIVE, label: STATUS_LABELS[PROJECT_STATUS.ACTIVE] },
    { value: PROJECT_STATUS.COMPLETED, label: STATUS_LABELS[PROJECT_STATUS.COMPLETED] },
    { value: PROJECT_STATUS.CANCELLED, label: STATUS_LABELS[PROJECT_STATUS.CANCELLED] },
    { value: PROJECT_STATUS.ON_HOLD, label: STATUS_LABELS[PROJECT_STATUS.ON_HOLD] }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projekty</h1>
          <p className="text-gray-600">Správa stavebních projektů</p>
        </div>
        {hasPermission('projects') && (
          <Button
            onClick={() => navigate(`${ROUTES.PROJECTS}/new`)}
            icon="fas fa-plus"
          >
            Nový projekt
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-building text-blue-600 text-xl" />
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
              <i className="fas fa-play-circle text-green-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Aktivní</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-clock text-yellow-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Plánování</p>
              <p className="text-2xl font-bold text-gray-900">{stats.planning}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-exclamation-triangle text-red-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Po termínu</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="text"
              placeholder="Hledat projekty..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              icon="fas fa-search"
            />
            
            <Input
              type="select"
              value={filters.status}
              onChange={(e) => setFilters({ status: e.target.value })}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Input>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setFilters({ search: '', status: '', client: '', manager: '' })}
                size="sm"
              >
                Vymazat filtry
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Projects Table */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Seznam projektů ({filteredProjects.length})
            </h2>
          </div>
        </div>
        
        <Table
          columns={columns}
          data={filteredProjects.map(project => ({
            ...project,
            _highlight: isDatePast(project.end_date) && project.status === PROJECT_STATUS.ACTIVE
          }))}
          loading={isLoading}
          onRowClick={handleRowClick}
          emptyMessage="Žádné projekty nenalezeny"
          emptyIcon="fas fa-building"
        />
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Smazat projekt"
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
              <p className="font-medium">Opravdu chcete smazat tento projekt?</p>
              <p className="text-sm text-gray-600 mt-1">
                Tato akce je nevratná a smaže všechna související data.
              </p>
            </div>
          </div>
          
          {projectToDelete && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium text-gray-900">{projectToDelete.name}</p>
              {projectToDelete.description && (
                <p className="text-sm text-gray-600 mt-1">{projectToDelete.description}</p>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default ProjectsPage
