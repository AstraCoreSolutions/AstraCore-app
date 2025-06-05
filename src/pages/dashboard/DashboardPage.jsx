import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import useProjectsStore from '../../store/projectsStore'
import { Card, StatCard, Button, ProjectCard } from '../../components/ui'
import { usePermissions } from '../../components/common/ProtectedRoute'
import { formatCurrency, formatDate } from '../../utils/helpers'
import { PROJECT_STATUS, STATUS_LABELS } from '../../utils/constants'
import { ROUTES } from '../../config/routes'

const DashboardPage = () => {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { projects, loadProjects, isLoading } = useProjectsStore()
  const { userRole, hasPermission } = usePermissions()
  const [stats, setStats] = useState({
    activeProjects: 0,
    totalProjects: 0,
    overdueProjects: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    pendingInvoices: 0
  })

  // Load data on mount
  useEffect(() => {
    if (profile?.id) {
      loadProjects(profile.id, userRole)
    }
  }, [profile?.id, userRole, loadProjects])

  // Calculate stats when projects change
  useEffect(() => {
    if (projects.length > 0) {
      const activeProjects = projects.filter(p => p.status === PROJECT_STATUS.ACTIVE).length
      const overdueProjects = projects.filter(p => 
        p.status === PROJECT_STATUS.ACTIVE && 
        p.end_date && 
        new Date(p.end_date) < new Date()
      ).length

      setStats(prev => ({
        ...prev,
        activeProjects,
        totalProjects: projects.length,
        overdueProjects
      }))
    }
  }, [projects])

  const getGreeting = () => {
    const hour = new Date().getHours()
    const name = profile?.first_name || 'uživateli'
    
    if (hour < 12) return `Dobré ráno, ${name}!`
    if (hour < 18) return `Dobrý den, ${name}!`
    return `Dobrý večer, ${name}!`
  }

  const getRecentProjects = () => {
    return projects
      .filter(p => p.status === PROJECT_STATUS.ACTIVE)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 4)
  }

  const getUpcomingDeadlines = () => {
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    return projects
      .filter(p => 
        p.status === PROJECT_STATUS.ACTIVE && 
        p.end_date && 
        new Date(p.end_date) >= now && 
        new Date(p.end_date) <= nextWeek
      )
      .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
      .slice(0, 3)
  }

  const quickActions = [
    {
      title: 'Nový projekt',
      description: 'Vytvořit nový stavební projekt',
      icon: 'fas fa-plus',
      color: 'primary',
      action: () => navigate(ROUTES.PROJECTS),
      permission: 'projects'
    },
    {
      title: 'Přidat výdaj',
      description: 'Zaznamenat nový výdaj',
      icon: 'fas fa-receipt',
      color: 'danger',
      action: () => navigate(ROUTES.FINANCE),
      permission: 'finance'
    },
    {
      title: 'Vystavit fakturu',
      description: 'Vytvořit novou fakturu',
      icon: 'fas fa-file-invoice',
      color: 'success',
      action: () => navigate(ROUTES.INVOICES),
      permission: 'invoices'
    },
    {
      title: 'Správa zaměstnanců',
      description: 'Spravovat tým',
      icon: 'fas fa-users',
      color: 'info',
      action: () => navigate(ROUTES.EMPLOYEES),
      permission: 'employees'
    }
  ]

  const filteredQuickActions = quickActions.filter(action => 
    hasPermission(action.permission)
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {getGreeting()}
        </h1>
        <p className="text-gray-600">
          Vítejte zpět v systému AstraCore Solutions
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Aktivní projekty"
          value={stats.activeProjects}
          icon="fas fa-building"
          color="primary"
          change={stats.overdueProjects > 0 ? `${stats.overdueProjects} po termínu` : null}
          changeType={stats.overdueProjects > 0 ? 'decrease' : 'neutral'}
        />
        
        <StatCard
          title="Celkem projektů"
          value={stats.totalProjects}
          icon="fas fa-chart-line"
          color="success"
        />

        {hasPermission('finance') && (
          <>
            <StatCard
              title="Měsíční příjmy"
              value={formatCurrency(stats.monthlyRevenue)}
              icon="fas fa-arrow-up"
              color="success"
            />
            
            <StatCard
              title="Měsíční výdaje"
              value={formatCurrency(stats.monthlyExpenses)}
              icon="fas fa-arrow-down"
              color="danger"
            />
          </>
        )}

        {!hasPermission('finance') && (
          <>
            <StatCard
              title="Moje projekty"
              value={projects.filter(p => p.assigned_employees?.includes(profile?.id)).length}
              icon="fas fa-user-hard-hat"
              color="info"
            />
            
            <StatCard
              title="Dokončené úkoly"
              value="12"
              icon="fas fa-check-circle"
              color="success"
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      {filteredQuickActions.length > 0 && (
        <Card>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Rychlé akce</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredQuickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 text-left group"
                >
                  <div className={`w-10 h-10 bg-${action.color}-100 text-${action.color}-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
                    <i className={action.icon} />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Aktivní projekty</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(ROUTES.PROJECTS)}
              >
                Zobrazit vše
              </Button>
            </div>
            <div className="p-6">
              {getRecentProjects().length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getRecentProjects().map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={() => navigate(`/projects/${project.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-building text-4xl text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">Žádné aktivní projekty</p>
                  {hasPermission('projects') && (
                    <Button onClick={() => navigate(ROUTES.PROJECTS)}>
                      Vytvořit první projekt
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Blížící se termíny</h3>
            </div>
            <div className="p-6">
              {getUpcomingDeadlines().length > 0 ? (
                <div className="space-y-3">
                  {getUpcomingDeadlines().map((project) => (
                    <div key={project.id} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <i className="fas fa-clock text-yellow-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {project.name}
                        </p>
                        <p className="text-xs text-yellow-600">
                          {formatDate(project.end_date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  Žádné blížící se termíny
                </p>
              )}
            </div>
          </Card>

          {/* System Status */}
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Stav systému</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Databáze</span>
                  <span className="flex items-center text-green-600">
                    <i className="fas fa-circle text-xs mr-2" />
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Synchronizace</span>
                  <span className="flex items-center text-green-600">
                    <i className="fas fa-circle text-xs mr-2" />
                    Aktivní
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Verze</span>
                  <span className="text-sm text-gray-900">v2.0.0</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
