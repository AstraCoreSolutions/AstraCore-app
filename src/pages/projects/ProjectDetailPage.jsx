import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useProjectsStore from '../../store/projectsStore'
import useAuthStore from '../../store/authStore'
import { Button, Card, StatusBadge, ProgressCell, Skeleton } from '../../components/ui'
import { usePermissions } from '../../components/common/ProtectedRoute'
import { PROJECT_STATUS, STATUS_LABELS, STATUS_COLORS } from '../../utils/constants'
import { formatDate, formatCurrency, calculateProgress } from '../../utils/helpers'

const ProjectDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { currentProject, loadProject, updateProgress, changeStatus, isLoading } = useProjectsStore()
  const { userRole, hasPermission } = usePermissions()
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (id) {
      loadProject(id)
    }
  }, [id, loadProject])

  if (isLoading || !currentProject) {
    return <ProjectDetailSkeleton />
  }

  const project = currentProject
  const isOverdue = project.end_date && new Date(project.end_date) < new Date() && project.status === PROJECT_STATUS.ACTIVE

  const tabs = [
    { id: 'overview', label: 'Přehled', icon: 'fas fa-eye' },
    { id: 'timeline', label: 'Harmonogram', icon: 'fas fa-calendar' },
    { id: 'team', label: 'Tým', icon: 'fas fa-users' },
    { id: 'materials', label: 'Materiál', icon: 'fas fa-boxes' },
    { id: 'equipment', label: 'Nářadí', icon: 'fas fa-tools' },
    { id: 'finances', label: 'Finance', icon: 'fas fa-coins', permission: 'finance' },
    { id: 'documents', label: 'Dokumenty', icon: 'fas fa-folder' }
  ]

  const filteredTabs = tabs.filter(tab => !tab.permission || hasPermission(tab.permission))

  const handleProgressUpdate = async (newProgress) => {
    await updateProgress(project.id, newProgress)
  }

  const handleStatusChange = async (newStatus) => {
    await changeStatus(project.id, newStatus)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/projects')}
                icon="fas fa-arrow-left"
              >
                Zpět na projekty
              </Button>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
            {project.description && (
              <p className="text-gray-600 mb-4">{project.description}</p>
            )}
            
            <div className="flex items-center space-x-6">
              <StatusBadge 
                status={project.status}
                statusLabels={STATUS_LABELS}
                statusColors={STATUS_COLORS}
                className="text-sm"
              />
              
              {isOverdue && (
                <div className="flex items-center text-red-600">
                  <i className="fas fa-exclamation-triangle mr-2" />
                  <span className="font-medium">Po termínu</span>
                </div>
              )}
              
              <div className="text-sm text-gray-500">
                Vytvořeno {formatDate(project.created_at)}
              </div>
            </div>
          </div>

          {hasPermission('projects') && (
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                icon="fas fa-edit"
                onClick={() => console.log('Edit project')}
              >
                Upravit
              </Button>
              
              <Button
                icon="fas fa-book"
                onClick={() => navigate(`/projects/${project.id}/diary`)}
              >
                Stavební deník
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Progress</span>
            <span className="text-lg font-bold text-gray-900">{project.progress || 0}%</span>
          </div>
          <ProgressCell progress={project.progress || 0} showLabel={false} />
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{project.client?.name || '-'}</div>
            <div className="text-sm text-gray-600">Klient</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {project.end_date ? formatDate(project.end_date) : '-'}
            </div>
            <div className="text-sm text-gray-600">Termín dokončení</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {project.budget ? formatCurrency(project.budget) : '-'}
            </div>
            <div className="text-sm text-gray-600">Rozpočet</div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {filteredTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <i className={`${tab.icon} mr-2`} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab project={project} />}
          {activeTab === 'timeline' && <TimelineTab project={project} />}
          {activeTab === 'team' && <TeamTab project={project} />}
          {activeTab === 'materials' && <MaterialsTab project={project} />}
          {activeTab === 'equipment' && <EquipmentTab project={project} />}
          {activeTab === 'finances' && <FinancesTab project={project} />}
          {activeTab === 'documents' && <DocumentsTab project={project} />}
        </div>
      </div>
    </div>
  )
}

// Tab Components
const OverviewTab = ({ project }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div className="space-y-6">
      <Card>
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Základní informace</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Název projektu</label>
              <p className="text-gray-900">{project.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Stav</label>
              <div className="mt-1">
                <StatusBadge 
                  status={project.status}
                  statusLabels={STATUS_LABELS}
                  statusColors={STATUS_COLORS}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Datum zahájení</label>
              <p className="text-gray-900">{project.start_date ? formatDate(project.start_date) : '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Plánované dokončení</label>
              <p className="text-gray-900">{project.end_date ? formatDate(project.end_date) : '-'}</p>
            </div>
          </div>
          {project.description && (
            <div>
              <label className="text-sm font-medium text-gray-700">Popis</label>
              <p className="text-gray-900 mt-1">{project.description}</p>
            </div>
          )}
          {project.location && (
            <div>
              <label className="text-sm font-medium text-gray-700">Lokalita</label>
              <p className="text-gray-900 mt-1">{project.location}</p>
            </div>
          )}
        </div>
      </Card>
    </div>

    <div className="space-y-6">
      <Card>
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Klient</h3>
        </div>
        <div className="p-6">
          {project.client ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Název</label>
                <p className="text-gray-900">{project.client.name}</p>
              </div>
              {project.client.email && (
                <div>
                  <label className="text-sm font-medium text-gray-700">E-mail</label>
                  <p className="text-gray-900">{project.client.email}</p>
                </div>
              )}
              {project.client.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Telefon</label>
                  <p className="text-gray-900">{project.client.phone}</p>
                </div>
              )}
              {project.client.address && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Adresa</label>
                  <p className="text-gray-900">{project.client.address}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Klient není přiřazen</p>
          )}
        </div>
      </Card>
    </div>
  </div>
)

const TimelineTab = ({ project }) => (
  <div className="text-center py-12">
    <i className="fas fa-calendar text-4xl text-gray-300 mb-4" />
    <p className="text-gray-500">Harmonogram bude implementován v další verzi</p>
  </div>
)

const TeamTab = ({ project }) => (
  <div className="text-center py-12">
    <i className="fas fa-users text-4xl text-gray-300 mb-4" />
    <p className="text-gray-500">Správa týmu bude implementována v další verzi</p>
  </div>
)

const MaterialsTab = ({ project }) => (
  <div className="text-center py-12">
    <i className="fas fa-boxes text-4xl text-gray-300 mb-4" />
    <p className="text-gray-500">Správa materiálu bude implementována v další verzi</p>
  </div>
)

const EquipmentTab = ({ project }) => (
  <div className="text-center py-12">
    <i className="fas fa-tools text-4xl text-gray-300 mb-4" />
    <p className="text-gray-500">Správa nářadí bude implementována v další verzi</p>
  </div>
)

const FinancesTab = ({ project }) => (
  <div className="text-center py-12">
    <i className="fas fa-coins text-4xl text-gray-300 mb-4" />
    <p className="text-gray-500">Finance projektu budou implementovány v další verzi</p>
  </div>
)

const DocumentsTab = ({ project }) => (
  <div className="text-center py-12">
    <i className="fas fa-folder text-4xl text-gray-300 mb-4" />
    <p className="text-gray-500">Správa dokumentů bude implementována v další verzi</p>
  </div>
)

// Loading skeleton
const ProjectDetailSkeleton = () => (
  <div className="space-y-6">
    <Card className="p-6">
      <Skeleton height="8" width="1/3" className="mb-4" />
      <Skeleton height="4" width="2/3" className="mb-2" />
      <Skeleton height="4" width="1/2" />
    </Card>
    
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => (
        <Card key={i} className="p-6">
          <Skeleton height="12" />
        </Card>
      ))}
    </div>
    
    <Card className="p-6">
      <Skeleton height="64" />
    </Card>
  </div>
)

export default ProjectDetailPage
