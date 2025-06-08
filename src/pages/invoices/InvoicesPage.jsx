import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button, Card, Input, Table, Modal, StatCard } from '../../components/ui'
import { formatCurrency, formatDate } from '../../utils/helpers'
import { supabase } from '../../config/supabase'
import toast from 'react-hot-toast'
import useAuthStore from '../../store/authStore'

const InvoicesPage = () => {
  const { profile } = useAuthStore()
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    client: ''
  })

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      invoice_number: '',
      client_id: '',
      project_id: '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: '',
      amount: '',
      tax_amount: '',
      total_amount: '',
      description: '',
      status: 'draft'
    }
  })

  // Watch amount and tax for automatic total calculation
  const watchAmount = watch('amount')
  const watchTaxAmount = watch('tax_amount')

  // Calculate total amount when amount or tax changes
  useEffect(() => {
    const amount = parseFloat(watchAmount) || 0
    const taxAmount = parseFloat(watchTaxAmount) || 0
    const total = amount + taxAmount
    setValue('total_amount', total.toFixed(2))
  }, [watchAmount, watchTaxAmount, setValue])

  // Load data on mount
  useEffect(() => {
    loadInvoices()
    loadDropdownData()
  }, [])

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
      setInvoices([])
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
      toast.error('Chyba při načítání dat')
    }
  }

  // Generate invoice number - OPRAVENO
  const generateInvoiceNumber = async () => {
    try {
      const year = new Date().getFullYear()
      
      // Get count of invoices for current year
      const { data, error } = await supabase
        .from('invoices')
        .select('invoice_number')
        .like('invoice_number', `${year}%`)
        .order('invoice_number', { ascending: false })
        .limit(1)

      if (error) throw error

      let nextNumber = 1
      if (data && data.length > 0) {
        const lastNumber = data[0].invoice_number
        const lastSequence = parseInt(lastNumber.substring(4))
        nextNumber = lastSequence + 1
      }

      return `${year}${nextNumber.toString().padStart(4, '0')}`
    } catch (error) {
      console.error('Error generating invoice number:', error)
      const year = new Date().getFullYear()
      return `${year}0001`
    }
  }

  // Handle form submission
  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      const invoiceData = {
        ...data,
        amount: parseFloat(data.amount) || 0,
        tax_amount: parseFloat(data.tax_amount) || 0,
        total_amount: parseFloat(data.total_amount) || 0,
        created_by: profile?.id,
        updated_at: new Date().toISOString()
      }

      if (editingInvoice) {
        // Update existing invoice
        const { error } = await supabase
          .from('invoices')
          .update(invoiceData)
          .eq('id', editingInvoice.id)

        if (error) throw error
        toast.success('Faktura byla aktualizována')
      } else {
        // Create new invoice - OPRAVENO
        if (!data.invoice_number) {
          invoiceData.invoice_number = await generateInvoiceNumber()
        }
        invoiceData.created_at = new Date().toISOString()

        const { error } = await supabase
          .from('invoices')
          .insert([invoiceData])

        if (error) throw error
        toast.success('Faktura byla vytvořena')
      }

      // Reload invoices
      await loadInvoices()
      
      // Reset form and close modal
      reset()
      setShowAddModal(false)
      setEditingInvoice(null)
      
    } catch (error) {
      console.error('Error saving invoice:', error)
      toast.error('Chyba při ukládání faktury: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle edit
  const handleEdit = (invoice) => {
    setEditingInvoice(invoice)
    reset({
      invoice_number: invoice.invoice_number,
      client_id: invoice.client_id,
      project_id: invoice.project_id || '',
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      amount: invoice.amount?.toString() || '',
      tax_amount: invoice.tax_amount?.toString() || '',
      total_amount: invoice.total_amount?.toString() || '',
      description: invoice.description || '',
      status: invoice.status
    })
    setShowAddModal(true)
  }

  // Handle delete
  const handleDelete = async (invoice) => {
    if (!confirm(`Opravdu chcete smazat fakturu ${invoice.invoice_number}?`)) return

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoice.id)

      if (error) throw error

      toast.success('Faktura byla smazána')
      await loadInvoices()
    } catch (error) {
      console.error('Error deleting invoice:', error)
      toast.error('Chyba při mazání faktury: ' + error.message)
    }
  }

  // Handle add new - OPRAVENO
  const handleAddNew = async () => {
    setEditingInvoice(null)
    const newInvoiceNumber = await generateInvoiceNumber()
    
    reset({
      invoice_number: newInvoiceNumber,
      client_id: '',
      project_id: '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: '',
      amount: '',
      tax_amount: '',
      total_amount: '',
      description: '',
      status: 'draft'
    })
    setShowAddModal(true)
  }

  // Handle close modal
  const handleCloseModal = () => {
    setShowAddModal(false)
    setEditingInvoice(null)
    reset()
  }

  // Filter invoices
  const getFilteredInvoices = () => {
    return invoices.filter(invoice => {
      const matchesSearch = !filters.search || 
        invoice.invoice_number?.toLowerCase().includes(filters.search.toLowerCase()) ||
        invoice.client_name?.toLowerCase().includes(filters.search.toLowerCase())
      
      const matchesStatus = !filters.status || invoice.status === filters.status
      const matchesClient = !filters.client || invoice.client_id === filters.client
      
      return matchesSearch && matchesStatus && matchesClient
    })
  }

  // Calculate statistics
  const getInvoiceStats = () => {
    const total = invoices.length
    const draft = invoices.filter(inv => inv.status === 'draft').length
    const pending = invoices.filter(inv => inv.status === 'pending').length
    const paid = invoices.filter(inv => inv.status === 'paid').length
    const overdue = invoices.filter(inv => inv.status === 'overdue').length
    
    const totalAmount = invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0)
    
    return { total, draft, pending, paid, overdue, totalAmount }
  }

  // Set due date automatically when issue date changes
  const handleIssueDateChange = (issueDate) => {
    if (issueDate) {
      const dueDate = new Date(issueDate)
      dueDate.setDate(dueDate.getDate() + 14) // 14 days payment term
      setValue('due_date', dueDate.toISOString().split('T')[0])
    }
  }

  const filteredInvoices = getFilteredInvoices()
  const stats = getInvoiceStats()

  const statusOptions = [
    { value: 'draft', label: 'Koncept', color: 'gray' },
    { value: 'pending', label: 'Čekající', color: 'yellow' },
    { value: 'paid', label: 'Zaplaceno', color: 'green' },
    { value: 'overdue', label: 'Po splatnosti', color: 'red' },
    { value: 'cancelled', label: 'Zrušeno', color: 'red' }
  ]

  const columns = [
    {
      key: 'invoice_number',
      title: 'Číslo faktury',
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{formatDate(row.issue_date)}</div>
        </div>
      )
    },
    {
      key: 'client_name',
      title: 'Klient'
    },
    {
      key: 'project_name',
      title: 'Projekt',
      render: (value) => value || '-'
    },
    {
      key: 'total_amount',
      title: 'Částka',
      render: (value) => formatCurrency(value)
    },
    {
      key: 'due_date',
      title: 'Splatnost',
      render: (value) => formatDate(value)
    },
    {
      key: 'status',
      title: 'Stav',
      render: (value) => {
        const status = statusOptions.find(s => s.value === value)
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            status?.color === 'green' ? 'bg-green-100 text-green-800' :
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
      key: 'actions',
      title: 'Akce',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
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
            onClick={() => handleDelete(row)}
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
          <h1 className="text-2xl font-bold text-gray-900">Faktury</h1>
          <p className="text-gray-600">Správa faktur a fakturace</p>
        </div>
        <Button
          onClick={handleAddNew}
          icon="fas fa-plus"
        >
          Vytvořit fakturu
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Celkem"
          value={stats.total}
          icon="fas fa-file-invoice"
          trend="neutral"
        />
        <StatCard
          title="Koncepty"
          value={stats.draft}
          icon="fas fa-edit"
          trend="neutral"
        />
        <StatCard
          title="Čekající"
          value={stats.pending}
          icon="fas fa-clock"
          trend="neutral"
        />
        <StatCard
          title="Zaplaceno"
          value={stats.paid}
          icon="fas fa-check-circle"
          trend="positive"
        />
        <StatCard
          title="Po splatnosti"
          value={stats.overdue}
          icon="fas fa-exclamation-triangle"
          trend={stats.overdue > 0 ? "negative" : "neutral"}
        />
        <StatCard
          title="Celková částka"
          value={formatCurrency(stats.totalAmount)}
          icon="fas fa-money-bill-wave"
          trend="positive"
        />
      </div>

      {/* Overdue Invoices Alert */}
      {stats.overdue > 0 && (
        <Card className="border-red-200 bg-red-50">
          <div className="p-4">
            <div className="flex items-center">
              <i className="fas fa-exclamation-triangle text-red-500 mr-3" />
              <div>
                <h3 className="font-medium text-red-900">
                  Pozor! Máte {stats.overdue} faktur po splatnosti
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  Doporučujeme kontaktovat klienty ohledně úhrady těchto faktur.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto border-red-300 text-red-700 hover:bg-red-100"
                onClick={() => setFilters(prev => ({ ...prev, status: 'overdue' }))}
              >
                Zobrazit
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Hledat fakturu..."
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
            
            <Button
              variant="outline"
              onClick={() => setFilters({ search: '', status: '', client: '' })}
              icon="fas fa-times"
            >
              Vymazat filtry
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Stats Summary - shown when no invoices */}
      {invoices.length === 0 && !isLoading && (
        <Card className="text-center py-12">
          <i className="fas fa-file-invoice text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Zatím žádné faktury</h3>
          <p className="text-gray-600 mb-6">
            Začněte vytvořením své první faktury pro klienta
          </p>
          <Button
            onClick={handleAddNew}
            icon="fas fa-plus"
            size="lg"
          >
            Vytvořit první fakturu
          </Button>
        </Card>
      )}

      {/* Invoices Table */}
      {invoices.length > 0 && (
        <Card>
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Faktury ({filteredInvoices.length})
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
                icon="fas fa-upload"
                disabled
              >
                Import (brzy)
              </Button>
            </div>
          </div>
          
          <Table
            columns={columns}
            data={filteredInvoices}
            loading={isLoading}
            emptyMessage="Žádné faktury nevyhovují filtrům"
            emptyIcon="fas fa-filter"
          />
        </Card>
      )}

      {/* Add/Edit Invoice Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        title={editingInvoice ? 'Upravit fakturu' : 'Nová faktura'}
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
              {editingInvoice ? 'Uložit změny' : 'Vytvořit fakturu'}
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
                {...register('invoice_number', { required: 'Číslo faktury je povinné' })}
                label="Číslo faktury"
                error={errors.invoice_number?.message}
                required
                disabled={!!editingInvoice}
                className={editingInvoice ? "bg-gray-50" : ""}
                helpText={editingInvoice ? "Číslo faktury nelze měnit" : "Automaticky generováno"}
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
                {...register('project_id')}
                label="Projekt"
                type="select"
                helpText="Volitelné - přiřazení k projektu"
              >
                <option value="">Bez projektu</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Input>
              
              <Input
                {...register('status', { required: 'Stav je povinný' })}
                label="Stav faktury"
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
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Datumy</h3>
              
              <Input
                {...register('issue_date', { required: 'Datum vystavení je povinné' })}
                label="Datum vystavení"
                type="date"
                error={errors.issue_date?.message}
                required
                onChange={(e) => {
                  handleIssueDateChange(e.target.value)
                }}
              />
              
              <Input
                {...register('due_date', { required: 'Datum splatnosti je povinné' })}
                label="Datum splatnosti"
                type="date"
                error={errors.due_date?.message}
                required
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start">
                  <i className="fas fa-info-circle text-blue-500 mt-0.5 mr-2" />
                  <div className="text-sm">
                    <div className="font-medium text-blue-900">Automatické nastavení</div>
                    <div className="text-blue-700">Splatnost se automaticky nastaví na 14 dní od vystavení</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Finanční údaje</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                {...register('amount', { 
                  required: 'Částka je povinná',
                  min: { value: 0.01, message: 'Částka musí být větší než 0' }
                })}
                label="Částka bez DPH"
                type="number"
                step="0.01"
                placeholder="0.00"
                error={errors.amount?.message}
                required
                suffix="Kč"
              />
              
              <Input
                {...register('tax_amount', {
                  min: { value: 0, message: 'DPH musí být kladná nebo nulová' }
                })}
                label="DPH"
                type="number"
                step="0.01"
                placeholder="0.00"
                error={errors.tax_amount?.message}
                suffix="Kč"
                helpText="Zadejte částku DPH, ne procenta"
              />
              
              <Input
                {...register('total_amount')}
                label="Celková částka"
                type="number"
                step="0.01"
                disabled
                className="bg-gray-50"
                suffix="Kč"
                helpText="Automaticky vypočítáno"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Input
              {...register('description')}
              label="Popis služeb"
              type="textarea"
              rows={4}
              placeholder="Detailní popis poskytnutých služeb, prací nebo dodávek..."
              helpText="Tento text se zobrazí na faktuře"
            />
          </div>

          {/* Company Information Display */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Dodavatel (vaše údaje)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">{import.meta.env.VITE_COMPANY_NAME}</div>
                <div>{import.meta.env.VITE_COMPANY_ADDRESS}</div>
                <div>{import.meta.env.VITE_COMPANY_CITY} {import.meta.env.VITE_COMPANY_POSTAL}</div>
              </div>
              <div>
                <div>IČO: {import.meta.env.VITE_COMPANY_ICO}</div>
                <div>DIČ: {import.meta.env.VITE_COMPANY_DIC}</div>
                <div>Tel: {import.meta.env.VITE_COMPANY_PHONE}</div>
                <div>Email: {import.meta.env.VITE_COMPANY_EMAIL}</div>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
{/* Description */}
          <div>
            <Input
              {...register('description')}
              label="Popis služeb"
              type="textarea"
              rows={4}
              placeholder="Detailní popis poskytnutých služeb, prací nebo dodávek..."
              helpText="Tento text se zobrazí na faktuře"
            />
          </div>

          {/* Company Information Display */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Dodavatel (vaše údaje)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">{import.meta.env.VITE_COMPANY_NAME}</div>
                <div>{import.meta.env.VITE_COMPANY_ADDRESS}</div>
                <div>{import.meta.env.VITE_COMPANY_CITY} {import.meta.env.VITE_COMPANY_POSTAL}</div>
              </div>
              <div>
                <div>IČO: {import.meta.env.VITE_COMPANY_ICO}</div>
                <div>DIČ: {import.meta.env.VITE_COMPANY_DIC}</div>
                <div>Tel: {import.meta.env.VITE_COMPANY_PHONE}</div>
                <div>Email: {import.meta.env.VITE_COMPANY_EMAIL}</div>
              </div>
            </div>
          </div>
    </form>
      </Modal>
    </div>
  )
}
export default InvoicesPage
