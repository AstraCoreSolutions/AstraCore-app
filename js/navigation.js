// AstraCore Solutions - Navigation Module (FIXED)

class NavigationManager {
    constructor() {
        this.currentPage = 'dashboard';
        this.pages = [
            'dashboard',
            'projects', 
            'finance',
            'invoices',
            'employees',
            'equipment',
            'materials',
            'reports',
            'settings'
        ];
        this.pageHistory = [];
        this.setupEventListeners();
    }

    /**
     * Initialize navigation
     */
    initialize() {
        Utils.Debug.log('Initializing navigation...');
        
        // Set initial page
        this.navigateTo('dashboard', document.querySelector('.sidebar-link.active'));
        
        // Setup sidebar state
        this.setupSidebar();
        
        Utils.Debug.log('Navigation initialized successfully');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.page) {
                this.navigateTo(event.state.page, null, false);
            }
        });

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey || event.metaKey) {
                switch (event.key) {
                    case '1':
                        event.preventDefault();
                        this.navigateToByIndex(0); // Dashboard
                        break;
                    case '2':
                        event.preventDefault();
                        this.navigateToByIndex(1); // Projects
                        break;
                    case '3':
                        event.preventDefault();
                        this.navigateToByIndex(2); // Finance
                        break;
                    // Add more shortcuts as needed
                }
            }
        });
    }

    /**
     * Navigate to specific page
     * @param {string} page - Page to navigate to
     * @param {HTMLElement} linkElement - Link element that was clicked
     * @param {boolean} updateHistory - Whether to update browser history
     */
    navigateTo(page, linkElement = null, updateHistory = true) {
        Utils.Debug.log(`Navigating to: ${page}`);

        // Validate page
        if (!this.pages.includes(page)) {
            Utils.Debug.error(`Invalid page: ${page}`);
            return;
        }

        try {
            // Hide all pages
            this.hideAllPages();
            
            // Show target page
            const targetPage = document.getElementById(page + 'Page');
            if (targetPage) {
                Utils.DOM.show(targetPage);
                targetPage.classList.add('fade-in');
            } else {
                Utils.Debug.error(`Page element not found: ${page}Page`);
                return;
            }
            
            // Update sidebar active state
            this.updateSidebarActiveState(linkElement, page);
            
            // Update page title in topbar
            this.updatePageTitle(page);
            
            // Update browser URL and history
            if (updateHistory) {
                this.updateBrowserHistory(page);
            }
            
            // Add to page history
            if (this.currentPage !== page) {
                this.pageHistory.push(this.currentPage);
                if (this.pageHistory.length > 10) {
                    this.pageHistory.shift(); // Keep only last 10 pages
                }
            }
            
            // Update current page
            this.currentPage = page;
            window.appState.currentPage = page;
            
            // Load page data
            this.loadPageData(page);
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            Utils.Debug.log(`Successfully navigated to: ${page}`);
            
        } catch (error) {
            Utils.Debug.error('Navigation error:', error);
        }
    }

    /**
     * Navigate to page by index (for keyboard shortcuts)
     * @param {number} index - Page index
     */
    navigateToByIndex(index) {
        if (index >= 0 && index < this.pages.length) {
            const page = this.pages[index];
            const linkElement = document.querySelector(`[onclick*="navigateTo('${page}'"]`);
            this.navigateTo(page, linkElement);
        }
    }

    /**
     * Hide all page content
     */
    hideAllPages() {
        this.pages.forEach(page => {
            const pageElement = document.getElementById(page + 'Page');
            if (pageElement) {
                Utils.DOM.hide(pageElement);
                pageElement.classList.remove('fade-in');
            }
        });
    }

    /**
     * Update sidebar active state
     * @param {HTMLElement} linkElement - Clicked link element
     * @param {string} page - Target page
     */
    updateSidebarActiveState(linkElement, page) {
        // Remove active class from all sidebar links
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to current link
        if (linkElement) {
            linkElement.classList.add('active');
        } else {
            // Find link by page name if linkElement not provided
            const targetLink = document.querySelector(`[onclick*="navigateTo('${page}'"]`);
            if (targetLink) {
                targetLink.classList.add('active');
            }
        }
    }

    /**
     * Update page title in topbar
     * @param {string} page - Current page
     */
    updatePageTitle(page) {
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            const titles = {
                'dashboard': 'Dashboard',
                'projects': 'Projekty',
                'finance': 'Finance',
                'invoices': 'Faktury',
                'employees': 'Zaměstnanci',
                'equipment': 'Nářadí',
                'materials': 'Materiál',
                'reports': 'Reporty',
                'settings': 'Nastavení'
            };
            pageTitle.textContent = titles[page] || 'AstraCore Solutions';
        }

        // Update document title
        const titles = {
            'dashboard': 'Dashboard',
            'projects': 'Projekty',
            'finance': 'Finance',
            'invoices': 'Faktury',
            'employees': 'Zaměstnanci',
            'equipment': 'Nářadí',
            'materials': 'Materiál',
            'reports': 'Reporty',
            'settings': 'Nastavení'
        };
        document.title = `${titles[page]} - AstraCore Solutions`;
    }

    /**
     * Update browser history
     * @param {string} page - Current page
     */
    updateBrowserHistory(page) {
        const url = `#${page}`;
        const state = { page: page };
        
        if (window.location.hash !== url) {
            history.pushState(state, '', url);
        }
    }

    /**
     * Load data for specific page
     * @param {string} page - Page to load data for
     */
    loadPageData(page) {
        Utils.Debug.log(`Loading data for page: ${page}`);

        switch(page) {
            case 'dashboard':
                if (window.DashboardManager) {
                    window.DashboardManager.loadDashboard();
                }
                break;
                
            case 'projects':
                if (window.TableManager) {
                    window.TableManager.loadProjectsTable();
                }
                break;
                
            case 'finance':
                if (window.TableManager) {
                    window.TableManager.loadTransactionsTable();
                }
                break;
                
            case 'invoices':
                if (window.TableManager) {
                    window.TableManager.loadInvoicesTable();
                }
                break;
                
            case 'employees':
                if (window.TableManager) {
                    window.TableManager.loadEmployeesTable();
                }
                break;
                
            case 'equipment':
                if (window.TableManager) {
                    window.TableManager.loadEquipmentTable();
                }
                break;
                
            case 'materials':
                if (window.TableManager) {
                    window.TableManager.loadMaterialsTable();
                }
                break;
                
            case 'reports':
                if (window.ReportsManager) {
                    window.ReportsManager.initializeReports();
                }
                break;
                
            case 'settings':
                if (window.SettingsManager) {
                    window.SettingsManager.loadSettings();
                }
                break;
                
            default:
                Utils.Debug.log(`No specific data loader for page: ${page}`);
        }
    }

    /**
     * Setup sidebar functionality
     */
    setupSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        
        if (!sidebar || !mainContent) return;

        // Restore sidebar state from storage
        const isCollapsed = Utils.Storage.get('sidebarCollapsed', false);
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('sidebar-collapsed');
        }

        // Mobile sidebar handling
        this.setupMobileSidebar();
    }

    /**
     * Toggle sidebar collapsed state
     */
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        
        if (!sidebar || !mainContent) return;

        const isCollapsed = sidebar.classList.contains('collapsed');
        
        if (isCollapsed) {
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('sidebar-collapsed');
        } else {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('sidebar-collapsed');
        }

        // Save state
        Utils.Storage.set('sidebarCollapsed', !isCollapsed);
        
        Utils.Debug.log(`Sidebar ${!isCollapsed ? 'collapsed' : 'expanded'}`);
    }

    /**
     * Setup mobile sidebar
     */
    setupMobileSidebar() {
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (event) => {
            if (window.innerWidth <= 768) {
                const sidebar = document.getElementById('sidebar');
                const sidebarToggle = document.querySelector('.sidebar-toggle');
                
                if (sidebar && !sidebar.contains(event.target) && 
                    sidebarToggle && !sidebarToggle.contains(event.target)) {
                    this.closeMobileSidebar();
                }
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.closeMobileSidebar();
            }
        });
    }

    /**
     * Open mobile sidebar
     */
    openMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.add('mobile-open');
        }
    }

    /**
     * Close mobile sidebar
     */
    closeMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('mobile-open');
        }
    }

    /**
     * Go back to previous page
     */
    goBack() {
        if (this.pageHistory.length > 0) {
            const previousPage = this.pageHistory.pop();
            this.navigateTo(previousPage);
        }
    }

    /**
     * Get current page
     * @returns {string} Current page name
     */
    getCurrentPage() {
        return this.currentPage;
    }

    /**
     * Check if page exists
     * @param {string} page - Page to check
     * @returns {boolean} True if page exists
     */
    pageExists(page) {
        return this.pages.includes(page);
    }

    /**
     * Get page title
     * @param {string} page - Page name
     * @returns {string} Page title
     */
    getPageTitle(page) {
        const titles = {
            'dashboard': 'Dashboard',
            'projects': 'Projekty',
            'finance': 'Finance',
            'invoices': 'Faktury',
            'employees': 'Zaměstnanci',
            'equipment': 'Nářadí',
            'materials': 'Materiál',
            'reports': 'Reporty',
            'settings': 'Nastavení'
        };
        return titles[page] || page;
    }

    /**
     * Handle hash change (for direct URL access)
     */
    handleHashChange() {
        const hash = window.location.hash.replace('#', '');
        if (hash && this.pageExists(hash)) {
            this.navigateTo(hash);
        }
    }

    /**
     * Initialize hash navigation
     */
    initializeHashNavigation() {
        // Handle initial hash
        this.handleHashChange();
        
        // Listen for hash changes
        window.addEventListener('hashchange', () => {
            this.handleHashChange();
        });
    }
}

// Create global navigation manager instance
window.NavigationManager = new NavigationManager();

// Global functions for use in HTML onclick handlers
window.navigateTo = (page, linkElement) => {
    window.NavigationManager.navigateTo(page, linkElement);
};

window.toggleSidebar = () => {
    window.NavigationManager.toggleSidebar();
};

// Initialize hash navigation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.NavigationManager.initializeHashNavigation();
});

Utils.Debug.log('Navigation module loaded successfully');
