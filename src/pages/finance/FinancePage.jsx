import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useFinanceStore from '../../store/financeStore'
import useAuthStore from '../../store/authStore'
import { Button, Card, StatCard, Modal, Spinner } from '../../components/ui'
import { usePermissions } from '../../components/common/ProtectedRoute'
import { formatCurrency, formatDate } from '../../utils/helpers'
import TransactionForm from './components/TransactionForm'
import InvoiceForm from './components/InvoiceForm'

const FinancePage = () => {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { 
    transactions,
    invoices,
    financialSummary,
    isLoading,
    loadTransactions,
    loadInvoices,
    loadFinancialSummary,
    getFinanceOverview
  } = useFinanceStore()
  const { hasPermission } = usePermissions()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  // Load data on mount
  useEffect(() => {
    const currentMonth = new Date()
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
    
    loadTransactions()
    loadInvoices()
    loadFinancialSummary(
      firstDay.toISOString().split('T')[0],
      lastDay.toISOString().split('T')[0]
    )
  }, [loadTransactions, loadInvoices, loadFinancialSummary])

  const overview = getFinanceOverview()

  const handleCreateTransaction = () => {
    setSelectedTransaction(null)
    setShowTransactionModal(true)
  }

  const handleCreateInvoice = () => {
    setSelectedInvoice(null)
    setShowInvoiceModal(true)
  }

  const handleFormSuccess = () => {
    setShowTransactionModal(false)
    setShowInvoiceModal(false)
    setSelectedTransaction(null)
    setSelectedInvoice(null)
    loadTransactions(true)
    loadInvoices(true)
  }

  const tabs = [
    { id: 'overview', label: 'Přehled', icon: 'fas fa-chart-line' },
    { id: 'transactions', label: 'Transakce', icon: 'fas fa-exchange-alt' },
    { id: 'invoices', label: 'Faktury', icon: 'fas fa-file-invoice' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
          <p className="text-gray-600 mt-1">Přehled financí, transakcí a faktur</p>
        </div>
        <div className="flex space-x-3">
          {hasPermission('finance_create') && (
            <>
              <Button 
                onClick={handleCreateTransaction}
                variant="outline"
              >
                <i className="fas fa-plus mr-2" />
                Přidat transakci
              </Button>
              <Button 
                onClick={handleCreateInvoice}
                className="bg-primary-600 hover:bg-primary-700"
              >
                <i className="fas fa-plus mr-2" />
                Vytvořit fakturu
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Příjmy</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(overview.totalIncome)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-arrow-up text-green-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Výdaje</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(overview.totalExpenses)}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-arrow-down text-red-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Zisk</p>
                <p className={`text-2xl font-bold ${overview.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(overview.profit)}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                overview.profit >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <i className={`fas fa-chart-line ${
                  overview.profit >= 0 ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Faktury k úhradě</p>
                <p className="text-2xl font-bold text-orange-600">{overview.pendingInvoices}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-clock text-orange-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className={`${tab.icon} mr-2`} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Financial Summary */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Finanční přehled za tento měsíc
                </h3>
                {financialSummary ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-gray-600">Celkem vyfakturováno</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {formatCurrency(financialSummary.totalInvoiced)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Zaplaceno</p>
                      <p className="text-xl font-semibold text-green-600">
                        {formatCurrency(financialSummary.totalPaid)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">K úhradě</p>
                      <p className="text-xl font-semibold text-orange-600">
                        {formatCurrency(financialSummary.outstanding)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Spinner />
                  </div>
                )}
              </div>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Nedávné transakce
                </h3>
              </div>
              <div className="p-6">
                {transactions.slice(0, 5).map(transaction => (
                  <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                        transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <i className={`fas ${
                          transaction.type === 'income' ? 'fa-arrow-up text-green-600' : 'fa-arrow-down text-red-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-500">{transaction.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-sm text-gray-500">{formatDate(transaction.transaction_date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'transactions' && (
          <Card>
            <div className="p-6">
              <p className="text-center text-gray-500">
                Transakce budou implementovány v další verzi
              </p>
            </div>
          </Card>
        )}

        {activeTab === 'invoices' && (
          <Card>
            <div className="p-6">
              <p className="text-center text-gray-500">
                Faktury budou implementovány v další verzi
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        title="Přidat transakci"
        size="lg"
      >
        <div className="p-6">
          <p className="text-center text-gray-500">
            Formulář pro transakce bude implementován v další verzi
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        title="Vytvořit fakturu"
        size="lg"
      >
        <div className="p-6">
          <p className="text-center text-gray-500">
            Formulář pro faktury bude implementován v další verzi
          </p>
        </div>
      </Modal>
    </div>
  )
}

export default FinancePage
