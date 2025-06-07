import { supabase } from '../config/supabase'
import { debugLog, debugError } from '../utils/helpers'
import { formatCurrency, formatDate } from '../utils/helpers'

/**
 * Reports Service
 * Handles generation of various business reports
 */

export const reportsService = {
  // Financial Reports
  async getFinancialReport(startDate, endDate, filters = {}) {
    try {
      debugLog('Generating financial report:', startDate, endDate)

      // Get transactions
      let transactionsQuery = supabase
        .from('transactions')
        .select(`
          *,
          project:projects(name),
          client:clients(name),
          supplier:suppliers(name)
        `)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

      if (filters.project_id) {
        transactionsQuery = transactionsQuery.eq('project_id', filters.project_id)
      }

      const { data: transactions, error: transError } = await transactionsQuery

      if (transError) throw transError

      // Get invoices
      let invoicesQuery = supabase
        .from('invoices')
        .select(`
          *,
          client:clients(name),
          project:projects(name)
        `)
        .gte('issue_date', startDate)
        .lte('issue_date', endDate)
        .order('issue_date', { ascending: false })

      if (filters.project_id) {
        invoicesQuery = invoicesQuery.eq('project_id', filters.project_id)
      }

      const { data: invoices, error: invError } = await invoicesQuery

      if (invError) throw invError

      // Calculate totals
      const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0)
      const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0)
      const profit = income - expenses

      const invoiceTotal = invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0)
      const paidInvoices = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0)
      const unpaidInvoices = invoiceTotal - paidInvoices

      const report = {
        period: { startDate, endDate },
        summary: {
          income: formatCurrency(income),
          expenses: formatCurrency(expenses),
          profit: formatCurrency(profit),
          profitMargin: income > 0 ? ((profit / income) * 100).toFixed(2) + '%' : '0%'
        },
        invoices: {
          total: formatCurrency(invoiceTotal),
          paid: formatCurrency(paidInvoices),
          unpaid: formatCurrency(unpaidInvoices),
          count: invoices.length
        },
        transactions: transactions.map(t => ({
          ...t,
          formattedAmount: formatCurrency(t.amount),
          formattedDate: formatDate(t.date)
        })),
        invoicesList: invoices.map(inv => ({
          ...inv,
          formattedAmount: formatCurrency(inv.total_amount),
          formattedDate: formatDate(inv.issue_date)
        }))
      }

      debugLog('Financial report generated:', report.summary)
      return { data: report, error: null }

    } catch (error) {
      debugError('Failed to generate financial report:', error)
      return { data: null, error: error.message }
    }
  },

  // Project Reports
  async getProjectReport(projectId, detailed = false) {
    try {
      debugLog('Generating project report:', projectId)

      // Get project details
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(*),
          project_manager:profiles(first_name, last_name)
        `)
        .eq('id', projectId)
        .single()

      if (projectError) throw projectError

      // Get project transactions
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('project_id', projectId)

      if (transError) throw transError

      // Get project materials
      const { data: materials, error: materialsError } = await supabase
        .from('materials')
        .select(`
          *,
          supplier:suppliers(name)
        `)
        .eq('project_id', projectId)

      if (materialsError) throw materialsError

      // Get project equipment
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select('*')
        .eq('current_project_id', projectId)

      if (equipmentError) throw equipmentError

      // Get project diary entries
      const { data: diaryEntries, error: diaryError } = await supabase
        .from('project_diary')
        .select('*')
        .eq('project_id', projectId)
        .order('entry_date', { ascending: false })

      if (diaryError) throw diaryError

      // Calculate project financials
      const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0)
      const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0)
      const materialCosts = materials.reduce((sum, m) => sum + (parseFloat(m.unit_price || 0) * parseFloat(m.quantity || 0)), 0)

      const report = {
        project: {
          ...project,
          formattedBudget: formatCurrency(project.budget),
          formattedStartDate: formatDate(project.start_date),
          formattedEndDate: formatDate(project.end_date)
        },
        financials: {
          budget: formatCurrency(project.budget),
          income: formatCurrency(income),
          expenses: formatCurrency(expenses),
          materialCosts: formatCurrency(materialCosts),
          profit: formatCurrency(income - expenses - materialCosts),
          budgetUsed: project.budget > 0 ? (((expenses + materialCosts) / project.budget) * 100).toFixed(2) + '%' : '0%'
        },
        resources: {
          materialsCount: materials.length,
          equipmentCount: equipment.length,
          diaryEntriesCount: diaryEntries.length
        }
      }

      if (detailed) {
        report.transactions = transactions.map(t => ({
          ...t,
          formattedAmount: formatCurrency(t.amount),
          formattedDate: formatDate(t.date)
        }))
        report.materials = materials
        report.equipment = equipment
        report.diaryEntries = diaryEntries
      }

      debugLog('Project report generated')
      return { data: report, error: null }

    } catch (error) {
      debugError('Failed to generate project report:', error)
      return { data: null, error: error.message }
    }
  },

  // Employee Reports
  async getEmployeeReport(employeeId, startDate, endDate) {
    try {
      debugLog('Generating employee report:', employeeId)

      // Get employee details
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('id', employeeId)
        .single()

      if (employeeError) throw employeeError

      // Get attendance records
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          *,
          project:projects(name)
        `)
        .eq('employee_id', employeeId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

      if (attendanceError) throw attendanceError

      // Calculate statistics
      const totalHours = attendance.reduce((sum, a) => sum + parseFloat(a.hours_worked || 0), 0)
      const overtimeHours = attendance.reduce((sum, a) => sum + parseFloat(a.overtime_hours || 0), 0)
      const workingDays = attendance.length
      const averageHoursPerDay = workingDays > 0 ? (totalHours / workingDays).toFixed(2) : 0

      const report = {
        employee: {
          ...employee,
          fullName: `${employee.profile.first_name} ${employee.profile.last_name}`
        },
        period: { startDate, endDate },
        statistics: {
          totalHours: totalHours.toFixed(2),
          overtimeHours: overtimeHours.toFixed(2),
          workingDays,
          averageHoursPerDay,
          estimatedSalary: employee.hourly_rate ? formatCurrency(totalHours * parseFloat(employee.hourly_rate)) : 'N/A'
        },
        attendance: attendance.map(a => ({
          ...a,
          formattedDate: formatDate(a.date),
          formattedHours: parseFloat(a.hours_worked || 0).toFixed(2)
        }))
      }

      debugLog('Employee report generated')
      return { data: report, error: null }

    } catch (error) {
      debugError('Failed to generate employee report:', error)
      return { data: null, error: error.message }
    }
  },

  // Materials Report
  async getMaterialsReport(filters = {}) {
    try {
      debugLog('Generating materials report')

      let query = supabase
        .from('materials')
        .select(`
          *,
          supplier:suppliers(name),
          project:projects(name)
        `)
        .order('name')

      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.project_id) {
        query = query.eq('project_id', filters.project_id)
      }

      const { data: materials, error } = await query

      if (error) throw error

      // Calculate totals
      const totalValue = materials.reduce((sum, m) => sum + (parseFloat(m.unit_price || 0) * parseFloat(m.quantity || 0)), 0)
      const lowStockItems = materials.filter(m => parseFloat(m.quantity) <= parseFloat(m.min_quantity || 0))
      const totalItems = materials.length

      // Group by category
      const byCategory = materials.reduce((acc, material) => {
        const category = material.category || 'other'
        if (!acc[category]) {
          acc[category] = { count: 0, value: 0, items: [] }
        }
        acc[category].count++
        acc[category].value += parseFloat(material.unit_price || 0) * parseFloat(material.quantity || 0)
        acc[category].items.push(material)
        return acc
      }, {})

      const report = {
        summary: {
          totalItems,
          totalValue: formatCurrency(totalValue),
          lowStockCount: lowStockItems.length,
          categoriesCount: Object.keys(byCategory).length
        },
        byCategory: Object.entries(byCategory).map(([category, data]) => ({
          category,
          count: data.count,
          value: formatCurrency(data.value),
          items: data.items
        })),
        lowStockItems: lowStockItems.map(m => ({
          ...m,
          formattedValue: formatCurrency(parseFloat(m.unit_price || 0) * parseFloat(m.quantity || 0))
        })),
        allMaterials: materials.map(m => ({
          ...m,
          formattedValue: formatCurrency(parseFloat(m.unit_price || 0) * parseFloat(m.quantity || 0))
        }))
      }

      debugLog('Materials report generated')
      return { data: report, error: null }

    } catch (error) {
      debugError('Failed to generate materials report:', error)
      return { data: null, error: error.message }
    }
  },

  // Export report to CSV
  exportToCSV(data, filename) {
    try {
      debugLog('Exporting report to CSV:', filename)

      let csvContent = ''
      
      if (Array.isArray(data) && data.length > 0) {
        // Get headers from first object
        const headers = Object.keys(data[0])
        csvContent += headers.join(',') + '\n'

        // Add data rows
        data.forEach(row => {
          const values = headers.map(header => {
            let value = row[header] || ''
            // Escape commas and quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              value = `"${value.replace(/"/g, '""')}"`
            }
            return value
          })
          csvContent += values.join(',') + '\n'
        })
      }

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      debugLog('CSV export completed')
      return { success: true }

    } catch (error) {
      debugError('Failed to export CSV:', error)
      return { success: false, error: error.message }
    }
  },

  // Export report to PDF (basic implementation)
  exportToPDF(reportData, filename) {
    try {
      debugLog('Exporting report to PDF:', filename)
      
      // This is a basic implementation
      // In a real app, you'd use a library like jsPDF or generate PDF on server
      const printWindow = window.open('', '_blank')
      
      printWindow.document.write(`
        <html>
          <head>
            <title>${filename}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .header { font-size: 18px; font-weight: bold; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="header">${filename}</div>
            <pre>${JSON.stringify(reportData, null, 2)}</pre>
          </body>
        </html>
      `)
      
      printWindow.document.close()
      printWindow.print()

      debugLog('PDF export completed')
      return { success: true }

    } catch (error) {
      debugError('Failed to export PDF:', error)
      return { success: false, error: error.message }
    }
  }
}

export default reportsService
