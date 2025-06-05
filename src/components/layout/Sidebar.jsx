import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { usePermissions } from '../common/ProtectedRoute'
import { getNavigationItems } from '../../utils/permissions'

const Sidebar = ({ isCollapsed, onToggle }) => {
  const location = useLocation()
  const { userRole } = usePermissions()
  const [hoveredItem, setHoveredItem] = useState(null)

  const navigationItems = getNavigationItems(userRole)

  const isActiveRoute = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <aside 
      className={`
        fixed left-0 top-0 h-full bg-gray-900 text-white transition-all duration-300 z-40
        ${isCollapsed ? 'w-16' : 'w-64'}
        ${isCollapsed ? 'lg:w-16' : 'lg:w-64'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          {/* Logo */}
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold">A</span>
          </div>
          
          {/* Brand name */}
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold logo-gradient">AstraCore</span>
              <span className="text-xs text-primary-400 font-medium">SOLUTIONS</span>
            </div>
          )}
        </div>

        {/* Toggle button */}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors lg:block hidden"
        >
          <i className={`fas ${isCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'} text-sm`} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.key}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `
                  sidebar-link relative group
                  ${isActive || isActiveRoute(item.path) ? 'active bg-primary-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}
                `}
                onMouseEnter={() => setHoveredItem(item.key)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <i className={`${item.icon} w-5 text-center flex-shrink-0`} />
                
                {!isCollapsed && (
                  <span className="ml-3">{item.label}</span>
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && hoveredItem === item.key && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-50 whitespace-nowrap">
                    {item.label}
                    <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-800 rotate-45" />
                  </div>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        {!isCollapsed ? (
          <div className="text-xs text-gray-400 text-center">
            <div>AstraCore v2.0.0</div>
            <div className="mt-1">© 2024 AstraCore Solutions</div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center mx-auto">
              <i className="fas fa-info text-xs text-gray-400" />
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
