// AstraCore Solutions - Modals and Forms Module

class ModalManager {
    constructor() {
        this.activeModal = null;
        this.formData = {};
        this.setupEventListeners();
    }

    /**
     * Initialize modal manager
     */
    initialize() {
        Utils.Debug.log('Initializing modal manager...');
        this.createModalElements();
        this.setupValidation();
        Utils.Debug.log('Modal manager initialized successfully');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.closeModal(this.activeModal);
            }
        });

        // Handle form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.closest('.modal')) {
                e.preventDefault();
                this.handleFormSubmit(form);
            }
        });
    }

    /**
     * Create modal elements dynamically
     */
    createModalElements() {
        // Create modals that don't exist in HTML
        this.createProjectModal();
        this.createTransactionModal();
        this.createInvoiceModal();
        this.createEmployeeModal();
        this.createEquipmentModal();
        this.createMaterialModal();
    }

    /**
     * Show project modal
     */
    showAddProjectModal() {
        const modal = this.getOrCreateModal('addProjectModal', 'Nový projekt', this.getProjectModalContent());
        this.clearForm('projectForm');
        this.setDefaultValues('project');
        this.showModal(modal);
    }

    /**
     * Show transaction modal
     */
    showAddTransactionModal(type = 'expense') {
        const title = type === 'income' ? 'Přidat příjem' : 'Přidat výdaj';
        const modal = this.getOrCreateModal('addTransactionModal', title, this.getTransactionModalContent());
        
        this.clearForm('transactionForm');
        const typeSelect = modal.querySelector('#transactionType');
        if (typeSelect) typeSelect.value = type;
        
        this.setDefaultValues('transaction');
        this.updateTransactionType();
        this.showModal(modal);
    }

    /**
     * Show invoice modal
     */
    showAddInvoiceModal() {
        const modal = this.getOrCreateModal('addInvoiceModal', 'Vystavit fakturu', this.getInvoiceModalContent());
        this.clearForm('invoiceForm');
        this.generateInvoiceNumber();
        this.setDefaultValues('invoice');
        this.showModal(modal);
    }

    /**
     * Show employee modal
     */
    showAddEmployeeModal() {
        const modal = this.getOrCreateModal('addEmployeeModal', 'Nový zaměstnanec', this.getEmployeeModalContent());
        this.clearForm('employeeForm');
        this.setDefaultValues('employee');
        this.showModal(modal);
    }

    /**
     * Show equipment modal
     */
    showAddEquipmentModal() {
        const modal = this.getOrCreateModal('addEquipmentModal', 'Přidat nářadí', this.getEquipmentModalContent());
        this.clearForm('equipmentForm');
        this.generateInventoryNumber();
        this.setDefaultValues('equipment');
        this.showModal(modal);
    }

    /**
     * Show material modal
     */
    showAddMaterialModal() {
        const modal = this.getOrCreateModal('addMaterialModal', 'Přidat materiál', this.getMaterialModalContent());
        this.clearForm('materialForm');
        this.setDefaultValues('material');
        this.showModal(modal);
    }

    /**
     * Generic modal creation
     */
    getOrCreateModal(id, title, content) {
        let modal = document.getElementById(id);
        
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = id;
            modal.tabIndex = -1;
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${content}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Zrušit</button>
                            <button type="button" class="btn btn-primary" onclick="ModalManager.handleSave('${id}')">
                                <i class="fas fa-save me-2"></i>Uložit
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        return modal;
    }

    /**
     * Show modal
     */
    showModal(modalElement) {
        this.activeModal = modalElement;
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        
        // Load select options
        this.loadSelectOptions(modalElement);
        
        // Focus first input
        setTimeout(() => {
            const firstInput = modalElement.querySelector('input, select, textarea');
            if (firstInput) firstInput.focus();
        }, 300);
    }

    /**
     * Close modal
     */
    closeModal(modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }
        this.activeModal = null;
    }

    /**
     * Handle form submission
     */
    async handleFormSubmit(form) {
        const modalId = form.closest('.modal').id;
        await this.handleSave(modalId);
    }

    /**
     * Handle save action
     */
    async handleSave(modalId) {
        Utils.Debug.log(`Saving data from modal: ${modalId}`);
        
        try {
            const modal = document.getElementById(modalId);
            const form = modal.querySelector('form');
            
            if (!form) {
                throw new Error('Form not found in modal');
            }

            // Validate form
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            // Get form data
            const formData = this.getFormData(form);
            
            // Show loading state
            const saveBtn = modal.querySelector('.modal-footer .btn-primary');
            Utils.DOM.showLoading(saveBtn);

            // Save based on modal type
            let result;
            switch (modalId) {
                case 'addProjectModal':
                    result = await this.saveProject(formData);
                    break;
                case 'addTransactionModal':
                    result = await this.saveTransaction(formData);
                    break;
                case 'addInvoiceModal':
                    result = await this.saveInvoice(formData);
                    break;
                case 'addEmployeeModal':
                    result = await this.saveEmployee(formData);
                    break;
                case 'addEquipmentModal':
                    result = await this.saveEquipment(formData);
                    break;
                case 'addMaterialModal':
                    result = await this.saveMaterial(formData);
                    break;
                default:
                    throw new Error(`Unknown modal type: ${modalId}`);
            }

            // Hide loading state
            Utils.DOM.hideLoading(saveBtn);

            // Close modal
            this.closeModal(modal);

            // Show success message
            this.showNotification('Záznam byl úspěšně uložen', 'success');

            // Refresh current page data
            this.refreshCurrentPage();

        } catch (error) {
            Utils.Debug.error(`Error saving data from ${modalId}:`, error);
            
            // Hide loading state
            const modal = document.getElementById(modalId);
            const saveBtn = modal.querySelector('.modal-footer .btn-primary');
            Utils.DOM.hideLoading(saveBtn);

            // Show error message
            this.showNotification('Chyba při ukládání: ' + error.message, 'error');
        }
    }

    /**
     * Get form data
     */
    getFormData(form) {
        const formData = new FormData(form);
        const data = {};
        
        // Get all form elements
        const elements = form.querySelectorAll('input, select, textarea');
        
        elements.forEach(element => {
            const name = element.name || element.id;
            if (!name) return;
            
            let value = element.value;
            
            // Handle different input types
            switch (element.type) {
                case 'checkbox':
                    value = element.checked;
                    break;
                case 'radio':
                    if (element.checked) {
                        data[name] = value;
                    }
                    return;
                case 'number':
                    value = value ? parseFloat(value) : null;
                    break;
                case 'date':
                    value = value || null;
                    break;
                default:
                    // Handle currency inputs
                    if (element.classList.contains('currency-format')) {
                        value = Utils.Currency.parse(value);
                    }
            }
            
            data[name] = value;
        });
        
        return data;
    }

    /**
     * Save project
     */
    async saveProject(data) {
        const projectData = {
            name: data.projectName,
            client: data.projectClient,
            description: data.projectDescription,
            contact_person: data.projectContact,
            contact_phone: data.projectContactPhone,
            address: data.projectAddress,
            responsible_employee_id: data.projectResponsible || null,
            status: data.projectStatus || 'planning',
            start_date: data.projectStartDate || null,
            end_date: data.projectEndDate,
            budget_without_vat: data.projectBudgetWithoutVAT || 0,
            vat_rate: data.projectVATRate || 21,
            total_budget: data.projectTotalBudget || 0,
            progress: data.projectProgress || 0,
            notes: data.projectNotes,
            created_by: window.appState.currentUser?.id
        };

        return await window.DatabaseManager.create(window.AstraCore.TABLES.PROJECTS, projectData);
    }

    /**
     * Save transaction
     */
    async saveTransaction(data) {
        const transactionData = {
            type: data.transactionType,
            description: data.transactionDescription,
            amount_without_vat: data.transactionAmount || 0,
            vat_rate_1: data.transactionVAT || 21,
            vat_amount_1: data.transactionVATAmount || 0,
            total_amount: data.transactionTotal || 0,
            category: data.transactionCategory,
            transaction_date: data.transactionDate,
            project_id: data.transactionProject || null,
            document_number: data.transactionDocumentNumber,
            note: data.transactionNote,
            created_by: window.appState.currentUser?.id
        };

        return await window.DatabaseManager.create(window.AstraCore.TABLES.TRANSACTIONS, transactionData);
    }

    /**
     * Save invoice
     */
    async saveInvoice(data) {
        const invoiceData = {
            invoice_number: data.invoiceNumber,
            issue_date: data.invoiceDate,
            due_date: data.invoiceDueDate,
            client_name: data.invoiceClient,
            client_address: data.invoiceClientAddress,
            project_id: data.invoiceProject || null,
            subtotal: data.invoiceSubtotal || 0,
            vat_total: data.invoiceVATTotal || 0,
            total_amount: data.invoiceGrandTotal || 0,
            note: data.invoiceNote,
            status: 'pending',
            created_by: window.appState.currentUser?.id
        };

        return await window.DatabaseManager.create(window.AstraCore.TABLES.INVOICES, invoiceData);
    }

    /**
     * Save employee
     */
    async saveEmployee(data) {
        const employeeData = {
            first_name: data.employeeFirstName,
            last_name: data.employeeLastName,
            birth_number: data.employeeBirthNumber,
            birth_date: data.employeeBirthDate || null,
            address: data.employeeAddress,
            phone: data.employeePhone,
            email: data.employeeEmail,
            position: data.employeePosition,
            contract_type: data.employeeContractType,
            start_date: data.employeeStartDate,
            end_date: data.employeeEndDate || null,
            hourly_rate: data.employeeHourlyRate || null,
            monthly_salary: data.employeeMonthlySalary || null,
            bank_account: data.employeeBankAccount,
            insurance_company: data.employeeInsurance,
            status: 'active',
            created_by: window.appState.currentUser?.id
        };

        return await window.DatabaseManager.create(window.AstraCore.TABLES.EMPLOYEES, employeeData);
    }

    /**
     * Save equipment
     */
    async saveEquipment(data) {
        const equipmentData = {
            name: data.equipmentName,
            inventory_number: data.equipmentInventoryNumber,
            manufacturer: data.equipmentManufacturer,
            model: data.equipmentModel,
            serial_number: data.equipmentSerialNumber,
            category: data.equipmentCategory,
            status: data.equipmentStatus || 'available',
            description: data.equipmentDescription,
            purchase_date: data.equipmentPurchaseDate || null,
            purchase_price: data.equipmentPurchasePrice || 0,
            supplier: data.equipmentSupplier,
            warranty_end: data.equipmentWarrantyEnd || null,
            location: data.equipmentLocation,
            notes: data.equipmentNotes,
            created_by: window.appState.currentUser?.id
        };

        return await window.DatabaseManager.create(window.AstraCore.TABLES.EQUIPMENT, equipmentData);
    }

    /**
     * Save material
     */
    async saveMaterial(data) {
        const materialData = {
            name: data.materialName,
            code: data.materialCode,
            category: data.materialCategory,
            unit: data.materialUnit,
            packaging: data.materialPackaging,
            preferred_supplier: data.materialSupplier,
            description: data.materialDescription,
            created_by: window.appState.currentUser?.id
        };

        return await window.DatabaseManager.create(window.AstraCore.TABLES.MATERIALS, materialData);
    }

    /**
     * Load select options
     */
    loadSelectOptions(modal) {
        // Load employees for project responsible
        const employeeSelects = modal.querySelectorAll('[data-load="employees"]');
        employeeSelects.forEach(select => {
            this.populateSelect(select, window.appState.data.employees, 
                item => `${item.first_name} ${item.last_name} - ${item.position}`);
        });

        // Load projects
        const projectSelects = modal.querySelectorAll('[data-load="projects"]');
        projectSelects.forEach(select => {
            this.populateSelect(select, 
                window.appState.data.projects.filter(p => p.status === 'active'), 
                item => `${item.name} - ${item.client}`);
        });
    }

    /**
     * Populate select element
     */
    populateSelect(select, data, labelFunction) {
        // Keep first option (placeholder)
        const firstOption = select.querySelector('option');
        select.innerHTML = '';
        if (firstOption) {
            select.appendChild(firstOption);
        }

        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = labelFunction ? labelFunction(item) : item.name;
            select.appendChild(option);
        });
    }

    /**
     * Set default values
     */
    setDefaultValues(formType) {
        const today = Utils.Date.today();
        
        switch (formType) {
            case 'project':
                this.setElementValue('projectStartDate', today);
                this.setElementValue('projectProgress', 0);
                this.setElementValue('projectVATRate', 21);
                break;
                
            case 'transaction':
                this.setElementValue('transactionDate', today);
                this.setElementValue('transactionVAT', 21);
                break;
                
            case 'invoice':
                this.setElementValue('invoiceDate', today);
                this.setElementValue('invoiceDueDate', Utils.Date.addDays(today, 14));
                break;
                
            case 'employee':
                this.setElementValue('employeeStartDate', today);
                break;
                
            case 'equipment':
                this.setElementValue('equipmentPurchaseDate', today);
                this.setElementValue('equipmentStatus', 'available');
                break;
        }
    }

    /**
     * Set element value safely
     */
    setElementValue(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.value = value;
        }
    }

    /**
     * Clear form
     */
    clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
        }
    }

    /**
     * Update transaction type
     */
    updateTransactionType() {
        const typeSelect = document.getElementById('transactionType');
        if (!typeSelect) return;

        const incomeTypeContainer = document.getElementById('incomeTypeContainer');
        if (incomeTypeContainer) {
            incomeTypeContainer.style.display = typeSelect.value === 'income' ? 'block' : 'none';
        }
    }

    /**
     * Generate invoice number
     */
    generateInvoiceNumber() {
        const year = new Date().getFullYear();
        const invoiceCount = window.appState.data.invoices.filter(i => 
            i.invoice_number && i.invoice_number.startsWith(year.toString())
        ).length + 1;
        
        const number = `${year}-${invoiceCount.toString().padStart(4, '0')}`;
        this.setElementValue('invoiceNumber', number);
    }

    /**
     * Generate inventory number
     */
    generateInventoryNumber() {
        const year = new Date().getFullYear();
        const count = window.appState.data.equipment.length + 1;
        const number = `INV-${year}-${count.toString().padStart(4, '0')}`;
        this.setElementValue('equipmentInventoryNumber', number);
    }

    /**
     * Setup form validation
     */
    setupValidation() {
        // Add real-time validation listeners
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('currency-format')) {
                Utils.Currency.formatInput(e.target);
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.id === 'transactionType') {
                this.updateTransactionType();
            }
        });
    }

    /**
     * Refresh current page data
     */
    refreshCurrentPage() {
        const currentPage = window.NavigationManager.getCurrentPage();
        
        switch (currentPage) {
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
            // Add more cases as needed
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Create toast notification
        const toastHTML = `
            <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <i class="fas fa-${type === 'success' ? 'check-circle text-success' : 
                                     type === 'error' ? 'exclamation-circle text-danger' : 
                                     'info-circle text-info'} me-2"></i>
                    <strong class="me-auto">AstraCore</strong>
                    <small>Právě teď</small>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;
        
        // Get or create toast container
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(container);
        }
        
        // Add toast
        container.insertAdjacentHTML('beforeend', toastHTML);
        const toastEl = container.lastElementChild;
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
        
        // Remove after hiding
        toastEl.addEventListener('hidden.bs.toast', () => {
            toastEl.remove();
        });
    }

    /**
     * Modal content templates
     */
    getProjectModalContent() {
        return `
            <form id="projectForm">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Název projektu *</label>
                        <input type="text" class="form-control" id="projectName" name="projectName" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Klient *</label>
                        <input type="text" class="form-control" id="projectClient" name="projectClient" required>
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label">Popis projektu</label>
                    <textarea class="form-control" id="projectDescription" name="projectDescription" rows="3"></textarea>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Datum zahájení</label>
                        <input type="date" class="form-control" id="projectStartDate" name="projectStartDate">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Plánované dokončení *</label>
                        <input type="date" class="form-control" id="projectEndDate" name="projectEndDate" required>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Rozpočet bez DPH</label>
                        <input type="text" class="form-control currency-format" id="projectBudgetWithoutVAT" name="projectBudgetWithoutVAT">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Stav projektu</label>
                        <select class="form-select" id="projectStatus" name="projectStatus">
                            <option value="planning">Plánování</option>
                            <option value="active" selected>Aktivní</option>
                            <option value="completed">Dokončené</option>
                            <option value="cancelled">Zrušené</option>
                        </select>
                    </div>
                </div>
            </form>
        `;
    }

    getTransactionModalContent() {
        return `
            <form id="transactionForm">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Typ transakce</label>
                        <select class="form-select" id="transactionType" name="transactionType" required>
                            <option value="income">Příjem</option>
                            <option value="expense">Výdaj</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Datum *</label>
                        <input type="date" class="form-control" id="transactionDate" name="transactionDate" required>
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label">Popis *</label>
                    <input type="text" class="form-control" id="transactionDescription" name="transactionDescription" required>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Částka bez DPH *</label>
                        <input type="text" class="form-control currency-format" id="transactionAmount" name="transactionAmount" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Sazba DPH</label>
                        <select class="form-select" id="transactionVAT" name="transactionVAT">
                            <option value="21">21%</option>
                            <option value="12">12%</option>
                            <option value="0">0%</option>
                        </select>
                    </div>
                </div>
            </form>
        `;
    }

    getInvoiceModalContent() {
        return `
            <form id="invoiceForm">
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Číslo faktury</label>
                        <input type="text" class="form-control" id="invoiceNumber" name="invoiceNumber" readonly>
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Datum vystavení</label>
                        <input type="date" class="form-control" id="invoiceDate" name="invoiceDate" required>
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Datum splatnosti</label>
                        <input type="date" class="form-control" id="invoiceDueDate" name="invoiceDueDate" required>
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label">Klient *</label>
                    <input type="text" class="form-control" id="invoiceClient" name="invoiceClient" required>
                </div>
            </form>
        `;
    }

    getEmployeeModalContent() {
        return `
            <form id="employeeForm">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Jméno *</label>
                        <input type="text" class="form-control" id="employeeFirstName" name="employeeFirstName" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Příjmení *</label>
                        <input type="text" class="form-control" id="employeeLastName" name="employeeLastName" required>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Telefon *</label>
                        <input type="tel" class="form-control" id="employeePhone" name="employeePhone" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-control" id="employeeEmail" name="employeeEmail">
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Pozice *</label>
                        <select class="form-select" id="employeePosition" name="employeePosition" required>
                            <option value="">Vyberte pozici</option>
                            <option value="stavař">Stavař</option>
                            <option value="zedník">Zedník</option>
                            <option value="elektrikář">Elektrikář</option>
                            <option value="instalatér">Instalatér</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Datum nástupu *</label>
                        <input type="date" class="form-control" id="employeeStartDate" name="employeeStartDate" required>
                    </div>
                </div>
            </form>
        `;
    }

    getEquipmentModalContent() {
        return `
            <form id="equipmentForm">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Název nářadí *</label>
                        <input type="text" class="form-control" id="equipmentName" name="equipmentName" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Inventární číslo</label>
                        <input type="text" class="form-control" id="equipmentInventoryNumber" name="equipmentInventoryNumber" readonly>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Kategorie *</label>
                        <select class="form-select" id="equipmentCategory" name="equipmentCategory" required>
                            <option value="">Vyberte kategorii</option>
                            <option value="hand_tools">Ruční nářadí</option>
                            <option value="power_tools">Elektrické nářadí</option>
                            <option value="machinery">Strojní technika</option>
                            <option value="measuring">Měřicí přístroje</option>
                            <option value="vehicles">Dopravní prostředky</option>
                            <option value="safety">Ochranné pomůcky</option>
                            <option value="it">IT technika</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Stav</label>
                        <select class="form-select" id="equipmentStatus" name="equipmentStatus">
                            <option value="available">K dispozici</option>
                            <option value="borrowed">Vypůjčeno</option>
                            <option value="service">V servisu</option>
                            <option value="retired">Vyřazeno</option>
                        </select>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Výrobce</label>
                        <input type="text" class="form-control" id="equipmentManufacturer" name="equipmentManufacturer">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Model</label>
                        <input type="text" class="form-control" id="equipmentModel" name="equipmentModel">
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label">Popis</label>
                    <textarea class="form-control" id="equipmentDescription" name="equipmentDescription" rows="3"></textarea>
                </div>
            </form>
        `;
    }

    getMaterialModalContent() {
        return `
            <form id="materialForm">
                <div class="row">
                    <div class="col-md-8 mb-3">
                        <label class="form-label">Název materiálu *</label>
                        <input type="text" class="form-control" id="materialName" name="materialName" required>
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Kód/SKU</label>
                        <input type="text" class="form-control" id="materialCode" name="materialCode">
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Kategorie *</label>
                        <select class="form-select" id="materialCategory" name="materialCategory" required>
                            <option value="">Vyberte kategorii</option>
                            <option value="construction">Stavební materiál</option>
                            <option value="wood">Dřevo a desky</option>
                            <option value="fasteners">Spojovací materiál</option>
                            <option value="electrical">Elektroinstalace</option>
                            <option value="plumbing">Voda a topení</option>
                            <option value="finishing">Dokončovací práce</option>
                            <option value="insulation">Izolace</option>
                            <option value="windows_doors">Okna a dveře</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Jednotka *</label>
                        <select class="form-select" id="materialUnit" name="materialUnit" required>
                            <option value="">Vyberte jednotku</option>
                            <option value="kg">kg</option>
                            <option value="m2">m²</option>
                            <option value="m3">m³</option>
                            <option value="m">m</option>
                            <option value="ks">ks</option>
                            <option value="balení">balení</option>
                            <option value="pytel">pytel</option>
                            <option value="role">role</option>
                            <option value="litr">litr</option>
                        </select>
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label">Preferovaný dodavatel</label>
                    <input type="text" class="form-control" id="materialSupplier" name="materialSupplier">
                </div>
                <div class="mb-3">
                    <label class="form-label">Popis/Specifikace</label>
                    <textarea class="form-control" id="materialDescription" name="materialDescription" rows="3"></textarea>
                </div>
            </form>
        `;
    }

    /**
     * Additional modal methods
     */
    createProjectModal() {
        // This will be created dynamically when needed
    }

    createTransactionModal() {
        // This will be created dynamically when needed
    }

    createInvoiceModal() {
        // This will be created dynamically when needed
    }

    createEmployeeModal() {
        // This will be created dynamically when needed
    }

    createEquipmentModal() {
        // This will be created dynamically when needed
    }

    createMaterialModal() {
        // This will be created dynamically when needed
    }

    /**
     * Show notifications modal
     */
    showNotifications() {
        const data = window.appState.data;
        let criticalCount = 0;
        let notifications = [];

        // Overdue invoices
        data.invoices.forEach(invoice => {
            if (invoice.status === 'pending' && Utils.Date.isPast(invoice.due_date)) {
                notifications.push({
                    type: 'warning',
                    title: `Faktura ${invoice.invoice_number}`,
                    message: `Po splatnosti od ${Utils.Date.format(invoice.due_date)}`,
                    action: () => window.NavigationManager.navigateTo('invoices')
                });
                criticalCount++;
            }
        });

        // Overdue projects
        data.projects.forEach(project => {
            if (project.status === 'active' && project.end_date && Utils.Date.isPast(project.end_date)) {
                notifications.push({
                    type: 'danger',
                    title: project.name,
                    message: `Projekt po termínu od ${Utils.Date.format(project.end_date)}`,
                    action: () => window.NavigationManager.navigateTo('projects')
                });
                criticalCount++;
            }
        });

        if (criticalCount === 0) {
            this.showNotification('Žádné nové notifikace', 'info');
            return;
        }

        // Create notifications modal
        const modal = this.getOrCreateModal('notificationsModal', 'Notifikace', this.getNotificationsContent(notifications));
        this.showModal(modal);
    }

    /**
     * Get notifications modal content
     */
    getNotificationsContent(notifications) {
        let content = '<div class="list-group">';
        
        notifications.forEach((notification, index) => {
            const iconClass = {
                'warning': 'fas fa-exclamation-triangle text-warning',
                'danger': 'fas fa-exclamation-circle text-danger',
                'info': 'fas fa-info-circle text-info'
            }[notification.type];

            content += `
                <div class="list-group-item d-flex align-items-start">
                    <i class="${iconClass} me-3 mt-1"></i>
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${notification.title}</h6>
                        <p class="mb-0 text-muted">${notification.message}</p>
                    </div>
                    <button class="btn btn-sm btn-outline-primary" onclick="(${notification.action})(); ModalManager.closeModal(document.getElementById('notificationsModal'))">
                        Zobrazit
                    </button>
                </div>
            `;
        });
        
        content += '</div>';
        return content;
    }

    /**
     * Quick action modals
     */
    showQuickInvoiceModal() {
        this.showAddInvoiceModal();
    }

    showQuickProjectModal() {
        this.showAddProjectModal();
    }

    showQuickTransactionModal(type) {
        this.showAddTransactionModal(type);
    }

    /**
     * Confirmation dialog
     */
    showConfirmDialog(title, message, onConfirm, onCancel = null) {
        const modal = this.getOrCreateModal('confirmModal', title, `
            <div class="text-center">
                <i class="fas fa-question-circle fa-3x text-warning mb-3"></i>
                <p>${message}</p>
            </div>
        `);

        // Update footer
        const footer = modal.querySelector('.modal-footer');
        footer.innerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Zrušit</button>
            <button type="button" class="btn btn-danger" onclick="ModalManager.executeConfirm()">Potvrdit</button>
        `;

        // Store callbacks
        this.confirmCallback = onConfirm;
        this.cancelCallback = onCancel;

        this.showModal(modal);
    }

    /**
     * Execute confirmation
     */
    executeConfirm() {
        if (this.confirmCallback) {
            this.confirmCallback();
        }
        this.closeModal(document.getElementById('confirmModal'));
        this.confirmCallback = null;
        this.cancelCallback = null;
    }

    /**
     * Delete confirmation
     */
    confirmDelete(itemType, itemName, deleteFunction) {
        this.showConfirmDialog(
            'Potvrdit smazání',
            `Opravdu chcete smazat ${itemType}: <strong>${itemName}</strong>?<br><br>Tato akce je nevratná.`,
            deleteFunction
        );
    }

    /**
     * Show loading modal
     */
    showLoadingModal(message = 'Načítání...') {
        const modal = this.getOrCreateModal('loadingModal', '', `
            <div class="text-center py-4">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p>${message}</p>
            </div>
        `);

        // Remove close buttons
        const closeButtons = modal.querySelectorAll('.btn-close, .modal-footer');
        closeButtons.forEach(btn => btn.style.display = 'none');

        this.showModal(modal);
        return modal;
    }

    /**
     * Hide loading modal
     */
    hideLoadingModal() {
        const modal = document.getElementById('loadingModal');
        if (modal) {
            this.closeModal(modal);
        }
    }

    /**
     * Error modal
     */
    showErrorModal(title, message, details = null) {
        let content = `
            <div class="text-center">
                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                <h5>${title}</h5>
                <p>${message}</p>
        `;

        if (details) {
            content += `
                <div class="mt-3">
                    <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="collapse" data-bs-target="#errorDetails">
                        Zobrazit detaily
                    </button>
                    <div class="collapse mt-2" id="errorDetails">
                        <div class="alert alert-secondary text-start">
                            <small><pre>${details}</pre></small>
                        </div>
                    </div>
                </div>
            `;
        }

        content += '</div>';

        const modal = this.getOrCreateModal('errorModal', 'Chyba', content);
        this.showModal(modal);
    }

    /**
     * Success modal
     */
    showSuccessModal(title, message) {
        const modal = this.getOrCreateModal('successModal', title, `
            <div class="text-center">
                <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
                <p>${message}</p>
            </div>
        `);
        this.showModal(modal);
    }

    /**
     * Cleanup
     */
    cleanup() {
        // Remove any open modals
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            this.closeModal(modal);
        });

        // Clear callbacks
        this.confirmCallback = null;
        this.cancelCallback = null;
        this.activeModal = null;
    }
}

// Create global modal manager instance
window.ModalManager = new ModalManager();

// Global functions for use in HTML onclick handlers
window.showAddProjectModal = () => window.ModalManager.showAddProjectModal();
window.showAddTransactionModal = (type) => window.ModalManager.showAddTransactionModal(type);
window.showAddInvoiceModal = () => window.ModalManager.showAddInvoiceModal();
window.showAddEmployeeModal = () => window.ModalManager.showAddEmployeeModal();
window.showAddEquipmentModal = () => window.ModalManager.showAddEquipmentModal();
window.showAddMaterialModal = () => window.ModalManager.showAddMaterialModal();
window.showNotifications = () => window.ModalManager.showNotifications();

Utils.Debug.log('Modals module loaded successfully');
