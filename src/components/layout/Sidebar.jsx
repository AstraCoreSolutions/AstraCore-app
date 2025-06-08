import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { usePermissions } from '../common/ProtectedRoute'

const Sidebar = ({ isCollapsed, onToggle }) => {
  const location = useLocation()
  const { hasPermission } = usePermissions()

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: 'fas fa-chart-pie',
      permission: null,
      color: 'blue'
    },
    {
      name: 'Projekty',
      href: '/projects',
      icon: 'fas fa-building',
      permission: 'projects',
      color: 'green'
    },
    {
      name: 'Finance',
      href: '/finance',
      icon: 'fas fa-coins',
      permission: 'finance',
      color: 'yellow'
    },
    {
      name: 'Faktury',
      href: '/invoices',
      icon: 'fas fa-file-invoice-dollar',
      permission: 'finance',
      color: 'red'
    },
    {
      name: 'Zaměstnanci',
      href: '/employees',
      icon: 'fas fa-users',
      permission: 'employees',
      color: 'purple'
    },
    {
      name: 'Materiál',
      href: '/materials',
      icon: 'fas fa-boxes',
      permission: 'materials',
      color: 'orange'
    },
    {
      name: 'Nářadí',
      href: '/equipment',
      icon: 'fas fa-tools',
      permission: 'equipment',
      color: 'gray'
    },
    {
      name: 'Klienti',
      href: '/clients',
      icon: 'fas fa-handshake',
      permission: 'clients',
      color: 'teal'
    },
    {
      name: 'Dodavatelé',
      href: '/suppliers',
      icon: 'fas fa-truck',
      permission: 'suppliers',
      color: 'indigo'
    },
    {
      name: 'Vozový park',
      href: '/vehicles',
      icon: 'fas fa-car',
      permission: 'vehicles',
      color: 'cyan'
    },
    {
      name: 'Dokumenty',
      href: '/documents',
      icon: 'fas fa-folder-open',
      permission: 'documents',
      color: 'pink'
    },
    {
      name: 'Reporty',
      href: '/reports',
      icon: 'fas fa-chart-line',
      permission: 'reports',
      color: 'emerald'
    }
  ]

  const filteredItems = menuItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  )

  return (
    <div className={`h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white transition-all duration-300 ease-in-out ${
      isCollapsed ? 'w-16' : 'w-64'
    } fixed left-0 top-0 z-40 shadow-2xl border-r border-gray-700/50 flex flex-col`}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gray-800/50 backdrop-blur-sm flex-shrink-0">
        <div className={`flex items-center space-x-3 transition-all duration-300 ${
          isCollapsed ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
        }`}>
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25 ring-2 ring-primary-400/20">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
              AstraCore
            </h1>
            <p className="text-xs text-primary-300 uppercase tracking-widest font-medium">Solutions</p>
          </div>
        </div>
        
        <button
          onClick={onToggle}
          className="p-2 rounded-xl hover:bg-gray-700/50 transition-all duration-200 hidden lg:block group"
          title={isCollapsed ? 'Rozbalit menu' : 'Sbalit menu'}
        >
          <i className={`fas ${isCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'} text-gray-400 group-hover:text-white transition-colors duration-200`} />
        </button>
      </div>

      {/* Navigation - s proper scrolling */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto min-h-0" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#374151 transparent'
      }}>
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.href || 
                          (item.href !== '/dashboard' && location.pathname.startsWith(item.href))
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative overflow-hidden ${
                isActive
                  ? `bg-gradient-to-r from-${item.color}-500 to-${item.color}-600 text-white shadow-lg transform scale-105 shadow-${item.color}-500/25`
                  : `text-gray-300 hover:bg-${item.color}-500/10 hover:text-${item.color}-400 hover:scale-105`
              }`}
              title={isCollapsed ? item.name : undefined}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-0 w-1 h-full bg-white rounded-r-full shadow-lg" />
              )}
              
              {/* Icon */}
              <div className={`flex items-center justify-center w-6 h-6 ${
                isCollapsed ? '' : 'mr-3'
              } relative z-10`}>
                <i className={`${item.icon} ${isActive ? 'text-white' : `text-gray-400 group-hover:text-${item.color}-400`} transition-all duration-200 group-hover:scale-110`} />
              </div>
              
              {/* Label */}
              <span className={`${
                isCollapsed ? 'opacity-0 absolute left-full ml-6 bg-gray-800 px-2 py-1 rounded-lg shadow-lg group-hover:opacity-100 whitespace-nowrap z-50' : 'opacity-100'
              } transition-all duration-300 whitespace-nowrap font-medium relative z-10`}>
                {item.name}
              </span>

              {/* Hover effect background */}
              {!isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl" />
              )}

              {/* Subtle shine effect for active items */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer - fixed at bottom */}
      <div className="p-4 border-t border-gray-700/50 bg-gray-800/30 backdrop-blur-sm flex-shrink-0">
        <NavLink
          to="/settings"
          className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 mb-3 ${
            location.pathname === '/settings'
              ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50 hover:scale-105'
          }`}
          title={isCollapsed ? 'Nastavení' : undefined}
        >
          <div className={`flex items-center justify-center w-6 h-6 ${
            isCollapsed ? '' : 'mr-3'
          }`}>
            <i className="fas fa-cog group-hover:rotate-180 transition-transform duration-500" />
          </div>
          <span className={`${
            isCollapsed ? 'opacity-0 absolute left-full ml-6 bg-gray-800 px-2 py-1 rounded-lg shadow-lg group-hover:opacity-100 whitespace-nowrap z-50' : 'opacity-100'
          } transition-all duration-300 font-medium`}>
            Nastavení
          </span>
        </NavLink>

        {/* Version info */}
        <div className={`px-3 py-2 ${
          isCollapsed ? 'opacity-0' : 'opacity-100'
        } transition-opacity duration-300`}>
          <div className="border-t border-gray-700/50 pt-3">
            <p className="text-xs text-gray-500 font-medium">AstraCore v2.0.0</p>
            <p className="text-xs text-gray-600 mt-1">© 2024 AstraCore Solutions</p>
          </div>
        </div>

        {/* Collapsed mode tooltip */}
        {isCollapsed && (
          <div className="text-center">
            <div className="w-8 h-8 mx-auto bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center text-xs font-bold opacity-50">
              2.0
            </div>
          </div>
        )}
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        nav::-webkit-scrollbar {
          width: 4px;
        }
        nav::-webkit-scrollbar-track {
          background: transparent;
        }
        nav::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 2px;
        }
        nav::-webkit-scrollbar-thumb:hover {
          background: #4B5563;
        }
      `}</style>
    </div>
  )
}

export default Sidebar
