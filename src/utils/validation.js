import { isValidEmail, isValidPhone, isValidICO } from './helpers.js'

// Base validation function
export const validateField = (value, rules) => {
  const errors = []
  
  // Required validation
  if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    errors.push('Toto pole je povinné')
    return errors // Return early if required field is empty
  }
  
  // Skip other validations if field is empty and not required
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return errors
  }
  
  // Min length validation
  if (rules.minLength && value.length < rules.minLength) {
    errors.push(`Minimální délka je ${rules.minLength} znaků`)
  }
  
  // Max length validation
  if (rules.maxLength && value.length > rules.maxLength) {
    errors.push(`Maximální délka je ${rules.maxLength} znaků`)
  }
  
  // Email validation
  if (rules.email && !isValidEmail(value)) {
    errors.push('Neplatný formát e-mailu')
  }
  
  // Phone validation
  if (rules.phone && !isValidPhone(value)) {
    errors.push('Neplatný formát telefonu')
  }
  
  // ICO validation
  if (rules.ico && !isValidICO(value)) {
    errors.push('Neplatné IČO')
  }
  
  // Number validation
  if (rules.number) {
    const num = parseFloat(value)
    if (isNaN(num)) {
      errors.push('Musí být číslo')
    } else {
      if (rules.min !== undefined && num < rules.min) {
        errors.push(`Minimální hodnota je ${rules.min}`)
      }
      if (rules.max !== undefined && num > rules.max) {
        errors.push(`Maximální hodnota je ${rules.max}`)
      }
    }
  }
  
  // Date validation
  if (rules.date) {
    const date = new Date(value)
    if (isNaN(date.getTime())) {
      errors.push('Neplatné datum')
    } else {
      if (rules.minDate && date < new Date(rules.minDate)) {
        errors.push(`Datum musí být po ${new Date(rules.minDate).toLocaleDateString('cs-CZ')}`)
      }
      if (rules.maxDate && date > new Date(rules.maxDate)) {
        errors.push(`Datum musí být před ${new Date(rules.maxDate).toLocaleDateString('cs-CZ')}`)
      }
    }
  }
  
  // Custom validation
  if (rules.custom && typeof rules.custom === 'function') {
    const customError = rules.custom(value)
    if (customError) {
      errors.push(customError)
    }
  }
  
  // Pattern validation
  if (rules.pattern && !rules.pattern.test(value)) {
    errors.push(rules.patternMessage || 'Neplatný formát')
  }
  
  return errors
}

// Validate entire form
export const validateForm = (data, schema) => {
  const errors = {}
  let isValid = true
  
  Object.entries(schema).forEach(([field, rules]) => {
    const fieldErrors = validateField(data[field], rules)
    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors
      isValid = false
    }
  })
  
  return { isValid, errors }
}

// Common validation schemas
export const validationSchemas = {
  // User login
  login: {
    email: {
      required: true,
      email: true
    },
    password: {
      required: true,
      minLength: 6
    }
  },
  
  // User registration/creation
  user: {
    email: {
      required: true,
      email: true
    },
    password: {
      required: true,
      minLength: 6
    },
    first_name: {
      required: true,
      minLength: 2,
      maxLength: 50
    },
    last_name: {
      required: true,
      minLength: 2,
      maxLength: 50
    },
    phone: {
      phone: true
    },
    role: {
      required: true
    }
  },
  
  // Project
  project: {
    name: {
      required: true,
      minLength: 3,
      maxLength: 100
    },
    description: {
      maxLength: 500
    },
    client_id: {
      required: true
    },
    start_date: {
      required: true,
      date: true
    },
    end_date: {
      date: true,
      custom: (value, data) => {
        if (value && data.start_date && new Date(value) <= new Date(data.start_date)) {
          return 'Datum ukončení musí být po datu zahájení'
        }
      }
    },
    budget: {
      number: true,
      min: 0
    }
  },
  
  // Client
  client: {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100
    },
    email: {
      email: true
    },
    phone: {
      phone: true
    },
    ico: {
      ico: true
    },
    address: {
      maxLength: 200
    }
  },
  
  // Employee
  employee: {
    first_name: {
      required: true,
      minLength: 2,
      maxLength: 50
    },
    last_name: {
      required: true,
      minLength: 2,
      maxLength: 50
    },
    email: {
      email: true
    },
    phone: {
      phone: true
    },
    position: {
      required: true,
      maxLength: 100
    },
    start_date: {
      required: true,
      date: true
    },
    hourly_rate: {
      number: true,
      min: 0
    }
  },
  
  // Invoice
  invoice: {
    client_id: {
      required: true
    },
    invoice_number: {
      required: true,
      maxLength: 50
    },
    issue_date: {
      required: true,
      date: true
    },
    due_date: {
      required: true,
      date: true,
      custom: (value, data) => {
        if (value && data.issue_date && new Date(value) <= new Date(data.issue_date)) {
          return 'Datum splatnosti musí být po datu vystavení'
        }
      }
    }
  },
  
  // Material
  material: {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100
    },
    category: {
      required: true
    },
    unit: {
      required: true,
      maxLength: 20
    },
    price_per_unit: {
      number: true,
      min: 0
    }
  },
  
  // Equipment
  equipment: {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100
    },
    category: {
      required: true
    },
    manufacturer: {
      maxLength: 100
    },
    model: {
      maxLength: 100
    },
    purchase_date: {
      date: true
    },
    purchase_price: {
      number: true,
      min: 0
    }
  },
  
  // Vehicle
  vehicle: {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100
    },
    license_plate: {
      required: true,
      pattern: /^[A-Z0-9]{2,8}$/,
      patternMessage: 'Neplatná SPZ'
    },
    brand: {
      maxLength: 50
    },
    model: {
      maxLength: 50
    },
    year: {
      number: true,
      min: 1900,
      max: new Date().getFullYear() + 1
    }
  },
  
  // Transaction
  transaction: {
    description: {
      required: true,
      minLength: 3,
      maxLength: 200
    },
    amount: {
      required: true,
      number: true,
      min: 0.01
    },
    category: {
      required: true
    },
    transaction_date: {
      required: true,
      date: true
    }
  }
}

// Specific validation functions
export const validatePassword = (password, confirmPassword) => {
  const errors = []
  
  if (!password) {
    errors.push('Heslo je povinné')
    return errors
  }
  
  if (password.length < 6) {
    errors.push('Heslo musí mít alespoň 6 znaků')
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Heslo musí obsahovat alespoň jedno malé písmeno')
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Heslo musí obsahovat alespoň jedno velké písmeno')
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Heslo musí obsahovat alespoň jednu číslici')
  }
  
  if (confirmPassword !== undefined && password !== confirmPassword) {
    errors.push('Hesla se neshodují')
  }
  
  return errors
}

export const validateFileUpload = (file, maxSize = 10 * 1024 * 1024, allowedTypes = []) => {
  const errors = []
  
  if (!file) {
    errors.push('Žádný soubor nebyl vybrán')
    return errors
  }
  
  if (file.size > maxSize) {
    errors.push(`Soubor je příliš velký. Maximální velikost je ${Math.round(maxSize / 1024 / 1024)}MB`)
  }
  
  if (allowedTypes.length > 0) {
    const fileExtension = file.name.split('.').pop().toLowerCase()
    if (!allowedTypes.includes(fileExtension)) {
      errors.push(`Nepodporovaný typ souboru. Povolené typy: ${allowedTypes.join(', ')}`)
    }
  }
  
  return errors
}
