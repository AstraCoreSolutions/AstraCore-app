import { create } from 'zustand'
import { financeApi } from '../services/api/finance'
import { debugLog, debugError } from '../utils/helpers'
import toast from 'react-hot-toast'

const useFinanceStore = create((set, get) => ({
  // State
  transactions: [],
  invoices: [],
  currentTransaction: null,
  currentInvoice: null,
  financialSummary: null,
  monthlyData: [],
  transactionCategories: [],
  isLoading: false,
  error: null,
  filters: {
    transactions: {
      search: '',
      type: '',
      category: '',
      project_id: '',
      date_from: '',
      date_to: ''
    },
    invoices: {
      search: '',
      status: '',
      client_id: '',
      project_id: '',
      date_from: '',
      date_to: '',
      overdue: false
    }
  },

  // Actions
  setTransactionFilters: (newFilters) => {
    set(state => ({
      filters: { 
        ...state.filters, 
        transactions: { ...state.filters.transactions, ...newFilters }
      }
    }))
    get().loadTransactions()
  },

  setInvoiceFilters: (newFilters) => {
    set(state => ({
      filters: { 
        ...state.filters, 
        invoices: { ...state.filters.invoices, ...newFilters }
      }
    }))
    get().loadInvoices()
  },

  clearTransactionFilters: () => {
    set(state => ({
      filters: {
        ...state.filters,
        transactions: {
          search: '',
          type: '',
          category: '',
          project_id: '',
          date_from: '',
          date_to: ''
        }
      }
    }))
    get().loadTransactions()
  },

  clearInvoiceFilters: () => {
    set(state => ({
      filters: {
        ...state.filters,
        invoices: {
          search: '',
          status: '',
          client_id: '',
          project_id: '',
          date_from: '',
          date_to: '',
          overdue: false
        }
      }
    }))
    get().loadInvoices()
  },

  // TRANSACTIONS

  // Load all transactions
  loadTransactions: async (forceRefresh = false) => {
    const state = get()
    
    if (state.isLoading && !forceRefresh) return
    
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Loading transactions with filters:', state.filters.transactions)
      
      const { data, error } = await financeApi.getTransactions(state.filters.transactions)
      
      if (error) throw new Error(error)
      
      set({ 
        transactions: data || [],
        isLoading: false 
      })
      
      debugLog('Transactions loaded:', data?.length)
    } catch (error) {
      debugError('Failed to load transactions:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error('Nepodařilo se načíst transakce')
    }
  },

  // Load single transaction
  loadTransaction: async (id) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Loading transaction:', id)
      
      const { data, error } = await financeApi.getTransactionById(id)
      
      if (error) throw new Error(error)
      
      set({ 
        currentTransaction: data,
        isLoading: false 
      })
      
      debugLog('Transaction loaded:', data?.description)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to load transaction:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error('Nepodařilo se načíst transakci')
      return { success: false, error: error.message }
    }
  },

  // Create new transaction
  createTransaction: async (transactionData) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Creating transaction:', transactionData.description)
      
      const { data, error } = await financeApi.createTransaction(transactionData)
      
      if (error) throw new Error(error)
      
      // Add to transactions list
      set(state => ({
        transactions: [data, ...state.transactions],
        isLoading: false
      }))
      
      toast.success('Transakce byla úspěšně vytvořena')
      debugLog('Transaction created:', data.description)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to create transaction:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error('Nepodařilo se vytvořit transakci')
      return { success: false, error: error.message }
    }
  },

  // Update transaction
  updateTransaction: async (id, updates) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Updating transaction:', id)
      
      const { data, error } = await financeApi.updateTransaction(id, updates)
      
      if (error) throw new Error(error)
      
      // Update in transactions list
      set(state => ({
        transactions: state.transactions.map(transaction => 
          transaction.id === id ? data : transaction
        ),
        currentTransaction: state.currentTransaction?.id === id ? data : state.currentTransaction,
        isLoading: false
      }))
      
      toast.success('Transakce byla úspěšně aktualizována')
      debugLog('Transaction updated:', data.description)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to update transaction:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error('Nepodařilo se aktualizovat transakci')
      return { success: false, error: error.message }
    }
  },

  // Delete transaction
  deleteTransaction: async (id) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Deleting transaction:', id)
      
      const { data, error } = await financeApi.deleteTransaction(id)
      
      if (error) throw new Error(error)
      
      // Remove from transactions list
      set(state => ({
        transactions: state.transactions.filter(transaction => transaction.id !== id),
        currentTransaction: state.currentTransaction?.id === id ? null : state.currentTransaction,
        isLoading: false
      }))
      
      toast.success('Transakce byla úspěšně smazána')
      debugLog('Transaction deleted')
      return { success: true }
    } catch (error) {
      debugError('Failed to delete transaction:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error('Nepodařilo se smazat transakci')
      return { success: false, error: error.message }
    }
  },

  // INVOICES

  // Load all invoices
  loadInvoices: async (forceRefresh = false) => {
    const state = get()
    
    if (state.isLoading && !forceRefresh) return
    
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Loading invoices with filters:', state.filters.invoices)
      
      const { data, error } = await financeApi.getInvoices(state.filters.invoices)
      
      if (error) throw new Error(error)
      
      set({ 
        invoices: data || [],
        isLoading: false 
      })
      
      debugLog('Invoices loaded:', data?.length)
    } catch (error) {
      debugError('Failed to load invoices:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error('Nepodařilo se načíst faktury')
    }
  },

  // Load single invoice
  loadInvoice: async (id) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Loading invoice:', id)
      
      const { data, error } = await financeApi.getInvoiceById(id)
      
      if (error) throw new Error(error)
      
      set({ 
        currentInvoice: data,
        isLoading: false 
      })
      
      debugLog('Invoice loaded:', data?.invoice_number)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to load invoice:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error('Nepodařilo se načíst fakturu')
      return { success: false, error: error.message }
    }
  },

  // Create new invoice
  createInvoice: async (invoiceData) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Creating invoice')
      
      const { data, error } = await financeApi.createInvoice(invoiceData)
      
      if (error) throw new Error(error)
      
      // Add to invoices list
      set(state => ({
        invoices: [data, ...state.invoices],
        isLoading: false
      }))
      
      toast.success('Faktura byla úspěšně vytvořena')
      debugLog('Invoice created:', data.invoice_number)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to create invoice:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error('Nepodařilo se vytvořit fakturu')
      return { success: false, error: error.message }
    }
  },

  // Update invoice
  updateInvoice: async (id, updates) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Updating invoice:', id)
      
      const { data, error } = await financeApi.updateInvoice(id, updates)
      
      if (error) throw new Error(error)
      
      // Update in invoices list
      set(state => ({
        invoices: state.invoices.map(invoice => 
          invoice.id === id ? data : invoice
        ),
        currentInvoice: state.currentInvoice?.id === id ? data : state.currentInvoice,
        isLoading: false
      }))
      
      toast.success('Faktura byla úspěšně aktualizována')
      debugLog('Invoice updated:', data.invoice_number)
      return { success: true, data }
    } catch (error) {
      debugError('Failed to update invoice:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error('Nepodařilo se aktualizovat fakturu')
      return { success: false, error: error.message }
    }
  },

  // Delete invoice
  deleteInvoice: async (id) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Deleting invoice:', id)
      
      const { data, error } = await financeApi.deleteInvoice(id)
      
      if (error) throw new Error(error)
      
      // Remove from invoices list
      set(state => ({
        invoices: state.invoices.filter(invoice => invoice.id !== id),
        currentInvoice: state.currentInvoice?.id === id ? null : state.currentInvoice,
        isLoading: false
      }))
      
      toast.success('Faktura byla úspěšně smazána')
      debugLog('Invoice deleted')
      return { success: true }
    } catch (error) {
      debugError('Failed to delete invoice:', error)
      set({ 
        error: error.message,
        isLoading: false 
      })
      toast.error(error.message || 'Nepodařilo se smazat fakturu')
      return { success: false, error: error.message }
    }
  },

  // Mark invoice as paid
  markInvoiceAsPaid: async (id, paidAmount = null, paymentDate = null) => {
    try {
      debugLog('Marking invoice as paid:', id)
      
      const { data, error } = await financeApi.markInvoiceAsPaid(id, paidAmount, paymentDate)
      
      if (error) throw new Error(error)
      
      // Update in invoices list
      set(state => ({
        invoices: state.invoices.map(invoice => 
          invoice.id === id ? data : invoice
        ),
        currentInvoice: state.currentInvoice?.id === id ? data : state.currentInvoice
      }))
      
      toast.success('Faktura byla označena jako zaplacená')
      debugLog('Invoice marked as paid')
      return { success: true, data }
    } catch (error) {
      debugError('Failed to mark invoice as paid:', error)
      toast.error('Nepodařilo se označit fakturu jako zaplacenou')
      return { success: false, error: error.message }
    }
  },

  // REPORTS

  // Load financial summary
  loadFinancialSummary: async (dateFrom, dateTo) => {
    try {
      debugLog('Loading financial summary:', dateFrom, dateTo)
      
      const { data, error } = await financeApi.getFinancialSummary(dateFrom, dateTo)
      
      if (error) throw new Error(error)
      
      set({ financialSummary: data })
      
      debugLog('Financial summary loaded')
      return { success: true, data }
    } catch (error) {
      debugError('Failed to load financial summary:', error)
      return { success: false, error: error.message }
    }
  },

  // Load monthly data
  loadMonthlyData: async (year) => {
    try {
      debugLog('Loading monthly data for year:', year)
      
      const { data, error } = await financeApi.getMonthlyData(year)
      
      if (error) throw new Error(error)
      
      set({ monthlyData: data || [] })
      
      debugLog('Monthly data loaded')
      return { success: true, data }
    } catch (error) {
      debugError('Failed to load monthly data:', error)
      return { success: false, error: error.message }
    }
  },

  // Load transaction categories
  loadTransactionCategories: async () => {
    try {
      debugLog('Loading transaction categories')
      
      const { data, error } = await financeApi.getTransactionCategories()
      
      if (error) throw new Error(error)
      
      set({ transactionCategories: data || [] })
      
      debugLog('Transaction categories loaded:', data?.length)
    } catch (error) {
      debugError('Failed to load transaction categories:', error)
    }
  },

  // Clear current items
  clearCurrentTransaction: () => {
    set({ currentTransaction: null })
  },

  clearCurrentInvoice: () => {
    set({ currentInvoice: null })
  },

  // Get overview statistics
  getFinanceOverview: () => {
    const state = get()
    const { transactions, invoices } = state
    
    const totalIncome = transactions
      ?.filter(t => t.type === 'income')
      ?.reduce((sum, t) => sum + t.amount, 0) || 0
    
    const totalExpenses = transactions
      ?.filter(t => t.type === 'expense')
      ?.reduce((sum, t) => sum + t.amount, 0) || 0
    
    const totalInvoiced = invoices
      ?.reduce((sum, i) => sum + i.total_amount, 0) || 0
    
    const paidInvoices = invoices
      ?.filter(i => i.status === 'paid').length || 0
    
    const pendingInvoices = invoices
      ?.filter(i => i.status === 'pending').length || 0
    
    const overdueInvoices = invoices
      ?.filter(i => i.status === 'overdue').length || 0
    
    return {
      totalIncome,
      totalExpenses,
      profit: totalIncome - totalExpenses,
      totalInvoiced,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      totalTransactions: transactions?.length || 0,
      totalInvoices: invoices?.length || 0
    }
  }
}))

export default useFinanceStore
