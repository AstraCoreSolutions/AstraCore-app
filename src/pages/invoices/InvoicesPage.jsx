import React, { useEffect, useState } from 'react'
import { Button, Table, Card, Input, StatusBadge, CurrencyCell, DateCell, ActionButton } from '../../components/ui'
import { INVOICE_STATUS, STATUS_LABELS, STATUS_COLORS } from '../../utils/constants'
import { formatCurrency, formatDate, isDatePast } from '../../utils/helpers'

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    client: '',
    search: ''
  })

  // Mock data - replace with real API calls
  useEffect(() => {
    const mockInvoices = [
      {
        id: 1,
        invoice_number: 'FA-2024-001',
        client_name: 'Stavební firma ABC s.r.o.',
        issue_date: '2024-01-15',
        due_date: '2024-01-29',
        total_amount: 125000,
        status: INVOICE_STATUS.PAID,
        created_at: '2024-01-15T10:00:00Z'
      },
      {
        id: 2,
        invoice_number: 'FA-2024-002',
        client_name: 'Developer XYZ a.s.',
        issue_date: '2024-01-20',
        due_date: '2024-02-03',
        total_amount: 87500,
        status: INVOICE_STATUS.PENDING,
        created_at: '2024-01-20T14:30:00Z'
      },
      {
        id: 3,
        invoice_number: 'FA-2024-003',
        client_name: 'Rodinný dům - Novák',
        issue_date: '2024-01-10',
        due_date: '2024-01-24',
        total_amount: 45000,
        status: INVOICE_STATUS.OVERDUE,
        created_at: '2024-01-10T09:15:00Z'
      }
    ]

    setTimeout(() => {
      setInvoices(mockInvoices)
      setIsLoading(false)
    }, 1000)
  }, [])

  const getFilteredInvoices = () => {
    return invoices.filter(invoice => {
      // Status filter
      if (filters.status && invoice.status !== filters.status) {
        return false
      }
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const searchFields = [
          invoice.invoice_number,
          invoice.client_name
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
    const paid = invoices.filter(i => i.status === INVOICE_STATUS.PAID).length
    const pending = invoices.filter(i => i.status === INVOICE_STATUS.PENDING).length
    const overdue = invoices.filter(i => i.status === INVOICE_STATUS.OVERDUE).length
    
    const totalAmount = invoices.reduce((sum, i) => sum + i.total_amount, 0)
    const pendingAmount = invoices
      .filter(i => i.status === INVOICE_STATUS.PENDING || i.status === INVOICE_STATUS.OVERDUE)
      .reduce((sum, i) => sum + i.total_amount, 0)

    return { total, paid, pending, overdue, totalAmount, pendingAmount }
  }

  const filteredInvoices = getFilteredInvoices()
  const stats = getInvoiceStats()

  const columns = [
    {
      key: 'invoice_number',
      title: 'Číslo faktury',
      render: (value, row) => (
        <div>
          <div className="font-semibold text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{formatDate(row.issue_date)}</div>
        </div>
      )
    },
    {
      key: 'client_name',
      title: 'Klient',
      render: (value) => (
        <div className="max-w-xs">
          <p className="truncate">{value}</p>
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
      key: 'due_date',
      title: 'Splatnost',
      render: (value, row) => {
        const isPast = isDatePast(value) && row.status !== INVOICE_STATUS.PAID
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
            onClick={() => console.log('View invoice', row)}
          />
          <ActionButton
            icon="fas fa-download"
            tooltip="Stáhnout PDF"
            onClick={() => console.log('Download PDF', row)}
            variant="ghost"
          />
          <ActionButton
            icon="fas fa-edit"
            tooltip="Upravit"
            onClick={() => console.log('Edit invoice', row)}
            variant="ghost"
          />
          {row.status === INVOICE_STATUS.PENDING && (
            <ActionButton
              icon="fas fa-check"
              tooltip="Označit jako zaplaceno"
              onClick={() => console.log('Mark as paid', row)}
              variant="ghost"
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            />
          )}
        </div>
      )
    }
  ]

  const statusOptions = [
    { value: '', label: 'Všechny stavy' },
    { value: INVOICE_STATUS.DRAFT, label: STATUS_LABELS[INVOICE_STATUS.DRAFT] },
    { value: INVOICE_STATUS.PENDING, label: STATUS_LABELS[INVOICE_STATUS.PENDING] },
    { value: INVOICE_STATUS.PAID, label: STATUS_LABELS[INVOICE_STATUS.PAID] },
    { value: INVOICE_STATUS.OVERDUE, label: STATUS_LABELS[INVOICE_STATUS.OVERDUE] },
    { value: INVOICE_STATUS.CANCELLED, label: STATUS_LABELS[INVOICE_STATUS.CANCELLED] }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faktury</h1>
          <p className="text-gray-600">Správa fakturace a plateb</p>
        </div>
        <Button
          onClick={() => console.log('Create new invoice')}
          icon="fas fa-plus"
        >
          Vystavit fakturu
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-file-invoice text-blue-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Celkem faktur</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-check-circle text-green-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Zaplaceno</p>
              <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-clock text-yellow-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Čekající</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-exclamation-triangle text-red-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Po splatnosti</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Celková hodnota faktur</h3>
          <div className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</div>
          <p className="text-gray-600 mt-1">Za všechny faktury</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Čeká na úhradu</h3>
          <div className="text-3xl font-bold text-red-600">{formatCurrency(stats.pendingAmount)}</div>
          <p className="text-gray-600 mt-1">Neuhrazené faktury</p>
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
              placeholder="Hledat faktury..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              icon="fas fa-search"
            />
            
            <Input
              type="select"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
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
                onClick={() => setFilters({ search: '', status: '', client: '' })}
                size="sm"
              >
                Vymazat filtry
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Invoices Table */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Seznam faktur ({filteredInvoices.length})
            </h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" icon="fas fa-download">
                Export
              </Button>
            </div>
          </div>
        </div>
        
        <Table
          columns={columns}
          data={filteredInvoices.map(invoice => ({
            ...invoice,
            _highlight: isDatePast(invoice.due_date) && invoice.status !== INVOICE_STATUS.PAID
          }))}
          loading={isLoading}
          emptyMessage="Žádné faktury nenalezeny"
          emptyIcon="fas fa-file-invoice"
        />
      </Card>
    </div>
  )
}

export default InvoicesPage
