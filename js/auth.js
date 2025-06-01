// AstraCore Solutions - Authentication Module (FIXED)

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.setupEventListeners();
    }

    /**
     * Initialize authentication
     */
    async initialize() {
        Utils.Debug.log('Initializing authentication...');
        
        try {
            // Check if user is already authenticated
            const { data: { session }, error } = await window.supabaseClient.auth.getSession();
            
            if (error) {
                Utils.Debug.error('Session check error:', error);
                this.showLogin();
                return;
            }

            if (session && session.user) {
                Utils.Debug.log('Found existing session for user:', session.user.email);
                this.currentUser = session.user;
                this.isAuthenticated = true;
                window.appState.currentUser = session.user;
                window.appState.isAuthenticated = true;
                await this.showMainApp();
            } else {
                Utils.Debug.log('No existing session found');
                this.showLogin();
            }
        } catch (error) {
            Utils.Debug.error('Auth initialization error:', error);
            this.showLogin();
        }
    }

    /**
     * Setup event listeners for forms and auth state changes
     */
    setupEventListeners() {
        // Login form
        const signInForm = document.getElementById('signInForm');
        if (signInForm) {
            signInForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.signIn();
            });
        }

        // Register form
        const signUpForm = document.getElementById('signUpForm');
        if (signUpForm) {
            signUpForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.signUp();
            });
        }

        // Auth state change listener
        if (window.supabaseClient) {
            window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
                Utils.Debug.log('Auth state changed:', event, session?.user?.email);
                
                switch (event) {
                    case 'SIGNED_IN':
                        if (session?.user) {
                            this.currentUser = session.user;
                            this.isAuthenticated = true;
                            window.appState.currentUser = session.user;
                            window.appState.isAuthenticated = true;
                            await this.showMainApp();
                        }
                        break;
                        
                    case 'SIGNED_OUT':
                        this.currentUser = null;
                        this.isAuthenticated = false;
                        window.appState.currentUser = null;
                        window.appState.isAuthenticated = false;
                        this.showLogin();
                        break;
                        
                    case 'TOKEN_REFRESHED':
                        Utils.Debug.log('Token refreshed');
                        break;
                        
                    default:
                        Utils.Debug.log('Unhandled auth event:', event);
                }
            });
        }
    }

    /**
     * Sign in user
     */
    async signIn() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        // Validation
        if (!email || !password) {
            this.showAuthMessage('Vyplňte všechna pole', 'error');
            return;
        }

        if (!Utils.Validation.isValidEmail(email)) {
            this.showAuthMessage('Neplatný formát e-mailu', 'error');
            return;
        }

        this.showAuthMessage('Přihlašování...', 'info');
        Utils.DOM.showLoading('#signInForm button[type="submit"]');

        try {
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                throw error;
            }

            // Success is handled by onAuthStateChange
            this.showAuthMessage('Přihlášení úspěšné!', 'success');
            
        } catch (error) {
            Utils.Debug.error('Sign in error:', error);
            
            let errorMessage = 'Chyba při přihlášení';
            
            switch (error.message) {
                case 'Invalid login credentials':
                    errorMessage = 'Neplatné přihlašovací údaje';
                    break;
                case 'Email not confirmed':
                    errorMessage = 'E-mail nebyl potvrzen. Zkontrolujte svou poštu.';
                    break;
                case 'Too many requests':
                    errorMessage = 'Příliš mnoho pokusů. Zkuste to později.';
                    break;
                default:
                    errorMessage = error.message || 'Neznámá chyba';
            }
            
            this.showAuthMessage(errorMessage, 'error');
        } finally {
            Utils.DOM.hideLoading('#signInForm button[type="submit"]');
        }
    }

    /**
     * Sign up new user
     */
    async signUp() {
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;

        // Validation
        if (!name || !email || !password) {
            this.showAuthMessage('Vyplňte všechna pole', 'error');
            return;
        }

        if (!Utils.Validation.isValidEmail(email)) {
            this.showAuthMessage('Neplatný formát e-mailu', 'error');
            return;
        }

        if (password.length < 6) {
            this.showAuthMessage('Heslo musí mít alespoň 6 znaků', 'error');
            return;
        }

        this.showAuthMessage('Registrace...', 'info');
        Utils.DOM.showLoading('#signUpForm button[type="submit"]');

        try {
            const { data, error } = await window.supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: name
                    }
                }
            });

            if (error) {
                throw error;
            }

            if (data.user && !data.session) {
                // Email confirmation required
                this.showAuthMessage(
                    'Registrace úspěšná! Zkontrolujte svůj e-mail pro potvrzení účtu.',
                    'success'
                );
                this.showLoginForm();
            } else if (data.session) {
                // Auto-confirmed (development mode)
                this.showAuthMessage('Registrace úspěšná!', 'success');
                // Success is handled by onAuthStateChange
            }

        } catch (error) {
            Utils.Debug.error('Sign up error:', error);
            
            let errorMessage = 'Chyba při registraci';
            
            switch (error.message) {
                case 'User already registered':
                    errorMessage = 'Uživatel s tímto e-mailem již existuje';
                    break;
                case 'Password should be at least 6 characters':
                    errorMessage = 'Heslo musí mít alespoň 6 znaků';
                    break;
                case 'Signup requires a valid password':
                    errorMessage = 'Zadejte platné heslo';
                    break;
                default:
                    errorMessage = error.message || 'Neznámá chyba';
            }
            
            this.showAuthMessage(errorMessage, 'error');
        } finally {
            Utils.DOM.hideLoading('#signUpForm button[type="submit"]');
        }
    }

    /**
     * Sign out user
     */
    async signOut() {
        try {
            Utils.Debug.log('Signing out user...');
            
            const { error } = await window.supabaseClient.auth.signOut();
            
            if (error) {
                throw error;
            }

            // Clear app state
            window.appState.currentUser = null;
            window.appState.isAuthenticated = false;
            window.appState.data = {
                projects: [],
                transactions: [],
                invoices: [],
                employees: [],
                equipment: [],
                materials: [],
                materialPurchases: [],
                materialUsage: [],
                equipmentBorrows: [],
                attendance: []
            };

            // Clear any cached data
            window.appState.cache.clear();

            Utils.Debug.log('User signed out successfully');
            
        } catch (error) {
            Utils.Debug.error('Sign out error:', error);
            // Even if there's an error, we'll show login screen
        }
    }

    /**
     * Show login screen
     */
    showLogin() {
        Utils.Debug.log('Showing login screen');
        Utils.DOM.show('#loginScreen');
        Utils.DOM.hide('#mainApp');
        this.hideAuthMessage();
        this.clearForms();
    }

    /**
     * Show main application
     */
    async showMainApp() {
        Utils.Debug.log('Showing main application');
        
        try {
            Utils.DOM.hide('#loginScreen');
            Utils.DOM.show('#mainApp');
            
            // Update user info in UI
            this.updateUserInfo();
            
            // Initialize app data and UI
            if (window.AppManager) {
                await window.AppManager.initialize();
            }
            
            Utils.Debug.log('Main app shown successfully');
            
        } catch (error) {
            Utils.Debug.error('Error showing main app:', error);
            this.showLogin();
        }
    }

    /**
     * Update user information in UI
     */
    updateUserInfo() {
        if (!this.currentUser) return;

        const userName = this.currentUser.user_metadata?.full_name || 
                        this.currentUser.email.split('@')[0];
        
        const userNameEl = document.getElementById('userName');
        const userAvatarEl = document.getElementById('userAvatar');
        
        if (userNameEl) {
            userNameEl.textContent = userName;
        }
        
        if (userAvatarEl) {
            userAvatarEl.textContent = userName.charAt(0).toUpperCase();
        }
    }

    /**
     * Show register form
     */
    showRegisterForm() {
        Utils.DOM.hide('#loginForm');
        Utils.DOM.show('#registerForm');
        this.hideAuthMessage();
        this.clearForms();
    }

    /**
     * Show login form
     */
    showLoginForm() {
        Utils.DOM.hide('#registerForm');
        Utils.DOM.show('#loginForm');
        this.hideAuthMessage();
        this.clearForms();
    }

    /**
     * Show authentication message
     */
    showAuthMessage(message, type = 'info') {
        const msgEl = document.getElementById('authMessage');
        if (!msgEl) return;

        msgEl.style.display = 'block';
        
        let className = 'alert ';
        switch(type) {
            case 'success':
                className += 'alert-success';
                break;
            case 'error':
                className += 'alert-danger';
                break;
            case 'info':
                className += 'alert-info';
                break;
            default:
                className += 'alert-secondary';
        }
        
        msgEl.className = className;
        msgEl.textContent = message;

        // Auto hide success/info messages after 5 seconds
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                this.hideAuthMessage();
            }, 5000);
        }
    }

    /**
     * Hide authentication message
     */
    hideAuthMessage() {
        const msgEl = document.getElementById('authMessage');
        if (msgEl) {
            msgEl.style.display = 'none';
        }
    }

    /**
     * Clear form inputs
     */
    clearForms() {
        // Clear login form
        const loginForm = document.getElementById('signInForm');
        if (loginForm) {
            loginForm.reset();
        }

        // Clear register form
        const registerForm = document.getElementById('signUpForm');
        if (registerForm) {
            registerForm.reset();
        }
    }

    /**
     * Check if user is authenticated
     */
    isUserAuthenticated() {
        return this.isAuthenticated && this.currentUser !== null;
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Reset password
     */
    async resetPassword(email) {
        try {
            const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email);
            
            if (error) {
                throw error;
            }

            this.showAuthMessage(
                'Odkaz pro obnovení hesla byl odeslán na váš e-mail',
                'success'
            );
            
        } catch (error) {
            Utils.Debug.error('Password reset error:', error);
            this.showAuthMessage('Chyba při odesílání e-mailu: ' + error.message, 'error');
        }
    }
}

// Create global auth manager instance
window.AuthManager = new AuthManager();

// Global functions for use in HTML onclick handlers
window.showRegisterForm = () => window.AuthManager.showRegisterForm();
window.showLoginForm = () => window.AuthManager.showLoginForm();
window.signOut = () => window.AuthManager.signOut();

Utils.Debug.log('Authentication module loaded successfully');
