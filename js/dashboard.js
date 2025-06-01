// AstraCore Solutions - Dashboard Module

class DashboardManager {
    constructor() {
        this.charts = {};
        this.refreshInterval = null;
        this.autoRefreshEnabled = true;
        this.refreshIntervalMs = 30000; // 30 seconds
    }

    /**
     * Initialize dashboard
     */
    async initialize() {
        Utils.Debug.log('Initializing dashboard...');
        
        try {
            await this.loadDashboard();
            this.setupAutoRefresh();
            this.setupEventListeners();
            
            Utils.Debug.log('Dashboard initialized successfully');
        } catch (error) {
            Utils.Debug.error('Dashboard initialization error:', error);
        }
    }

    /**
     * Load dashboard data and update UI
     */
    async loadDashboard() {
        Utils.Debug.log('Loading dashboard data...');
        
        try {
            // Show loading state
            this.showLoadingState();
            
            // Calculate statistics
            await this.updateStatistics();
            
            // Update recent projects list
            this.updateRecentProjectsList();
            
            // Update critical tasks
            this.updateCriticalTasks();
            
            // Initialize charts if Chart.js is available
            if (typeof Chart !== 'undefined') {
                this.initializeCharts();
            }
            
            // Update notification badge
            this.updateNotificationBadge();
            
            // Hide loading state
            this.hideLoadingState();
            
        } catch (error) {
            Utils.Debug.error('Error loading dashboard:', error);
            this.hideLoadingState();
            this.showErrorState();
        }
    }

    /**
     * Update dashboard statistics
     */
    async updateStatistics() {
        const data = window.appState.data;
        
        // Calculate active projects
        const activeProjects = data.projects.filter(p => p.status === 'active').length;
        
        // Calculate monthly income and expenses
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyIncome = data.transactions
            .filter(t => {
                const date = new Date(t.transaction_date || t.created_at);
                return t.type === 'income' && 
                       date.getMonth() === currentMonth && 
                       date.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + parseFloat(t.total_amount || 0), 0);
        
        const monthlyExpenses = data.transactions
            .filter(t => {
                const date = new Date(t.transaction_date || t.created_at);
                return t.type === 'expense' && 
                       date.getMonth() === currentMonth && 
                       date.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + parseFloat(t.total_amount || 0), 0);
        
        // Calculate overdue invoices
        const overdueInvoices = data.invoices.filter(i => {
            if (i.status !== 'pending') return false;
            const dueDate = new Date(i.due_date);
            return dueDate < new Date();
        }).length;
        
        // Update DOM elements
        this.updateStatElement('statActiveProjects', activeProjects);
        this.updateStatElement('statMonthlyRevenue', Utils.Currency.format(monthlyIncome));
        this.updateStatElement('statMonthlyExpenses', Utils.Currency.format(monthlyExpenses));
        this.updateStatElement('statOverdueInvoices', overdueInvoices);
        
        Utils.Debug.log('Statistics updated:', {
            activeProjects,
            monthlyIncome,
            monthlyExpenses,
            overdueInvoices
        });
    }

    /**
     * Update statistic element
     * @param {string} elementId - Element ID
     * @param {string|number} value - Value to display
     */
    updateStatElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            // Add animation
            element.style.opacity = '0.5';
            setTimeout(() => {
                element.textContent = value;
                element.style.opacity = '1';
            }, 150);
        }
    }

