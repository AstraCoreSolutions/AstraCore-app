import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Input, Table, Modal, StatCard } from '../../components/ui'
import { formatCurrency, formatDate } from '../../utils/helpers'
import { PROJECT_STATUS, STATUS_LABELS } from '../../utils/constants'
import { supabase } from '../../config/supabase'
import toast from 'react-hot-toast'
import useAuthStore from '../../store/authStore'

const ProjectsPage = () => {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [employees, setEmployees] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [projectToDelete, setProjectToDelete] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    client: '',
    manager: ''
  })

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      client_id: '',
      manager_id: '',
      status: 'planning',
      progress: 0,
      start_date: '',
      end_date: '',
      budget: '',
      location: '',
      assigned_employees: []
    }
  })

  // Watch form values safely
  const formValues = watch()

  // Load data on mount
  useEffect(() => {
    loadProjects()
    loadDropdownData()
  }, [])

  // Load projects from Supabase - OPRAVENO
  const loadProjects = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(name),
          manager:profiles!projects_manager_id_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const projectsWithDetails = data?.map(project => ({
        ...project,
        client_name: project.client?.name || 'Bez klienta',
        manager_name: project.manager 
          ? `${project.manager.first_name} ${project.manager.last_name}` 
          : 'Nepřiřazen',
        is_overdue: project.status === PROJECT_STATUS.ACTIVE && 
                    project.end_date && 
                    new Date(project.end_date) < new Date()
      })) || []

      setProjects(projectsWithDetails)
    } catch (error) {
      console.error('Error loading projects:', error)
      toast.error('Chyba při načítání projektů')
      setProjects([])
    } finally {
      setIsLoading(false)
    }
  }

  // Load clients and employees for dropdowns
  const loadDropdownData = async () => {
    try {
      const [clientsResult, employeesResult] = await Promise.all([
        supabase.from('clients').select('id, name').order('name'),
        supabase.from('profiles').select('id, first_name, last_name, role').order('first_name')
      ])

      if (clientsResult.error) throw clientsResult.error
      if (employeesResult.error) throw employeesResult.error

      setClients(clientsResult.data || [])
      setEmployees(employeesResult.data || [])
    } catch (error) {
      console.error('Error loading dropdown data:', error)
      toast.error('Chyba při načítání dat')
    }
  }

  // Handle form submission
  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      const projectData = {
        ...data,
        budget: parseFloat(data.budget) || null,
        progress: parseInt(data.progress) || 0,
        assigned_employees: data.assigned_employees || [],
        created_by: profile?.id,
        updated_at: new Date().toISOString()
      }

      if (editingProject) {
        // Update existing project
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', editingProject.id)

        if (error) throw error
        toast.success('Projekt byl aktualizován')
      } else {
        // Create new project
        projectData.created_at = new Date().toISOString()

        const { error } = await supabase
          .from('projects')
          .insert([projectData])

        if (error) throw error
        toast.success('Projekt byl vytvořen')
      }

      // Reload projects
      await loadProjects()
      
      // Reset form and close modal
      reset()
      setShowAddModal(false)
      setEditingProject(null)
      
    } catch (error) {
      console.error('Error saving project:', error)
      toast.error('Chyba při ukládání projektu: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle edit
  const handleEdit = (project) => {
    setEditingProject(project)
    reset({
      name: project.name || '',
      description: project.description || '',
      client_id: project.client_id || '',
      manager_id: project.manager_id || '',
      status: project.status || 'planning',
      progress: project.progress || 0,
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      budget: project.budget?.toString() || '',
      location: project.location || '',
      assigned_employees: project.assigned_employees || []
    })
    setShowAddModal(true)
  }

  // Handle delete click
  const handleDeleteClick = (project) => {
    setProjectToDelete(project)
    setShowDeleteModal(true)
  }

  // Handle delete confirm
  const handleDelete = async () => {
    if (!projectToDelete) return

    setDeleteLoading(true)
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectToDelete.id)

      if (error) throw error

      toast.success('Projekt byl smazán')
      await loadProjects()
      setShowDeleteModal(false)
      setProjectToDelete(null)
      
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Chyba při mazání projektu: ' + error.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  // Handle add new
  const handleAddNew = () => {
    setEditingProject(null)
    reset({
      name: '',
      description: '',
      client_id: '',
      manager_id: profile?.id || '', // Default to current user
      status: 'planning',
      progress: 0,
      start_date: '',
      end_date: '',
      budget: '',
      location: '',
      assigned_employees: []
    })
    setShowAddModal(true)
  }

  // Handle close modal
  const handleCloseModal = () => {
    setShowAddModal(false)
    setEditingProject(null)
    reset()
  }

  // Handle project detail view
  const handleViewDetail = (project) => {
    navigate(`/projects/${project.id}`)
  }

  // Filter projects
  const getFilteredProjects = () => {
    return projects.filter(project => {
      const matchesSearch = !filters.search || 
        project.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        project.client_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        project.location?.toLowerCase().includes(filters.search.toLowerCase())
      
      const matchesStatus = !filters.status || project.status === filters.status
      const matchesClient = !filters.client || project.client_id === filters.client
      const matchesManager = !filters.manager || project.manager_id === filters.manager
      
      return matchesSearch && matchesStatus && matchesClient && matchesManager
    })
  }

  // Calculate statistics
  const getProjectStats = () => {
    const total = projects.length
    const active = projects.filter(p => p.status === PROJECT_STATUS.ACTIVE).length
    const completed = projects.filter(p => p.status === PROJECT_STATUS.COMPLETED).length
    const overdue = projects.filter(p => p.is_overdue).length
    const planning = projects.filter(p => p.status === PROJECT_STATUS.PLANNING).length
    
    const totalBudget = projects.reduce((sum, p) => sum + (parseFloat(p.budget) || 0), 0)
    const avgProgress = projects.length > 0 
      ? projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length 
      : 0
    
    return { 
      total, 
      active, 
      completed, 
      overdue, 
      planning, 
      totalBudget, 
      avgProgress: Math.round(avgProgress) 
    }
  }

  // Set end date automatically when start date changes
  const handleStartDateChange = (startDate) => {
    if (startDate && !formValues.end_date) {
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + 3) // Default 3 months duration
      setValue('end_date', endDate.toISOString().split('T')[0])
    }
  }

  const filteredProjects = getFilteredProjects()
  const stats = getProjectStats()

  const statusOptions = [
    { value: PROJECT_STATUS.PLANNING, label: STATUS_LABELS[PROJECT_STATUS.PLANNING], color: 'blue' },
    { value: PROJECT_STATUS.ACTIVE, label: STATUS_LABELS[PROJECT_STATUS.ACTIVE], color: 'green' },
    { value: PROJECT_STATUS.COMPLETED, label: STATUS_LABELS[PROJECT_STATUS.COMPLETED], color: 'gray' },
    { value: PROJECT_STATUS.ON_HOLD, label: STATUS_LABELS[PROJECT_STATUS.ON_HOLD], color: 'yellow' },
    { value: PROJECT_STATUS.CANCELLED, label: STATUS_LABELS[PROJECT_STATUS.CANCELLED], color: 'red' }
  ]

  const managers = employees.filter(emp => 
    emp.role === 'admin' || emp.role === 'manager'
  )

  const columns = [
    {
      key: 'name',
      title: 'Projekt',
      render: (value, row) => (
        <div>
          <div className="flex items-center">
            <div className="font-medium text-gray-900 hover:text-primary-600 cursor-pointer"
                 onClick={() => handleViewDetail(row)}>
              {value}
            </div>
            {row.is_overdue && (
              <i className="fas fa-exclamation-triangle text-red-500 ml-2" title="Po termínu" />
            )}
          </div>
          <div className="text-sm text-gray-500">{row.client_name}</div>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Stav',
      render: (value) => {
        const status = statusOptions.find(s => s.value === value)
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            status?.color === 'green' ? 'bg-green-100 text-green-800' :
            status?.color === 'blue' ? 'bg-blue-100 text-blue-800' :
            status?.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
            status?.color === 'red' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {status?.label || value}
          </span>
        )
      }
    },
    {
      key: 'progress',
      title: 'Postup',
      render: (value) => (
        <div className="flex items-center">
          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
            <div 
              className={`h-2 rounded-full ${
                value >= 100 ? 'bg-green-500' :
                value >= 75 ? 'bg-blue-500' :
                value >= 50 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(value, 100)}%` }}
            />
          </div>
          <span className="text-sm font-medium">{value}%</span>
        </div>
      )
    },
    {
      key: 'manager_name',
      title: 'Manažer'
    },
    {
      key: 'dates',
      title: 'Termíny',
      render: (_, row) => (
        <div className="text-sm">
          {row.start_date && (
            <div>Start: {formatDate(row.start_date)}</div>
          )}
          {row.end_date && (
            <div className={row.is_overdue ? 'text-red-600 font-medium' : ''}>
              Konec: {formatDate(row.end_date)}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'budget',
      title: 'Rozpočet',
      render: (value) => value ? formatCurrency(value) : '-'
    },
    {
      key: 'actions',
      title: 'Akce',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewDetail(row)}
            icon="fas fa-eye"
          >
            Detail
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(row)}
            icon="fas fa-edit"
          >
            Upravit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDeleteClick(row)}
            icon="fas fa-trash"
            className="text-red-600 hover:text-red-700"
          >
            Smazat
          </Button>
        </div>
      )
    }
  ]
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projekty</h1>
          <p className="text-gray-600">Správa projektů a jejich průběhu</p>
        </div>
        <Button
          onClick={handleAddNew}
          icon="fas fa-plus"
        >
          Nový projekt
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
        <StatCard
          title="Celkem"
          value={stats.total}
          icon="fas fa-project-diagram"
          trend="neutral"
        />
        <StatCard
          title="Plánování"
          value={stats.planning}
          icon="fas fa-clipboard-list"
          trend="neutral"
        />
        <StatCard
          title="Aktivní"
          value={stats.active}
          icon="fas fa-play-circle"
          trend="positive"
        />
        <StatCard
          title="Dokončené"
          value={stats.completed}
          icon="fas fa-check-circle"
          trend="positive"
        />
        <StatCard
          title="Po termínu"
          value={stats.overdue}
          icon="fas fa-exclamation-triangle"
          trend={stats.overdue > 0 ? "negative" : "positive"}
        />
        <StatCard
          title="Celkový rozpočet"
          value={formatCurrency(stats.totalBudget)}
          icon="fas fa-euro-sign"
          trend="positive"
        />
        <StatCard
          title="Průměrný postup"
          value={`${stats.avgProgress}%`}
          icon="fas fa-chart-line"
          trend="positive"
        />
      </div>

      {/* Overdue Projects Alert */}
      {stats.overdue > 0 && (
        <Card className="border-red-200 bg-red-50">
          <div className="p-4">
            <div className="flex items-center">
              <i className="fas fa-exclamation-triangle text-red-500 mr-3" />
              <div>
                <h3 className="font-medium text-red-900">
                  Upozornění na projekty po termínu
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  {stats.overdue} projektů překročilo plánovaný termín dokončení.
                  Doporučujeme kontaktovat klienty a aktualizovat harmonogram.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto border-red-300 text-red-700 hover:bg-red-100"
                onClick={() => setFilters(prev => ({ ...prev, status: PROJECT_STATUS.ACTIVE }))}
              >
                Zobrazit aktivní
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Filtry</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              placeholder="Hledat projekt..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              icon="fas fa-search"
            />
            
            <Input
              type="select"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="">Všechny stavy</option>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Input>
            
            <Input
              type="select"
              value={filters.client}
              onChange={(e) => setFilters(prev => ({ ...prev, client: e.target.value }))}
            >
              <option value="">Všichni klienti</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </Input>
            
            <Input
              type="select"
              value={filters.manager}
              onChange={(e) => setFilters(prev => ({ ...prev, manager: e.target.value }))}
            >
              <option value="">Všichni manažeři</option>
              {managers.map(manager => (
                <option key={manager.id} value={manager.id}>
                  {manager.first_name} {manager.last_name}
                </option>
              ))}
            </Input>
            
            <Button
              variant="outline"
              onClick={() => setFilters({ search: '', status: '', client: '', manager: '' })}
              icon="fas fa-times"
            >
              Vymazat filtry
            </Button>
          </div>
        </div>
      </Card>

      {/* Empty state */}
      {projects.length === 0 && !isLoading && (
        <Card className="text-center py-12">
          <i className="fas fa-project-diagram text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Zatím žádné projekty</h3>
          <p className="text-gray-600 mb-6">
            Začněte vytvořením svého prvního projektu
          </p>
          <Button
            onClick={handleAddNew}
            icon="fas fa-plus"
            size="lg"
          >
            Vytvořit první projekt
          </Button>
        </Card>
      )}

      {/* Projects Table */}
      {projects.length > 0 && (
        <Card>
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Projekty ({filteredProjects.length})
            </h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                icon="fas fa-download"
                disabled
              >
                Export (brzy)
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon="fas fa-calendar"
                disabled
              >
                Kalendář (brzy)
              </Button>
            </div>
          </div>
          
          <Table
            columns={columns}
            data={filteredProjects}
            loading={isLoading}
            emptyMessage="Žádné projekty nevyhovují filtrům"
            emptyIcon="fas fa-filter"
          />
        </Card>
      )}

      {/* Add/Edit Project Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        title={editingProject ? 'Upravit projekt' : 'Nový projekt'}
        size="xl"
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
              {editingProject ? 'Uložit změny' : 'Vytvořit projekt'}
            </Button>
          </>
        }
      >
        <form className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Základní údaje</h3>
              
              <Input
                {...register('name', { required: 'Název projektu je povinný' })}
                label="Název projektu"
                error={errors.name?.message}
                required
                placeholder="Např. Rekonstrukce bytového domu"
              />
              
              <Input
                {...register('client_id', { required: 'Klient je povinný' })}
                label="Klient"
                type="select"
                error={errors.client_id?.message}
                required
              >
                <option value="">Vyberte klienta</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </Input>
              
              <Input
                {...register('manager_id', { required: 'Manažer projektu je povinný' })}
                label="Manažer projektu"
                type="select"
                error={errors.manager_id?.message}
                required
              >
                <option value="">Vyberte manažera</option>
                {managers.map(manager => (
                  <option key={manager.id} value={manager.id}>
                    {manager.first_name} {manager.last_name}
                  </option>
                ))}
              </Input>
              
              <Input
                {...register('location')}
                label="Lokalita"
                placeholder="Adresa nebo popis místa realizace"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Stav a postup</h3>
              
              <Input
                {...register('status', { required: 'Stav projektu je povinný' })}
                label="Stav projektu"
                type="select"
                error={errors.status?.message}
                required
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Input>
              
              <Input
                {...register('progress', { 
                  min: { value: 0, message: 'Postup nemůže být záporný' },
                  max: { value: 100, message: 'Postup nemůže být více než 100%' }
                })}
                label="Postup (%)"
                type="number"
                min="0"
                max="100"
                error={errors.progress?.message}
                placeholder="0"
                helpText="Aktuální postup projektu v procentech"
              />
              
              <Input
                {...register('budget', { 
                  min: { value: 0, message: 'Rozpočet nemůže být záporný' }
                })}
                label="Rozpočet"
                type="number"
                step="0.01"
                min="0"
                error={errors.budget?.message}
                placeholder="0.00"
                suffix="Kč"
                helpText="Celkový rozpočet projektu"
              />
            </div>
          </div>

          {/* Dates */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Časový harmonogram</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                {...register('start_date')}
                label="Plánovaný začátek"
                type="date"
                error={errors.start_date?.message}
                onChange={(e) => {
                  register('start_date').onChange(e)
                  handleStartDateChange(e.target.value)
                }}
              />
              
              <Input
                {...register('end_date')}
                label="Plánované dokončení"
                type="date"
                error={errors.end_date?.message}
              />
            </div>
            
            {formValues.start_date && formValues.end_date && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm">
                  <div className="font-medium text-blue-900">Délka projektu</div>
                  <div className="text-blue-700">
                    {(() => {
                      const start = new Date(formValues.start_date)
                      const end = new Date(formValues.end_date)
                      const diffTime = Math.abs(end - start)
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                      const months = Math.floor(diffDays / 30)
                      const days = diffDays % 30
                      
                      if (months > 0) {
                        return `${months} měsíc${months > 1 ? 'ů' : ''} a ${days} dn${days > 1 ? 'í' : 'ů'}`
                      }
                      return `${diffDays} dn${diffDays > 1 ? 'í' : 'ů'}`
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <Input
              {...register('description')}
              label="Popis projektu"
              type="textarea"
              rows={4}
              placeholder="Detailní popis projektu, požadavky klienta, specifika realizace..."
              helpText="Tento popis bude viditelný všem členům týmu"
            />
          </div>

          {/* Team Assignment */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Přiřazení týmu</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-3">
                Přiřazení zaměstnanců k projektu bude implementováno v další verzi.
                Zatím je možné nastavit pouze manažera projektu.
              </p>
              <div className="text-sm">
                <div className="font-medium text-gray-900">Aktuální manažer:</div>
                <div className="text-gray-700">
                  {formValues.manager_id ? 
                    managers.find(m => m.id === formValues.manager_id)?.first_name + ' ' +
                    managers.find(m => m.id === formValues.manager_id)?.last_name 
                    : 'Není vybrán'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Project Summary */}
          {(formValues.name || formValues.budget || formValues.start_date) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Přehled projektu</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Projekt:</div>
                  <div className="text-gray-700">{formValues.name || 'Nepojmenovaný projekt'}</div>
                  {formValues.location && (
                    <>
                      <div className="font-medium mt-2">Lokalita:</div>
                      <div className="text-gray-700">{formValues.location}</div>
                    </>
                  )}
                </div>
                <div>
                  {formValues.budget && (
                    <>
                      <div className="font-medium">Rozpočet:</div>
                      <div className="text-gray-700">{formatCurrency(formValues.budget)}</div>
                    </>
                  )}
                  {formValues.start_date && (
                    <>
                      <div className="font-medium mt-2">Začátek:</div>
                      <div className="text-gray-700">{formatDate(formValues.start_date)}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>
      </Modal>
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Smazat projekt"
        size="md"
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
              icon="fas fa-trash"
            >
              Smazat projekt
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
            <i className="fas fa-exclamation-triangle text-red-600 text-xl" />
          </div>
          
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Opravdu smazat projekt?
            </h3>
            <p className="text-gray-600">
              Chcete smazat projekt <strong>{projectToDelete?.name}</strong>?
            </p>
            {projectToDelete && (
              <div className="text-sm text-gray-500 mt-2">
                <div>Klient: {projectToDelete.client_name}</div>
                <div>Stav: {statusOptions.find(s => s.value === projectToDelete.status)?.label}</div>
                {projectToDelete.budget && (
                  <div>Rozpočet: {formatCurrency(projectToDelete.budget)}</div>
                )}
              </div>
            )}
            <p className="text-sm text-red-600 mt-3">
              <i className="fas fa-exclamation-triangle mr-1" />
              Tato akce je nevratná. Všechny související dokumenty, faktury a záznamy budou odstraněny.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ProjectsPage
