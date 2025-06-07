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

  const getColorClasses = (color, isActive) => {
    const colorMap = {
      blue: isActive ? 'from-blue-500 to-blue-600 text-white shadow-blue-500/25' : 'hover:bg-blue-500/10 hover:text-blue-400',
      green: isActive ? 'from-green-500 to-green-600 text-white shadow-green-500/25' : 'hover:bg-green-500/10 hover:text-green-400',
      yellow: isActive ? 'from-yellow-500 to-yellow-600 text-white shadow-yellow-500/25' : 'hover:bg-yellow-500/10 hover:text-yellow-400',
      red: isActive ? 'from-red-500 to-red-600 text-white shadow-red-500/25' : 'hover:bg-red-500/10 hover:text-red-400',
      purple: isActive ? 'from-purple-500 to-purple-600 text-white shadow-purple-500/25' : 'hover:bg-purple-500/10 hover:text-purple-400',
      orange: isActive ? 'from-orange-500 to-orange-600 text-white shadow-orange-500/25' : 'hover:bg-orange-500/10 hover:text-orange-400',
      gray: isActive ? 'from-gray-500 to-gray-600 text-white shadow-gray-500/25' : 'hover:bg-gray-500/10 hover:text-gray-400',
      teal: isActive ? 'from-teal-500 to-teal-600 text-white shadow-teal-500/25' : 'hover:bg-teal-500/10 hover:text-teal-400',
      indigo: isActive ? 'from-indigo-500 to-indigo-600 text-white shadow-indigo-500/25' : 'hover:bg-indigo-500/10 hover:text-indigo-400',
      cyan: isActive ? 'from-cyan-500 to-cyan-600 text-white shadow-cyan-500/25' : 'hover:bg-cyan-500/10 hover:text-cyan-400',
      pink: isActive ? 'from-pink-500 to-pink-600 text-white shadow-pink-500/25' : 'hover:bg-pink-500/10 hover:text-pink-400',
      emerald: isActive ? 'from-emerald-500 to-emerald-600 text-white shadow-emerald-500/25' : 'hover:bg-emerald-500/10 hover:text-emerald-400'
    }
    return colorMap[color] || colorMap.blue
  }

  return (
    <div className={`h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white transition-all duration-300 ease-in-out ${
      isCollapsed ? 'w-16' : 'w-64'
    } fixed left-0 top-0 z-40 shadow-2xl border-r border-gray-700/50`}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gray-800/50 backdrop-blur-sm">
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

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.href || 
                          (item.href !== '/dashboard' && location.pathname.startsWith(item.href))
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative overflow-hidden ${
                isActive
                  ? `bg-gradient-to-r ${getColorClasses(item.color, true)} shadow-lg transform scale-105`
                  : `text-gray-300 ${getColorClasses(item.color, false)} hover:scale-105`
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
                isCollapsed ? 'opacity-0 absolute left-full ml-6 bg-gray-800 px-2 py-1 rounded-lg shadow-lg group-hover:opacity-100' : 'opacity-100'
              } transition-all duration-300 whitespace-nowrap font-medium relative z-10`}>
                {item.name}
              </span>

              {/* Hover effect background */}
              {!isActive && (
                <div className={`absolute inset-0 bg-gradient-to-r from-${item.color}-500/10 to-${item.color}-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl`} />
              )}

              {/* Subtle shine effect for active items */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700/50 bg-gray-800/30 backdrop-blur-sm">
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
            isCollapsed ? 'opacity-0 absolute left-full ml-6 bg-gray-800 px-2 py-1 rounded-lg shadow-lg group-hover:opacity-100' : 'opacity-100'
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
    </div>
  )
}

export default Sidebar
