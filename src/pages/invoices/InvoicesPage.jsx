import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import useFinanceStore from '../../store/financeStore'
import { Button, Table, Card, Input, Modal, StatusBadge, CurrencyCell, DateCell, ActionButton } from '../../components/ui'
import { INVOICE_STATUS, STATUS_LABELS, STATUS_COLORS } from '../../utils/constants'
import { formatCurrency, formatDate } from '../../utils/helpers'
import { supabase } from '../../config/supabase'
import toast from 'react-hot-toast'

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    client: '',
    search: ''
  })

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      invoice_number: '',
      client_id: '',
      project_id: '',
      amount: '',
      tax_amount: '',
      total_amount: '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: '',
      status: INVOICE_STATUS.DRAFT,
      description: '',
      notes: ''
    }
  })

  const watchAmount = watch('amount')
  const watchTaxAmount = watch('tax_amount')

  // Calculate total amount when amount or tax changes
  useEffect(() => {
    const amount = parseFloat(watchAmount) || 0
    const taxAmount = parseFloat(watchTaxAmount) || 0
    const total = amount + taxAmount
    setValue('total_amount', total.toFixed(2))
  }, [watchAmount, watchTaxAmount, setValue])

  // Load invoices from Supabase
  const loadInvoices = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(name),
          project:projects(name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const invoicesWithDetails = data?.map(invoice => ({
        ...invoice,
        client_name: invoice.client?.name || 'Neznámý klient',
        project_name: invoice.project?.name || null
      })) || []

      setInvoices(invoicesWithDetails)
    } catch (error) {
      console.error('Error loading invoices:', error)
      toast.error('Chyba při načítání faktur')
      setInvoices([]) // Prázdný array místo mock dat
    } finally {
      setIsLoading(false)
    }
  }

  // Load clients and projects for dropdowns
  const loadDropdownData = async () => {
    try {
      const [clientsResult, projectsResult] = await Promise.all([
        supabase.from('clients').select('id, name').order('name'),
        supabase.from('projects').select('id, name').order('name')
      ])

      if (clientsResult.error) throw clientsResult.error
      if (projectsResult.error) throw projectsResult.error

      setClients(clientsResult.data || [])
      setProjects(projectsResult.data || [])
    } catch (error) {
      console.error('Error loading dropdown data:', error)
    }
  }

  useEffect(() => {
    loadInvoices()
    loadDropdownData()
  }, [])

  useEffect(() => {
    if (editingInvoice) {
      Object.keys(editingInvoice).forEach(key => {
        if (key.includes('_date')) {
          setValue(key, editingInvoice[key]?.split('T')[0])
        } else {
          setValue(key, editingInvoice[key] || '')
        }
      })
    }
  }, [editingInvoice, setValue])

  const getFilteredInvoices = () => {
    return invoices.filter(invoice => {
      // Status filter
      if (filters.status && invoice.status !== filters.status) {
        return false
      }
      
      // Client filter
      if (filters.client && invoice.client_id !== filters.client) {
        return false
      }
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const searchFields = [
          invoice.invoice_number,
          invoice.client_name,
          invoice.project_name,
          invoice.description
        ].filter(Boolean)
        
        const matchesSearch = searchFields.some(field => 
          field.toLowerCase().includes(searchLower)
        )
        
        if (!matchesSearch) return false
      }
      
      return true
    })
  }

  const getInvoiceStats = () => {
    const total = invoices.length
    const draft = invoices.filter(i => i.status === INVOICE_STATUS.DRAFT).length
    const pending = invoices.filter(i => i.status === INVOICE_STATUS.PENDING).length
    const paid = invoices.filter(i => i.status === INVOICE_STATUS.PAID).length
    const overdue = invoices.filter(i => i.status === INVOICE_STATUS.OVERDUE).length
    const totalAmount = invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0)
    const pendingAmount = invoices
      .filter(i => i.status === INVOICE_STATUS.PENDING)
      .reduce((sum, i) => sum + (i.total_amount || 0), 0)

    return { total, draft, pending, paid, overdue, totalAmount, pendingAmount }
  }

  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear()
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `${year}${randomNum}`
  }

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      const invoiceData = {
        ...data,
        amount: parseFloat(data.amount) || 0,
        tax_amount: parseFloat(data.tax_amount) || 0,
        total_amount: parseFloat(data.total_amount) || 0,
        client_id: data.client_id || null,
        project_id: data.project_id || null,
        invoice_number: data.invoice_number || generateInvoiceNumber()
      }

      let result
      if (editingInvoice) {
        // Update existing invoice
        result = await supabase
          .from('invoices')
          .update(invoiceData)
          .eq('id', editingInvoice.id)
          .select()
      } else {
        // Create new invoice
        result = await supabase
          .from('invoices')
          .insert([invoiceData])
          .select()
      }

      if (result.error) throw result.error

      toast.success(editingInvoice ? 'Faktura byla aktualizována' : 'Faktura byla vytvořena')
      
      // Reload invoices
      await loadInvoices()
      
      // Reset form and close modal
      reset()
      setShowAddModal(false)
      setEditingInvoice(null)
      
    } catch (error) {
      console.error('Error saving invoice:', error)
      toast.error('Chyba při ukládání faktury')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice)
    setShowAddModal(true)
  }

  const handleDeleteClick = (invoice) => {
    setInvoiceToDelete(invoice)
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!invoiceToDelete) return

    setDeleteLoading(true)
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceToDelete.id)

      if (error) throw error

      toast.success('Faktura byla smazána')
      await loadInvoices()
      setShowDeleteModal(false)
      setInvoiceToDelete(null)
      
    } catch (error) {
      console.error('Error deleting invoice:', error)
      toast.error('Chyba při mazání faktury')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleMarkAsPaid = async (invoice) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: INVOICE_STATUS.PAID,
          paid_at: new Date().toISOString()
        })
        .eq('id', invoice.id)

      if (error) throw error

      toast.success('Faktura byla označena jako zaplacená')
      await loadInvoices()
      
    } catch (error) {
      console.error('Error marking invoice as paid:', error)
      toast.error('Chyba při označování faktury jako zaplacené')
    }
  }

  const handleAddNew = () => {
    setEditingInvoice(null)
    reset({
      invoice_number: generateInvoiceNumber(),
      issue_date: new Date().toISOString().split('T')[0],
      status: INVOICE_STATUS.DRAFT
    })
    setShowAddModal(true)
  }

  const filteredInvoices = getFilteredInvoices()
  const stats = getInvoiceStats()

  const columns = [
    {
      key: 'invoice_number',
      title: 'Číslo faktury',
      render: (value) => (
        <div className="font-medium text-gray-900">{value}</div>
      )
    },
    {
      key: 'client_name',
      title: 'Klient',
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          {row.project_name && (
            <div className="text-sm text-gray-500">{row.project_name}</div>
          )}
        </div>
      )
    },
    {
      key: 'total_amount',
      title: 'Částka',
      render: (value) => <CurrencyCell amount={value} />
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
      key: 'issue_date',
      title: 'Datum vystavení',
      render: (value) => formatDate(value)
    },
    {
      key: 'due_date',
      title: 'Datum splatnosti',
      render: (value) => {
        if (!value) return '-'
        const isPast = new Date(value) < new Date()
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
            tooltip="Zobrazit"
            onClick={() => toast.info(`Zobrazit fakturu ${row.invoice_number}`)}
          />
          <ActionButton
            icon="fas fa-download"
            tooltip="Stáhnout PDF"
            onClick={() => toast.info(`Stáhnout fakturu ${row.invoice_number}`)}
            variant="ghost"
          />
          <ActionButton
            icon="fas fa-edit"
            tooltip="Upravit"
            onClick={() => handleEdit(row)}
            variant="ghost"
          />
          {row.status === INVOICE_STATUS.PENDING && (
            <ActionButton
              icon="fas fa-check"
              tooltip="Označit jako zaplaceno"
              onClick={() => handleMarkAsPaid(row)}
              variant="ghost"
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            />
          )}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faktury</h1>
          <p className="text-gray-600 mt-1">Správa faktur a fakturace</p>
        </div>
        <Button onClick={handleAddNew} className="bg-primary-600 hover:bg-primary-700">
          <i className="fas fa-plus mr-2" />
          Vytvořit fakturu
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Celkem</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-file-invoice text-blue-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Koncepty</p>
                <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-edit text-gray-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Čekající</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-clock text-yellow-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Zaplacené</p>
                <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
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
                <p className="text-sm font-medium text-gray-600">Po splatnosti</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-red-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Celková částka</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtry</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Hledat fakturu..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              icon="fas fa-search"
            />
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Všechny stavy</option>
              <option value={INVOICE_STATUS.DRAFT}>{STATUS_LABELS[INVOICE_STATUS.DRAFT]}</option>
              <option value={INVOICE_STATUS.PENDING}>{STATUS_LABELS[INVOICE_STATUS.PENDING]}</option>
              <option value={INVOICE_STATUS.PAID}>{STATUS_LABELS[INVOICE_STATUS.PAID]}</option>
              <option value={INVOICE_STATUS.OVERDUE}>{STATUS_LABELS[INVOICE_STATUS.OVERDUE]}</option>
              <option value={INVOICE_STATUS.CANCELLED}>{STATUS_LABELS[INVOICE_STATUS.CANCELLED]}</option>
            </select>
            <select
              value={filters.client}
              onChange={(e) => setFilters(prev => ({ ...prev, client: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Všichni klienti</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
            <Button
              variant="outline"
              onClick={() => setFilters({ status: '', client: '', search: '' })}
            >
              Vymazat filtry
            </Button>
          </div>
        </div>
      </Card>

      {/* Invoices Table */}
      <Card>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Faktury ({filteredInvoices.length})
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
          data={filteredInvoices}
          columns={columns}
          loading={isLoading}
          emptyMessage="Žádné faktury nenalezeny"
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setEditingInvoice(null)
          reset()
        }}
        title={editingInvoice ? 'Upravit fakturu' : 'Nová faktura'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Číslo faktury *"
              {...register('invoice_number', { required: 'Číslo faktury je povinné' })}
              error={errors.invoice_number?.message}
            />
            <select
              {...register('status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value={INVOICE_STATUS.DRAFT}>{STATUS_LABELS[INVOICE_STATUS.DRAFT]}</option>
              <option value={INVOICE_STATUS.PENDING}>{STATUS_LABELS[INVOICE_STATUS.PENDING]}</option>
              <option value={INVOICE_STATUS.PAID}>{STATUS_LABELS[INVOICE_STATUS.PAID]}</option>
              <option value={INVOICE_STATUS.CANCELLED}>{STATUS_LABELS[INVOICE_STATUS.CANCELLED]}</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              {...register('client_id', { required: 'Klient je povinný' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Vyberte klienta</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
            <select
              {...register('project_id')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Vyberte projekt (volitelné)</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Částka bez DPH *"
              type="number"
              step="0.01"
              {...register('amount', { required: 'Částka je povinná' })}
              error={errors.amount?.message}
            />
            <Input
              label="DPH"
              type="number"
              step="0.01"
              {...register('tax_amount')}
            />
            <Input
              label="Celková částka"
              type="number"
              step="0.01"
              {...register('total_amount')}
              disabled
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Datum vystavení *"
              type="date"
              {...register('issue_date', { required: 'Datum vystavení je povinné' })}
              error={errors.issue_date?.message}
            />
            <Input
              label="Datum splatnosti"
              type="date"
              {...register('due_date')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Popis služeb
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Popis fakturovaných služeb..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poznámky
            </label>
            <textarea
              {...register('notes')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Interní poznámky..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddModal(false)
                setEditingInvoice(null)
                reset()
              }}
            >
              Zrušit
            </Button>
            <Button
              type="submit"
              loading={submitting}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {editingInvoice ? 'Uložit změny' : 'Vytvořit fakturu'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setInvoiceToDelete(null)
        }}
        title="Smazat fakturu"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Opravdu chcete smazat fakturu "{invoiceToDelete?.invoice_number}"? Tato akce je nevratná.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false)
                setInvoiceToDelete(null)
              }}
            >
              Zrušit
            </Button>
            <Button
              variant="danger"
              loading={deleteLoading}
              onClick={handleDelete}
            >
              Smazat
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default InvoicesPage
