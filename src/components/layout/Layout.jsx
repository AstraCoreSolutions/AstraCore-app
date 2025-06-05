import React, { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { usePermissions } from '../common/ProtectedRoute'

const Layout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const location = useLocation()
  const { userRole } = usePermissions()

  // Close mobile sidebar when route changes
  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [location.pathname])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Get page title from current route
  const getPageTitle = () => {
    const path = location.pathname
    const titles = {
      '/dashboard': 'Dashboard',
      '/projects': 'Projekty',
      '/finance': 'Finance & Účetnictví',
      '/invoices': 'Faktury',
      '/employees': 'Zaměstnanci',
      '/materials': 'Materiál',
      '/equipment': 'Nářadí',
      '/clients': 'Klienti',
      '/suppliers': 'Dodavatelé',
      '/vehicles': 'Vozový park',
      '/documents': 'Dokumenty',
      '/reports': 'Reporty',
      '/settings': 'Nastavení'
    }

    // Check for dynamic routes
    if (path.startsWith('/projects/') && path.includes('/diary')) {
      return 'Stavební deník'
    } else if (path.startsWith('/projects/')) {
      return 'Detail projektu'
    }

    return titles[path] || 'AstraCore'
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar 
          isCollapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
        />
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <Sidebar 
            isCollapsed={false}
            onToggle={() => setMobileSidebarOpen(false)}
          />
          
          {/* Close button for mobile */}
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-lg text-white hover:bg-gray-700 lg:hidden"
          >
            <i className="fas fa-times" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`
        lg:transition-all lg:duration-300
        ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}
      `}>
        {/* Top Bar */}
        <TopBar 
          onSidebarToggle={toggleMobileSidebar}
          title={getPageTitle()}
        />

        {/* Page Content */}
        <main className="flex-1">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Role indicator for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-1 rounded-lg text-xs z-50">
          Role: {userRole}
        </div>
      )}
    </div>
  )
}

export default Layout
