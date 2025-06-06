import { create } from 'zustand'
import { supabase, TABLES } from '../config/supabase.js'
import { TRANSACTION_TYPES } from '../utils/constants.js'
import { debugLog, debugError } from '../utils/helpers.js'

const useFinanceStore = create((set, get) => ({
  // State
  transactions: [],
  invoices: [],
  isLoading: false,
  error: null,
  filters: {
    type: '',
    category: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  },
  
  // Actions
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => {
    debugError('Finance error:', error)
    set({ error })
  },
  
  clearError: () => set({ error: null }),
  
  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
  
  // Load all transactions
  loadTransactions: async () => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Loading transactions...')
      
      const { data, error } = await supabase
        .from(TABLES.TRANSACTIONS)
        .select('*')
        .order('transaction_date', { ascending: false })
        .limit(200)
      
      if (error) throw error
      
      debugLog('Transactions loaded:', data?.length || 0)
      set({ transactions: data || [], isLoading: false })
      
    } catch (error) {
      debugError('Failed to load transactions:', error)
      set({ error: error.message, isLoading: false })
    }
  },
  
  // Add transaction
  addTransaction: async (transactionData, userId) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Adding transaction:', transactionData)
      
      const newTransaction = {
        ...transactionData,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from(TABLES.TRANSACTIONS)
        .insert([newTransaction])
        .select()
        .single()
      
      if (error) throw error
      
      debugLog('Transaction added:', data)
      
      // Add to transactions list
      set(state => ({
        transactions: [data, ...state.transactions],
        isLoading: false
      }))
      
      return { success: true, transaction: data }
      
    } catch (error) {
      debugError('Failed to add transaction:', error)
      set({ error: error.message, isLoading: false })
      return { success: false, error: error.message }
    }
  },
  
  // Update transaction
  updateTransaction: async (transactionId, updates) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Updating transaction:', transactionId, updates)
      
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from(TABLES.TRANSACTIONS)
        .update(updateData)
        .eq('id', transactionId)
        .select()
        .single()
      
      if (error) throw error
      
      debugLog('Transaction updated:', data)
      
      // Update in transactions list
      set(state => ({
        transactions: state.transactions.map(t => t.id === transactionId ? data : t),
        isLoading: false
      }))
      
      return { success: true, transaction: data }
      
    } catch (error) {
      debugError('Failed to update transaction:', error)
      set({ error: error.message, isLoading: false })
      return { success: false, error: error.message }
    }
  },
  
  // Delete transaction
  deleteTransaction: async (transactionId) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Deleting transaction:', transactionId)
      
      const { error } = await supabase
        .from(TABLES.TRANSACTIONS)
        .delete()
        .eq('id', transactionId)
      
      if (error) throw error
      
      debugLog('Transaction deleted')
      
      // Remove from transactions list
      set(state => ({
        transactions: state.transactions.filter(t => t.id !== transactionId),
        isLoading: false
      }))
      
      return { success: true }
      
    } catch (error) {
      debugError('Failed to delete transaction:', error)
      set({ error: error.message, isLoading: false })
      return { success: false, error: error.message }
    }
  },
  
  // Get filtered transactions
  getFilteredTransactions: () => {
    const { transactions, filters } = get()
    
    return transactions.filter(transaction => {
      // Type filter
      if (filters.type && transaction.type !== filters.type) {
        return false
      }
      
      // Category filter
      if (filters.category && transaction.category !== filters.category) {
        return false
      }
      
      // Date range filter
      if (filters.dateFrom) {
        const transactionDate = new Date(transaction.transaction_date)
        const fromDate = new Date(filters.dateFrom)
        if (transactionDate < fromDate) return false
      }
      
      if (filters.dateTo) {
        const transactionDate = new Date(transaction.transaction_date)
        const toDate = new Date(filters.dateTo)
        if (transactionDate > toDate) return false
      }
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const searchFields = [
          transaction.description,
          transaction.category,
          transaction.note
        ].filter(Boolean)
        
        const matchesSearch = searchFields.some(field => 
          field.toLowerCase().includes(searchLower)
        )
        
        if (!matchesSearch) return false
      }
      
      return true
    })
  },
  
  // Get financial statistics
  getFinancialStats: () => {
    const { transactions } = get()
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    const monthlyTransactions = transactions.filter(t => {
      const date = new Date(t.transaction_date)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })
    
    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === TRANSACTION_TYPES.INCOME)
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
    
    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === TRANSACTION_TYPES.EXPENSE)
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
    
    const totalIncome = transactions
      .filter(t => t.type === TRANSACTION_TYPES.INCOME)
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
    
    const totalExpenses = transactions
      .filter(t => t.type === TRANSACTION_TYPES.EXPENSE)
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
    
    return {
      monthlyIncome,
      monthlyExpenses,
      monthlyProfit: monthlyIncome - monthlyExpenses,
      totalIncome,
      totalExpenses,
      totalProfit: totalIncome - totalExpenses,
      transactionCount: transactions.length
    }
  },
  
  // Get transactions by category
  getTransactionsByCategory: () => {
    const { transactions } = get()
    const categories = {}
    
    transactions.forEach(transaction => {
      const category = transaction.category || 'Ostatní'
      if (!categories[category]) {
        categories[category] = {
          income: 0,
          expense: 0,
          count: 0
        }
      }
      
      categories[category].count++
      
      if (transaction.type === TRANSACTION_TYPES.INCOME) {
        categories[category].income += parseFloat(transaction.amount) || 0
      } else {
        categories[category].expense += parseFloat(transaction.amount) || 0
      }
    })
    
    return categories
  }
}))

export default useFinanceStore
