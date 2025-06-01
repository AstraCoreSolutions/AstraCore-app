// AstraCore Solutions - Main Application Module

class AppManager {
    constructor() {
        this.isInitialized = false;
        this.initializationPromise = null;
        this.modules = {};
        this.errorHandlers = new Map();
        this.setupGlobalErrorHandling();
    }

    /**
     * Initialize the entire application
     */
    async initialize() {
        if (this.isInitialized) {
            return this.initializationPromise;
        }

        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = this._doInitialize();
        return this.initializationPromise;
    }

    /**
     * Internal initialization method
     */
    async _doInitialize() {
        Utils.Debug.log('🚀 Starting AstraCore Solutions initialization...');
        
        try {
            // Show loading state
            this.showGlobalLoading('Inicializace aplikace...');

            // Step 1: Initialize core modules
            await this.initializeCoreModules();

            // Step 2: Initialize authentication
            await this.initializeAuthentication();

            // Step 3: Only proceed if user is authenticated
            if (window.appState.isAuthenticated) {
                await this.initializeApplicationModules();
            }

            this.isInitialized = true;
            Utils.Debug.log('✅ AstraCore Solutions initialized successfully');

        } catch (error) {
            Utils.Debug.error('❌ Application initialization failed:', error);
            this.handleInitializationError(error);
            throw error;
        } finally {
            this.hideGlobalLoading();
        }
    }

    /**
     * Initialize core modules (always needed)
     */
    async initializeCoreModules() {
        Utils.Debug.log('Initializing core modules...');

        // Connection check
        if (window.DatabaseManager) {
            await window.DatabaseManager.checkConnection();
        }

        // Modal manager
        if (window.ModalManager) {
            window.ModalManager.initialize();
        }

        // Navigation manager
        if (window.NavigationManager) {
            window.NavigationManager.initialize();
        }

        Utils.Debug.log('Core modules initialized');
    }

    /**
     * Initialize authentication
     */
    async initializeAuthentication() {
        Utils.Debug.log('Initializing authentication...');

        if (window.AuthManager) {
            await window.AuthManager.initialize();
        } else {
            throw new Error('AuthManager not available');
        }

        Utils.Debug.log('Authentication initialized');
    }

    /**
     * Initialize application modules (only when authenticated)
     */
    async initializeApplicationModules() {
        Utils.Debug.log('Initializing application modules...');

        // Initialize database manager
        if (window.DatabaseManager) {
            await window.DatabaseManager.initialize();
        }

        // Initialize dashboard
        if (window.DashboardManager) {
            await window.DashboardManager.initialize();
        }

        // Initialize table manager if available
        if (window.TableManager) {
            window.TableManager.initialize();
        }

        // Initialize charts manager if available
        if (window.ChartsManager) {
            window.ChartsManager.initialize();
        }

        // Load initial page
        const currentPage = window.NavigationManager.getCurrentPage() || 'dashboard';
        window.NavigationManager.navigateTo(currentPage);

        Utils.Debug.log('Application modules initialized');
    }

