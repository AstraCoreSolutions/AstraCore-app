// AstraCore Solutions - Main Application Module (COMPLETE FIXED VERSION)

class AppManager {
    constructor() {
        this.isInitialized = false;
        this.initializationPromise = null;
        this.modules = {};
        this.errorHandlers = new Map();
        this.dataLoaded = false;
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

            // Pozor: NEBUDEME automaticky spouštět application modules
            // Ty se spustí až po úspěšném přihlášení v AuthManager.showMainApp()

            this.isInitialized = true;
            Utils.Debug.log('✅ AstraCore Solutions core initialized successfully');

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

        // Check Supabase connection
        if (!window.supabaseClient) {
            throw new Error('Supabase client not initialized');
        }

        // Modal manager first
        if (window.ModalManager) {
            window.ModalManager.initialize();
        }

        // Table manager
        if (window.TableManager) {
            window.TableManager.initialize();
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
     * TATO METODA SE VOLÁ AŽ PO PŘIHLÁŠENÍ
     */
    async initializeApplicationModules() {
        Utils.Debug.log('Initializing application modules...');

        try {
            // Initialize database manager and load data
            if (window.DatabaseManager) {
                await window.DatabaseManager.initialize();
                this.dataLoaded = true;
                Utils.Debug.log('Database data loaded successfully');
            }

            // Initialize navigation AFTER data is loaded
            if (window.NavigationManager) {
                window.NavigationManager.initialize();
            }

            // Initialize dashboard
            if (window.DashboardManager) {
                await window.DashboardManager.initialize();
            }

            // Initialize other managers
            if (window.ReportsManager) {
                window.ReportsManager.initialize();
            }

            if (window.SettingsManager) {
                window.SettingsManager.initialize();
            }

            if (window.ExportManager) {
                window.ExportManager.initialize();
            }

            // Setup periodic data refresh
            this.setupPeriodicRefresh();

            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();

            // Initial page load with data
            this.loadInitialPage();

            Utils.Debug.log('Application modules initialized');

        } catch (error) {
            Utils.Debug.error('Error initializing application modules:', error);
            // Don't throw - some modules might be optional
        }
    }

    /**
     * Load initial page with proper data
     */
    loadInitialPage() {
        // Get initial page from URL hash or default to dashboard
        const hash = window.location.hash.replace('#', '');
        const initialPage = hash && window.NavigationManager.pageExists(hash) ? hash : 'dashboard';
        
        Utils.Debug.log(`Loading initial page: ${initialPage}`);
        
        // Navigate to initial page
        window.NavigationManager.navigateTo(initialPage);
        
        // Ensure tables are loaded for all pages (in background)
        setTimeout(() => {
            this.preloadAllTables();
        }, 1000);
    }

    /**
     * Preload all table data in background
     */
    preloadAllTables() {
        if (!window.TableManager || !this.dataLoaded) return;
        
        Utils.Debug.log('Preloading all table data...');
        
        try {
            // Don't show loading - this is background preload
            window.TableManager.currentTable = 'projects';
            window.TableManager.currentData = window.appState.data.projects;
            window.TableManager.applyFiltersAndSort();
            
            window.TableManager.currentTable = 'transactions';
            window.TableManager.currentData = window.appState.data.transactions;
            window.TableManager.applyFiltersAndSort();
            
            window.TableManager.currentTable = 'invoices';
            window.TableManager.currentData = window.appState.data.invoices;
            window.TableManager.applyFiltersAndSort();
            
            window.TableManager.currentTable = 'employees';
            window.TableManager.currentData = window.appState.data.employees;
            window.TableManager.applyFiltersAndSort();
            
            window.TableManager.currentTable = 'equipment';
            window.TableManager.currentData = window.appState.data.equipment;
            window.TableManager.applyFiltersAndSort();
            
            window.TableManager.currentTable = 'materials';
            window.TableManager.currentData = window.appState.data.materials;
            window.TableManager.applyFiltersAndSort();
            
            Utils.Debug.log('All table data preloaded');
        } catch (error) {
            Utils.Debug.error('Error preloading tables:', error);
        }
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

        // Page visibility changes
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
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
            url: window.location.href,
            userId: window.appState.currentUser?.id || 'anonymous'
        };

        // Log to console
        Utils.Debug.error(`Global ${type}:`, errorInfo);

        // Store error for reporting
        this.storeErrorForReporting(errorInfo);

        // Show user-friendly error message
        this.showUserErrorMessage(type, error.message);

        // Report to external service if available
        this.reportErrorToService(errorInfo);
    }

    /**
     * Handle initialization errors
     */
    handleInitializationError(error) {
        const errorMessage = `
            <div class="container-fluid h-100">
                <div class="row h-100 justify-content-center align-items-center">
                    <div class="col-md-6 text-center">
                        <div class="card">
                            <div class="card-body p-5">
                                <i class="fas fa-exclamation-triangle fa-4x text-danger mb-4"></i>
                                <h3 class="text-danger mb-3">Chyba při spuštění aplikace</h3>
                                <p class="text-muted mb-4">${this.escapeHtml(error.message)}</p>
                                <div class="d-grid gap-2">
                                    <button class="btn btn-primary btn-lg" onclick="location.reload()">
                                        <i class="fas fa-redo me-2"></i>Obnovit stránku
                                    </button>
                                    <button class="btn btn-outline-secondary" onclick="AppManager.showErrorDetails()">
                                        <i class="fas fa-info-circle me-2"></i>Zobrazit detaily
                                    </button>
                                </div>
                                <div id="errorDetails" class="mt-4 text-start" style="display: none;">
                                    <h6>Technické detaily:</h6>
                                    <pre class="bg-light p-3 rounded text-small">${this.escapeHtml(error.stack || error.message)}</pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Show error in body
        document.body.innerHTML = errorMessage;
        
        // Store error details
        this.storeErrorForReporting({
            type: 'Initialization Error',
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Show error details
     */
    showErrorDetails() {
        const details = document.getElementById('errorDetails');
        if (details) {
            details.style.display = details.style.display === 'none' ? 'block' : 'none';
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
                window.DatabaseManager.checkConnection().catch(() => {
                    // Ignore errors
                });
            }

            // Refresh data
            if (this.isInitialized) {
                this.refreshData().catch(() => {
                    // Ignore errors
                });
            }
        } else {
            statusEl.className = 'connection-status disconnected';
            statusEl.innerHTML = '<i class="fas fa-wifi-slash"></i><span>Žádné připojení</span>';
            statusEl.style.display = 'block';
        }
    }

    /**
     * Handle page visibility changes
     */
    handleVisibilityChange() {
        if (!this.isInitialized) return;

        if (!document.hidden) {
            // Page became visible
            const timeSinceLastRefresh = Date.now() - (window.appState.lastRefresh || 0);
            
            // Refresh data if it's been more than 5 minutes
            if (timeSinceLastRefresh > 300000) {
                this.refreshData().catch(() => {
                    // Ignore errors
                });
                window.appState.lastRefresh = Date.now();
            }
        }
    }

    /**
     * Setup periodic data refresh
     */
    setupPeriodicRefresh() {
        // Refresh data every 10 minutes when online and app is visible
        setInterval(() => {
            if (navigator.onLine && !document.hidden && this.isInitialized && this.dataLoaded) {
                this.refreshData().catch(() => {
                    // Ignore errors in background refresh
                });
            }
        }, 600000); // 10 minutes
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Only handle shortcuts when not in input fields
            if (event.target.tagName === 'INPUT' || 
                event.target.tagName === 'TEXTAREA' || 
                event.target.contentEditable === 'true') {
                return;
            }

            if (event.ctrlKey || event.metaKey) {
                switch (event.key) {
                    case '1':
                        event.preventDefault();
                        window.NavigationManager.navigateTo('dashboard');
                        break;
                    case '2':
                        event.preventDefault();
                        window.NavigationManager.navigateTo('projects');
                        break;
                    case '3':
                        event.preventDefault();
                        window.NavigationManager.navigateTo('finance');
                        break;
                    case '4':
                        event.preventDefault();
                        window.NavigationManager.navigateTo('invoices');
                        break;
                    case 'k':
                        event.preventDefault();
                        this.showKeyboardShortcuts();
                        break;
                    case 'r':
                        event.preventDefault();
                        this.refreshData();
                        break;
                }
            }

            // Quick add shortcuts
            if (event.altKey) {
                switch (event.key) {
                    case 'p':
                        event.preventDefault();
                        if (window.ModalManager) {
                            window.ModalManager.showAddProjectModal();
                        }
                        break;
                    case 'i':
                        event.preventDefault();
                        if (window.ModalManager) {
                            window.ModalManager.showAddInvoiceModal();
                        }
                        break;
                    case 't':
                        event.preventDefault();
                        if (window.ModalManager) {
                            window.ModalManager.showAddTransactionModal('expense');
                        }
                        break;
                }
            }
        });
    }

    /**
     * Show keyboard shortcuts modal
     */
    showKeyboardShortcuts() {
        if (!window.ModalManager) return;

        const shortcuts = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Navigace</h6>
                    <ul class="list-unstyled">
                        <li><kbd>Ctrl + 1</kbd> Dashboard</li>
                        <li><kbd>Ctrl + 2</kbd> Projekty</li>
                        <li><kbd>Ctrl + 3</kbd> Finance</li>
                        <li><kbd>Ctrl + 4</kbd> Faktury</li>
                    </ul>
                </div>
                <div class="col-md-6">
                    <h6>Rychlé akce</h6>
                    <ul class="list-unstyled">
                        <li><kbd>Alt + P</kbd> Nový projekt</li>
                        <li><kbd>Alt + I</kbd> Nová faktura</li>
                        <li><kbd>Alt + T</kbd> Nový výdaj</li>
                    </ul>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-12">
                    <h6>Obecné</h6>
                    <ul class="list-unstyled">
                        <li><kbd>Ctrl + R</kbd> Obnovit data</li>
                        <li><kbd>Ctrl + K</kbd> Zobrazit klávesové zkratky</li>
                        <li><kbd>Esc</kbd> Zavřít modal</li>
                    </ul>
                </div>
            </div>
        `;

        const modal = window.ModalManager.getOrCreateModal(
            'keyboardShortcutsModal', 
            'Klávesové zkratky', 
            shortcuts
        );
        window.ModalManager.showModal(modal);
    }

    /**
     * Store error for reporting
     */
    storeErrorForReporting(errorInfo) {
        try {
            const errors = Utils.Storage.get('app_errors', []);
            errors.push(errorInfo);
            
            // Keep only last 20 errors
            if (errors.length > 20) {
                errors.splice(0, errors.length - 20);
            }
            
            Utils.Storage.set('app_errors', errors);
        } catch (e) {
            Utils.Debug.error('Failed to store error for reporting:', e);
        }
    }

    /**
     * Report error to external service
     */
    reportErrorToService(errorInfo) {
        // TODO: Implement error reporting to external service
        // For now, just log
        Utils.Debug.log('Error would be reported to service:', errorInfo);
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
            loader.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            loader.style.zIndex = '9999';
            loader.innerHTML = `
                <div class="text-center">
                    <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <div id="globalLoaderMessage" class="h5 text-muted">${message}</div>
                    <div class="mt-3">
                        <small class="text-muted">AstraCore Solutions</small>
                    </div>
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
        if (!this.isInitialized || !navigator.onLine) {
            return;
        }

        try {
            Utils.Debug.log('Refreshing application data...');
            
            // Show subtle loading indicator
            this.showRefreshIndicator();
            
            if (window.DatabaseManager) {
                await window.DatabaseManager.loadAllData();
                this.dataLoaded = true;
            }
            
            // Refresh current page
            const currentPage = window.NavigationManager.getCurrentPage();
            if (currentPage === 'dashboard' && window.DashboardManager) {
                await window.DashboardManager.loadDashboard();
            } else if (window.NavigationManager) {
                window.NavigationManager.refreshCurrentPageData();
            }
            
            // Update last refresh time
            window.appState.lastRefresh = Date.now();
            
            Utils.Debug.log('Application data refreshed');
            
            if (window.ModalManager) {
                window.ModalManager.showNotification('Data byla aktualizována', 'success');
            }
            
        } catch (error) {
            Utils.Debug.error('Error refreshing data:', error);
            
            if (window.ModalManager) {
                window.ModalManager.showNotification('Chyba při aktualizaci dat', 'error');
            }
        } finally {
            this.hideRefreshIndicator();
        }
    }

    /**
     * Show refresh indicator
     */
    showRefreshIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'refreshIndicator';
        indicator.className = 'position-fixed top-0 end-0 m-3 alert alert-info d-flex align-items-center';
        indicator.style.zIndex = '1060';
        indicator.innerHTML = `
            <div class="spinner-border spinner-border-sm me-2" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <small>Aktualizuji data...</small>
        `;
        document.body.appendChild(indicator);

        // Auto hide after 10 seconds
        setTimeout(() => {
            this.hideRefreshIndicator();
        }, 10000);
    }

    /**
     * Hide refresh indicator
     */
    hideRefreshIndicator() {
        const indicator = document.getElementById('refreshIndicator');
        if (indicator) {
            indicator.remove();
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
            errors: [],
            version: window.AstraCore.APP_CONFIG.VERSION
        };

        try {
            // Check database connection
            if (window.DatabaseManager) {
                try {
                    await window.DatabaseManager.checkConnection();
                    health.database = true;
                } catch (error) {
                    health.database = false;
                    health.errors.push({
                        type: 'Database Connection Error',
                        message: error.message
                    });
                }
            }

            // Check authentication
            if (window.AuthManager && window.AuthManager.isUserAuthenticated()) {
                health.authentication = true;
            }

            // Check modules
            const modules = [
                'NavigationManager', 
                'DashboardManager', 
                'ModalManager', 
                'TableManager',
                'ReportsManager',
                'SettingsManager',
                'ExportManager'
            ];
            
            modules.forEach(moduleName => {
                health.modules[moduleName] = !!window[moduleName];
            });

            // Performance metrics
            if (performance.timing) {
                health.performance = {
                    loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
                    domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
                    initialized: this.isInitialized,
                    dataLoaded: this.dataLoaded
                };
            }

            // Memory usage if available
            if (performance.memory) {
                health.performance.memory = {
                    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                    limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
                };
            }

            // Get stored errors
            health.errors = [...health.errors, ...Utils.Storage.get('app_errors', []).slice(-5)];

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
                environment: window.AstraCore.APP_CONFIG.ENVIRONMENT,
                initialized: this.isInitialized,
                dataLoaded: this.dataLoaded
            },
            browser: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                languages: navigator.languages,
                cookieEnabled: navigator.cookieEnabled,
                onLine: navigator.onLine,
                platform: navigator.platform,
                vendor: navigator.vendor
            },
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
                devicePixelRatio: window.devicePixelRatio
            },
            state: {
                isAuthenticated: window.appState.isAuthenticated,
                currentUser: window.appState.currentUser?.email || 'anonymous',
                currentPage: window.appState.currentPage,
                dataLoaded: Object.keys(window.appState.data).map(key => ({
                    key,
                    count: window.appState.data[key].length
                })),
                settings: window.appState.settings
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

        if (window.ModalManager) {
            window.ModalManager.showNotification('Systémové informace byly exportovány', 'success');
        }
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

        try {
            // Cleanup modules
            if (window.DashboardManager && window.DashboardManager.cleanup) {
                window.DashboardManager.cleanup();
            }

            if (window.DatabaseManager && window.DatabaseManager.cleanup) {
                window.DatabaseManager.cleanup();
            }

            if (window.ModalManager && window.ModalManager.cleanup) {
                window.ModalManager.cleanup();
            }

            if (window.ReportsManager && window.ReportsManager.cleanup) {
                window.ReportsManager.cleanup();
            }

            // Clear intervals and timeouts
            this.clearAllTimers();

            // Clear caches
            if (window.appState.cache) {
                window.appState.cache.clear();
            }

            // Clear stored errors
            Utils.Storage.remove('app_errors');

            this.isInitialized = false;
            this.dataLoaded = false;
            this.initializationPromise = null;

            Utils.Debug.log('Application cleanup completed');

        } catch (error) {
            Utils.Debug.error('Error during cleanup:', error);
        }
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
            
            if (window.ModalManager) {
                window.ModalManager.showNotification('Aplikace byla restartována', 'success');
            }
            
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
            dataLoaded: this.dataLoaded,
            authenticated: window.appState.isAuthenticated,
            currentUser: window.appState.currentUser?.email || 'anonymous',
            currentPage: window.appState.currentPage,
            online: navigator.onLine,
            version: window.AstraCore.APP_CONFIG.VERSION,
            environment: window.AstraCore.APP_CONFIG.ENVIRONMENT,
            modules: {
                AuthManager: !!window.AuthManager,
                DatabaseManager: !!window.DatabaseManager,
                NavigationManager: !!window.NavigationManager,
                DashboardManager: !!window.DashboardManager,
                ModalManager: !!window.ModalManager,
                TableManager: !!window.TableManager,
                ReportsManager: !!window.ReportsManager,
                SettingsManager: !!window.SettingsManager,
                ExportManager: !!window.ExportManager
            },
            lastRefresh: window.appState.lastRefresh || null
        };
    }

    /**
     * Escape HTML for safe display
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Update app settings
     */
    updateSettings(newSettings) {
        window.appState.settings = { ...window.appState.settings, ...newSettings };
        Utils.Storage.set('app_settings', window.appState.settings);
        
        // Apply theme changes
        if (newSettings.theme) {
            document.body.setAttribute('data-theme', newSettings.theme);
        }
        
        Utils.Debug.log('App settings updated:', window.appState.settings);
    }

    /**
     * Load saved settings
     */
    loadSettings() {
        const savedSettings = Utils.Storage.get('app_settings', {});
        window.appState.settings = { ...window.appState.settings, ...savedSettings };
        
        // Apply theme
        if (window.appState.settings.theme) {
            document.body.setAttribute('data-theme', window.appState.settings.theme);
        }
    }
}

// Create global app manager instance
window.AppManager = new AppManager();

// Global initialization function
window.initializeApp = async function() {
    try {
        // Load settings first
        window.AppManager.loadSettings();
        
        // Initialize app
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
window.checkAppHealth = () => window.AppManager.checkSystemHealth();

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
            console.group('🔧 AstraCore Debug Info');
            console.log('Status:', window.getAppStatus());
            console.log('App State:', window.appState);
            console.log('Supabase Client:', window.supabaseClient);
            console.log('Health:', window.checkAppHealth());
            console.groupEnd();
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
        TableManager: window.TableManager,
        Utils: window.Utils,
        Config: window.AstraCore
    };

    console.log('🚀 AstraCore Solutions - Development Mode');
    console.log('💡 Press Ctrl+Shift+D for debug info');
    console.log('🔧 Use window.debug.* to access managers');
    console.log('⌨️ Press Ctrl+K for keyboard shortcuts');
}

Utils.Debug.log('App module loaded successfully');
