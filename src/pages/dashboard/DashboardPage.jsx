import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import useProjectsStore from '../../store/projectsStore'
import { Card, StatCard, Button, ProjectCard, Spinner } from '../../components/ui'
import { usePermissions } from '../../components/common/ProtectedRoute'
import { formatCurrency, formatDate } from '../../utils/helpers'
import { PROJECT_STATUS, STATUS_LABELS } from '../../utils/constants'
import { ROUTES } from '../../config/routes'
import { supabase } from '../../config/supabase'
import toast from 'react-hot-toast'

const DashboardPage = () => {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { projects, loadProjects, isLoading: projectsLoading } = useProjectsStore()
  const { userRole, hasPermission } = usePermissions()
  
  // Local state for dashboard data
  const [dashboardData, setDashboardData] = useState({
    stats: {
      activeProjects: 0,
      totalProjects: 0,
      overdueProjects: 0,
      monthlyRevenue: 0,
      monthlyExpenses: 0,
      pendingInvoices: 0
    },
    recentProjects: [],
    upcomingTasks: [],
    notifications: []
  })
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load dashboard data on mount
  useEffect(() => {
    if (profile?.id) {
      loadDashboardData()
    }
  }, [profile?.id, userRole])

  const loadDashboardData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Load projects first
      await loadProjects(profile.id, userRole)

      // Load other dashboard data in parallel
      const [financialData, tasksData, notificationsData] = await Promise.allSettled([
        loadFinancialData(),
        loadUpcomingTasks(),
        loadNotifications()
      ])

      // Process results
      const newDashboardData = { ...dashboardData }

      if (financialData.status === 'fulfilled') {
        newDashboardData.stats = {
          ...newDashboardData.stats,
          ...financialData.value
        }
      } else {
        console.error('Failed to load financial data:', financialData.reason)
      }

      if (tasksData.status === 'fulfilled') {
        newDashboardData.upcomingTasks = tasksData.value
      } else {
        console.error('Failed to load tasks:', tasksData.reason)
      }

      if (notificationsData.status === 'fulfilled') {
        newDashboardData.notifications = notificationsData.value
      } else {
        console.error('Failed to load notifications:', notificationsData.reason)
      }

      setDashboardData(newDashboardData)

    } catch (error) {
      console.error('Error loading dashboard:', error)
      setError('Chyba při načítání dashboardu')
      toast.error('Nepodařilo se načíst všechna data')
    } finally {
      setLoading(false)
    }
  }

  // Load financial data
  const loadFinancialData = async () => {
    if (!hasPermission('finance')) {
      return {
        monthlyRevenue: 0,
        monthlyExpenses: 0,
        pendingInvoices: 0
      }
    }

    try {
      const currentMonth = new Date()
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

      // Get transactions for current month
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .gte('transaction_date', firstDay.toISOString().split('T')[0])
        .lte('transaction_date', lastDay.toISOString().split('T')[0])

      if (transError) throw transError

      // Get pending invoices
      const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select('*')
        .in('status', ['draft', 'pending', 'overdue'])

      if (invError) throw invError

      const monthlyRevenue = transactions
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) || 0

      const monthlyExpenses = transactions
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) || 0

      const pendingInvoices = invoices
        ?.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0) || 0

      return {
        monthlyRevenue,
        monthlyExpenses,
        pendingInvoices
      }
    } catch (error) {
      console.error('Error loading financial data:', error)
      return {
        monthlyRevenue: 0,
        monthlyExpenses: 0,
        pendingInvoices: 0
      }
    }
  }

  // Load upcoming tasks/deadlines
  const loadUpcomingTasks = async () => {
    try {
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)

      const { data: projectTasks, error } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          end_date,
          status,
          client:clients(name)
        `)
        .eq('status', 'active')
        .lte('end_date', nextWeek.toISOString().split('T')[0])
        .order('end_date', { ascending: true })
        .limit(5)

      if (error) throw error

      return projectTasks?.map(project => ({
        id: project.id,
        title: project.name,
        type: 'project_deadline',
        date: project.end_date,
        description: `Termín dokončení projektu pro ${project.client?.name || 'neznámého klienta'}`,
        priority: new Date(project.end_date) < new Date() ? 'high' : 'medium'
      })) || []

    } catch (error) {
      console.error('Error loading tasks:', error)
      return []
    }
  }

  // Load notifications
  const loadNotifications = async () => {
    try {
      // For now, generate some example notifications based on data
      const notifications = []

      // Check for overdue projects
      const overdueProjects = projects.filter(p => 
        p.status === PROJECT_STATUS.ACTIVE && 
        p.end_date && 
        new Date(p.end_date) < new Date()
      )

      if (overdueProjects.length > 0) {
        notifications.push({
          id: 'overdue-projects',
          type: 'warning',
          title: 'Projekty po termínu',
          message: `Máte ${overdueProjects.length} projektů po termínu dokončení`,
          date: new Date().toISOString(),
          action: () => navigate(ROUTES.PROJECTS)
        })
      }

      // Check for low stock materials (if permission allows)
      if (hasPermission('materials')) {
        const { data: materials } = await supabase
          .from('materials')
          .select('*')
          .lt('current_stock', 'min_stock')

        if (materials?.length > 0) {
          notifications.push({
            id: 'low-stock',
            type: 'info',
            title: 'Nízký stav materiálu',
            message: `${materials.length} materiálů má nízký stav skladu`,
            date: new Date().toISOString(),
            action: () => navigate(ROUTES.MATERIALS)
          })
        }
      }

      return notifications.slice(0, 5) // Max 5 notifications

    } catch (error) {
      console.error('Error loading notifications:', error)
      return []
    }
  }

  // Calculate project stats when projects change
  useEffect(() => {
    if (projects.length > 0) {
      const activeProjects = projects.filter(p => p.status === PROJECT_STATUS.ACTIVE).length
      const overdueProjects = projects.filter(p => 
        p.status === PROJECT_STATUS.ACTIVE && 
        p.end_date && 
        new Date(p.end_date) < new Date()
      ).length

      // Get recent projects (last 5)
      const recentProjects = projects
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)

      setDashboardData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          activeProjects,
          totalProjects: projects.length,
          overdueProjects
        },
        recentProjects
      }))
    }
  }, [projects])

  const handleRefresh = () => {
    loadDashboardData()
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Dobré ráno'
    if (hour < 18) return 'Dobrý den'
    return 'Dobrý večer'
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="p-8 text-center max-w-md">
          <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Chyba při načítání</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} icon="fas fa-refresh">
            Zkusit znovu
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {profile?.first_name || 'uživateli'}!
          </h1>
          <p className="text-gray-600">Přehled vašich projektů a aktivit</p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          icon="fas fa-refresh"
          loading={projectsLoading}
        >
          Obnovit
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Aktivní projekty"
          value={dashboardData.stats.activeProjects}
          icon="fas fa-building"
          trend="neutral"
        />
        
        <StatCard
          title="Celkem projektů"
          value={dashboardData.stats.totalProjects}
          icon="fas fa-list"
          trend="positive"
        />
        
        {dashboardData.stats.overdueProjects > 0 && (
          <StatCard
            title="Po termínu"
            value={dashboardData.stats.overdueProjects}
            icon="fas fa-exclamation-triangle"
            trend="negative"
          />
        )}
        
        {hasPermission('finance') && (
          <>
            <StatCard
              title="Měsíční příjmy"
              value={formatCurrency(dashboardData.stats.monthlyRevenue)}
              icon="fas fa-arrow-up"
              trend="positive"
            />
            
            <StatCard
              title="Měsíční výdaje"
              value={formatCurrency(dashboardData.stats.monthlyExpenses)}
              icon="fas fa-arrow-down"
              trend="negative"
            />
            
            <StatCard
              title="Nevyřízené faktury"
              value={formatCurrency(dashboardData.stats.pendingInvoices)}
              icon="fas fa-file-invoice"
              trend="neutral"
            />
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card>
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Nedavné projekty</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(ROUTES.PROJECTS)}
            >
              Zobrazit vše
            </Button>
          </div>
          <div className="p-6">
            {dashboardData.recentProjects.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    compact
                    onClick={() => navigate(`/projects/${project.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-building text-4xl text-gray-300 mb-4" />
                <p className="text-gray-500">Žádné projekty</p>
                {hasPermission('projects') && (
                  <Button
                    className="mt-4"
                    onClick={() => navigate(ROUTES.PROJECTS)}
                    icon="fas fa-plus"
                  >
                    Vytvořit projekt
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Upcoming Tasks & Deadlines */}
        <Card>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Nadcházející termíny</h2>
          </div>
          <div className="p-6">
            {dashboardData.upcomingTasks.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.upcomingTasks.map((task, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      task.priority === 'high'
                        ? 'border-red-500 bg-red-50'
                        : task.priority === 'medium'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{task.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          <i className="fas fa-calendar mr-1" />
                          {formatDate(task.date)}
                        </p>
                      </div>
                      <i className={`fas fa-${
                        task.priority === 'high' ? 'exclamation-circle text-red-500' :
                        task.priority === 'medium' ? 'clock text-yellow-500' :
                        'info-circle text-blue-500'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-calendar-check text-4xl text-gray-300 mb-4" />
                <p className="text-gray-500">Žádné nadcházející termíny</p>
              </div>
            )}
          </div>
        </Card>

        {/* Notifications */}
        {dashboardData.notifications.length > 0 && (
          <Card className="lg:col-span-2">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Upozornění</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData.notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border ${
                      notification.type === 'warning'
                        ? 'border-yellow-200 bg-yellow-50'
                        : notification.type === 'error'
                        ? 'border-red-200 bg-red-50'
                        : 'border-blue-200 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <i className={`fas fa-${
                          notification.type === 'warning' ? 'exclamation-triangle text-yellow-500' :
                          notification.type === 'error' ? 'times-circle text-red-500' :
                          'info-circle text-blue-500'
                        } mr-3 mt-1`} />
                        <div>
                          <h3 className="font-medium text-gray-900">{notification.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        </div>
                      </div>
                      {notification.action && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={notification.action}
                        >
                          Zobrazit
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        {hasPermission('projects') && (
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Rychlé akce</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate(ROUTES.PROJECTS)}
                  icon="fas fa-plus"
                  className="w-full"
                >
                  Nový projekt
                </Button>
                
                {hasPermission('clients') && (
                  <Button
                    variant="outline"
                    onClick={() => navigate(ROUTES.CLIENTS)}
                    icon="fas fa-user-plus"
                    className="w-full"
                  >
                    Nový klient
                  </Button>
                )}
                
                {hasPermission('finance') && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => navigate(ROUTES.INVOICES)}
                      icon="fas fa-file-invoice"
                      className="w-full"
                    >
                      Nová faktura
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => navigate(ROUTES.FINANCE)}
                      icon="fas fa-chart-line"
                      className="w-full"
                    >
                      Finance
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
