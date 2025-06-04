// AstraCore Solutions - Utility Functions

/**
 * Currency utilities
 */
const CurrencyUtils = {
    format(amount) {
        if (!amount && amount !== 0) return '0,00 Kč';
        return new Intl.NumberFormat('cs-CZ', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount) + ' Kč';
    },

    parse(value) {
        if (typeof value === 'number') return value;
        if (!value) return 0;
        return parseFloat(value.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
    }
};

/**
 * Date utilities
 */
const DateUtils = {
    format(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('cs-CZ');
    },

    formatDateTime(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('cs-CZ');
    },

    today() {
        return new Date().toISOString().split('T')[0];
    },

    addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result.toISOString().split('T')[0];
    },

    isPast(date) {
        return new Date(date) < new Date();
    },

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
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    isValidPhone(phone) {
        const phoneRegex = /^(\+420)?[0-9]{9}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    },

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
    show(element) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (el) {
            el.style.display = 'block';
            el.classList.add('fade-in');
        }
    },

    hide(element) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (el) {
            el.style.display = 'none';
        }
    },

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

    showLoading(element) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (el) {
            el.classList.add('loading');
            el.disabled = true;
        }
    },

    hideLoading(element) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (el) {
            el.classList.remove('loading');
            el.disabled = false;
        }
    }
};

/**
 * Storage utilities
 */
const StorageUtils = {
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Storage set error:', error);
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Storage remove error:', error);
        }
    }
};

/**
 * String utilities
 */
const StringUtils = {
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    truncate(str, length) {
        return str.length > length ? str.substring(0, length) + '...' : str;
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

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
 * Debug utilities
 */
const DebugUtils = {
    log(...args) {
        if (window.AstraCore?.APP_CONFIG?.ENVIRONMENT === 'development') {
            console.log('[AstraCore]', ...args);
        }
    },

    error(...args) {
        console.error('[AstraCore]', ...args);
    },

    warn(...args) {
        console.warn('[AstraCore]', ...args);
    }
};

// Export utilities to global scope
window.Utils = {
    Currency: CurrencyUtils,
    Date: DateUtils,
    Validation: ValidationUtils,
    DOM: DOMUtils,
    Storage: StorageUtils,
    String: StringUtils,
    Debug: DebugUtils
};

console.log('✅ AstraCore utilities loaded');
