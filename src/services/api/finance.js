import { supabase } from '../../config/supabase'
import { handleApiError } from '../utils/errorHandler'

/**
 * Finance API Service
 * Handles all finance-related operations including transactions and invoices
 */
export const financeApi = {
  // TRANSACTIONS
  
  // Get all transactions with optional filters
  async getTransactions(filters = {}) {
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          project:projects(name),
          created_by_user:profiles!transactions_created_by_fkey(
            first_name,
            last_name
          )
        `)
        .order('transaction_date', { ascending: false })

      // Apply filters
      if (filters.type) {
        query = query.eq('type', filters.type)
      }
      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.project_id) {
        query = query.eq('project_id', filters.project_id)
      }
      if (filters.date_from) {
        query = query.gte('transaction_date', filters.date_from)
      }
      if (filters.date_to) {
        query = query.lte('transaction_date', filters.date_to)
      }
      if (filters.search) {
        query = query.or(`description.ilike.%${filters.search}%,category.ilike.%${filters.search}%,note.ilike.%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch transactions')
    }
  },

  // Get transaction by ID
  async getTransactionById(id) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          project:projects(*),
          created_by_user:profiles!transactions_created_by_fkey(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch transaction')
    }
  },

  // Create new transaction
  async createTransaction(transactionData) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          ...transactionData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select(`
          *,
          project:projects(name),
          created_by_user:profiles!transactions_created_by_fkey(
            first_name,
            last_name
          )
        `)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to create transaction')
    }
  },

  // Update transaction
  async updateTransaction(id, updates) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          project:projects(name),
          created_by_user:profiles!transactions_created_by_fkey(
            first_name,
            last_name
          )
        `)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to update transaction')
    }
  },

  // Delete transaction
  async deleteTransaction(id) {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { data: true, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to delete transaction')
    }
  },

  // INVOICES

  // Get all invoices with optional filters
  async getInvoices(filters = {}) {
    try {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          client:clients(name, email),
          project:projects(name),
          created_by_user:profiles!invoices_created_by_fkey(
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.client_id) {
        query = query.eq('client_id', filters.client_id)
      }
      if (filters.project_id) {
        query = query.eq('project_id', filters.project_id)
      }
      if (filters.date_from) {
        query = query.gte('issue_date', filters.date_from)
      }
      if (filters.date_to) {
        query = query.lte('issue_date', filters.date_to)
      }
      if (filters.overdue) {
        const today = new Date().toISOString().split('T')[0]
        query = query.lt('due_date', today).neq('status', 'paid')
      }
      if (filters.search) {
        query = query.or(`invoice_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch invoices')
    }
  },

  // Get invoice by ID
  async getInvoiceById(id) {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(*),
          project:projects(*),
          created_by_user:profiles!invoices_created_by_fkey(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch invoice')
    }
  },

  // Create new invoice
  async createInvoice(invoiceData) {
    try {
      // Generate invoice number if not provided
      if (!invoiceData.invoice_number) {
        const year = new Date().getFullYear()
        const { data: lastInvoice } = await supabase
          .from('invoices')
          .select('invoice_number')
          .ilike('invoice_number', `${year}%`)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        let nextNumber = 1
        if (lastInvoice?.invoice_number) {
          const match = lastInvoice.invoice_number.match(/\d+$/)
          if (match) {
            nextNumber = parseInt(match[0]) + 1
          }
        }
        invoiceData.invoice_number = `${year}${nextNumber.toString().padStart(4, '0')}`
      }

      const { data, error } = await supabase
        .from('invoices')
        .insert([{
          ...invoiceData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select(`
          *,
          client:clients(name, email),
          project:projects(name),
          created_by_user:profiles!invoices_created_by_fkey(
            first_name,
            last_name
          )
        `)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to create invoice')
    }
  },

  // Update invoice
  async updateInvoice(id, updates) {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          client:clients(name, email),
          project:projects(name),
          created_by_user:profiles!invoices_created_by_fkey(
            first_name,
            last_name
          )
        `)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to update invoice')
    }
  },

  // Delete invoice
  async deleteInvoice(id) {
    try {
      // Check if invoice is paid
      const { data: invoice } = await supabase
        .from('invoices')
        .select('status')
        .eq('id', id)
        .single()

      if (invoice && invoice.status === 'paid') {
        return { 
          data: null, 
          error: 'Nelze smazat zaplacenou fakturu' 
        }
      }

      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { data: true, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to delete invoice')
    }
  },

  // Mark invoice as paid
  async markInvoiceAsPaid(id, paidAmount = null, paymentDate = null) {
    try {
      const updates = {
        status: 'paid',
        updated_at: new Date().toISOString()
      }

      if (paidAmount !== null) {
        updates.paid_amount = paidAmount
      }

      if (paymentDate) {
        updates.payment_date = paymentDate
      }

      const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          client:clients(name, email),
          project:projects(name)
        `)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to mark invoice as paid')
    }
  },

  // FINANCIAL REPORTS

  // Get financial summary
  async getFinancialSummary(dateFrom, dateTo) {
    try {
      // Get transactions summary
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('type, amount')
        .gte('transaction_date', dateFrom)
        .lte('transaction_date', dateTo)

      if (transError) throw transError

      // Get invoices summary
      const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select('status, total_amount, paid_amount')
        .gte('issue_date', dateFrom)
        .lte('issue_date', dateTo)

      if (invError) throw invError

      // Calculate summary
      const income = transactions
        ?.filter(t => t.type === 'income')
        ?.reduce((sum, t) => sum + t.amount, 0) || 0

      const expenses = transactions
        ?.filter(t => t.type === 'expense')
        ?.reduce((sum, t) => sum + t.amount, 0) || 0

      const totalInvoiced = invoices
        ?.reduce((sum, i) => sum + i.total_amount, 0) || 0

      const totalPaid = invoices
        ?.filter(i => i.status === 'paid')
        ?.reduce((sum, i) => sum + (i.paid_amount || i.total_amount), 0) || 0

      const outstanding = invoices
        ?.filter(i => i.status !== 'paid' && i.status !== 'cancelled')
        ?.reduce((sum, i) => sum + i.total_amount, 0) || 0

      const summary = {
        income,
        expenses,
        profit: income - expenses,
        totalInvoiced,
        totalPaid,
        outstanding,
        transactionCount: transactions?.length || 0,
        invoiceCount: invoices?.length || 0
      }

      return { data: summary, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to get financial summary')
    }
  },

  // Get transaction categories
  async getTransactionCategories() {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('category')
        .not('category', 'is', null)

      if (error) throw error

      // Get unique categories
      const categories = [...new Set(data.map(t => t.category))].filter(Boolean)
      
      return { data: categories, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch transaction categories')
    }
  },

  // Get monthly financial data
  async getMonthlyData(year) {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('type, amount, transaction_date')
        .gte('transaction_date', `${year}-01-01`)
        .lte('transaction_date', `${year}-12-31`)

      if (error) throw error

      // Group by month
      const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        income: 0,
        expenses: 0,
        profit: 0
      }))

      transactions?.forEach(transaction => {
        const month = new Date(transaction.transaction_date).getMonth()
        if (transaction.type === 'income') {
          monthlyData[month].income += transaction.amount
        } else {
          monthlyData[month].expenses += transaction.amount
        }
        monthlyData[month].profit = monthlyData[month].income - monthlyData[month].expenses
      })

      return { data: monthlyData, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to get monthly financial data')
    }
  }
}

export default financeApi
