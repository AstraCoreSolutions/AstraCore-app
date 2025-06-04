// AstraCore Solutions - Core Application Logic

class AstraCoreApp {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.currentPage = 'dashboard';
        this.data = {
            projects: [],
            transactions: [],
            invoices: [],
            employees: [],
            equipment: [],
            materials: []
        };
        this.isInitialized = false;
    }

    /**
     * Initialize the application
     */
    async initialize() {
        console.log('🚀 AstraCore initializing...');
        
        try {
            // Check Supabase connection
            if (!window.supabaseClient) {
                throw new Error('Supabase client not available');
            }

            // Check authentication
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            
            if (session?.user) {
                console.log('✅ User authenticated');
                await this.handleAuthenticatedUser(session.user);
            } else {
                console.log('🔐 No user, showing login');
                this.showLogin();
            }

            // Setup auth listener
            window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
                console.log('Auth event:', event);
                if (event === 'SIGNED_IN' && session?.user) {
                    await this.handleAuthenticatedUser(session.user);
                } else if (event === 'SIGNED_OUT') {
                    this.handleSignOut();
                }
            });

            this.setupEventHandlers();
            this.isInitialized = true;
            console.log('✅ AstraCore initialized successfully');

        } catch (error) {
            console.error('❌ AstraCore initialization failed:', error);
            this.showError(error.message);
        }
    }

    /**
     * Handle authenticated user
     */
    async handleAuthenticatedUser(user) {
        this.currentUser = user;
        this.isAuthenticated = true;
        
        // Load data
        await this.loadAllData();
        
        // Show main app
        this.showMainApp();
        
        // Load dashboard
        this.loadDashboard();
    }

    /**
     * Handle sign out
     */
    handleSignOut() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.data = {
            projects: [],
            transactions: [],
            invoices: [],
            employees: [],
            equipment: [],
            materials: []
        };
        this.showLogin();
    }

    /**
     * Show login screen
     */
    showLogin() {
        this.hideLoading();
        document.getElementById('loginScreen').style.display = 'block';
        document.getElementById('mainApp').style.display = 'none';
    }

    /**
     * Show main application
     */
    showMainApp() {
        this.hideLoading();
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        // Update user info
        const userName = this.currentUser.user_metadata?.full_name || 
                        this.currentUser.email.split('@')[0];
        
        document.getElementById('userName').textContent = userName;
        document.getElementById('userAvatar').textContent = userName.charAt(0).toUpperCase();
    }

    /**
     * Load all data from Supabase
     */
    async loadAllData() {
        console.log('📊 Loading application data...');
        
        const tables = ['projects', 'transactions', 'invoices', 'employees', 'equipment', 'materials'];
        
        for (const table of tables) {
            try {
                const { data, error } = await window.supabaseClient
                    .from(table)
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(100);
                
                if (!error) {
                    this.data[table] = data || [];
                    console.log(`✅ Loaded ${data?.length || 0} ${table}`);
                } else {
                    console.log(`⚠️ Table ${table} not found:`, error.message);
                    this.data[table] = [];
                }
            } catch (error) {
                console.log(`⚠️ Error loading ${table}:`, error.message);
                this.data[table] = [];
            }
        }
    }

    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Login form
        const loginForm = document.getElementById('signInForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin();
            });
        }

        // Register form
        const registerForm = document.getElementById('signUpForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleRegister();
            });
        }
    }

    /**
     * Handle login
     */
    async handleLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.showAuthMessage('Vyplňte všechna pole', 'danger');
            return;
        }

        if (!Utils.Validation.isValidEmail(email)) {
            this.showAuthMessage('Neplatný formát e-mailu', 'danger');
            return;
        }

        this.showAuthMessage('Přihlašování...', 'info');

        try {
            const { error } = await window.supabaseClient.auth.signInWithPassword({
                email, password
            });

            if (error) throw error;

        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = 'Chyba při přihlášení';
            
            switch (error.message) {
                case 'Invalid login credentials':
                    errorMessage = 'Neplatné přihlašovací údaje';
                    break;
                case 'Email not confirmed':
                    errorMessage = 'E-mail nebyl potvrzen';
                    break;
                default:
                    errorMessage = error.message;
            }
            
            this.showAuthMessage(errorMessage, 'danger');
        }
    }

    /**
     * Handle registration
     */
    async handleRegister() {
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;

        if (!name || !email || !password) {
            this.showAuthMessage('Vyplňte všechna pole', 'danger');
            return;
        }

        if (!Utils.Validation.isValidEmail(email)) {
            this.showAuthMessage('Neplatný formát e-mailu', 'danger');
            return;
        }

        if (password.length < 6) {
            this.showAuthMessage('Heslo musí mít alespoň 6 znaků', 'danger');
            return;
        }

        this.showAuthMessage('Registrace...', 'info');

        try {
            const { data, error } = await window.supabaseClient.auth.signUp({
                email, password,
                options: {
                    data: { full_name: name }
                }
            });

            if (error) throw error;

            if (data.user && !data.session) {
                this.showAuthMessage('Registrace úspěšná! Zkontrolujte e-mail.', 'success');
                this.showLoginForm();
            } else {
                this.showAuthMessage('Registrace úspěšná!', 'success');
            }

        } catch (error) {
            console.error('Register error:', error);
            let errorMessage = 'Chyba při registraci';
            
            switch (error.message) {
                case 'User already registered':
                    errorMessage = 'Uživatel již existuje';
                    break;
                default:
                    errorMessage = error.message;
            }
            
            this.showAuthMessage(errorMessage, 'danger');
        }
    }

    /**
     * Navigation
     */
    navigateTo(page, linkElement) {
        console.log('Navigate to:', page);
        
        // Hide all pages
        document.querySelectorAll('.page-content').forEach(p => p.style.display = 'none');
        
        // Show target page
        const targetPage = document.getElementById(page + 'Page');
        if (targetPage) {
            targetPage.style.display = 'block';
            document.getElementById('pageTitle').textContent = this.getPageTitle(page);
            
            // Update sidebar
            document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
            if (linkElement) linkElement.classList.add('active');
            
            // Load page data
            this.loadPageData(page);
        }
        
        this.currentPage = page;
    }

    /**
     * Load page data
     */
    loadPageData(page) {
        switch(page) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'projects':
                this.loadProjectsTable();
                break;
            case 'finance':
                this.loadTransactionsTable();
                break;
            case 'invoices':
                this.loadInvoicesTable();
                break;
            case 'employees':
                this.loadEmployeesTable();
                break;
            case 'equipment':
                this.loadEquipmentTable();
                break;
            case 'materials':
                this.loadMaterialsTable();
                break;
        }
    }

    /**
     * Load dashboard
     */
    loadDashboard() {
        // Update statistics
        const activeProjects = this.data.projects.filter(p => p.status === 'active').length;
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyIncome = this.data.transactions
            .filter(t => {
                const date = new Date(t.transaction_date || t.created_at || Date.now());
                return t.type === 'income' && 
                       date.getMonth() === currentMonth && 
                       date.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + (parseFloat(t.total_amount) || 0), 0);
        
        const monthlyExpenses = this.data.transactions
            .filter(t => {
                const date = new Date(t.transaction_date || t.created_at || Date.now());
                return t.type === 'expense' && 
                       date.getMonth() === currentMonth && 
                       date.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + (parseFloat(t.total_amount) || 0), 0);
        
        const overdueInvoices = this.data.invoices.filter(i => {
            if (i.status !== 'pending') return false;
            const dueDate = new Date(i.due_date);
            return dueDate < new Date();
        }).length;
        
        // Update UI
        this.updateElement('statActiveProjects', activeProjects);
        this.updateElement('statMonthlyRevenue', Utils.Currency.format(monthlyIncome));
        this.updateElement('statMonthlyExpenses', Utils.Currency.format(monthlyExpenses));
        this.updateElement('statOverdueInvoices', overdueInvoices);
        
        // Update projects list
        this.updateRecentProjects();
    }

    /**
     * Update recent projects
     */
    updateRecentProjects() {
        const container = document.getElementById('recentProjectsList');
        if (!container) return;
        
        const recentProjects = this.data.projects
            .filter(p => p.status === 'active')
            .slice(0, 5);
        
        if (recentProjects.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-building fa-3x mb-3 opacity-50"></i>
                    <p>Zatím žádné projekty</p>
                    <button class="btn btn-primary" onclick="app.showAddModal('project')">
                        Vytvořit první projekt
                    </button>
                </div>
            `;
            return;
        }
        
        let html = '';
        recentProjects.forEach(project => {
            const progress = project.progress || 0;
            const isOverdue = project.end_date && Utils.Date.isPast(project.end_date);
            
            html += `
                <div class="border-bottom pb-3 mb-3">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h6 class="mb-1">
                                ${Utils.String.escapeHtml(project.name)}
                                ${isOverdue ? '<i class="fas fa-exclamation-triangle text-warning ms-1"></i>' : ''}
                            </h6>
                            <small class="text-muted">${Utils.String.escapeHtml(project.client || '')}</small>
                        </div>
                        <span class="badge bg-success">Aktivní</span>
                    </div>
                    <div class="mt-2">
                        <div class="d-flex justify-content-between mb-1">
                            <small>Progress: ${progress}%</small>
                            <small>${project.end_date ? Utils.Date.format(project.end_date) : 'Bez termínu'}</small>
                        </div>
                        <div class="progress" style="height: 5px;">
                            <div class="progress-bar bg-primary" style="width: ${Math.min(progress, 100)}%"></div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    /**
     * Load tables (simplified versions)
     */
    loadProjectsTable() {
        const container = document.getElementById('projectsTableBody');
        if (!container) return;
        
        if (this.data.projects.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="fas fa-building fa-3x mb-3 opacity-50"></i>
                        <div>Žádné projekty</div>
                        <button class="btn btn-primary btn-sm mt-2" onclick="app.showAddModal('project')">
                            <i class="fas fa-plus me-1"></i>Přidat projekt
                        </button>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        this.data.projects.forEach(project => {
            const progress = project.progress || 0;
            const isOverdue = project.end_date && Utils.Date.isPast(project.end_date);
            
            html += `
                <tr ${isOverdue ? 'class="table-warning"' : ''}>
                    <td>
                        <div class="fw-semibold">${Utils.String.escapeHtml(project.name)}</div>
                        <small class="text-muted">${Utils.String.escapeHtml(project.description || '')}</small>
                    </td>
                    <td>${Utils.String.escapeHtml(project.client || '')}</td>
                    <td><span class="badge bg-success">Aktivní</span></td>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="progress flex-grow-1 me-2" style="height: 6px;">
                                <div class="progress-bar bg-primary" style="width: ${Math.min(progress, 100)}%"></div>
                            </div>
                            <small>${progress}%</small>
                        </div>
                    </td>
                    <td>${project.end_date ? Utils.Date.format(project.end_date) : 'Neurčeno'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="app.editItem('project', '${project.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        container.innerHTML = html;
    }

    loadTransactionsTable() {
        const container = document.getElementById('transactionsTableBody');
        if (!container) return;
        
        if (this.data.transactions.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="fas fa-coins fa-3x mb-3 opacity-50"></i>
                        <div>Žádné transakce</div>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        this.data.transactions.forEach(transaction => {
            const typeIcon = transaction.type === 'income' ? 'fa-arrow-up text-success' : 'fa-arrow-down text-danger';
            const typeText = transaction.type === 'income' ? 'Příjem' : 'Výdaj';
            const amount = transaction.total_amount || 0;
            const amountClass = transaction.type === 'income' ? 'text-success' : 'text-danger';
            
            html += `
                <tr>
                    <td>
                        <i class="fas ${typeIcon} me-2"></i>
                        ${typeText}
                    </td>
                    <td>${Utils.String.escapeHtml(transaction.description || '')}</td>
                    <td class="${amountClass} fw-semibold">${Utils.Currency.format(amount)}</td>
                    <td>${Utils.String.escapeHtml(transaction.category || '')}</td>
                    <td>${Utils.Date.format(transaction.transaction_date || transaction.created_at)}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="app.editItem('transaction', '${transaction.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        container.innerHTML = html;
    }

    loadInvoicesTable() {
        const container = document.getElementById('invoicesTableBody');
        if (!container) return;
        
        if (this.data.invoices.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="fas fa-file-invoice fa-3x mb-3 opacity-50"></i>
                        <div>Žádné faktury</div>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        this.data.invoices.forEach(invoice => {
            const isOverdue = invoice.status === 'pending' && Utils.Date.isPast(invoice.due_date);
            const amount = invoice.total_amount || 0;
            
            html += `
                <tr ${isOverdue ? 'class="table-warning"' : ''}>
                    <td>
                        <div class="fw-semibold">${Utils.String.escapeHtml(invoice.invoice_number || '')}</div>
                        <small class="text-muted">${Utils.Date.format(invoice.issue_date)}</small>
                    </td>
                    <td>${Utils.String.escapeHtml(invoice.client_name || '')}</td>
                    <td class="fw-semibold">${Utils.Currency.format(amount)}</td>
                    <td>
                        <span class="badge ${invoice.status === 'paid' ? 'bg-success' : 'bg-warning'}">
                            ${invoice.status === 'paid' ? 'Zaplaceno' : 'Čekající'}
                        </span>
                    </td>
                    <td>${Utils.Date.format(invoice.due_date)}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="app.editItem('invoice', '${invoice.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        container.innerHTML = html;
    }

    loadEmployeesTable() {
        const container = document.getElementById('employeesTableBody');
        if (!container) return;
        
        if (this.data.employees.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="fas fa-users fa-3x mb-3 opacity-50"></i>
                        <div>Žádní zaměstnanci</div>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        this.data.employees.forEach(employee => {
            const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
            
            html += `
                <tr>
                    <td>
                        <div class="fw-semibold">${Utils.String.escapeHtml(fullName)}</div>
                        <small class="text-muted">${Utils.String.escapeHtml(employee.position || '')}</small>
                    </td>
                    <td>
                        <div>${Utils.String.escapeHtml(employee.phone || '')}</div>
                        <small class="text-muted">${Utils.String.escapeHtml(employee.email || '')}</small>
                    </td>
                    <td><span class="badge bg-success">Aktivní</span></td>
                    <td>${Utils.Date.format(employee.start_date)}</td>
                    <td>${employee.hourly_rate ? Utils.Currency.format(employee.hourly_rate) + '/hod' : 'Neuvedeno'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="app.editItem('employee', '${employee.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        container.innerHTML = html;
    }

    loadEquipmentTable() {
        const container = document.getElementById('equipmentTableBody');
        if (!container) return;
        
        if (this.data.equipment.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="fas fa-tools fa-3x mb-3 opacity-50"></i>
                        <div>Žádné nářadí</div>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        this.data.equipment.forEach(item => {
            html += `
                <tr>
                    <td>
                        <div class="fw-semibold">${Utils.String.escapeHtml(item.name || '')}</div>
                        <small class="text-muted">${Utils.String.escapeHtml(item.inventory_number || '')}</small>
                    </td>
                    <td>
                        <div>${Utils.String.escapeHtml(item.manufacturer || '')}</div>
                        <small class="text-muted">${Utils.String.escapeHtml(item.model || '')}</small>
                    </td>
                    <td>${Utils.String.escapeHtml(item.category || '')}</td>
                    <td><span class="badge bg-success">K dispozici</span></td>
                    <td>${Utils.String.escapeHtml(item.location || 'Neuvedeno')}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="app.editItem('equipment', '${item.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        container.innerHTML = html;
    }

    loadMaterialsTable() {
        const container = document.getElementById('materialsTableBody');
        if (!container) return;
        
        if (this.data.materials.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="fas fa-boxes fa-3x mb-3 opacity-50"></i>
                        <div>Žádné materiály</div>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        this.data.materials.forEach(material => {
            html += `
                <tr>
                    <td>
                        <div class="fw-semibold">${Utils.String.escapeHtml(material.name || '')}</div>
                        <small class="text-muted">${Utils.String.escapeHtml(material.code || '')}</small>
                    </td>
                    <td>${Utils.String.escapeHtml(material.category || '')}</td>
                    <td>${Utils.String.escapeHtml(material.unit || '')}</td>
                    <td>${Utils.String.escapeHtml(material.preferred_supplier || 'Neuvedeno')}</td>
                    <td><span class="badge bg-info">Na skladě</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="app.editItem('material', '${material.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        container.innerHTML = html;
    }

    /**
     * Utility methods
     */
    getPageTitle(page) {
        const titles = {
            dashboard: 'Dashboard',
            projects: 'Projekty',
            finance: 'Finance',
            invoices: 'Faktury',
            employees: 'Zaměstnanci',
            equipment: 'Nářadí',
            materials: 'Materiál',
            reports: 'Reporty',
            settings: 'Nastavení'
        };
        return titles[page] || page;
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    showAuthMessage(message, type) {
        const msgEl = document.getElementById('authMessage');
        if (msgEl) {
            msgEl.style.display = 'block';
            msgEl.className = `alert alert-${type}`;
            msgEl.textContent = message;
            
            if (type === 'success' || type === 'info') {
                setTimeout(() => msgEl.style.display = 'none', 5000);
            }
        }
    }

    showError(message) {
        this.hideLoading();
        document.body.innerHTML = `
            <div class="container mt-5">
                <div class="alert alert-danger">
                    <h4>Chyba aplikace</h4>
                    <p>${Utils.String.escapeHtml(message)}</p>
                    <button class="btn btn-primary" onclick="location.reload()">Obnovit stránku</button>
                </div>
            </div>
        `;
    }

    hideLoading() {
        const loadingEl = document.getElementById('loadingScreen');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        if (sidebar && mainContent) {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('sidebar-collapsed');
        }
    }

    showLoginForm() {
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('authMessage').style.display = 'none';
    }

    showRegisterForm() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
        document.getElementById('authMessage').style.display = 'none';
    }

    signOut() {
        if (window.supabaseClient) {
            window.supabaseClient.auth.signOut();
        }
    }

    // Placeholder methods for future functionality
    showAddModal(type) {
        alert(`Funkce přidání ${type} bude brzy dostupná`);
    }

    editItem(type, id) {
        alert(`Funkce úpravy ${type} bude brzy dostupná`);
    }

    showNotifications() {
        alert('Notifikace budou brzy dostupné');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM ready - initializing AstraCore...');
    
    // Create global app instance
    window.app = new AstraCoreApp();
    
    // Initialize app
    window.app.initialize().catch(error => {
        console.error('❌ Failed to initialize app:', error);
    });
});

// Global functions for HTML onclick handlers
window.navigateTo = (page, linkElement) => window.app?.navigateTo(page, linkElement);
window.toggleSidebar = () => window.app?.toggleSidebar();
window.showRegisterForm = () => window.app?.showRegisterForm();
window.showLoginForm = () => window.app?.showLoginForm();
window.signOut = () => window.app?.signOut();
window.showNotifications = () => window.app?.showNotifications();

console.log('✅ AstraCore core loaded');
