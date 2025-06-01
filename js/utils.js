// AstraCore Solutions - Utility Functions

/**
 * Currency formatting and parsing utilities
 */
const CurrencyUtils = {
    /**
     * Format number as Czech currency
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency string
     */
    format(amount) {
        if (!amount && amount !== 0) return '0,00 Kč';
        return new Intl.NumberFormat('cs-CZ', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount) + ' Kč';
    },

    /**
     * Parse currency string to number
     * @param {string|number} value - Value to parse
     * @returns {number} Parsed number
     */
    parse(value) {
        if (typeof value === 'number') return value;
        if (!value) return 0;
        // Remove currency symbol and spaces, replace comma with dot
        return parseFloat(value.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
    },

    /**
     * Format input field value as currency
     * @param {HTMLInputElement} input - Input element
     */
    formatInput(input) {
        let value = input.value.replace(/[^\d,]/g, '');
        if (value) {
            let number = parseFloat(value.replace(',', '.'));
            if (!isNaN(number)) {
                input.value = new Intl.NumberFormat('cs-CZ', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }).format(number);
            }
        }
    }
};

/**
 * Date formatting and parsing utilities
 */
const DateUtils = {
    /**
     * Format date for Czech locale
     * @param {string|Date} dateString - Date to format
     * @returns {string} Formatted date string
     */
    format(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('cs-CZ');
    },

    /**
     * Format date and time for Czech locale
     * @param {string|Date} dateString - Date to format
     * @returns {string} Formatted datetime string
     */
    formatDateTime(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('cs-CZ');
    },

    /**
     * Get today's date in YYYY-MM-DD format
     * @returns {string} Today's date
     */
    today() {
        return new Date().toISOString().split('T')[0];
    },

    /**
     * Add days to date
     * @param {string|Date} date - Base date
     * @param {number} days - Days to add
     * @returns {string} New date in YYYY-MM-DD format
     */
    addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result.toISOString().split('T')[0];
    },

    /**
     * Check if date is in the past
     * @param {string|Date} date - Date to check
     * @returns {boolean} True if date is in the past
     */
    isPast(date) {
        return new Date(date) < new Date();
    },

    /**
     * Get difference in days between two dates
     * @param {string|Date} date1 - First date
     * @param {string|Date} date2 - Second date
     * @returns {number} Difference in days
     */
    daysDifference(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
};

/**
 * Validation utilities
 */
const ValidationUtils = {
    /**
     * Validate email address
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Validate Czech phone number
     * @param {string} phone - Phone to validate
     * @returns {boolean} True if valid
     */
    isValidPhone(phone) {
        const phoneRegex = /^(\+420)?[0-9]{9}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    },

    /**
     * Validate Czech birth number (rodné číslo)
     * @param {string} birthNumber - Birth number to validate
     * @returns {boolean} True if valid
     */
    isValidBirthNumber(birthNumber) {
        const regex = /^(\d{2})(\d{2})(\d{2})\/(\d{3,4})$/;
        return regex.test(birthNumber);
    },

    /**
     * Validate Czech business ID (IČO)
     * @param {string} ico - ICO to validate
     * @returns {boolean} True if valid
     */
    isValidICO(ico) {
        if (!/^\d{8}$/.test(ico)) return false;
        
        let sum = 0;
        for (let i = 0; i < 7; i++) {
            sum += parseInt(ico[i]) * (8 - i);
        }
        
        const remainder = sum % 11;
        const checkDigit = remainder < 2 ? remainder : 11 - remainder;
        
        return checkDigit === parseInt(ico[7]);
    },

    /**
     * Validate required fields in form
     * @param {Object} data - Form data
     * @param {Array} requiredFields - Array of required field names
     * @returns {Object} Validation result
     */
    validateRequired(data, requiredFields) {
        const errors = {};
        let isValid = true;

        requiredFields.forEach(field => {
            if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
                errors[field] = 'Toto pole je povinné';
                isValid = false;
            }
        });

        return { isValid, errors };
    }
};

/**
 * DOM utilities
 */
const DOMUtils = {
    /**
     * Show element with fade animation
     * @param {HTMLElement|string} element - Element or selector
     */
    show(element) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (el) {
            el.style.display = 'block';
            el.classList.add('fade-in');
        }
    },

    /**
     * Hide element
     * @param {HTMLElement|string} element - Element or selector
     */
    hide(element) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (el) {
            el.style.display = 'none';
        }
    },

    /**
     * Toggle element visibility
     * @param {HTMLElement|string} element - Element or selector
     */
    toggle(element) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (el) {
            if (el.style.display === 'none') {
                this.show(el);
            } else {
                this.hide(el);
            }
        }
    },

    /**
     * Add loading state to element
     * @param {HTMLElement|string} element - Element or selector
     */
    showLoading(element) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (el) {
            el.classList.add('loading');
            el.disabled = true;
        }
    },

    /**
     * Remove loading state from element
     * @param {HTMLElement|string} element - Element or selector
     */
    hideLoading(element) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (el) {
            el.classList.remove('loading');
            el.disabled = false;
        }
    },

    /**
     * Scroll to element smoothly
     * @param {HTMLElement|string} element - Element or selector
     */
    scrollTo(element) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    }
};

