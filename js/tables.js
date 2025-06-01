// AstraCore Solutions - Table Management Module

class TableManager {
    constructor() {
        this.currentTable = null;
        this.currentData = [];
        this.filteredData = [];
        this.sortConfig = { key: null, direction: 'asc' };
        this.pagination = {
            currentPage: 1,
            pageSize: 20,
            totalPages: 1,
            totalItems: 0
        };
        this.filters = {};
        this.searchTerm = '';
        this.setupEventListeners();
    }

    /**
     * Initialize table manager
     */
    initialize() {
        Utils.Debug.log('Initializing table manager...');
        this.setupGlobalTableEvents();
        Utils.Debug.log('Table manager initialized successfully');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search functionality
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('table-search')) {
                this.handleSearch(e.target.value);
            }
        });

        // Filter functionality
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('table-filter')) {
                this.handleFilter(e.target.name, e.target.value);
            }
        });

        // Pagination
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('page-link')) {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (page && page !== this.pagination.currentPage) {
                    this.goToPage(page);
                }
            }
        });
    }

    /**
     * Setup global table events
     */
    setupGlobalTableEvents() {
        // Sort headers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('sortable')) {
                const key = e.target.dataset.sort;
                this.handleSort(key);
            }
        });

        // Row actions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-edit')) {
                const id = e.target.dataset.id;
                this.editRecord(id);
            }
            
            if (e.target.classList.contains('btn-delete')) {
                const id = e.target.dataset.id;
                const name = e.target.dataset.name;
                this.deleteRecord(id, name);
            }
        });
    }

    /**
     * Load projects table
     */
    loadProjectsTable() {
        Utils.Debug.log('Loading projects table...');
        
        this.currentTable = 'projects';
        this.currentData = window.appState.data.projects;
        this.applyFiltersAndSort();
        
        const tableHtml = this.generateProjectsTable();
        this.updateTableContainer('projectsTableBody', tableHtml);
        this.updatePagination();
    }

    /**
     * Generate projects table HTML
     */
    generateProjectsTable() {
        if (this.filteredData.length === 0) {
            return `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="fas fa-building fa-2x mb-3 opacity-50"></i>
                        <div>Žádné projekty nenalezeny</div>
                        <button class="btn btn-primary btn-sm mt-2" onclick="showAddProjectModal()">
                            <i class="fas fa-plus me-1"></i>Přidat projekt
                        </button>
                    </td>
                </tr>
            `;
        }

        const paginatedData = this.getCurrentPageData();
        let html = '';

        paginatedData.forEach(project => {
            const progress = project.progress || 0;
            const statusText = this.getStatusText(project.status);
            const statusClass = this.getStatusClass(project.status);
            const isOverdue = project.end_date && Utils.Date.isPast(project.end_date);
            
            html += `
                <tr class="${isOverdue ? 'table-warning' : ''}">
                    <td>
                        <div class="fw-semibold">${this.escapeHtml(project.name)}</div>
                        <small class="text-muted">${this.escapeHtml(project.description || '')}</small>
                    </td>
                    <td>${this.escapeHtml(project.client)}</td>
                    <td>
                        <span class="badge ${statusClass}">${statusText}</span>
                        ${isOverdue ? '<i class="fas fa-exclamation-triangle text-warning ms-1" title="Po termínu"></i>' : ''}
                    </td>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="progress flex-grow-1 me-2" style="height: 6px;">
                                <div class="progress-bar ${progress >= 100 ? 'bg-success' : 'bg-primary'}" 
                                     style="width: ${Math.min(progress, 100)}%"></div>
                            </div>
                            <small>${progress}%</small>
                        </div>
                    </td>
                    <td>
                        ${project.end_date ? Utils.Date.format(project.end_date) : 
                          '<span class="text-muted">Neurčeno</span>'}
                    </td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-sm btn-outline-primary btn-edit" 
                                    data-id="${project.id}" 
                                    data-bs-toggle="tooltip" 
                                    title="Upravit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-info" 
                                    onclick="viewProjectDetails('${project.id}')"
                                    data-bs-toggle="tooltip" 
                                    title="Detail">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger btn-delete" 
                                    data-id="${project.id}" 
                                    data-name="${this.escapeHtml(project.name)}"
                                    data-bs-toggle="tooltip" 
                                    title="Smazat">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        return html;
    }

    /**
     * Load transactions table
     */
    loadTransactionsTable() {
        Utils.Debug.log('Loading transactions table...');
        
        this.currentTable = 'transactions';
        this.currentData = window.appState.data.transactions;
        this.applyFiltersAndSort();
        
        const tableHtml = this.generateTransactionsTable();
        this.updateTableContainer('transactionsTableBody', tableHtml);
        this.updatePagination();
    }

    /**
     * Generate transactions table HTML
     */
    generateTransactionsTable() {
        if (this.filteredData.length === 0) {
            return `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="fas fa-coins fa-2x mb-3 opacity-50"></i>
                        <div>Žádné transakce nenalezeny</div>
                        <button class="btn btn-success btn-sm mt-2 me-2" onclick="showAddTransactionModal('income')">
                            <i class="fas fa-plus me-1"></i>Přidat příjem
                        </button>
                        <button class="btn btn-danger btn-sm mt-2" onclick="showAddTransactionModal('expense')">
                            <i class="fas fa-plus me-1"></i>Přidat výdaj
                        </button>
                    </td>
                </tr>
            `;
        }

        const paginatedData = this.getCurrentPageData();
        let html = '';

        paginatedData.forEach(transaction => {
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
                    <td>
                        <div class="fw-semibold">${this.escapeHtml(transaction.description)}</div>
                        ${transaction.document_number ? 
                          `<small class="text-muted">Dok. č.: ${this.escapeHtml(transaction.document_number)}</small>` : ''}
                    </td>
                    <td class="table-currency ${amountClass} fw-semibold">
                        ${Utils.Currency.format(amount)}
                    </td>
                    <td>
                        ${transaction.category ? this.getCategoryText(transaction.category) : 
                          '<span class="text-muted">Nezařazeno</span>'}
                    </td>
                    <td>${Utils.Date.format(transaction.transaction_date || transaction.created_at)}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-sm btn-outline-primary btn-edit" 
                                    data-id="${transaction.id}"
                                    data-bs-toggle="tooltip" 
                                    title="Upravit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger btn-delete" 
                                    data-id="${transaction.id}" 
                                    data-name="${this.escapeHtml(transaction.description)}"
                                    data-bs-toggle="tooltip" 
                                    title="Smazat">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        return html;
    }

    /**
     * Load invoices table
     */
    loadInvoicesTable() {
        Utils.Debug.log('Loading invoices table...');
        
        this.currentTable = 'invoices';
        this.currentData = window.appState.data.invoices;
        this.applyFiltersAndSort();
        
        const tableHtml = this.generateInvoicesTable();
        this.updateTableContainer('invoicesTableBody', tableHtml);
        this.updatePagination();
    }

    /**
     * Generate invoices table HTML
     */
    generateInvoicesTable() {
        if (this.filteredData.length === 0) {
            return `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="fas fa-file-invoice fa-2x mb-3 opacity-50"></i>
                        <div>Žádné faktury nenalezeny</div>
                        <button class="btn btn-primary btn-sm mt-2" onclick="showAddInvoiceModal()">
                            <i class="fas fa-plus me-1"></i>Vystavit fakturu
                        </button>
                    </td>
                </tr>
            `;
        }

        const paginatedData = this.getCurrentPageData();
        let html = '';

        paginatedData.forEach(invoice => {
            const statusText = this.getStatusText(invoice.status);
            const statusClass = this.getStatusClass(invoice.status);
            const isOverdue = invoice.status === 'pending' && Utils.Date.isPast(invoice.due_date);
            const amount = invoice.total_amount || 0;
            
            html += `
                <tr class="${isOverdue ? 'table-warning' : ''}">
                    <td>
                        <div class="fw-semibold">${this.escapeHtml(invoice.invoice_number)}</div>
                        <small class="text-muted">${Utils.Date.format(invoice.issue_date)}</small>
                    </td>
                    <td>${this.escapeHtml(invoice.client_name)}</td>
                    <td class="table-currency fw-semibold">
                        ${Utils.Currency.format(amount)}
                    </td>
                    <td>
                        <span class="badge ${statusClass}">${statusText}</span>
                        ${isOverdue ? '<i class="fas fa-exclamation-triangle text-warning ms-1" title="Po splatnosti"></i>' : ''}
                    </td>
                    <td>
                        ${Utils.Date.format(invoice.due_date)}
                        ${isOverdue ? 
                          `<br><small class="text-danger">Překročeno o ${Utils.Date.daysDifference(invoice.due_date, new Date())} dní</small>` : ''}
                    </td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-sm btn-outline-primary btn-edit" 
                                    data-id="${invoice.id}"
                                    data-bs-toggle="tooltip" 
                                    title="Upravit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-info" 
                                    onclick="downloadInvoicePDF('${invoice.id}')"
                                    data-bs-toggle="tooltip" 
                                    title="Stáhnout PDF">
                                <i class="fas fa-download"></i>
                            </button>
                            ${invoice.status === 'pending' ? `
                                <button class="btn btn-sm btn-outline-success" 
                                        onclick="markInvoiceAsPaid('${invoice.id}')"
                                        data-bs-toggle="tooltip" 
                                        title="Označit jako zaplaceno">
                                    <i class="fas fa-check"></i>
                                </button>
                            ` : ''}
                            <button class="btn btn-sm btn-outline-danger btn-delete" 
                                    data-id="${invoice.id}" 
                                    data-name="${this.escapeHtml(invoice.invoice_number)}"
                                    data-bs-toggle="tooltip" 
                                    title="Smazat">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        return html;
    }

    /**
     * Load employees table
     */
    loadEmployeesTable() {
        Utils.Debug.log('Loading employees table...');
        
        this.currentTable = 'employees';
        this.currentData = window.appState.data.employees;
        this.applyFiltersAndSort();
        
        const tableHtml = this.generateEmployeesTable();
        this.updateTableContainer('employeesTableBody', tableHtml);
        this.updatePagination();
    }

    /**
     * Generate employees table HTML
     */
    generateEmployeesTable() {
        if (this.filteredData.length === 0) {
            return `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="fas fa-users fa-2x mb-3 opacity-50"></i>
                        <div>Žádní zaměstnanci nenalezeni</div>
                        <button class="btn btn-primary btn-sm mt-2" onclick="showAddEmployeeModal()">
                            <i class="fas fa-plus me-1"></i>Přidat zaměstnance
                        </button>
                    </td>
                </tr>
            `;
        }

        const paginatedData = this.getCurrentPageData();
        let html = '';

        paginatedData.forEach(employee => {
            const statusText = this.getStatusText(employee.status);
            const statusClass = this.getStatusClass(employee.status);
            const fullName = `${employee.first_name} ${employee.last_name}`;
            
            html += `
                <tr>
                    <td>
                        <div class="fw-semibold">${this.escapeHtml(fullName)}</div>
                        <small class="text-muted">${this.escapeHtml(employee.position || '')}</small>
                    </td>
                    <td>
                        <div>${this.escapeHtml(employee.phone || '')}</div>
                        <small class="text-muted">${this.escapeHtml(employee.email || '')}</small>
                    </td>
                    <td>
                        <span class="badge ${statusClass}">${statusText}</span>
                    </td>
                    <td>${Utils.Date.format(employee.start_date)}</td>
                    <td class="table-currency">
                        ${employee.hourly_rate ? 
                          `${Utils.Currency.format(employee.hourly_rate)}/hod` : 
                          employee.monthly_salary ? 
                          `${Utils.Currency.format(employee.monthly_salary)}/měs` : 
                          '<span class="text-muted">Neuvedeno</span>'}
                    </td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-sm btn-outline-primary btn-edit" 
                                    data-id="${employee.id}"
                                    data-bs-toggle="tooltip" 
                                    title="Upravit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-info" 
                                    onclick="viewEmployeeAttendance('${employee.id}')"
                                    data-bs-toggle="tooltip" 
                                    title="Docházka">
                                <i class="fas fa-calendar-alt"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger btn-delete" 
                                    data-id="${employee.id}" 
                                    data-name="${this.escapeHtml(fullName)}"
                                    data-bs-toggle="tooltip" 
                                    title="Smazat">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        return html;
    }

    /**
     * Load equipment table
     */
    loadEquipmentTable() {
        Utils.Debug.log('Loading equipment table...');
        
        this.currentTable = 'equipment';
        this.currentData = window.appState.data.equipment;
        this.applyFiltersAndSort();
        
        const tableHtml = this.generateEquipmentTable();
        this.updateTableContainer('equipmentTableBody', tableHtml);
        this.updatePagination();
    }

    /**
     * Generate equipment table HTML
     */
    generateEquipmentTable() {
        if (this.filteredData.length === 0) {
            return `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="fas fa-tools fa-2x mb-3 opacity-50"></i>
                        <div>Žádné nářadí nenalezeno</div>
                        <button class="btn btn-primary btn-sm mt-2" onclick="showAddEquipmentModal()">
                            <i class="fas fa-plus me-1"></i>Přidat nářadí
                        </button>
                    </td>
                </tr>
            `;
        }

        const paginatedData = this.getCurrentPageData();
        let html = '';

        paginatedData.forEach(equipment => {
            const statusText = this.getStatusText(equipment.status);
            const statusClass = this.getStatusClass(equipment.status);
            const categoryText = this.getCategoryText(equipment.category);
            
            html += `
                <tr>
                    <td>
                        <div class="fw-semibold">${this.escapeHtml(equipment.name)}</div>
                        <small class="text-muted">${this.escapeHtml(equipment.inventory_number || '')}</small>
                    </td>
                    <td>
                        <div>${this.escapeHtml(equipment.manufacturer || '')}</div>
                        <small class="text-muted">${this.escapeHtml(equipment.model || '')}</small>
                    </td>
                    <td>${categoryText}</td>
                    <td>
                        <span class="badge ${statusClass}">${statusText}</span>
                    </td>
                    <td>${this.escapeHtml(equipment.location || 'Neuvedeno')}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-sm btn-outline-primary btn-edit" 
                                    data-id="${equipment.id}"
                                    data-bs-toggle="tooltip" 
                                    title="Upravit">
                                <i class="fas fa-edit"></i>
                            </button>
                            ${equipment.status === 'available' ? `
                                <button class="btn btn-sm btn-outline-warning" 
                                        onclick="borrowEquipment('${equipment.id}')"
                                        data-bs-toggle="tooltip" 
                                        title="Vypůjčit">
                                    <i class="fas fa-hand-paper"></i>
                                </button>
                            ` : ''}
                            <button class="btn btn-sm btn-outline-danger btn-delete" 
                                    data-id="${equipment.id}" 
                                    data-name="${this.escapeHtml(equipment.name)}"
                                    data-bs-toggle="tooltip" 
                                    title="Smazat">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        return html;
    }

    /**
     * Load materials table
     */
    loadMaterialsTable() {
        Utils.Debug.log('Loading materials table...');
        
        this.currentTable = 'materials';
        this.currentData = window.appState.data.materials;
        this.applyFiltersAndSort();
        
        const tableHtml = this.generateMaterialsTable();
        this.updateTableContainer('materialsTableBody', tableHtml);
        this.updatePagination();
    }

    /**
     * Generate materials table HTML
     */
    generateMaterialsTable() {
        if (this.filteredData.length === 0) {
            return `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="fas fa-boxes fa-2x mb-3 opacity-50"></i>
                        <div>Žádné materiály nenalezeny</div>
                        <button class="btn btn-primary btn-sm mt-2" onclick="showAddMaterialModal()">
                            <i class="fas fa-plus me-1"></i>Přidat materiál
                        </button>
                    </td>
                </tr>
            `;
        }

        const paginatedData = this.getCurrentPageData();
        let html = '';

        paginatedData.forEach(material => {
            const categoryText = this.getCategoryText(material.category);
            
            html += `
                <tr>
                    <td>
                        <div class="fw-semibold">${this.escapeHtml(material.name)}</div>
                        <small class="text-muted">${this.escapeHtml(material.code || '')}</small>
                    </td>
                    <td>${categoryText}</td>
                    <td>${this.escapeHtml(material.unit || '')}</td>
                    <td>${this.escapeHtml(material.preferred_supplier || 'Neuvedeno')}</td>
                    <td>
                        <span class="badge bg-info">Na skladě</span>
                    </td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-sm btn-outline-primary btn-edit" 
                                    data-id="${material.id}"
                                    data-bs-toggle="tooltip" 
                                    title="Upravit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-success" 
                                    onclick="addMaterialPurchase('${material.id}')"
                                    data-bs-toggle="tooltip" 
                                    title="Nákup">
                                <i class="fas fa-shopping-cart"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-warning" 
                                    onclick="useMaterial('${material.id}')"
                                    data-bs-toggle="tooltip" 
                                    title="Spotřeba">
                                <i class="fas fa-minus"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger btn-delete" 
                                    data-id="${material.id}" 
                                    data-name="${this.escapeHtml(material.name)}"
                                    data-bs-toggle="tooltip" 
                                    title="Smazat">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        return html;
    }

    /**
     * Apply filters and sorting
     */
    applyFiltersAndSort() {
        let data = [...this.currentData];

        // Apply search filter
        if (this.searchTerm) {
            data = this.filterBySearch(data, this.searchTerm);
        }

        // Apply other filters
        Object.entries(this.filters).forEach(([key, value]) => {
            if (value && value !== '') {
                data = data.filter(item => {
                    if (typeof item[key] === 'string') {
                        return item[key].toLowerCase().includes(value.toLowerCase());
                    }
                    return item[key] === value;
                });
            }
        });

        // Apply sorting
        if (this.sortConfig.key) {
            data.sort((a, b) => {
                let aVal = a[this.sortConfig.key];
                let bVal = b[this.sortConfig.key];

                // Handle null/undefined values
                if (aVal == null) aVal = '';
                if (bVal == null) bVal = '';

                // Convert to string for comparison
                aVal = aVal.toString().toLowerCase();
                bVal = bVal.toString().toLowerCase();

                if (aVal < bVal) {
                    return this.sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aVal > bVal) {
                    return this.sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        this.filteredData = data;
        this.updatePaginationInfo();
    }

    /**
     * Filter data by search term
     */
    filterBySearch(data, searchTerm) {
        const term = searchTerm.toLowerCase();
        
        return data.filter(item => {
            switch (this.currentTable) {
                case 'projects':
                    return item.name?.toLowerCase().includes(term) ||
                           item.client?.toLowerCase().includes(term) ||
                           item.description?.toLowerCase().includes(term);
                           
                case 'transactions':
                    return item.description?.toLowerCase().includes(term) ||
                           item.document_number?.toLowerCase().includes(term);
                           
                case 'invoices':
                    return item.invoice_number?.toLowerCase().includes(term) ||
                           item.client_name?.toLowerCase().includes(term);
                           
                case 'employees':
                    return item.first_name?.toLowerCase().includes(term) ||
                           item.last_name?.toLowerCase().includes(term) ||
                           item.position?.toLowerCase().includes(term) ||
                           item.phone?.toLowerCase().includes(term) ||
                           item.email?.toLowerCase().includes(term);
                           
                case 'equipment':
                    return item.name?.toLowerCase().includes(term) ||
                           item.manufacturer?.toLowerCase().includes(term) ||
                           item.model?.toLowerCase().includes(term) ||
                           item.inventory_number?.toLowerCase().includes(term);
                           
                case 'materials':
                    return item.name?.toLowerCase().includes(term) ||
                           item.code?.toLowerCase().includes(term) ||
                           item.preferred_supplier?.toLowerCase().includes(term);
                           
                default:
                    return true;
            }
        });
    }

    /**
     * Handle search
     */
    handleSearch(searchTerm) {
        this.searchTerm = searchTerm;
        this.pagination.currentPage = 1;
        this.applyFiltersAndSort();
        this.refreshCurrentTable();
    }

    /**
     * Handle filter
     */
    handleFilter(filterKey, filterValue) {
        this.filters[filterKey] = filterValue;
        this.pagination.currentPage = 1;
        this.applyFiltersAndSort();
        this.refreshCurrentTable();
    }

    /**
     * Handle sort
     */
    handleSort(sortKey) {
        if (this.sortConfig.key === sortKey) {
            this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortConfig.key = sortKey;
            this.sortConfig.direction = 'asc';
        }
        
        this.applyFiltersAndSort();
        this.refreshCurrentTable();
        this.updateSortIndicators();
    }

    /**
     * Update sort indicators
     */
    updateSortIndicators() {
        // Remove all sort indicators
        document.querySelectorAll('.sortable').forEach(header => {
            header.classList.remove('sorted-asc', 'sorted-desc');
        });

        // Add indicator to current sort column
        if (this.sortConfig.key) {
            const currentHeader = document.querySelector(`[data-sort="${this.sortConfig.key}"]`);
            if (currentHeader) {
                currentHeader.classList.add(`sorted-${this.sortConfig.direction}`);
            }
        }
    }

    /**
     * Go to specific page
     */
    goToPage(page) {
        if (page >= 1 && page <= this.pagination.totalPages) {
            this.pagination.currentPage = page;
            this.refreshCurrentTable();
            this.updatePagination();
        }
    }

    /**
     * Get current page data
     */
    getCurrentPageData() {
        const startIndex = (this.pagination.currentPage - 1) * this.pagination.pageSize;
        const endIndex = startIndex + this.pagination.pageSize;
        return this.filteredData.slice(startIndex, endIndex);
    }

    /**
     * Update pagination info
     */
    updatePaginationInfo() {
        this.pagination.totalItems = this.filteredData.length;
        this.pagination.totalPages = Math.ceil(this.pagination.totalItems / this.pagination.pageSize);
        
        // Reset to page 1 if current page is out of bounds
        if (this.pagination.currentPage > this.pagination.totalPages) {
            this.pagination.currentPage = Math.max(1, this.pagination.totalPages);
        }
    }

    /**
     * Update pagination controls
     */
    updatePagination() {
        const container = document.querySelector('.pagination-container');
        if (!container) return;

        if (this.pagination.totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '<nav><ul class="pagination justify-content-center">';

        // Previous button
        html += `
            <li class="page-item ${this.pagination.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.pagination.currentPage - 1}">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;

        // Page numbers
        const startPage = Math.max(1, this.pagination.currentPage - 2);
        const endPage = Math.min(this.pagination.totalPages, this.pagination.currentPage + 2);

        if (startPage > 1) {
            html += `<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>`;
            if (startPage > 2) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `
                <li class="page-item ${i === this.pagination.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }

        if (endPage < this.pagination.totalPages) {
            if (endPage < this.pagination.totalPages - 1) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            html += `<li class="page-item"><a class="page-link" href="#" data-page="${this.pagination.totalPages}">${this.pagination.totalPages}</a></li>`;
        }

        // Next button
        html += `
            <li class="page-item ${this.pagination.currentPage === this.pagination.totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.pagination.currentPage + 1}">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;

        html += '</ul></nav>';
        
        // Add info
        html += `
            <div class="text-center text-muted mt-2">
                <small>
                    Zobrazuji ${(this.pagination.currentPage - 1) * this.pagination.pageSize + 1} - 
                    ${Math.min(this.pagination.currentPage * this.pagination.pageSize, this.pagination.totalItems)} 
                    z ${this.pagination.totalItems} záznamů
                </small>
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * Update table container
     */
    updateTableContainer(containerId, html) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = html;
            
            // Initialize tooltips
            this.initializeTooltips();
        }
    }

    /**
     * Initialize tooltips
     */
    initializeTooltips() {
        // Initialize Bootstrap tooltips
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltipTriggerList.forEach(tooltipTriggerEl => {
            if (bootstrap && bootstrap.Tooltip) {
                new bootstrap.Tooltip(tooltipTriggerEl);
            }
        });
    }

    /**
     * Refresh current table
     */
    refreshCurrentTable() {
        switch (this.currentTable) {
            case 'projects':
                this.loadProjectsTable();
                break;
            case 'transactions':
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
     * Edit record
     */
    editRecord(id) {
        const record = this.currentData.find(item => item.id === id);
        if (!record) {
            Utils.Debug.error('Record not found:', id);
            return;
        }

        // Open edit modal based on table type
        switch (this.currentTable) {
            case 'projects':
                this.editProject(record);
                break;
            case 'transactions':
                this.editTransaction(record);
                break;
            case 'invoices':
                this.editInvoice(record);
                break;
            case 'employees':
                this.editEmployee(record);
                break;
            case 'equipment':
                this.editEquipment(record);
                break;
            case 'materials':
                this.editMaterial(record);
                break;
        }
    }

    /**
     * Delete record
     */
    async deleteRecord(id, name) {
        if (!window.ModalManager) {
            if (!confirm(`Opravdu chcete smazat záznam "${name}"?`)) {
                return;
            }
        } else {
            window.ModalManager.confirmDelete(
                this.getTableDisplayName(),
                name,
                () => this.performDelete(id)
            );
            return;
        }

        await this.performDelete(id);
    }

    /**
     * Perform delete operation
     */
    async performDelete(id) {
        try {
            const tableName = this.getTableName();
            await window.DatabaseManager.delete(tableName, id);
            
            // Remove from local data
            const index = this.currentData.findIndex(item => item.id === id);
            if (index !== -1) {
                this.currentData.splice(index, 1);
            }
            
            // Refresh table
            this.applyFiltersAndSort();
            this.refreshCurrentTable();
            
            // Show success message
            if (window.ModalManager) {
                window.ModalManager.showNotification('Záznam byl úspěšně smazán', 'success');
            }
            
        } catch (error) {
            Utils.Debug.error('Error deleting record:', error);
            
            if (window.ModalManager) {
                window.ModalManager.showNotification('Chyba při mazání záznamu: ' + error.message, 'error');
            } else {
                alert('Chyba při mazání záznamu: ' + error.message);
            }
        }
    }

    /**
     * Get table name for database operations
     */
    getTableName() {
        const mapping = {
            'projects': window.AstraCore.TABLES.PROJECTS,
            'transactions': window.AstraCore.TABLES.TRANSACTIONS,
            'invoices': window.AstraCore.TABLES.INVOICES,
            'employees': window.AstraCore.TABLES.EMPLOYEES,
            'equipment': window.AstraCore.TABLES.EQUIPMENT,
            'materials': window.AstraCore.TABLES.MATERIALS
        };
        return mapping[this.currentTable];
    }

    /**
     * Get table display name
     */
    getTableDisplayName() {
        const mapping = {
            'projects': 'projekt',
            'transactions': 'transakci',
            'invoices': 'fakturu',
            'employees': 'zaměstnance',
            'equipment': 'nářadí',
            'materials': 'materiál'
        };
        return mapping[this.currentTable] || 'záznam';
    }

    /**
     * Edit methods for different record types
     */
    editProject(project) {
        // TODO: Implement project editing
        Utils.Debug.log('Edit project:', project);
    }

    editTransaction(transaction) {
        // TODO: Implement transaction editing
        Utils.Debug.log('Edit transaction:', transaction);
    }

    editInvoice(invoice) {
        // TODO: Implement invoice editing
        Utils.Debug.log('Edit invoice:', invoice);
    }

    editEmployee(employee) {
        // TODO: Implement employee editing
        Utils.Debug.log('Edit employee:', employee);
    }

    editEquipment(equipment) {
        // TODO: Implement equipment editing
        Utils.Debug.log('Edit equipment:', equipment);
    }

    editMaterial(material) {
        // TODO: Implement material editing
        Utils.Debug.log('Edit material:', material);
    }

    /**
     * Helper methods
     */
    getStatusText(status) {
        return window.AstraCore.LOCALE.STATUS_TEXT[status] || status;
    }

    getStatusClass(status) {
        const mapping = {
            planning: 'bg-info',
            active: 'bg-success',
            completed: 'bg-secondary',
            cancelled: 'bg-danger',
            pending: 'bg-warning',
            paid: 'bg-success',
            overdue: 'bg-danger',
            available: 'bg-success',
            borrowed: 'bg-warning',
            service: 'bg-info',
            retired: 'bg-secondary',
            inactive: 'bg-secondary',
            terminated: 'bg-danger'
        };
        return mapping[status] || 'bg-secondary';
    }

    getCategoryText(category) {
        return window.AstraCore.LOCALE.CATEGORY_TEXT[category] || category;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Export table data
     */
    exportToCSV() {
        const data = this.filteredData;
        if (data.length === 0) {
            alert('Žádná data k exportu');
            return;
        }

        // Get headers based on table type
        const headers = this.getExportHeaders();
        
        // Convert data to CSV format
        let csv = headers.join(',') + '\n';
        
        data.forEach(row => {
            const values = headers.map(header => {
                const value = this.getExportValue(row, header);
                return `"${value.toString().replace(/"/g, '""')}"`;
            });
            csv += values.join(',') + '\n';
        });

        // Download CSV file
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${this.currentTable}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Get export headers based on table type
     */
    getExportHeaders() {
        const headers = {
            projects: ['name', 'client', 'status', 'progress', 'start_date', 'end_date'],
            transactions: ['type', 'description', 'total_amount', 'category', 'transaction_date'],
            invoices: ['invoice_number', 'client_name', 'total_amount', 'status', 'issue_date', 'due_date'],
            employees: ['first_name', 'last_name', 'position', 'phone', 'email', 'status'],
            equipment: ['name', 'manufacturer', 'model', 'category', 'status', 'location'],
            materials: ['name', 'category', 'unit', 'preferred_supplier']
        };
        return headers[this.currentTable] || [];
    }

    /**
     * Get export value for specific field
     */
    getExportValue(row, field) {
        let value = row[field];
        
        if (value == null) return '';
        
        // Format specific fields
        if (field.includes('date') && value) {
            return Utils.Date.format(value);
        }
        
        if (field.includes('amount') && value) {
            return value.toString();
        }
        
        return value.toString();
    }

    /**
     * Set page size
     */
    setPageSize(size) {
        this.pagination.pageSize = parseInt(size);
        this.pagination.currentPage = 1;
        this.applyFiltersAndSort();
        this.refreshCurrentTable();
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        this.filters = {};
        this.searchTerm = '';
        this.pagination.currentPage = 1;
        
        // Clear filter inputs
        document.querySelectorAll('.table-filter').forEach(input => {
            input.value = '';
        });
        
        document.querySelectorAll('.table-search').forEach(input => {
            input.value = '';
        });
        
        this.applyFiltersAndSort();
        this.refreshCurrentTable();
    }

    /**
     * Get table statistics
     */
    getTableStats() {
        return {
            total: this.currentData.length,
            filtered: this.filteredData.length,
            currentPage: this.pagination.currentPage,
            totalPages: this.pagination.totalPages,
            pageSize: this.pagination.pageSize
        };
    }
}

// Create global table manager instance
window.TableManager = new TableManager();

// Global functions for table actions
window.viewProjectDetails = (id) => {
    Utils.Debug.log('View project details:', id);
    // TODO: Implement project details view
};

window.downloadInvoicePDF = (id) => {
    Utils.Debug.log('Download invoice PDF:', id);
    // TODO: Implement PDF generation
};

window.markInvoiceAsPaid = async (id) => {
    try {
        await window.DatabaseManager.update(window.AstraCore.TABLES.INVOICES, id, {
            status: 'paid',
            paid_date: new Date().toISOString()
        });
        
        if (window.ModalManager) {
            window.ModalManager.showNotification('Faktura označena jako zaplacená', 'success');
        }
        
        window.TableManager.refreshCurrentTable();
    } catch (error) {
        Utils.Debug.error('Error marking invoice as paid:', error);
        if (window.ModalManager) {
            window.ModalManager.showNotification('Chyba při označování faktury', 'error');
        }
    }
};

window.viewEmployeeAttendance = (id) => {
    Utils.Debug.log('View employee attendance:', id);
    // TODO: Implement attendance view
};

window.borrowEquipment = (id) => {
    Utils.Debug.log('Borrow equipment:', id);
    // TODO: Implement equipment borrowing
};

window.addMaterialPurchase = (id) => {
    Utils.Debug.log('Add material purchase:', id);
    // TODO: Implement material purchase
};

window.useMaterial = (id) => {
    Utils.Debug.log('Use material:', id);
    // TODO: Implement material usage
};

Utils.Debug.log('Table manager module loaded successfully');
