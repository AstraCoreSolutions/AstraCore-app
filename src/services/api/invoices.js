import { supabase, TABLES } from '../../config/supabase.js'
import { debugLog, debugError } from '../../utils/helpers.js'

export const invoicesAPI = {
  // Get all invoices
  getInvoices: async () => {
    try {
      debugLog('Fetching invoices...')
      
      const { data, error } = await supabase
        .from(TABLES.INVOICES)
        .select(`
          *,
          client:clients(id, name, email),
          project:projects(id, name)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      debugLog('Invoices fetched:', data?.length || 0)
      return { success: true, invoices: data || [] }
      
    } catch (error) {
      debugError('Failed to fetch invoices:', error)
      return { success: false, error: error.message }
    }
  },

  // Add invoice
  addInvoice: async (invoiceData, creatorId) => {
    try {
      debugLog('Adding invoice:', invoiceData)
      
      const newInvoice = {
        ...invoiceData,
        created_by: creatorId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from(TABLES.INVOICES)
        .insert([newInvoice])
        .select(`
          *,
          client:clients(id, name, email),
          project:projects(id, name)
        `)
        .single()
      
      if (error) throw error
      
      debugLog('Invoice added:', data)
      return { success: true, invoice: data }
      
    } catch (error) {
      debugError('Failed to add invoice:', error)
      return { success: false, error: error.message }
    }
  },

  // Update invoice
  updateInvoice: async (invoiceId, updates) => {
    try {
      debugLog('Updating invoice:', invoiceId, updates)
      
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from(TABLES.INVOICES)
        .update(updateData)
        .eq('id', invoiceId)
        .select(`
          *,
          client:clients(id, name, email),
          project:projects(id, name)
        `)
        .single()
      
      if (error) throw error
      
      debugLog('Invoice updated:', data)
      return { success: true, invoice: data }
      
    } catch (error) {
      debugError('Failed to update invoice:', error)
      return { success: false, error: error.message }
    }
  },

  // Mark invoice as paid
  markAsPaid: async (invoiceId, paidAmount) => {
    try {
      debugLog('Marking invoice as paid:', invoiceId, paidAmount)
      
      const { data, error } = await supabase
        .from(TABLES.INVOICES)
        .update({
          status: 'paid',
          paid_amount: paidAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
        .select()
        .single()
      
      if (error) throw error
      
      debugLog('Invoice marked as paid:', data)
      return { success: true, invoice: data }
      
    } catch (error) {
      debugError('Failed to mark invoice as paid:', error)
      return { success: false, error: error.message }
    }
  },

  // Generate invoice number
  generateInvoiceNumber: async () => {
    try {
      const year = new Date().getFullYear()
      const { count, error } = await supabase
        .from(TABLES.INVOICES)
        .select('*', { count: 'exact' })
        .like('invoice_number', `FA-${year}-%`)
      
      if (error) throw error
      
      const nextNumber = (count || 0) + 1
      const invoiceNumber = `FA-${year}-${nextNumber.toString().padStart(3, '0')}`
      
      return { success: true, invoiceNumber }
      
    } catch (error) {
      debugError('Failed to generate invoice number:', error)
      return { success: false, error: error.message }
    }
  }
}

export default invoicesAPI