/**
 * Storage utilities
 */
const StorageUtils = {
    /**
     * Get item from localStorage with JSON parsing
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if not found
     * @returns {*} Stored value or default
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    },

    /**
     * Set item to localStorage with JSON stringifying
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Storage set error:', error);
        }
    },

    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Storage remove error:', error);
        }
    },

    /**
     * Clear all localStorage
     */
    clear() {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('Storage clear error:', error);
        }
    }
};

/**
 * Number utilities
 */
const NumberUtils = {
    /**
     * Format number with thousands separator
     * @param {number} num - Number to format
     * @returns {string} Formatted number
     */
    format(num) {
        return new Intl.NumberFormat('cs-CZ').format(num);
    },

    /**
     * Round to specified decimal places
     * @param {number} num - Number to round
     * @param {number} decimals - Number of decimal places
     * @returns {number} Rounded number
     */
    round(num, decimals = 2) {
        return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
    },

    /**
     * Generate random integer between min and max
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random integer
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Clamp number between min and max
     * @param {number} num - Number to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped number
     */
    clamp(num, min, max) {
        return Math.min(Math.max(num, min), max);
    }
};

/**
 * String utilities
 */
const StringUtils = {
    /**
     * Capitalize first letter
     * @param {string} str - String to capitalize
     * @returns {string} Capitalized string
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    /**
     * Truncate string to specified length
     * @param {string} str - String to truncate
     * @param {number} length - Maximum length
     * @returns {string} Truncated string
     */
    truncate(str, length) {
        return str.length > length ? str.substring(0, length) + '...' : str;
    },

    /**
     * Generate random string
     * @param {number} length - Length of string
     * @returns {string} Random string
     */
    random(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    /**
     * Slugify string for URLs
     * @param {string} str - String to slugify
     * @returns {string} Slugified string
     */
    slugify(str) {
        return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
    }
};

/**
 * Array utilities
 */
const ArrayUtils = {
    /**
     * Group array by key
     * @param {Array} array - Array to group
     * @param {string} key - Key to group by
     * @returns {Object} Grouped object
     */
    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const value = item[key];
            groups[value] = groups[value] || [];
            groups[value].push(item);
            return groups;
        }, {});
    },

    /**
     * Remove duplicates from array
     * @param {Array} array - Array to deduplicate
     * @param {string} key - Key for object arrays
     * @returns {Array} Deduplicated array
     */
    unique(array, key = null) {
        if (key) {
            const seen = new Set();
            return array.filter(item => {
                const value = item[key];
                if (seen.has(value)) {
                    return false;
                }
                seen.add(value);
                return true;
            });
        }
        return [...new Set(array)];
    },

    /**
     * Sort array by multiple keys
     * @param {Array} array - Array to sort
     * @param {Array} keys - Array of sort keys with direction
     * @returns {Array} Sorted array
     */
    sortBy(array, keys) {
        return array.sort((a, b) => {
            for (let { key, direction = 'asc' } of keys) {
                let aVal = a[key];
                let bVal = b[key];
                
                if (aVal < bVal) return direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }
};

/**
 * Debug utilities
 */
const DebugUtils = {
    /**
     * Log message if in debug mode
     * @param {...any} args - Arguments to log
     */
    log(...args) {
        if (window.DEBUG) {
            console.log('[AstraCore]', ...args);
        }
    },

    /**
     * Log error
     * @param {...any} args - Arguments to log
     */
    error(...args) {
        console.error('[AstraCore]', ...args);
    },

    /**
     * Log warning
     * @param {...any} args - Arguments to log
     */
    warn(...args) {
        console.warn('[AstraCore]', ...args);
    },

    /**
     * Performance timing
     * @param {string} label - Timer label
     */
    time(label) {
        if (window.DEBUG) {
            console.time(`[AstraCore] ${label}`);
        }
    },

    /**
     * End performance timing
     * @param {string} label - Timer label
     */
    timeEnd(label) {
        if (window.DEBUG) {
            console.timeEnd(`[AstraCore] ${label}`);
        }
    }
};

// Export utilities to global scope
window.Utils = {
    Currency: CurrencyUtils,
    Date: DateUtils,
    Validation: ValidationUtils,
    DOM: DOMUtils,
    Storage: StorageUtils,
    Number: NumberUtils,
    String: StringUtils,
    Array: ArrayUtils,
    Debug: DebugUtils
};

// Setup currency input formatting on document ready
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners for currency inputs
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('currency-format')) {
            Utils.Currency.formatInput(e.target);
        }
    });
    
    // Add event listeners for phone inputs
    document.addEventListener('input', function(e) {
        if (e.target.type === 'tel') {
            // Format phone number as user types
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 3 && value.length <= 6) {
                e.target.value = value.substring(0, 3) + ' ' + value.substring(3);
            } else if (value.length > 6) {
                e.target.value = value.substring(0, 3) + ' ' + value.substring(3, 6) + ' ' + value.substring(6, 9);
            }
        }
    });
});

Utils.Debug.log('Utility functions loaded successfully');
