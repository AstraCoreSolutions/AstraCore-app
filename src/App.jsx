import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'
import { ROUTES } from './config/routes'

// Components
import { ErrorBoundary, LoadingScreen, ProtectedRoute, AdminRoute } from './components/common'
import { Layout } from './components/layout'

// Pages
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import ProjectsPage from './pages/projects/ProjectsPage'
import ProjectDetailPage from './pages/projects/ProjectDetailPage'
import ProjectDiaryPage from './pages/projects/ProjectDiaryPage'
import FinancePage from './pages/finance/FinancePage'
import InvoicesPage from './pages/invoices/InvoicesPage'
import EmployeesPage from './pages/employees/EmployeesPage'
import MaterialsPage from './pages/materials/MaterialsPage'
import EquipmentPage from './pages/equipment/EquipmentPage'
import ClientsPage from './pages/clients/ClientsPage'
import SuppliersPage from './pages/suppliers/SuppliersPage'
import VehiclesPage from './pages/vehicles/VehiclesPage'
import DocumentsPage from './pages/documents/DocumentsPage'
import ReportsPage from './pages/reports/ReportsPage'
import SettingsPage from './pages/settings/SettingsPage'

// 404 Page component
const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
        <i className="fas fa-exclamation-triangle text-3xl text-gray-400" />
      </div>
      <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
      <p className="text-gray-600 mb-6">Stránka nebyla nalezena</p>
      <button
        onClick={() => window.history.back()}
        className="btn btn-primary"
      >
        <i className="fas fa-arrow-left mr-2" />
        Zpět
      </button>
    </div>
  </div>
)

function App() {
  const location = useLocation()
  const { initialize, isLoading, isAuthenticated } = useAuthStore()

  // Initialize auth store
  useEffect(() => {
    initialize()
  }, [initialize])

  // Show loading screen during initialization
  if (isLoading) {
    return <LoadingScreen message="Inicializuji aplikaci..." />
  }

  return (
    <ErrorBoundary>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route 
            path={ROUTES.LOGIN} 
            element={
              isAuthenticated ? 
                <Navigate to={ROUTES.DASHBOARD} replace /> : 
                <LoginPage />
            } 
          />
          
          {/* Root redirect */}
          <Route 
            path="/" 
            element={<Navigate to={ROUTES.DASHBOARD} replace />} 
          />

          {/* Protected Routes with Layout */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            {/* Dashboard */}
            <Route 
              path={ROUTES.DASHBOARD} 
              element={<DashboardPage />} 
            />

            {/* Projects */}
            <Route 
              path={ROUTES.PROJECTS} 
              element={
                <ProtectedRoute requiredPermission="projects">
                  <ProjectsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path={ROUTES.PROJECT_DETAIL} 
              element={
                <ProtectedRoute requiredPermission="projects">
                  <ProjectDetailPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path={ROUTES.PROJECT_DIARY} 
              element={
                <ProtectedRoute requiredPermission="projects">
                  <ProjectDiaryPage />
                </ProtectedRoute>
              } 
            />

            {/* Finance - Admin only */}
            <Route 
              path={ROUTES.FINANCE} 
              element={
                <AdminRoute>
                  <FinancePage />
                </AdminRoute>
              } 
            />

            {/* Invoices - Admin only */}
            <Route 
              path={ROUTES.INVOICES} 
              element={
                <AdminRoute>
                  <InvoicesPage />
                </AdminRoute>
              } 
            />

            {/* Employees */}
            <Route 
              path={ROUTES.EMPLOYEES} 
              element={
                <ProtectedRoute requiredPermission="employees">
                  <EmployeesPage />
                </ProtectedRoute>
              } 
            />

            {/* Materials */}
            <Route 
              path={ROUTES.MATERIALS} 
              element={
                <ProtectedRoute requiredPermission="materials">
                  <MaterialsPage />
                </ProtectedRoute>
              } 
            />

            {/* Equipment */}
            <Route 
              path={ROUTES.EQUIPMENT} 
              element={
                <ProtectedRoute requiredPermission="equipment">
                  <EquipmentPage />
                </ProtectedRoute>
              } 
            />

            {/* Clients */}
            <Route 
              path={ROUTES.CLIENTS} 
              element={
                <ProtectedRoute requiredPermission="clients">
                  <ClientsPage />
                </ProtectedRoute>
              } 
            />

            {/* Suppliers */}
            <Route 
              path={ROUTES.SUPPLIERS} 
              element={
                <ProtectedRoute requiredPermission="suppliers">
                  <SuppliersPage />
                </ProtectedRoute>
              } 
            />

            {/* Vehicles */}
            <Route 
              path={ROUTES.VEHICLES} 
              element={
                <ProtectedRoute requiredPermission="vehicles">
                  <VehiclesPage />
                </ProtectedRoute>
              } 
            />

            {/* Documents */}
            <Route 
              path={ROUTES.DOCUMENTS} 
              element={
                <ProtectedRoute requiredPermission="documents">
                  <DocumentsPage />
                </ProtectedRoute>
              } 
            />

            {/* Reports - Admin only */}
            <Route 
              path={ROUTES.REPORTS} 
              element={
                <AdminRoute>
                  <ReportsPage />
                </AdminRoute>
              } 
            />

            {/* Settings */}
            <Route 
              path={ROUTES.SETTINGS} 
              element={
                <ProtectedRoute requiredPermission="settings">
                  <SettingsPage />
                </ProtectedRoute>
              } 
            />
          </Route>

          {/* 404 Page */}
          <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
        </Routes>

        {/* Toast notifications */}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#48bb78',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#f56565',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </ErrorBoundary>
  )
}

export default App
