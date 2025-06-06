import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import useEmployeesStore from '../../store/employeesStore'
import useAuthStore from '../../store/authStore'
import { Button, Table, Card, Input, Modal, StatusBadge, ActionButton, CurrencyCell, DateCell } from '../../components/ui'
import { EMPLOYEE_STATUS, STATUS_LABELS, STATUS_COLORS } from '../../utils/constants'
import { formatCurrency, formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

const EmployeesPage = () => {
  const { profile } = useAuthStore()
  const { 
    employees, 
    loadEmployees, 
    addEmployee,
    updateEmployee,
    deleteEmployee,
    filters, 
    setFilters, 
    getFilteredEmployees,
    getEmployeeStats,
    isLoading 
  } = useEmployeesStore()

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      position: '',
      start_date: new Date().toISOString().split('T')[0],
      hourly_rate: '',
      notes: ''
    }
  })

  useEffect(() => {
    loadEmployees()
  }, [loadEmployees])

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

  const filteredEmployees = getFilteredEmployees()
  const stats = getEmployeeStats()

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      let result
      if (editingEmployee) {
        result = await updateEmployee(editingEmployee.id, data)
      } else {
        result = await addEmployee(data, profile.id)
      }

      if (result.success) {
        toast.success(editingEmployee ? 'Zaměstnanec upraven' : 'Zaměstnanec přidán')
        handleCloseModal()
      } else {
        toast.error(result.error || 'Chyba při ukládání')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setEditingEmployee(null)
    reset()
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
      const result = await deleteEmployee(employeeToDelete.id)
      if (result.success) {
        toast.success('Zaměstnanec smazán')
        setShowDeleteModal(false)
        setEmployeeToDelete(null)
      }
    } finally {
      setDeleteLoading(false)
    }
  }

  const columns = [
    {
      key: 'name',
      title: 'Jméno',
      render: (_, row) => (
        <div>
          <div className="font-semibold text-gray-900">
            {`${row.first_name} ${row.last_name}`}
          </div>
          <div className="text-sm text-gray-500">{row.position || '-'}</div>
        </div>
      )
    },
    {
      key: 'contact',
      title: 'Kontakt',
      render: (_, row) => (
        <div>
          <div className="text-sm">{row.email || '-'}</div>
          <div className="text-sm text-gray-500">{row.phone || '-'}</div>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Stav',
      render: (value) => (
        <StatusBadge 
          status={value || EMPLOYEE_STATUS.ACTIVE}
          statusLabels={STATUS_LABELS}
          statusColors={STATUS_COLORS}
        />
      )
    },
    {
      key: 'start_date',
      title: 'Datum nástupu',
      render: (value) => <DateCell date={value} />
    },
    {
      key: 'hourly_rate',
      title: 'Hodinová sazba',
      render: (value) => value ? <CurrencyCell amount={value} /> : '-'
    },
    {
      key: 'actions',
      title: 'Akce',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <ActionButton
            icon="fas fa-eye"
            tooltip="Zobrazit detail"
            onClick={() => console.log('View employee', row)}
          />
          <ActionButton
            icon="fas fa-clock"
            tooltip="Docházka"
            onClick={() => console.log('View attendance', row)}
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
        </div>
      )
    }
  ]

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
    'Ostatní'
  ]

  const statusOptions = [
    { value: '', label: 'Všechny stavy' },
    { value: EMPLOYEE_STATUS.ACTIVE, label: STATUS_LABELS[EMPLOYEE_STATUS.ACTIVE] },
    { value: EMPLOYEE_STATUS.INACTIVE, label: STATUS_LABELS[EMPLOYEE_STATUS.INACTIVE] },
    { value: EMPLOYEE_STATUS.TERMINATED, label: STATUS_LABELS[EMPLOYEE_STATUS.TERMINATED] }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zaměstnanci</h1>
          <p className="text-gray-600">Správa týmu a docházky</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => console.log('Import employees')}
            icon="fas fa-upload"
          >
            Import
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            icon="fas fa-plus"
          >
            Přidat zaměstnance
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-users text-blue-600 text-xl" />
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
              <i className="fas fa-user-check text-green-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Aktivní</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-user-clock text-yellow-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Neaktivní</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.inactive}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-user-times text-red-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Ukončeno</p>
              <p className="text-2xl font-bold text-red-600">{stats.terminated}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              type="text"
              placeholder="Hledat zaměstnance..."
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

            <Input
              type="select"
              value={filters.position}
              onChange={(e) => setFilters({ position: e.target.value })}
            >
              <option value="">Všechny pozice</option>
              {positions.map(position => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </Input>

            <Button
              variant="outline"
              onClick={() => setFilters({ search: '', status: '', position: '' })}
              size="sm"
            >
              Vymazat filtry
            </Button>
          </div>
        </div>
      </Card>

      {/* Employees Table */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Seznam zaměstnanců ({filteredEmployees.length})
            </h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" icon="fas fa-download">
                Export
              </Button>
              <Button variant="outline" size="sm" icon="fas fa-calendar">
                Docházka
              </Button>
            </div>
          </div>
        </div>
        
        <Table
          columns={columns}
          data={filteredEmployees}
          loading={isLoading}
          emptyMessage="Žádní zaměstnanci nenalezeni"
          emptyIcon="fas fa-users"
        />
      </Card>

      {/* Add/Edit Employee Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        title={editingEmployee ? 'Upravit zaměstnance' : 'Nový zaměstnanec'}
        size="lg"
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
              {editingEmployee ? 'Uložit změny' : 'Přidat zaměstnance'}
            </Button>
          </>
        }
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('first_name', { required: 'Jméno je povinné' })}
              label="Křestní jméno"
              type="text"
              placeholder="Jan"
              error={errors.first_name?.message}
              required
            />
            
            <Input
              {...register('last_name', { required: 'Příjmení je povinné' })}
              label="Příjmení"
              type="text"
              placeholder="Novák"
              error={errors.last_name?.message}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('email')}
              label="E-mail"
              type="email"
              placeholder="jan.novak@email.cz"
              error={errors.email?.message}
            />
            
            <Input
              {...register('phone')}
              label="Telefon"
              type="tel"
              placeholder="+420 123 456 789"
              error={errors.phone?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('position', { required: 'Pozice je povinná' })}
              label="Pozice"
              type="select"
              error={errors.position?.message}
              required
            >
              <option value="">Vyberte pozici</option>
              {positions.map(position => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </Input>
            
            <Input
              {...register('start_date', { required: 'Datum nástupu je povinné' })}
              label="Datum nástupu"
              type="date"
              error={errors.start_date?.message}
              required
            />
          </div>

          <Input
            {...register('hourly_rate')}
            label="Hodinová sazba"
            type="number"
            step="0.01"
            placeholder="350"
            suffix="Kč/hod"
            error={errors.hourly_rate?.message}
          />

          <Input
            {...register('notes')}
            label="Poznámky"
            type="textarea"
            rows={3}
            placeholder="Dodatečné informace o zaměstnanci..."
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Smazat zaměstnance"
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
              <p className="font-medium">Opravdu chcete smazat tohoto zaměstnance?</p>
              <p className="text-sm text-gray-600 mt-1">
                Tato akce je nevratná a smaže všechna související data.
              </p>
            </div>
          </div>
          
          {employeeToDelete && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium text-gray-900">
                {`${employeeToDelete.first_name} ${employeeToDelete.last_name}`}
              </p>
              <p className="text-sm text-gray-600 mt-1">{employeeToDelete.position}</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default EmployeesPage