    /**
     * Setup global error handling
     */
    setupGlobalErrorHandling() {
        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            Utils.Debug.error('Unhandled promise rejection:', event.reason);
            this.handleGlobalError(event.reason, 'Promise Rejection');
            event.preventDefault();
        });

        // Global errors
        window.addEventListener('error', (event) => {
            Utils.Debug.error('Global error:', event.error);
            this.handleGlobalError(event.error, 'JavaScript Error');
        });

        // Network errors
        window.addEventListener('offline', () => {
            this.handleNetworkError(false);
        });

        window.addEventListener('online', () => {
            this.handleNetworkError(true);
        });
    }

    /**
     * Handle global errors
     */
    handleGlobalError(error, type = 'Unknown Error') {
        const errorInfo = {
            type,
            message: error.message || error.toString(),
            stack: error.stack || 'No stack trace available',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // Log to console
        Utils.Debug.error(`Global ${type}:`, errorInfo);

        // Store error for reporting
        this.storeErrorForReporting(errorInfo);

        // Show user-friendly error message
        this.showUserErrorMessage(type, error.message);
    }

    /**
     * Handle initialization errors
     */
    handleInitializationError(error) {
        const errorMessage = `
            <div class="text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                <h4>Chyba při spuštění aplikace</h4>
                <p class="text-muted">${error.message}</p>
                <button class="btn btn-primary mt-3" onclick="location.reload()">
                    <i class="fas fa-redo me-2"></i>Obnovit stránku
                </button>
            </div>
        `;

        // Show error in main app area
        const appElement = document.getElementById('mainApp');
        if (appElement) {
            appElement.innerHTML = errorMessage;
            appElement.style.display = 'block';
        }

        // Hide login screen
        const loginElement = document.getElementById('loginScreen');
        if (loginElement) {
            loginElement.style.display = 'none';
        }
    }

    /**
     * Handle network errors
     */
    handleNetworkError(isOnline) {
        const statusEl = document.getElementById('connectionStatus');
        if (!statusEl) return;

        if (isOnline) {
            statusEl.className = 'connection-status connected';
            statusEl.innerHTML = '<i class="fas fa-check-circle"></i><span>Připojení obnoveno</span>';
            statusEl.style.display = 'block';
            
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 3000);
            
            // Try to reinitialize if needed
            if (this.isInitialized && window.DatabaseManager) {
                window.DatabaseManager.checkConnection();
            }
        } else {
            statusEl.className = 'connection-status disconnected';
            statusEl.innerHTML = '<i class="fas fa-wifi-slash"></i><span>Žádné připojení</span>';
            statusEl.style.display = 'block';
        }
    }

    /**
     * Store error for reporting
     */
    storeErrorForReporting(errorInfo) {
        try {
            const errors = Utils.Storage.get('app_errors', []);
            errors.push(errorInfo);
            
            // Keep only last 10 errors
            if (errors.length > 10) {
                errors.splice(0, errors.length - 10);
            }
            
            Utils.Storage.set('app_errors', errors);
        } catch (e) {
            Utils.Debug.error('Failed to store error for reporting:', e);
        }
    }

    /**
     * Show user-friendly error message
     */
    showUserErrorMessage(type, message) {
        // Don't show error messages during initialization
        if (!this.isInitialized) return;

        // Don't spam user with errors
        if (this.lastErrorTime && Date.now() - this.lastErrorTime < 5000) {
            return;
        }
        this.lastErrorTime = Date.now();

        let userMessage = 'Nastala neočekávaná chyba. Zkuste to prosím znovu.';
        
        switch (type) {
            case 'Promise Rejection':
                userMessage = 'Chyba při zpracování požadavku. Zkuste to znovu.';
                break;
            case 'JavaScript Error':
                userMessage = 'Chyba aplikace. Obnovte prosím stránku.';
                break;
            case 'Network Error':
                userMessage = 'Chyba připojení. Zkontrolujte internetové připojení.';
                break;
        }

        // Show toast notification
        if (window.ModalManager) {
            window.ModalManager.showNotification(userMessage, 'error');
        }
    }

    /**
     * Show global loading state
     */
    showGlobalLoading(message = 'Načítání...') {
        let loader = document.getElementById('globalLoader');
        
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'globalLoader';
            loader.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center';
            loader.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            loader.style.zIndex = '9999';
            loader.innerHTML = `
                <div class="text-center">
                    <div class="spinner-border text-primary mb-3" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <div id="globalLoaderMessage">${message}</div>
                </div>
            `;
            document.body.appendChild(loader);
        } else {
            document.getElementById('globalLoaderMessage').textContent = message;
            loader.style.display = 'flex';
        }
    }

    /**
     * Hide global loading state
     */
    hideGlobalLoading() {
        const loader = document.getElementById('globalLoader');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    /**
     * Refresh application data
     */
    async refreshData() {
        try {
            Utils.Debug.log('Refreshing application data...');
            
            if (window.DatabaseManager) {
                await window.DatabaseManager.loadAllData();
            }
            
            // Refresh current page
            const currentPage = window.NavigationManager.getCurrentPage();
            if (currentPage === 'dashboard' && window.DashboardManager) {
                await window.DashboardManager.loadDashboard();
            }
            
            Utils.Debug.log('Application data refreshed');
            
            if (window.ModalManager) {
                window.ModalManager.showNotification('Data byla aktualizována', 'success');
            }
            
        } catch (error) {
            Utils.Debug.error('Error refreshing data:', error);
            
            if (window.ModalManager) {
                window.ModalManager.showNotification('Chyba při aktualizaci dat', 'error');
            }
        }
    }

    /**
     * Check system health
     */
    async checkSystemHealth() {
        const health = {
            timestamp: new Date().toISOString(),
            database: false,
            authentication: false,
            modules: {},
            performance: {},
            errors: []
        };

        try {
            // Check database connection
            if (window.DatabaseManager) {
                await window.DatabaseManager.checkConnection();
                health.database = true;
            }

            // Check authentication
            if (window.AuthManager && window.AuthManager.isUserAuthenticated()) {
                health.authentication = true;
            }

            // Check modules
            const modules = ['NavigationManager', 'DashboardManager', 'ModalManager'];
            modules.forEach(moduleName => {
                health.modules[moduleName] = !!window[moduleName];
            });

            // Performance metrics
            if (performance.timing) {
                health.performance = {
                    loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
                    domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
                };
            }

            // Get stored errors
            health.errors = Utils.Storage.get('app_errors', []).slice(-5);

        } catch (error) {
            health.errors.push({
                type: 'Health Check Error',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }

        return health;
    }

    /**
     * Export system information for debugging
     */
    async exportSystemInfo() {
        const systemInfo = {
            app: {
                name: window.AstraCore.APP_CONFIG.NAME,
                version: window.AstraCore.APP_CONFIG.VERSION,
                environment: window.AstraCore.APP_CONFIG.ENVIRONMENT
            },
            browser: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                cookieEnabled: navigator.cookieEnabled,
                onLine: navigator.onLine
            },
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth
            },
            state: {
                isAuthenticated: window.appState.isAuthenticated,
                currentPage: window.appState.currentPage,
                dataLoaded: Object.keys(window.appState.data).map(key => ({
                    key,
                    count: window.appState.data[key].length
                }))
            },
            health: await this.checkSystemHealth()
        };

        // Create downloadable file
        const blob = new Blob([JSON.stringify(systemInfo, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `astracore-system-info-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Register error handler for specific module
     */
    registerErrorHandler(moduleName, handler) {
        this.errorHandlers.set(moduleName, handler);
    }

    /**
     * Handle module-specific error
     */
    handleModuleError(moduleName, error) {
        const handler = this.errorHandlers.get(moduleName);
        if (handler) {
            try {
                handler(error);
            } catch (handlerError) {
                Utils.Debug.error(`Error in ${moduleName} error handler:`, handlerError);
            }
        } else {
            this.handleGlobalError(error, `${moduleName} Error`);
        }
    }

    /**
     * Cleanup application
     */
    cleanup() {
        Utils.Debug.log('Cleaning up application...');

        // Cleanup modules
        if (window.DashboardManager) {
            window.DashboardManager.cleanup();
        }

        if (window.DatabaseManager) {
            window.DatabaseManager.cleanup();
        }

        if (window.ModalManager) {
            window.ModalManager.cleanup();
        }

        // Clear intervals and timeouts
        this.clearAllTimers();

        // Clear caches
        if (window.appState.cache) {
            window.appState.cache.clear();
        }

        this.isInitialized = false;
        this.initializationPromise = null;

        Utils.Debug.log('Application cleanup completed');
    }

    /**
     * Clear all timers
     */
    clearAllTimers() {
        // Clear all timeouts
        let timeoutId = setTimeout(() => {}, 0);
        while (timeoutId--) {
            clearTimeout(timeoutId);
        }

        // Clear all intervals
        let intervalId = setInterval(() => {}, 0);
        while (intervalId--) {
            clearInterval(intervalId);
        }
    }

    /**
     * Restart application
     */
    async restart() {
        try {
            this.showGlobalLoading('Restartování aplikace...');
            
            // Cleanup current state
            this.cleanup();
            
            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Reinitialize
            await this.initialize();
            
        } catch (error) {
            Utils.Debug.error('Error restarting application:', error);
            // Force reload as fallback
            location.reload();
        } finally {
            this.hideGlobalLoading();
        }
    }

    /**
     * Get application status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            authenticated: window.appState.isAuthenticated,
            currentUser: window.appState.currentUser?.email,
            currentPage: window.appState.currentPage,
            online: navigator.onLine,
            modules: {
                AuthManager: !!window.AuthManager,
                DatabaseManager: !!window.DatabaseManager,
                NavigationManager: !!window.NavigationManager,
                DashboardManager: !!window.DashboardManager,
                ModalManager: !!window.ModalManager
            }
        };
    }
}

// Create global app manager instance
window.AppManager = new AppManager();

// Global initialization function
window.initializeApp = async function() {
    try {
        await window.AppManager.initialize();
    } catch (error) {
        console.error('Failed to initialize application:', error);
    }
};

// Global functions for debugging and maintenance
window.refreshApp = () => window.AppManager.refreshData();
window.restartApp = () => window.AppManager.restart();
window.getAppStatus = () => window.AppManager.getStatus();
window.exportSystemInfo = () => window.AppManager.exportSystemInfo();

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.AppManager.isInitialized) {
        // Page became visible, refresh data if needed
        const timeSinceLastRefresh = Date.now() - (window.appState.lastRefresh || 0);
        if (timeSinceLastRefresh > 300000) { // 5 minutes
            window.AppManager.refreshData();
            window.appState.lastRefresh = Date.now();
        }
    }
});

// Handle beforeunload for cleanup
window.addEventListener('beforeunload', () => {
    if (window.AppManager.isInitialized) {
        window.AppManager.cleanup();
    }
});

// Development helpers
if (window.AstraCore.APP_CONFIG.ENVIRONMENT === 'development') {
    // Add debug panel
    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            console.log('🔧 AstraCore Debug Info:');
            console.log('Status:', window.getAppStatus());
            console.log('App State:', window.appState);
            console.log('Supabase Client:', window.supabaseClient);
        }
    });

    // Global access to managers for debugging
    window.debug = {
        AppManager: window.AppManager,
        AuthManager: window.AuthManager,
        DatabaseManager: window.DatabaseManager,
        NavigationManager: window.NavigationManager,
        DashboardManager: window.DashboardManager,
        ModalManager: window.ModalManager,
        Utils: window.Utils,
        Config: window.AstraCore
    };

    console.log('🚀 AstraCore Solutions Development Mode');
    console.log('💡 Press Ctrl+Shift+D for debug info');
    console.log('🔧 Use window.debug.* to access managers');
}

Utils.Debug.log('App module loaded successfully');
