import Papa from 'papaparse'
import { debugLog, debugError } from '../utils/helpers.js'

export const importService = {
  // Parse CSV file
  parseCSV: (file, options = {}) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        delimitersToGuess: [',', '\t', '|', ';'],
        ...options,
        complete: (results) => {
          debugLog('CSV parsed:', results.data.length, 'rows')
          
          // Clean up headers (remove whitespace)
          const cleanData = results.data.map(row => {
            const cleanRow = {}
            Object.keys(row).forEach(key => {
              const cleanKey = key.trim()
              cleanRow[cleanKey] = row[key]
            })
            return cleanRow
          })
          
          resolve({
            success: true,
            data: cleanData,
            meta: results.meta,
            errors: results.errors
          })
        },
        error: (error) => {
          debugError('CSV parsing failed:', error)
          reject({
            success: false,
            error: error.message
          })
        }
      })
    })
  },

  // Import materials from CSV
  importMaterials: async (file) => {
    try {
      const result = await importService.parseCSV(file)
      
      if (!result.success) {
        throw new Error(result.error)
      }

      const requiredFields = ['name', 'unit']
      const materials = []
      const errors = []

      result.data.forEach((row, index) => {
        // Validate required fields
        const missing = requiredFields.filter(field => !row[field])
        if (missing.length > 0) {
          errors.push(`Řádek ${index + 1}: Chybí povinná pole: ${missing.join(', ')}`)
          return
        }

        // Map CSV columns to material object
        const material = {
          name: row.name || row['Materiál'] || row['Material'],
          category: row.category || row['Kategorie'] || row['Category'],
          unit: row.unit || row['Jednotka'] || row['Unit'],
          price_per_unit: parseFloat(row.price_per_unit || row['Cena za jednotku'] || row['Price'] || 0),
          current_stock: parseInt(row.current_stock || row['Současný stav'] || row['Stock'] || 0),
          min_stock: parseInt(row.min_stock || row['Minimální stav'] || row['Min Stock'] || 0),
          supplier: row.supplier || row['Dodavatel'] || row['Supplier'],
          notes: row.notes || row['Poznámky'] || row['Notes']
        }

        materials.push(material)
      })

      debugLog('Materials processed:', materials.length, 'errors:', errors.length)
      
      return {
        success: errors.length === 0,
        data: materials,
        errors,
        total: result.data.length
      }
      
    } catch (error) {
      debugError('Import materials failed:', error)
      return { success: false, error: error.message }
    }
  },

  // Import employees from CSV
  importEmployees: async (file) => {
    try {
      const result = await importService.parseCSV(file)
      
      if (!result.success) {
        throw new Error(result.error)
      }

      const requiredFields = ['first_name', 'last_name']
      const employees = []
      const errors = []

      result.data.forEach((row, index) => {
        // Validate required fields
        const missing = requiredFields.filter(field => 
          !row[field] && !row[field.replace('_', ' ')] && !row[field.charAt(0).toUpperCase() + field.slice(1)]
        )
        
        if (missing.length > 0) {
          errors.push(`Řádek ${index + 1}: Chybí povinná pole: ${missing.join(', ')}`)
          return
        }

        // Map CSV columns to employee object
        const employee = {
          first_name: row.first_name || row['Křestní jméno'] || row['First Name'],
          last_name: row.last_name || row['Příjmení'] || row['Last Name'],
          email: row.email || row['E-mail'] || row['Email'],
          phone: row.phone || row['Telefon'] || row['Phone'],
          position: row.position || row['Pozice'] || row['Position'],
          start_date: row.start_date || row['Datum nástupu'] || row['Start Date'],
          hourly_rate: parseFloat(row.hourly_rate || row['Hodinová sazba'] || row['Hourly Rate'] || 0),
          status: row.status || row['Stav'] || row['Status'] || 'active'
        }

        employees.push(employee)
      })

      debugLog('Employees processed:', employees.length, 'errors:', errors.length)
      
      return {
        success: errors.length === 0,
        data: employees,
        errors,
        total: result.data.length
      }
      
    } catch (error) {
      debugError('Import employees failed:', error)
      return { success: false, error: error.message }
    }
  },

  // Import clients from CSV
  importClients: async (file) => {
    try {
      const result = await importService.parseCSV(file)
      
      if (!result.success) {
        throw new Error(result.error)
      }

      const requiredFields = ['name']
      const clients = []
      const errors = []

      result.data.forEach((row, index) => {
        // Validate required fields
        const missing = requiredFields.filter(field => !row[field])
        if (missing.length > 0) {
          errors.push(`Řádek ${index + 1}: Chybí povinná pole: ${missing.join(', ')}`)
          return
        }

        // Map CSV columns to client object
        const client = {
          name: row.name || row['Název'] || row['Name'],
          type: row.type || row['Typ'] || row['Type'] || 'company',
          email: row.email || row['E-mail'] || row['Email'],
          phone: row.phone || row['Telefon'] || row['Phone'],
          ico: row.ico || row['IČO'] || row['ICO'],
          dic: row.dic || row['DIČ'] || row['DIC'],
          address: row.address || row['Adresa'] || row['Address'],
          city: row.city || row['Město'] || row['City'],
          postal_code: row.postal_code || row['PSČ'] || row['Postal Code'],
          contact_person: row.contact_person || row['Kontaktní osoba'] || row['Contact Person']
        }

        clients.push(client)
      })

      debugLog('Clients processed:', clients.length, 'errors:', errors.length)
      
      return {
        success: errors.length === 0,
        data: clients,
        errors,
        total: result.data.length
      }
      
    } catch (error) {
      debugError('Import clients failed:', error)
      return { success: false, error: error.message }
    }
  },

  // Validate import data
  validateImportData: (data, type) => {
    const validationRules = {
      materials: {
        required: ['name', 'unit'],
        optional: ['category', 'price_per_unit', 'current_stock', 'min_stock', 'supplier', 'notes']
      },
      employees: {
        required: ['first_name', 'last_name'],
        optional: ['email', 'phone', 'position', 'start_date', 'hourly_rate', 'status']
      },
      clients: {
        required: ['name'],
        optional: ['type', 'email', 'phone', 'ico', 'dic', 'address', 'city', 'postal_code', 'contact_person']
      }
    }

    const rules = validationRules[type]
    if (!rules) {
      return { isValid: false, errors: ['Neznámý typ importu'] }
    }

    const errors = []
    
    data.forEach((row, index) => {
      // Check required fields
      rules.required.forEach(field => {
        if (!row[field]) {
          errors.push(`Řádek ${index + 1}: Chybí povinné pole '${field}'`)
        }
      })
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

export default importService
