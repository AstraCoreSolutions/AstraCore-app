<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AstraCore Solutions - Stavební Management</title>
    
    <!-- External CSS -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    
    <!-- Custom CSS -->
    <link href="css/styles.css" rel="stylesheet">
    <link href="css/components.css" rel="stylesheet">
</head>
<body>
    <!-- Loading Screen -->
    <div id="loadingScreen" class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style="background: rgba(255,255,255,0.95); z-index: 9999;">
        <div class="text-center">
            <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;"></div>
            <h5 class="text-muted">Načítání aplikace...</h5>
        </div>
    </div>

    <!-- Login Screen -->
    <div id="loginScreen" class="login-container" style="display: none;">
        <div class="login-card">
            <div class="login-logo">A</div>
            <h2 class="text-center mb-4">AstraCore Solutions</h2>
            <div id="authContainer">
                <!-- Login Form -->
                <div id="loginForm">
                    <form id="signInForm">
                        <div class="mb-3">
                            <label class="form-label">E-mail</label>
                            <input type="email" class="form-control" id="loginEmail" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Heslo</label>
                            <input type="password" class="form-control" id="loginPassword" required>
                        </div>
                        <button type="submit" class="btn btn-primary w-100 mb-3">
                            <i class="fas fa-sign-in-alt me-2"></i>Přihlásit se
                        </button>
                    </form>
                    <div class="text-center">
                        <small class="text-muted">
                            Nemáte účet? 
                            <a href="#" onclick="showRegisterForm()" class="text-primary">Zaregistrujte se</a>
                        </small>
                    </div>
                </div>

                <!-- Register Form -->
                <div id="registerForm" style="display: none;">
                    <form id="signUpForm">
                        <div class="mb-3">
                            <label class="form-label">Celé jméno</label>
                            <input type="text" class="form-control" id="registerName" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">E-mail</label>
                            <input type="email" class="form-control" id="registerEmail" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Heslo</label>
                            <input type="password" class="form-control" id="registerPassword" required>
                        </div>
                        <button type="submit" class="btn btn-primary w-100 mb-3">
                            <i class="fas fa-user-plus me-2"></i>Zaregistrovat se
                        </button>
                    </form>
                    <div class="text-center">
                        <small class="text-muted">
                            Už máte účet? 
                            <a href="#" onclick="showLoginForm()" class="text-primary">Přihlaste se</a>
                        </small>
                    </div>
                </div>

                <!-- Messages -->
                <div id="authMessage" class="mt-3" style="display: none;"></div>
            </div>
        </div>
    </div>

    <!-- Main Application -->
    <div id="mainApp" style="display: none;">
        <!-- Sidebar -->
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <a href="#" class="sidebar-logo">
                    <div class="sidebar-logo-icon">A</div>
                    <span class="sidebar-logo-text">AstraCore</span>
                </a>
                <button class="sidebar-toggle" onclick="toggleSidebar()">
                    <i class="fas fa-bars"></i>
                </button>
            </div>
            
            <nav class="sidebar-menu">
                <div class="sidebar-item">
                    <a href="#dashboard" class="sidebar-link active" onclick="navigateTo('dashboard', this)">
                        <i class="fas fa-home sidebar-icon"></i>
                        <span class="sidebar-text">Dashboard</span>
                    </a>
                </div>
                <div class="sidebar-item">
                    <a href="#projects" class="sidebar-link" onclick="navigateTo('projects', this)">
                        <i class="fas fa-building sidebar-icon"></i>
                        <span class="sidebar-text">Projekty</span>
                    </a>
                </div>
                <div class="sidebar-item">
                    <a href="#finance" class="sidebar-link" onclick="navigateTo('finance', this)">
                        <i class="fas fa-coins sidebar-icon"></i>
                        <span class="sidebar-text">Finance</span>
                    </a>
                </div>
                <div class="sidebar-item">
                    <a href="#invoices" class="sidebar-link" onclick="navigateTo('invoices', this)">
                        <i class="fas fa-file-invoice sidebar-icon"></i>
                        <span class="sidebar-text">Faktury</span>
                    </a>
                </div>
                <div class="sidebar-item">
                    <a href="#employees" class="sidebar-link" onclick="navigateTo('employees', this)">
                        <i class="fas fa-users sidebar-icon"></i>
                        <span class="sidebar-text">Zaměstnanci</span>
                    </a>
                </div>
                <div class="sidebar-item">
                    <a href="#equipment" class="sidebar-link" onclick="navigateTo('equipment', this)">
                        <i class="fas fa-tools sidebar-icon"></i>
                        <span class="sidebar-text">Nářadí</span>
                    </a>
                </div>
                <div class="sidebar-item">
                    <a href="#materials" class="sidebar-link" onclick="navigateTo('materials', this)">
                        <i class="fas fa-boxes sidebar-icon"></i>
                        <span class="sidebar-text">Materiál</span>
                    </a>
                </div>
                <div class="sidebar-item">
                    <a href="#reports" class="sidebar-link" onclick="navigateTo('reports', this)">
                        <i class="fas fa-chart-bar sidebar-icon"></i>
                        <span class="sidebar-text">Reporty</span>
                    </a>
                </div>
                <div class="sidebar-item">
                    <a href="#settings" class="sidebar-link" onclick="navigateTo('settings', this)">
                        <i class="fas fa-cog sidebar-icon"></i>
                        <span class="sidebar-text">Nastavení</span>
                    </a>
                </div>
            </nav>
        </aside>

        <!-- Main Content -->
        <div class="main-content" id="mainContent">
            <!-- Top Bar -->
            <header class="topbar">
                <div>
                    <h4 class="mb-0" id="pageTitle">Dashboard</h4>
                </div>
                
                <div class="topbar-actions">
                    <button class="topbar-btn" onclick="showNotifications()" title="Notifikace">
                        <i class="fas fa-bell"></i>
                    </button>
                    
                    <div class="dropdown">
                        <div class="user-menu" data-bs-toggle="dropdown">
                            <div class="user-avatar" id="userAvatar">A</div>
                            <div>
                                <div class="fw-semibold" id="userName">Admin</div>
                                <small class="text-muted">Administrátor</small>
                            </div>
                        </div>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item" href="#profile"><i class="fas fa-user me-2"></i>Můj profil</a></li>
                            <li><a class="dropdown-item" href="#settings"><i class="fas fa-cog me-2"></i>Nastavení</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item" onclick="signOut()"><i class="fas fa-sign-out-alt me-2"></i>Odhlásit se</a></li>
                        </ul>
                    </div>
                </div>
            </header>

            <!-- Content Area -->
            <div class="content-area">
                <!-- Dashboard Page -->
                <div id="dashboardPage" class="page-content">
                    <div class="page-header">
                        <h1 class="page-title">Dashboard</h1>
                    </div>

                    <!-- Stats Row -->
                    <div class="row mb-4">
                        <div class="col-lg-3 col-md-6 mb-4">
                            <div class="card stat-card">
                                <div class="card-body">
                                    <div class="stat-icon bg-primary bg-opacity-10 text-primary">
                                        <i class="fas fa-building"></i>
                                    </div>
                                    <div class="stat-value" id="statActiveProjects">0</div>
                                    <div class="stat-label">Aktivní projekty</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-lg-3 col-md-6 mb-4">
                            <div class="card stat-card">
                                <div class="card-body">
                                    <div class="stat-icon bg-success bg-opacity-10 text-success">
                                        <i class="fas fa-money-bill-wave"></i>
                                    </div>
                                    <div class="stat-value" id="statMonthlyRevenue">0 Kč</div>
                                    <div class="stat-label">Měsíční příjmy</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-lg-3 col-md-6 mb-4">
                            <div class="card stat-card">
                                <div class="card-body">
                                    <div class="stat-icon bg-danger bg-opacity-10 text-danger">
                                        <i class="fas fa-arrow-down"></i>
                                    </div>
                                    <div class="stat-value" id="statMonthlyExpenses">0 Kč</div>
                                    <div class="stat-label">Celkové výdaje</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-lg-3 col-md-6 mb-4">
                            <div class="card stat-card">
                                <div class="card-body">
                                    <div class="stat-icon bg-warning bg-opacity-10 text-warning">
                                        <i class="fas fa-file-invoice"></i>
                                    </div>
                                    <div class="stat-value" id="statOverdueInvoices">0</div>
                                    <div class="stat-label">Po splatnosti</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Quick Actions -->
                    <div class="row mb-4">
                        <div class="col-12">
                            <h5 class="mb-3">Rychlé akce</h5>
                            <div class="quick-actions">
                                <a href="#" class="quick-action-btn" onclick="addProject()">
                                    <i class="fas fa-plus quick-action-icon"></i>
                                    <div>Nový projekt</div>
                                </a>
                                <a href="#" class="quick-action-btn" onclick="addInvoice()">
                                    <i class="fas fa-file-invoice quick-action-icon"></i>
                                    <div>Vystavit fakturu</div>
                                </a>
                                <a href="#" class="quick-action-btn" onclick="addTransaction('expense')">
                                    <i class="fas fa-receipt quick-action-icon"></i>
                                    <div>Přidat výdaj</div>
                                </a>
                                <a href="#" class="quick-action-btn" onclick="addTransaction('income')">
                                    <i class="fas fa-arrow-up quick-action-icon"></i>
                                    <div>Přidat příjem</div>
                                </a>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Activity -->
                    <div class="row">
                        <div class="col-lg-8 mb-4">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">Aktivní projekty</h5>
                                </div>
                                <div class="card-body">
                                    <div id="recentProjectsList">
                                        <div class="text-center text-muted py-4">
                                            <i class="fas fa-building fa-3x mb-3 opacity-50"></i>
                                            <p>Zatím žádné projekty</p>
                                            <button class="btn btn-primary" onclick="addProject()">
                                                Vytvořit první projekt
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-lg-4 mb-4">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">Status</h5>
                                </div>
                                <div class="card-body">
                                    <div class="alert alert-success">
                                        <i class="fas fa-check-circle me-2"></i>
                                        Aplikace je spuštěna a funkční!
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Projects Page -->
                <div id="projectsPage" class="page-content" style="display: none;">
                    <div class="page-header">
                        <h1 class="page-title">Projekty</h1>
                    </div>
                    <div class="card">
                        <div class="card-body">
                            <p>Stránka projektů - připravena pro rozšíření</p>
                        </div>
                    </div>
                </div>

                <!-- Finance Page -->
                <div id="financePage" class="page-content" style="display: none;">
                    <div class="page-header">
                        <h1 class="page-title">Finance</h1>
                    </div>
                    <div class="card">
                        <div class="card-body">
                            <p>Stránka financí - připravena pro rozšíření</p>
                        </div>
                    </div>
                </div>

                <!-- Invoices Page -->
                <div id="invoicesPage" class="page-content" style="display: none;">
                    <div class="page-header">
                        <h1 class="page-title">Faktury</h1>
                    </div>
                    <div class="card">
                        <div class="card-body">
                            <p>Stránka faktur - připravena pro rozšíření</p>
                        </div>
                    </div>
                </div>

                <!-- Employees Page -->
                <div id="employeesPage" class="page-content" style="display: none;">
                    <div class="page-header">
                        <h1 class="page-title">Zaměstnanci</h1>
                    </div>
                    <div class="card">
                        <div class="card-body">
                            <p>Stránka zaměstnanců - připravena pro rozšíření</p>
                        </div>
                    </div>
                </div>

                <!-- Equipment Page -->
                <div id="equipmentPage" class="page-content" style="display: none;">
                    <div class="page-header">
                        <h1 class="page-title">Nářadí a technika</h1>
                    </div>
                    <div class="card">
                        <div class="card-body">
                            <p>Stránka nářadí - připravena pro rozšíření</p>
                        </div>
                    </div>
                </div>

                <!-- Materials Page -->
                <div id="materialsPage" class="page-content" style="display: none;">
                    <div class="page-header">
                        <h1 class="page-title">Materiál a sklad</h1>
                    </div>
                    <div class="card">
                        <div class="card-body">
                            <p>Stránka materiálu - připravena pro rozšíření</p>
                        </div>
                    </div>
                </div>

                <!-- Reports Page -->
                <div id="reportsPage" class="page-content" style="display: none;">
                    <div class="page-header">
                        <h1 class="page-title">Reporty a analýzy</h1>
                    </div>
                    <div class="card">
                        <div class="card-body">
                            <p>Stránka reportů - připravena pro rozšíření</p>
                        </div>
                    </div>
                </div>

                <!-- Settings Page -->
                <div id="settingsPage" class="page-content" style="display: none;">
                    <div class="page-header">
                        <h1 class="page-title">Nastavení</h1>
                    </div>
                    <div class="card">
                        <div class="card-body">
                            <p>Stránka nastavení - připravena pro rozšíření</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- POUZE ZÁKLADNÍ SKRIPTY - BEZ KONFLIKTU -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js"></script>
    
    <!-- MINIMÁLNÍ JAVASCRIPT BEZ ŽÁDNÝCH MODULŮ -->
    <script>
    console.log('🚀 MINIMAL VERSION - Starting...');

    // Supabase setup
    const SUPABASE_URL = 'https://ikxwnpbljrsuclhmrgjw.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlreHducGJsanJzdWNsaG1yZ2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MzM5MDMsImV4cCI6MjA2NDEwOTkwM30.38VTFfklX_7ovgwMjQlcx2B7PheHbMGs6yFqygcciWo';
    
    let supabaseClient;
    let currentUser = null;

    // POUZE JEDNA INICIALIZACE
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📄 DOM ready - minimal version');
        initializeMinimalApp();
    });

    async function initializeMinimalApp() {
        try {
            console.log('🔧 Initializing minimal app...');
            
            // Initialize Supabase
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            console.log('✅ Supabase initialized');
            
            // Check auth
            const { data: { session } } = await supabaseClient.auth.getSession();
            
            if (session?.user) {
                console.log('✅ User authenticated');
                showMainApp(session.user);
            } else {
                console.log('🔐 No user, showing login');
                showLogin();
            }
            
            // Setup auth listener
            supabaseClient.auth.onAuthStateChange((event, session) => {
                console.log('Auth event:', event);
                if (event === 'SIGNED_IN' && session?.user) {
                    showMainApp(session.user);
                } else if (event === 'SIGNED_OUT') {
                    showLogin();
                }
            });
            
            setupEventHandlers();
            console.log('✅ Minimal app initialized');
            
        } catch (error) {
            console.error('❌ Minimal init failed:', error);
            showError('Chyba při inicializaci: ' + error.message);
        }
    }

    function showLogin() {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'block';
        document.getElementById('mainApp').style.display = 'none';
    }

    function showMainApp(user) {
        currentUser = user;
        
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        // Update user info
        const userName = user.user_metadata?.full_name || user.email.split('@')[0];
        document.getElementById('userName').textContent = userName;
        document.getElementById('userAvatar').textContent = userName.charAt(0).toUpperCase();
        
        console.log('✅ Main app shown for user:', userName);
    }

    function setupEventHandlers() {
        // Login form
        document.getElementById('signInForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            try {
                const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } catch (error) {
                showAuthMessage('Chyba přihlášení: ' + error.message, 'danger');
            }
        });

        // Register form
        document.getElementById('signUpForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            
            try {
                const { error } = await supabaseClient.auth.signUp({
                    email, password,
                    options: { data: { full_name: name } }
                });
                if (error) throw error;
                showAuthMessage('Registrace úspěšná! Zkontrolujte email.', 'success');
            } catch (error) {
                showAuthMessage('Chyba registrace: ' + error.message, 'danger');
            }
        });
    }

    function showError(message) {
        document.body.innerHTML = `
            <div class="container mt-5">
                <div class="alert alert-danger">
                    <h4>Chyba aplikace</h4>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">Obnovit stránku</button>
                </div>
            </div>
        `;
    }

    function showAuthMessage(message, type) {
        const msgEl = document.getElementById('authMessage');
        msgEl.style.display = 'block';
        msgEl.className = `alert alert-${type}`;
        msgEl.textContent = message;
        setTimeout(() => msgEl.style.display = 'none', 5000);
    }

    // GLOBÁLNÍ FUNKCE
    window.navigateTo = function(page, linkElement) {
        console.log('Navigate to:', page);
        
        // Hide all pages
        document.querySelectorAll('.page-content').forEach(p => p.style.display = 'none');
        
        // Show target page
        const targetPage = document.getElementById(page + 'Page');
        if (targetPage) {
            targetPage.style.display = 'block';
            document.getElementById('pageTitle').textContent = getPageTitle(page);
            
            // Update sidebar
            document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
            if (linkElement) linkElement.classList.add('active');
        }
    };

    window.toggleSidebar = function() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('sidebar-collapsed');
    };

    window.showRegisterForm = function() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
        document.getElementById('authMessage').style.display = 'none';
    };

    window.showLoginForm = function() {
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('authMessage').style.display = 'none';
    };

    window.signOut = function() {
        if (supabaseClient) {
            supabaseClient.auth.signOut();
        }
    };

    // Simple modal functions
    window.addProject = () => alert('Funkce přidání projektu bude brzy dostupná');
    window.addInvoice = () => alert('Funkce vystavení faktury bude brzy dostupná');
    window.addTransaction = (type) => alert(`Funkce přidání ${type === 'income' ? 'příjmu' : 'výdaje'} bude brzy dostupná`);
    window.showNotifications = () => alert('Notifikace budou brzy dostupné');

    function getPageTitle(page) {
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

    console.log('✅ Minimal version script loaded');
    </script>
</body>
</html>