    /**
     * Update recent projects list
     */
    updateRecentProjectsList() {
        const container = document.getElementById('recentProjectsList');
        if (!container) return;
        
        const data = window.appState.data;
        const recentProjects = data.projects
            .filter(p => p.status === 'active')
            .slice(0, 5);
        
        if (recentProjects.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-building fa-3x mb-3 opacity-50"></i>
                    <p>Zatím žádné projekty</p>
                    <button class="btn btn-primary" onclick="showAddProjectModal()">
                        Vytvořit první projekt
                    </button>
                </div>
            `;
            return;
        }
        
        let html = '';
        recentProjects.forEach(project => {
            const progress = project.progress || 0;
            const statusText = this.getStatusText(project.status);
            const statusClass = this.getStatusClass(project.status);
            const isOverdue = project.end_date && Utils.Date.isPast(project.end_date);
            
            html += `
                <div class="border-bottom pb-3 mb-3">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h6 class="mb-1">
                                ${this.escapeHtml(project.name)}
                                ${isOverdue ? '<i class="fas fa-exclamation-triangle text-warning ms-1" title="Po termínu"></i>' : ''}
                            </h6>
                            <small class="text-muted">${this.escapeHtml(project.client)}</small>
                        </div>
                        <span class="badge ${statusClass}">${statusText}</span>
                    </div>
                    <div class="mt-2">
                        <div class="d-flex justify-content-between mb-1">
                            <small>Progress: ${progress}%</small>
                            <small>${project.end_date ? Utils.Date.format(project.end_date) : 'Bez termínu'}</small>
                        </div>
                        <div class="progress" style="height: 5px;">
                            <div class="progress-bar ${progress >= 100 ? 'bg-success' : 'bg-primary'}" 
                                 style="width: ${Math.min(progress, 100)}%"></div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    /**
     * Update critical tasks
     */
    updateCriticalTasks() {
        const container = document.getElementById('criticalTasksList');
        if (!container) return;
        
        const data = window.appState.data;
        const criticalTasks = [];
        
        // Overdue invoices
        data.invoices.forEach(invoice => {
            if (invoice.status === 'pending' && Utils.Date.isPast(invoice.due_date)) {
                criticalTasks.push({
                    type: 'invoice',
                    title: `Faktura ${invoice.invoice_number}`,
                    description: `Po splatnosti od ${Utils.Date.format(invoice.due_date)}`,
                    priority: 'high',
                    action: () => window.NavigationManager.navigateTo('invoices')
                });
            }
        });
        
        // Overdue projects
        data.projects.forEach(project => {
            if (project.status === 'active' && project.end_date && Utils.Date.isPast(project.end_date)) {
                criticalTasks.push({
                    type: 'project',
                    title: project.name,
                    description: `Projekt po termínu od ${Utils.Date.format(project.end_date)}`,
                    priority: 'medium',
                    action: () => window.NavigationManager.navigateTo('projects')
                });
            }
        });
        
        // Equipment in service too long
        data.equipment.forEach(equipment => {
            if (equipment.status === 'service' && equipment.service_date) {
                const daysDiff = Utils.Date.daysDifference(equipment.service_date, new Date());
                if (daysDiff > 7) {
                    criticalTasks.push({
                        type: 'equipment',
                        title: equipment.name,
                        description: `V servisu už ${daysDiff} dní`,
                        priority: 'low',
                        action: () => window.NavigationManager.navigateTo('equipment')
                    });
                }
            }
        });
        
        if (criticalTasks.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-check-circle fa-3x mb-3 opacity-50 text-success"></i>
                    <p>Žádné kritické úkoly</p>
                    <small>Vše je pod kontrolou!</small>
                </div>
            `;
            return;
        }
        
        // Sort by priority
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        criticalTasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
        
        let html = '';
        criticalTasks.slice(0, 5).forEach(task => {
            const iconClass = {
                invoice: 'fas fa-file-invoice text-warning',
                project: 'fas fa-building text-danger',
                equipment: 'fas fa-tools text-info'
            }[task.type];
            
            html += `
                <div class="border-bottom pb-2 mb-2 cursor-pointer" onclick="(${task.action})()">
                    <div class="d-flex align-items-start">
                        <i class="${iconClass} me-2 mt-1"></i>
                        <div class="flex-grow-1">
                            <div class="fw-semibold">${this.escapeHtml(task.title)}</div>
                            <small class="text-muted">${this.escapeHtml(task.description)}</small>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    /**
     * Initialize charts
     */
    initializeCharts() {
        // Only initialize if Chart.js is available and we're on dashboard
        if (typeof Chart === 'undefined' || window.NavigationManager.getCurrentPage() !== 'dashboard') {
            return;
        }

        // Destroy existing charts
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};

        // Cash Flow Chart
        this.initializeCashFlowChart();
        
        // Project Status Chart
        this.initializeProjectStatusChart();
        
        // Expense Categories Chart
        this.initializeExpenseCategoriesChart();
    }

    /**
     * Initialize cash flow chart
     */
    initializeCashFlowChart() {
        const canvas = document.getElementById('cashFlowChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const last4MonthsData = this.getLast4MonthsData();

        this.charts.cashFlow = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: last4MonthsData.map(m => m.label),
                datasets: [
                    {
                        label: 'Příjmy',
                        data: last4MonthsData.map(m => m.income),
                        backgroundColor: 'rgba(72, 187, 120, 0.8)',
                        borderColor: 'rgba(72, 187, 120, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Výdaje',
                        data: last4MonthsData.map(m => m.expenses),
                        backgroundColor: 'rgba(245, 101, 101, 0.8)',
                        borderColor: 'rgba(245, 101, 101, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return Utils.Currency.format(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + Utils.Currency.format(context.parsed.y);
                            }
                        }
                    },
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }

    /**
     * Initialize project status chart
     */
    initializeProjectStatusChart() {
        const canvas = document.getElementById('projectStatusChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const statusCounts = this.getProjectStatusCounts();

        // Only create chart if there's data
        if (Object.keys(statusCounts).length === 0) {
            canvas.parentElement.innerHTML = '<div class="text-center text-muted p-4">Žádné projekty</div>';
            return;
        }

        this.charts.projectStatus = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusCounts).map(status => this.getStatusText(status)),
                datasets: [{
                    data: Object.values(statusCounts),
                    backgroundColor: [
                        'rgba(66, 153, 225, 0.8)',  // planning
                        'rgba(72, 187, 120, 0.8)',  // active
                        'rgba(113, 128, 150, 0.8)', // completed
                        'rgba(245, 101, 101, 0.8)'  // cancelled
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    /**
     * Initialize expense categories chart
     */
    initializeExpenseCategoriesChart() {
        const canvas = document.getElementById('expenseCategoriesChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const categoryData = this.getExpenseCategoryData();

        // Only create chart if there's data
        if (categoryData.labels.length === 0) {
            canvas.parentElement.innerHTML = '<div class="text-center text-muted p-4">Žádné výdaje</div>';
            return;
        }

        this.charts.expenseCategories = new Chart(ctx, {
            type: 'horizontalBar',
            data: {
                labels: categoryData.labels,
                datasets: [{
                    label: 'Výdaje',
                    data: categoryData.data,
                    backgroundColor: 'rgba(230, 126, 73, 0.8)',
                    borderColor: 'rgba(230, 126, 73, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return Utils.Currency.format(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return Utils.Currency.format(context.parsed.x);
                            }
                        }
                    },
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    /**
     * Get last 4 months data for chart
     */
    getLast4MonthsData() {
        const months = [];
        const now = new Date();
        const data = window.appState.data;
        
        for (let i = 3; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const month = date.getMonth();
            const year = date.getFullYear();
            
            const income = data.transactions
                .filter(t => {
                    const tDate = new Date(t.transaction_date || t.created_at);
                    return t.type === 'income' && 
                           tDate.getMonth() === month && 
                           tDate.getFullYear() === year;
                })
                .reduce((sum, t) => sum + parseFloat(t.total_amount || 0), 0);
            
            const expenses = data.transactions
                .filter(t => {
                    const tDate = new Date(t.transaction_date || t.created_at);
                    return t.type === 'expense' && 
                           tDate.getMonth() === month && 
                           tDate.getFullYear() === year;
                })
                .reduce((sum, t) => sum + parseFloat(t.total_amount || 0), 0);
            
            months.push({
                label: date.toLocaleDateString('cs-CZ', { month: 'short', year: 'numeric' }),
                income: income,
                expenses: expenses
            });
        }
        
        return months;
    }

    /**
     * Get project status counts
     */
    getProjectStatusCounts() {
        const data = window.appState.data;
        const counts = {};
        
        data.projects.forEach(project => {
            counts[project.status] = (counts[project.status] || 0) + 1;
        });
        
        return counts;
    }

    /**
     * Get expense category data
     */
    getExpenseCategoryData() {
        const data = window.appState.data;
        const categories = {};
        
        data.transactions
            .filter(t => t.type === 'expense')
            .forEach(transaction => {
                const category = transaction.category || 'other';
                categories[category] = (categories[category] || 0) + parseFloat(transaction.total_amount || 0);
            });
        
        // Sort by value and take top 5
        const sorted = Object.entries(categories)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
        
        return {
            labels: sorted.map(([category]) => this.getCategoryText(category)),
            data: sorted.map(([, amount]) => amount)
        };
    }

    /**
     * Update notification badge
     */
    updateNotificationBadge() {
        const data = window.appState.data;
        let criticalCount = 0;
        
        // Count overdue invoices
        criticalCount += data.invoices.filter(i => {
            if (i.status !== 'pending') return false;
            const dueDate = new Date(i.due_date);
            return dueDate < new Date();
        }).length;
        
        // Count overdue projects
        criticalCount += data.projects.filter(p => {
            if (p.status !== 'active' || !p.end_date) return false;
            return Utils.Date.isPast(p.end_date);
        }).length;
        
        const badge = document.getElementById('notificationCount');
        if (badge) {
            if (criticalCount > 0) {
                badge.textContent = criticalCount;
                badge.style.display = 'inline-flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    /**
     * Setup auto refresh
     */
    setupAutoRefresh() {
        if (this.autoRefreshEnabled) {
            this.refreshInterval = setInterval(() => {
                if (window.NavigationManager.getCurrentPage() === 'dashboard') {
                    this.loadDashboard();
                }
            }, this.refreshIntervalMs);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Refresh button if exists
        const refreshBtn = document.getElementById('dashboardRefresh');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadDashboard();
            });
        }
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        const stats = ['statActiveProjects', 'statMonthlyRevenue', 'statMonthlyExpenses', 'statOverdueInvoices'];
        stats.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = '...';
            }
        });
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        // Loading state is automatically hidden when stats are updated
    }

    /**
     * Show error state
     */
    showErrorState() {
        const container = document.getElementById('recentProjectsList');
        if (container) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-exclamation-triangle fa-3x mb-3 text-warning"></i>
                    <p>Chyba při načítání dat</p>
                    <button class="btn btn-primary btn-sm" onclick="window.DashboardManager.loadDashboard()">
                        Zkusit znovu
                    </button>
                </div>
            `;
        }
    }

    /**
     * Helper functions
     */
    getStatusText(status) {
        return window.AstraCore.LOCALE.STATUS_TEXT[status] || status;
    }

    getStatusClass(status) {
        return `bg-${status}`;
    }

    getCategoryText(category) {
        return window.AstraCore.LOCALE.CATEGORY_TEXT[category] || category;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Cleanup dashboard
     */
    cleanup() {
        // Clear refresh interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }

        // Destroy charts
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }
}

// Create global dashboard manager instance
window.DashboardManager = new DashboardManager();

Utils.Debug.log('Dashboard module loaded successfully');
