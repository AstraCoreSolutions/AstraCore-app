import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import useFinanceStore from '../../store/financeStore'
import useAuthStore from '../../store/authStore'
import { Button, Table, Card, Input, Modal, StatusBadge, CurrencyCell, DateCell, ActionButton } from '../../components/ui'
import { TRANSACTION_TYPES, EXPENSE_CATEGORIES } from '../../utils/constants'
import { formatCurrency, formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

const FinancePage = () => {
  const { profile } = useAuthStore()
  const { 
    transactions, 
    loadTransactions, 
    addTransaction,
    updateTransaction,
    deleteTransaction,
    filters, 
    setFilters, 
    getFilteredTransactions,
    getFinancialStats,
    getTransactionsByCategory,
    isLoading 
  } = useFinanceStore()

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      type: TRANSACTION_TYPES.EXPENSE,
      description: '',
      amount: '',
      category: '',
      transaction_date: new Date().toISOString().split('T')[0],
      note: ''
    }
  })

  const watchType = watch('type')

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  useEffect(() => {
    if (editingTransaction) {
      Object.keys(editingTransaction).forEach(key => {
        if (key === 'transaction_date') {
          setValue(key, editingTransaction[key]?.split('T')[0])
        } else {
          setValue(key, editingTransaction[key] || '')
        }
      })
    }
  }, [editingTransaction, setValue])

  const filteredTransactions = getFilteredTransactions()
  const stats = getFinancialStats()
  const categoryStats = getTransactionsByCategory()

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      let result
      if (editingTransaction) {
        result = await updateTransaction(editingTransaction.id, data)
      } else {
        result = await addTransaction(data, profile.id)
      }

      if (result.success) {
        toast.success(editingTransaction ? 'Transakce upravena' : 'Transakce přidána')
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
    setEditingTransaction(null)
    reset()
  }

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction)
    setShowAddModal(true)
  }

  const handleDeleteClick = (transaction) => {
    setTransactionToDelete(transaction)
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!transactionToDelete) return

    setDeleteLoading(true)
    try {
      const result = await deleteTransaction(transactionToDelete.id)
      if (result.success) {
        toast.success('Transakce smazána')
        setShowDeleteModal(false)
        setTransactionToDelete(null)
      }
    } finally {
      setDeleteLoading(false)
    }
  }

  const columns = [
    {
      key: 'type',
      title: 'Typ',
      render: (value) => (
        <div className="flex items-center">
          <i className={`fas ${value === TRANSACTION_TYPES.INCOME ? 'fa-arrow-up text-green-600' : 'fa-arrow-down text-red-600'} mr-2`} />
          <span>{value === TRANSACTION_TYPES.INCOME ? 'Příjem' : 'Výdaj'}</span>
        </div>
      )
    },
    {
      key: 'description',
      title: 'Popis',
      render: (value) => (
        <div className="max-w-xs">
          <p className="font-medium truncate">{value}</p>
        </div>
      )
    },
    {
      key: 'amount',
      title: 'Částka',
      render: (value, row) => (
        <CurrencyCell 
          amount={value}
          positive={row.type === TRANSACTION_TYPES.INCOME}
          negative={row.type === TRANSACTION_TYPES.EXPENSE}
        />
      )
    },
    {
      key: 'category',
      title: 'Kategorie',
      render: (value) => value || '-'
    },
    {
      key: 'transaction_date',
      title: 'Datum',
      render: (value) => <DateCell date={value} />
    },
    {
      key: 'actions',
      title: 'Akce',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <ActionButton
            icon="fas fa-edit"
            tooltip="Upravit"
            onClick={() => handleEdit(row)}
          />
          <ActionButton
            icon="fas fa-trash"
            tooltip="Smazat"
            onClick={() => handleDeleteClick(row)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          />
        </div>
      )
    }
  ]

  const incomeCategories = [
    'Faktury',
    'Hotovostní platby',
    'Bankovní převody',
    'Dotace',
    'Ostatní příjmy'
  ]

  const expenseCategories = [
    'Materiál',
    'Mzdy',
    'Nářadí',
    'Pohonné hmoty',
    'Servis',
    'Pojištění',
    'Kancelář',
    'Marketing',
    'Ostatní'
  ]

  const currentCategories = watchType === TRANSACTION_TYPES.INCOME ? incomeCategories : expenseCategories

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance & Účetnictví</h1>
          <p className="text-gray-600">Správa příjmů, výdajů a účetnictví</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="success"
            onClick={() => {
              reset({ type: TRANSACTION_TYPES.INCOME })
              setShowAddModal(true)
            }}
            icon="fas fa-plus"
          >
            Přidat příjem
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              reset({ type: TRANSACTION_TYPES.EXPENSE })
              setShowAddModal(true)
            }}
            icon="fas fa-plus"
          >
            Přidat výdaj
          </Button>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-arrow-up text-green-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Měsíční příjmy</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.monthlyIncome)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-arrow-down text-red-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Měsíční výdaje</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.monthlyExpenses)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-chart-line text-blue-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Měsíční zisk</p>
              <p className={`text-2xl font-bold ${stats.monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(stats.monthlyProfit)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-list text-yellow-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Celkem transakcí</p>
              <p className="text-2xl font-bold text-gray-900">{stats.transactionCount}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              type="text"
              placeholder="Hledat transakce..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              icon="fas fa-search"
            />
            
            <Input
              type="select"
              value={filters.type}
              onChange={(e) => setFilters({ type: e.target.value })}
            >
              <option value="">Všechny typy</option>
              <option value={TRANSACTION_TYPES.INCOME}>Příjmy</option>
              <option value={TRANSACTION_TYPES.EXPENSE}>Výdaje</option>
            </Input>

            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ dateFrom: e.target.value })}
              placeholder="Od data"
            />

            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ dateTo: e.target.value })}
              placeholder="Do data"
            />

            <Button
              variant="outline"
              onClick={() => setFilters({ search: '', type: '', category: '', dateFrom: '', dateTo: '' })}
              size="sm"
            >
              Vymazat filtry
            </Button>
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Transakce ({filteredTransactions.length})
            </h2>
          </div>
        </div>
        
        <Table
          columns={columns}
          data={filteredTransactions}
          loading={isLoading}
          emptyMessage="Žádné transakce nenalezeny"
          emptyIcon="fas fa-coins"
        />
      </Card>

      {/* Add/Edit Transaction Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        title={editingTransaction ? 'Upravit transakci' : 'Nová transakce'}
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
              {editingTransaction ? 'Uložit změny' : 'Přidat transakci'}
            </Button>
          </>
        }
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('type', { required: 'Typ je povinný' })}
              label="Typ transakce"
              type="select"
              error={errors.type?.message}
              required
            >
              <option value={TRANSACTION_TYPES.INCOME}>Příjem</option>
              <option value={TRANSACTION_TYPES.EXPENSE}>Výdaj</option>
            </Input>
            
            <Input
              {...register('transaction_date', { required: 'Datum je povinné' })}
              label="Datum"
              type="date"
              error={errors.transaction_date?.message}
              required
            />
          </div>

          <Input
            {...register('description', { required: 'Popis je povinný' })}
            label="Popis"
            type="text"
            placeholder="Popis transakce..."
            error={errors.description?.message}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('amount', { 
                required: 'Částka je povinná',
                min: { value: 0.01, message: 'Částka musí být větší než 0' }
              })}
              label="Částka"
              type="number"
              step="0.01"
              placeholder="0.00"
              suffix="Kč"
              error={errors.amount?.message}
              required
            />
            
            <Input
              {...register('category')}
              label="Kategorie"
              type="select"
            >
              <option value="">Vyberte kategorii</option>
              {currentCategories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Input>
          </div>

          <Input
            {...register('note')}
            label="Poznámka"
            type="textarea"
            rows={3}
            placeholder="Dodatečné poznámky..."
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Smazat transakci"
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
              <p className="font-medium">Opravdu chcete smazat tuto transakci?</p>
              <p className="text-sm text-gray-600 mt-1">Tato akce je nevratná.</p>
            </div>
          </div>
          
          {transactionToDelete && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium text-gray-900">{transactionToDelete.description}</p>
              <p className="text-sm text-gray-600 mt-1">
                {formatCurrency(transactionToDelete.amount)} • {formatDate(transactionToDelete.transaction_date)}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default FinancePage
