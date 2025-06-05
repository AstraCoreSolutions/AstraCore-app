import { format, parseISO, isValid } from 'date-fns'
import { cs } from 'date-fns/locale'

// Date helpers
export const formatDate = (date, formatStr = 'dd.MM.yyyy') => {
  if (!date) return '-'
  
  const parsedDate = typeof date === 'string' ? parseISO(date) : date
  
  if (!isValid(parsedDate)) return '-'
  
  return format(parsedDate, formatStr, { locale: cs })
}

export const formatDateTime = (date) => {
  return formatDate(date, 'dd.MM.yyyy HH:mm')
}

export const isDatePast = (date) => {
  if (!date) return false
  const parsedDate = typeof date === 'string' ? parseISO(date) : date
  return parsedDate < new Date()
}

export const addDays = (date, days) => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export const getDaysDifference = (date1, date2) => {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diffTime = Math.abs(d2 - d1)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Currency helpers
export const formatCurrency = (amount, currency = 'CZK') => {
  if (!amount && amount !== 0) return '0,00 Kč'
  
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

export const parseCurrency = (value) => {
  if (typeof value === 'number') return value
  if (!value) return 0
  
  // Remove currency symbols and spaces, replace comma with dot
  const cleaned = value.toString().replace(/[^\d,-]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

// String helpers
export const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export const truncate = (str, length = 50) => {
  if (!str) return ''
  return str.length > length ? str.substring(0, length) + '...' : str
}

export const slugify = (str) => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-')
}

export const escapeHtml = (text) => {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// Array helpers
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key]
    if (!result[group]) {
      result[group] = []
    }
    result[group].push(item)
    return result
  }, {})
}

export const sortBy = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const aValue = a[key]
    const bValue = b[key]
    
    if (aValue < bValue) return direction === 'asc' ? -1 : 1
    if (aValue > bValue) return direction === 'asc' ? 1 : -1
    return 0
  })
}

export const filterBy = (array, filters) => {
  return array.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value || value === '') return true
      
      const itemValue = item[key]
      if (typeof itemValue === 'string') {
        return itemValue.toLowerCase().includes(value.toLowerCase())
      }
      
      return itemValue === value
    })
  })
}

// File helpers
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

export const isImageFile = (filename) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
  const extension = getFileExtension(filename).toLowerCase()
  return imageExtensions.includes(extension)
}

// Validation helpers
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidPhone = (phone) => {
  // Czech phone number format
  const phoneRegex = /^(\+420)?[0-9]{9}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export const isValidICO = (ico) => {
  // Czech business ID validation
  if (!/^\d{8}$/.test(ico)) return false
  
  const digits = ico.split('').map(Number)
  const weights = [8, 7, 6, 5, 4, 3, 2]
  
  const sum = digits.slice(0, 7).reduce((acc, digit, index) => {
    return acc + digit * weights[index]
  }, 0)
  
  const remainder = sum % 11
  const checkDigit = remainder < 2 ? remainder : 11 - remainder
  
  return checkDigit === digits[7]
}

// URL helpers
export const buildUrl = (base, params = {}) => {
  const url = new URL(base, window.location.origin)
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      url.searchParams.append(key, value)
    }
  })
  
  return url.toString()
}

// Local storage helpers
export const getFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error('Error reading from localStorage:', error)
    return defaultValue
  }
}

export const setToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Error writing to localStorage:', error)
  }
}

export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Error removing from localStorage:', error)
  }
}

// Debug helpers
export const debugLog = (...args) => {
  if (import.meta.env.VITE_DEV_MODE === 'true') {
    console.log('[AstraCore]', ...args)
  }
}

export const debugError = (...args) => {
  console.error('[AstraCore]', ...args)
}

// Generate random ID
export const generateId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Calculate progress percentage
export const calculateProgress = (completed, total) => {
  if (!total || total === 0) return 0
  return Math.round((completed / total) * 100)
}

// Deep clone object
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj))
}

// Check if object is empty
export const isEmpty = (obj) => {
  return Object.keys(obj).length === 0
}
