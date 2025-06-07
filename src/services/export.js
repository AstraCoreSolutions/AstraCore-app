import { formatCurrency, formatDate } from '../utils/helpers.js'

export const exportService = {
  // Export data to CSV
  exportToCSV: (data, filename, columns = null) => {
    try {
      if (!data || data.length === 0) {
        throw new Error('Žádná data k exportu')
      }

      // Use provided columns or extract from first object
      const headers = columns || Object.keys(data[0])
      
      // Create CSV content
      const csvContent = [
        // Headers
        headers.join(','),
        // Data rows
        ...data.map(row => 
          headers.map(header => {
            const value = row[header]
            // Handle special formatting
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value}"`
            }
            return value || ''
          }).join(',')
        )
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `${filename}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      return { success: true }
      
    } catch (error) {
      console.error('Export to CSV failed:', error)
      return { success: false, error: error.message }
    }
  },

  // Export to Excel (requires SheetJS)
  exportToExcel: async (data, filename, sheetName = 'Data') => {
    try {
      // This would require SheetJS library
      // For now, fallback to CSV
      return exportService.exportToCSV(data, filename)
      
    } catch (error) {
      console.error('Export to Excel failed:', error)
      return { success: false, error: error.message }
    }
  },

  // Export financial report
  exportFinancialReport: (transactions, dateFrom, dateTo) => {
    try {
      const reportData = transactions.map(t => ({
        'Datum': formatDate(t.transaction_date),
        'Typ': t.type === 'income' ? 'Příjem' : 'Výdaj',
        'Popis': t.description,
        'Kategorie': t.category || '',
        'Částka': formatCurrency(t.amount),
        'Poznámka': t.note || ''
      }))

      const filename = `financni-report-${dateFrom}-${dateTo}`
      return exportService.exportToCSV(reportData, filename)
      
    } catch (error) {
      console.error('Export financial report failed:', error)
      return { success: false, error: error.message }
    }
  },

  // Export project report
  exportProjectReport: (projects) => {
    try {
      const reportData = projects.map(p => ({
        'Název': p.name,
        'Klient': p.client?.name || '',
        'Stav': p.status,
        'Pokrok': `${p.progress || 0}%`,
        'Zahájení': p.start_date ? formatDate(p.start_date) : '',
        'Dokončení': p.end_date ? formatDate(p.end_date) : '',
        'Rozpočet': p.budget ? formatCurrency(p.budget) : '',
        'Lokace': p.location || ''
      }))

      const filename = `projekty-report-${new Date().toISOString().split('T')[0]}`
      return exportService.exportToCSV(reportData, filename)
      
    } catch (error) {
      console.error('Export project report failed:', error)
      return { success: false, error: error.message }
    }
  },

  // Export employees report
  exportEmployeesReport: (employees) => {
    try {
      const reportData = employees.map(e => ({
        'Jméno': `${e.first_name} ${e.last_name}`,
        'E-mail': e.email || '',
        'Telefon': e.phone || '',
        'Pozice': e.position || '',
        'Nástup': e.start_date ? formatDate(e.start_date) : '',
        'Hodinová sazba': e.hourly_rate ? formatCurrency(e.hourly_rate) : '',
        'Stav': e.status || 'active'
      }))

      const filename = `zamestnanci-report-${new Date().toISOString().split('T')[0]}`
      return exportService.exportToCSV(reportData, filename)
      
    } catch (error) {
      console.error('Export employees report failed:', error)
      return { success: false, error: error.message }
    }
  },

  // Export materials inventory
  exportMaterialsInventory: (materials) => {
    try {
      const reportData = materials.map(m => ({
        'Materiál': m.name,
        'Kategorie': m.category || '',
        'Jednotka': m.unit,
        'Cena za jednotku': formatCurrency(m.price_per_unit),
        'Současný stav': m.current_stock,
        'Minimální stav': m.min_stock,
        'Celková hodnota': formatCurrency((m.current_stock || 0) * (m.price_per_unit || 0)),
        'Dodavatel': m.supplier || ''
      }))

      const filename = `material-sklad-${new Date().toISOString().split('T')[0]}`
      return exportService.exportToCSV(reportData, filename)
      
    } catch (error) {
      console.error('Export materials inventory failed:', error)
      return { success: false, error: error.message }
    }
  }
}

export default exportService
