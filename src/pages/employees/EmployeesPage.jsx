import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button, Table, Card, Input, Modal, StatusBadge, ActionButton, CurrencyCell } from '../../components/ui'
import { EMPLOYEE_STATUS, STATUS_LABELS, STATUS_COLORS } from '../../utils/constants'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { supabase } from '../../config/supabase'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

const EmployeesPage = () => {
  const { user } = useAuthStore()
  const [employees, setEmployees] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    position: '',
    search: ''
  })

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      position: '',
      start_date: '',
      hourly_rate: '',
      status: EMPLOYEE_STATUS.ACTIVE,
      notes: ''
    }
  })

  const positions = [
    'Vedoucí stavby',
    'Stavbyvedoucí',
    'Mistr',
    'Zedník',
    'Tesař',
    'Elektrikář',
    'Instalatér',
    'Pomocný pracovník',
    'Řidič',
    'Administrativní pracovník',
    'Ostatní'
  ]

  // Load employees from Supabase
  const loadEmployees = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id) // Exclude current user
        .order('first_name')

      if (error) throw error

      // Zjednodušená verze bez JOIN až do vyřešení schématu
      const employeesWithStats = data?.map(employee => ({
        ...employee,
        attendance_count: 0, // Placeholder
        projects_count: 0, // Placeholder
        full_name: `${employee.first_name || ''} ${employee.last_name || ''}`.trim(),
        status: employee.status || EMPLOYEE_STATUS.ACTIVE
      })) || []

      setEmployees(employeesWithStats)
    } catch (error) {
      console.error('Error loading employees:', error)
      toast.error('Chyba při načítání zaměstnanců')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadEmployees()
  }, [user?.id])

  useEffect(() => {
    if (editingEmployee) {
      Object.keys(editingEmployee).forEach(key => {
        if (key === 'start_date') {
          setValue(key, editingEmployee[key]?.split('T')[0])
        } else {
          setValue(key, editingEmployee[key] || '')
        }
      })
    }
  }, [editingEmployee, setValue])

  const getFilteredEmployees = () => {
    return employees.filter(employee => {
      // Status filter
      if (filters.status && employee.status !== filters.status) {
        return false
      }
      
      // Position filter
      if (filters.position && employee.position !== filters.position) {
        return false
      }
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const searchFields = [
          employee.first_name,
          employee.last_name,
          employee.email,
          employee.phone,
          employee.position
        ].filter(Boolean)
        
        const matchesSearch = searchFields.some(field => 
          field.toLowerCase().includes(searchLower)
        )
        
        if (!matchesSearch) return false
      }
      
      return true
    })
  }

  const getEmployeeStats = () => {
    const total = employees.length
    const active = employees.filter(e => e.status === EMPLOYEE_STATUS.ACTIVE).length
    const inactive = employees.filter(e => e.status === EMPLOYEE_STATUS.INACTIVE).length
    const avgHourlyRate = employees.length > 0 
      ? employees.reduce((sum, e) => sum + (e.hourly_rate || 0), 0) / employees.length 
      : 0

    return { total, active, inactive, avgHourlyRate }
  }

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      const employeeData = {
        ...data,
        hourly_rate: parseFloat(data.hourly_rate) || 0,
        start_date: data.start_date || null,
        role: 'employee' // Default role
      }

      let result
      if (editingEmployee) {
        // Update existing employee
        result = await supabase
          .from('profiles')
          .update(employeeData)
          .eq('id', editingEmployee.id)
          .select()
      } else {
        // For new employees, we would typically create a user account first
        // This is a simplified version - in real app, you'd need proper user creation
        toast.info('Vytvoření nového zaměstnance vyžaduje registraci uživatelského účtu')
        return
      }

      if (result.error) throw result.error

      toast.success('Zaměstnanec byl aktualizován')
      
      // Reload employees
      await loadEmployees()
      
      // Reset form and close modal
      reset()
      setShowAddModal(false)
      setEditingEmployee(null)
      
    } catch (error) {
      console.error('Error saving employee:', error)
      toast.error('Chyba při ukládání zaměstnance')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (employee) => {
    setEditingEmployee(employee)
    setShowAddModal(true)
  }

  const handleDeleteClick = (employee) => {
    setEmployeeToDelete(employee)
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!employeeToDelete) return

    setDeleteLoading(true)
    try {
      // In a real app, you might want to deactivate instead of delete
      const { error } = await supabase
        .from('profiles')
        .update({ status: EMPLOYEE_STATUS.TERMINATED })
        .eq('id', employeeToDelete.id)

      if (error) throw error

      toast.success('Zaměstnanec byl deaktivován')
      await loadEmployees()
      setShowDeleteModal(false)
      setEmployeeToDelete(null)
      
    } catch (error) {
      console.error('Error deactivating employee:', error)
      toast.error('Chyba při deaktivaci zaměstnance')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleViewAttendance = (employee) => {
    // Navigate to attendance page for specific employee
    toast.info(`Docházka pro ${employee.full_name}`)
  }

  const handleViewDetail = (employee) => {
    // Navigate to employee detail page
    toast.info(`Detail zaměstnance ${employee.full_name}`)
  }

  const handleAddNew = () => {
    setEditingEmployee(null)
    reset()
    setShowAddModal(true)
  }

  const filteredEmployees = getFilteredEmployees()
  const stats = getEmployeeStats()

  const columns = [
    {
      key: 'full_name',
      title: 'Jméno',
      render: (_, row) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              {row.first_name?.[0]}{row.last_name?.[0]}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.full_name}</div>
            <div className="text-sm text-gray-500">{row.position}</div>
          </div>
        </div>
      )
    },
    {
      key: 'contact',
      title: 'Kontakt',
      render: (_, row) => (
        <div>
          {row.email && (
            <div className="text-sm text-gray-900">{row.email}</div>
          )}
          {row.phone && (
            <div className="text-sm text-gray-500">{row.phone}</div>
          )}
        </div>
      )
    },
    {
      key: 'start_date',
      title: 'Nástup',
      render: (value) => value ? formatDate(value) : '-'
    },
    {
      key: 'hourly_rate',
      title: 'Hodinová sazba',
      render: (value) => value ? <CurrencyCell amount={value} /> : '-'
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
      key: 'projects_count',
      title: 'Projekty',
      render: (value) => (
        <div className="text-center">
          <span className="text-lg font-semibold text-gray-900">{value || 0}</span>
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Akce',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <ActionButton
            icon="fas fa-eye"
            tooltip="Zobrazit detail"
            onClick={() => handleViewDetail(row)}
          />
          <ActionButton
            icon="fas fa-clock"
            tooltip="Docházka"
            onClick={() => handleViewAttendance(row)}
            variant="ghost"
          />
          <ActionButton
            icon="fas fa-edit"
            tooltip="Upravit"
            onClick={() => handleEdit(row)}
            variant="ghost"
          />
          <ActionButton
            icon="fas fa-user-times"
            tooltip="Deaktivovat"
            onClick={() => handleDeleteClick(row)}
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          />
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zaměstnanci</h1>
          <p className="text-gray-600 mt-1">Správa týmu a zaměstnanců</p>
        </div>
        <Button onClick={handleAddNew} className="bg-primary-600 hover:bg-primary-700">
          <i className="fas fa-plus mr-2" />
          Přidat zaměstnance
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Celkem zaměstnanců</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-user-check text-green-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Neaktivní</p>
                <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-user-times text-gray-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Průměrná sazba</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.avgHourlyRate)}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-coins text-yellow-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtry</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Hledat zaměstnance..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              icon="fas fa-search"
            />
            <select
              value={filters.position}
              onChange={(e) => setFilters(prev => ({ ...prev, position: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Všechny pozice</option>
              {positions.map(position => (
                <option key={position} value={position}>{position}</option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Všechny stavy</option>
              <option value={EMPLOYEE_STATUS.ACTIVE}>{STATUS_LABELS[EMPLOYEE_STATUS.ACTIVE]}</option>
              <option value={EMPLOYEE_STATUS.INACTIVE}>{STATUS_LABELS[EMPLOYEE_STATUS.INACTIVE]}</option>
              <option value={EMPLOYEE_STATUS.TERMINATED}>{STATUS_LABELS[EMPLOYEE_STATUS.TERMINATED]}</option>
            </select>
            <Button
              variant="outline"
              onClick={() => setFilters({ status: '', position: '', search: '' })}
            >
              Vymazat filtry
            </Button>
          </div>
        </div>
      </Card>

      {/* Employees Table */}
      <Card>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Zaměstnanci ({filteredEmployees.length})
          </h3>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <i className="fas fa-download mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <i className="fas fa-upload mr-2" />
              Import
            </Button>
          </div>
        </div>
        <Table
          data={filteredEmployees}
          columns={columns}
          loading={isLoading}
          emptyMessage="Žádní zaměstnanci nenalezeni"
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setEditingEmployee(null)
          reset()
        }}
        title={editingEmployee ? 'Upravit zaměstnance' : 'Nový zaměstnanec'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!editingEmployee && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <i className="fas fa-info-circle text-blue-600 mr-2" />
                <p className="text-blue-800 text-sm">
                  Pro přidání nového zaměstnance je potřeba nejdříve vytvořit uživatelský účet
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Křestní jméno *"
              {...register('first_name', { required: 'Křestní jméno je povinné' })}
              error={errors.first_name?.message}
            />
            <Input
              label="Příjmení *"
              {...register('last_name', { required: 'Příjmení je povinné' })}
              error={errors.last_name?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="E-mail"
              type="email"
              {...register('email')}
              disabled={!editingEmployee}
            />
            <Input
              label="Telefon"
              {...register('phone')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              {...register('position')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Vyberte pozici</option>
              {positions.map(position => (
                <option key={position} value={position}>{position}</option>
              ))}
            </select>
            <Input
              label="Datum nástupu"
              type="date"
              {...register('start_date')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Hodinová sazba"
              type="number"
              step="0.01"
              {...register('hourly_rate')}
              placeholder="0.00"
            />
            <select
              {...register('status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value={EMPLOYEE_STATUS.ACTIVE}>{STATUS_LABELS[EMPLOYEE_STATUS.ACTIVE]}</option>
              <option value={EMPLOYEE_STATUS.INACTIVE}>{STATUS_LABELS[EMPLOYEE_STATUS.INACTIVE]}</option>
              <option value={EMPLOYEE_STATUS.TERMINATED}>{STATUS_LABELS[EMPLOYEE_STATUS.TERMINATED]}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poznámky
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Dodatečné informace o zaměstnanci..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddModal(false)
                setEditingEmployee(null)
                reset()
              }}
            >
              Zrušit
            </Button>
            <Button
              type="submit"
              loading={submitting}
              disabled={!editingEmployee}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {editingEmployee ? 'Uložit změny' : 'Přidat zaměstnance'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setEmployeeToDelete(null)
        }}
        title="Deaktivovat zaměstnance"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Opravdu chcete deaktivovat zaměstnance "{employeeToDelete?.full_name}"? 
            Zaměstnanec bude označen jako ukončený, ale data zůstanou zachována.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false)
                setEmployeeToDelete(null)
              }}
            >
              Zrušit
            </Button>
            <Button
              variant="danger"
              loading={deleteLoading}
              onClick={handleDelete}
            >
              Deaktivovat
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default EmployeesPage
