// AstraCore Solutions - Database Operations Module

class DatabaseManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.setupConnectionMonitoring();
        this.retryAttempts = 3;
        this.retryDelay = 1000;
    }

    /**
     * Initialize database manager
     */
    async initialize() {
        Utils.Debug.log('Initializing database manager...');
        
        try {
            await this.checkConnection();
            await this.loadAllData();
            this.setupRealTimeSubscriptions();
            
            Utils.Debug.log('Database manager initialized successfully');
        } catch (error) {
            Utils.Debug.error('Database initialization error:', error);
            throw error;
        }
    }

    /**
     * Check database connection
     */
    async checkConnection() {
        const statusEl = document.getElementById('connectionStatus');
        
        try {
            statusEl.className = 'connection-status disconnected';
            statusEl.innerHTML = '<i class="fas fa-wifi"></i><span>Připojování...</span>';
            
            // Test connection with a simple query
            const { data, error } = await window.supabaseClient
                .from('projects')
                .select('id')
                .limit(1);
            
            if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist
                throw error;
            }
            
            statusEl.className = 'connection-status connected';
            statusEl.innerHTML = '<i class="fas fa-check-circle"></i><span>Připojeno</span>';
            
            // Hide status after 3 seconds
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 3000);
            
            this.isOnline = true;
            
        } catch (error) {
            Utils.Debug.error('Connection error:', error);
            statusEl.className = 'connection-status disconnected';
            statusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>Chyba připojení</span>';
            this.isOnline = false;
            throw error;
        }
    }

    /**
     * Setup connection monitoring
     */
    setupConnectionMonitoring() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            Utils.Debug.log('Connection restored');
            this.checkConnection();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            Utils.Debug.log('Connection lost');
            const statusEl = document.getElementById('connectionStatus');
            if (statusEl) {
                statusEl.className = 'connection-status disconnected';
                statusEl.innerHTML = '<i class="fas fa-wifi-slash"></i><span>Offline</span>';
                statusEl.style.display = 'block';
            }
        });
    }

    /**
     * Load all application data
     */
    async loadAllData() {
        Utils.Debug.log('Loading all application data...');
        
        try {
            const promises = [
                this.loadProjects(),
                this.loadTransactions(),
                this.loadInvoices(),
                this.loadEmployees(),
                this.loadEquipment(),
                this.loadMaterials(),
                this.loadMaterialPurchases(),
                this.loadMaterialUsage(),
                this.loadEquipmentBorrows(),
                this.loadAttendance()
            ];

            await Promise.allSettled(promises);
            
            Utils.Debug.log('All data loaded successfully');
            
        } catch (error) {
            Utils.Debug.error('Error loading data:', error);
            throw error;
        }
    }

    /**
     * Generic retry mechanism for database operations
     */
    async retry(operation, attempts = this.retryAttempts) {
        for (let i = 0; i < attempts; i++) {
            try {
                return await operation();
            } catch (error) {
                if (i === attempts - 1) throw error;
                
                Utils.Debug.log(`Retry attempt ${i + 1}/${attempts} after error:`, error.message);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * (i + 1)));
            }
        }
    }

    /**
     * Load projects
     */
    async loadProjects() {
        try {
            const { data, error } = await this.retry(async () => {
                return await window.supabaseClient
                    .from(window.AstraCore.TABLES.PROJECTS)
                    .select('*')
                    .order('created_at', { ascending: false });
            });

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            window.appState.data.projects = data || [];
            Utils.Debug.log(`Loaded ${data?.length || 0} projects`);
            
        } catch (error) {
            Utils.Debug.error('Error loading projects:', error);
            window.appState.data.projects = [];
        }
    }

    /**
     * Load transactions
     */
    async loadTransactions() {
        try {
            const { data, error } = await this.retry(async () => {
                return await window.supabaseClient
                    .from(window.AstraCore.TABLES.TRANSACTIONS)
                    .select('*')
                    .order('created_at', { ascending: false });
            });

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            window.appState.data.transactions = data || [];
            Utils.Debug.log(`Loaded ${data?.length || 0} transactions`);
            
        } catch (error) {
            Utils.Debug.error('Error loading transactions:', error);
            window.appState.data.transactions = [];
        }
    }

    /**
     * Load invoices
     */
    async loadInvoices() {
        try {
            const { data, error } = await this.retry(async () => {
                return await window.supabaseClient
                    .from(window.AstraCore.TABLES.INVOICES)
                    .select('*')
                    .order('created_at', { ascending: false });
            });

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            window.appState.data.invoices = data || [];
            Utils.Debug.log(`Loaded ${data?.length || 0} invoices`);
            
        } catch (error) {
            Utils.Debug.error('Error loading invoices:', error);
            window.appState.data.invoices = [];
        }
    }

    /**
     * Load employees
     */
    async loadEmployees() {
        try {
            const { data, error } = await this.retry(async () => {
                return await window.supabaseClient
                    .from(window.AstraCore.TABLES.EMPLOYEES)
                    .select('*')
                    .order('created_at', { ascending: false });
            });

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            window.appState.data.employees = data || [];
            Utils.Debug.log(`Loaded ${data?.length || 0} employees`);
            
        } catch (error) {
            Utils.Debug.error('Error loading employees:', error);
            window.appState.data.employees = [];
        }
    }

    /**
     * Load equipment
     */
    async loadEquipment() {
        try {
            const { data, error } = await this.retry(async () => {
                return await window.supabaseClient
                    .from(window.AstraCore.TABLES.EQUIPMENT)
                    .select('*')
                    .order('created_at', { ascending: false });
            });

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            window.appState.data.equipment = data || [];
            Utils.Debug.log(`Loaded ${data?.length || 0} equipment items`);
            
        } catch (error) {
            Utils.Debug.error('Error loading equipment:', error);
            window.appState.data.equipment = [];
        }
    }

    /**
     * Load materials
     */
    async loadMaterials() {
        try {
            const { data, error } = await this.retry(async () => {
                return await window.supabaseClient
                    .from(window.AstraCore.TABLES.MATERIALS)
                    .select('*')
                    .order('created_at', { ascending: false });
            });

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            window.appState.data.materials = data || [];
            Utils.Debug.log(`Loaded ${data?.length || 0} materials`);
            
        } catch (error) {
            Utils.Debug.error('Error loading materials:', error);
            window.appState.data.materials = [];
        }
    }

    /**
     * Load material purchases
     */
    async loadMaterialPurchases() {
        try {
            const { data, error } = await this.retry(async () => {
                return await window.supabaseClient
                    .from(window.AstraCore.TABLES.MATERIAL_PURCHASES)
                    .select('*')
                    .order('created_at', { ascending: false });
            });

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            window.appState.data.materialPurchases = data || [];
            Utils.Debug.log(`Loaded ${data?.length || 0} material purchases`);
            
        } catch (error) {
            Utils.Debug.error('Error loading material purchases:', error);
            window.appState.data.materialPurchases = [];
        }
    }

    /**
     * Load material usage
     */
    async loadMaterialUsage() {
        try {
            const { data, error } = await this.retry(async () => {
                return await window.supabaseClient
                    .from(window.AstraCore.TABLES.MATERIAL_USAGE)
                    .select('*')
                    .order('created_at', { ascending: false });
            });

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            window.appState.data.materialUsage = data || [];
            Utils.Debug.log(`Loaded ${data?.length || 0} material usage records`);
            
        } catch (error) {
            Utils.Debug.error('Error loading material usage:', error);
            window.appState.data.materialUsage = [];
        }
    }

    /**
     * Load equipment borrows
     */
    async loadEquipmentBorrows() {
        try {
            const { data, error } = await this.retry(async () => {
                return await window.supabaseClient
                    .from(window.AstraCore.TABLES.EQUIPMENT_BORROWS)
                    .select('*')
                    .order('created_at', { ascending: false });
            });

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            window.appState.data.equipmentBorrows = data || [];
            Utils.Debug.log(`Loaded ${data?.length || 0} equipment borrows`);
            
        } catch (error) {
            Utils.Debug.error('Error loading equipment borrows:', error);
            window.appState.data.equipmentBorrows = [];
        }
    }

    /**
     * Load attendance
     */
    async loadAttendance() {
        try {
            const { data, error } = await this.retry(async () => {
                return await window.supabaseClient
                    .from(window.AstraCore.TABLES.ATTENDANCE)
                    .select('*')
                    .order('created_at', { ascending: false });
            });

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            window.appState.data.attendance = data || [];
            Utils.Debug.log(`Loaded ${data?.length || 0} attendance records`);
            
        } catch (error) {
            Utils.Debug.error('Error loading attendance:', error);
            window.appState.data.attendance = [];
        }
    }

    /**
     * Create record
     */
    async create(table, data) {
        try {
            if (!this.isOnline) {
                throw new Error('Žádné připojení k internetu');
            }

            const { data: result, error } = await this.retry(async () => {
                return await window.supabaseClient
                    .from(table)
                    .insert([data])
                    .select();
            });

            if (error) {
                throw error;
            }

            // Update local state
            this.updateLocalState(table, 'create', result[0]);

            Utils.Debug.log(`Created record in ${table}:`, result[0]);
            return result[0];
            
        } catch (error) {
            Utils.Debug.error(`Error creating record in ${table}:`, error);
            throw error;
        }
    }

    /**
     * Update record
     */
    async update(table, id, data) {
        try {
            if (!this.isOnline) {
                throw new Error('Žádné připojení k internetu');
            }

            const { data: result, error } = await this.retry(async () => {
                return await window.supabaseClient
                    .from(table)
                    .update(data)
                    .eq('id', id)
                    .select();
            });

            if (error) {
                throw error;
            }

            // Update local state
            this.updateLocalState(table, 'update', result[0]);

            Utils.Debug.log(`Updated record in ${table}:`, result[0]);
            return result[0];
            
        } catch (error) {
            Utils.Debug.error(`Error updating record in ${table}:`, error);
            throw error;
        }
    }

    /**
     * Delete record
     */
    async delete(table, id) {
        try {
            if (!this.isOnline) {
                throw new Error('Žádné připojení k internetu');
            }

            const { error } = await this.retry(async () => {
                return await window.supabaseClient
                    .from(table)
                    .delete()
                    .eq('id', id);
            });

            if (error) {
                throw error;
            }

            // Update local state
            this.updateLocalState(table, 'delete', { id });

            Utils.Debug.log(`Deleted record from ${table}:`, id);
            return true;
            
        } catch (error) {
            Utils.Debug.error(`Error deleting record from ${table}:`, error);
            throw error;
        }
    }

    /**
     * Get records with filtering and pagination
     */
    async get(table, options = {}) {
        try {
            const {
                filters = {},
                orderBy = 'created_at',
                ascending = false,
                limit = 100,
                offset = 0
            } = options;

            let query = window.supabaseClient
                .from(table)
                .select('*');

            // Apply filters
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                    query = query.eq(key, value);
                }
            });

            // Apply ordering
            query = query.order(orderBy, { ascending });

            // Apply pagination
            if (limit) {
                query = query.range(offset, offset + limit - 1);
            }

            const { data, error } = await this.retry(async () => query);

            if (error) {
                throw error;
            }

            return data || [];
            
        } catch (error) {
            Utils.Debug.error(`Error getting records from ${table}:`, error);
            throw error;
        }
    }

    /**
     * Update local state after database operations
     */
    updateLocalState(table, operation, record) {
        const stateKey = this.getStateKey(table);
        if (!stateKey) return;

        const dataArray = window.appState.data[stateKey];

        switch (operation) {
            case 'create':
                dataArray.unshift(record);
                break;
                
            case 'update':
                const updateIndex = dataArray.findIndex(item => item.id === record.id);
                if (updateIndex !== -1) {
                    dataArray[updateIndex] = record;
                }
                break;
                
            case 'delete':
                const deleteIndex = dataArray.findIndex(item => item.id === record.id);
                if (deleteIndex !== -1) {
                    dataArray.splice(deleteIndex, 1);
                }
                break;
        }

        // Clear cache for this table
        window.appState.cache.delete(table);

        // Trigger UI update
        this.triggerUIUpdate(stateKey);
    }

    /**
     * Get state key for table
     */
    getStateKey(table) {
        const mapping = {
            [window.AstraCore.TABLES.PROJECTS]: 'projects',
            [window.AstraCore.TABLES.TRANSACTIONS]: 'transactions',
            [window.AstraCore.TABLES.INVOICES]: 'invoices',
            [window.AstraCore.TABLES.EMPLOYEES]: 'employees',
            [window.AstraCore.TABLES.EQUIPMENT]: 'equipment',
            [window.AstraCore.TABLES.MATERIALS]: 'materials',
            [window.AstraCore.TABLES.MATERIAL_PURCHASES]: 'materialPurchases',
            [window.AstraCore.TABLES.MATERIAL_USAGE]: 'materialUsage',
            [window.AstraCore.TABLES.EQUIPMENT_BORROWS]: 'equipmentBorrows',
            [window.AstraCore.TABLES.ATTENDANCE]: 'attendance'
        };
        return mapping[table];
    }

    /**
     * Trigger UI update for specific data type
     */
    triggerUIUpdate(dataType) {
        // Update dashboard if it's currently visible
        if (window.NavigationManager.getCurrentPage() === 'dashboard') {
            if (window.DashboardManager) {
                window.DashboardManager.loadDashboard();
            }
        }

        // Update specific table managers
        switch (dataType) {
            case 'projects':
                if (window.TableManager && window.NavigationManager.getCurrentPage() === 'projects') {
                    window.TableManager.loadProjectsTable();
                }
                break;
            case 'transactions':
                if (window.TableManager && window.NavigationManager.getCurrentPage() === 'finance') {
                    window.TableManager.loadTransactionsTable();
                }
                break;
            // Add more cases as needed
        }
    }

    /**
     * Setup real-time subscriptions
     */
    setupRealTimeSubscriptions() {
        if (!window.AstraCore.APP_CONFIG.FEATURES.ENABLE_REAL_TIME) {
            return;
        }

        try {
            // Subscribe to changes in important tables
            const tables = [
                window.AstraCore.TABLES.PROJECTS,
                window.AstraCore.TABLES.TRANSACTIONS,
                window.AstraCore.TABLES.INVOICES
            ];

            tables.forEach(table => {
                window.supabaseClient
                    .channel(`public:${table}`)
                    .on('postgres_changes', 
                        { event: '*', schema: 'public', table: table },
                        (payload) => {
                            this.handleRealTimeUpdate(table, payload);
                        }
                    )
                    .subscribe();
            });

            Utils.Debug.log('Real-time subscriptions setup complete');
            
        } catch (error) {
            Utils.Debug.error('Error setting up real-time subscriptions:', error);
        }
    }

    /**
     * Handle real-time updates
     */
    handleRealTimeUpdate(table, payload) {
        Utils.Debug.log(`Real-time update for ${table}:`, payload);

        const { eventType, new: newRecord, old: oldRecord } = payload;

        switch (eventType) {
            case 'INSERT':
                this.updateLocalState(table, 'create', newRecord);
                break;
            case 'UPDATE':
                this.updateLocalState(table, 'update', newRecord);
                break;
            case 'DELETE':
                this.updateLocalState(table, 'delete', oldRecord);
                break;
        }
    }

    /**
     * Cache management
     */
    getCached(key) {
        return window.appState.cache.get(key);
    }

    setCached(key, data, ttl = 300000) { // 5 minutes default TTL
        window.appState.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }

    isCacheValid(key) {
        const cached = window.appState.cache.get(key);
        if (!cached) return false;
        return Date.now() - cached.timestamp < cached.ttl;
    }

    clearCache() {
        window.appState.cache.clear();
        Utils.Debug.log('Cache cleared');
    }

    /**
     * Cleanup database manager
     */
    cleanup() {
        // Unsubscribe from real-time channels
        if (window.supabaseClient) {
            window.supabaseClient.removeAllChannels();
        }
        
        // Clear cache
        this.clearCache();
        
        Utils.Debug.log('Database manager cleaned up');
    }
}

// Create global database manager instance
window.DatabaseManager = new DatabaseManager();

Utils.Debug.log('Database module loaded successfully');
