import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { Button } from '../ui'
import { useNotificationsStore } from '../../services/notifications'

const TopBar = ({ onSidebarToggle, title = 'Dashboard' }) => {
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuthStore()
  
  // Použití notifikačního store místo mockovaných dat
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification 
  } = useNotificationsStore()
  
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const userMenuRef = useRef(null)
  const notificationsRef = useRef(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const getUserDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`
    }
    if (profile?.first_name) {
      return profile.first_name
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'Uživatel'
  }

  const getUserInitials = () => {
    const name = getUserDisplayName()
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
  }

  const getRoleLabel = () => {
    const roleLabels = {
      admin: 'Administrátor',
      manager: 'Stavbyvedoucí',
      employee: 'Zaměstnanec'
    }
    return roleLabels[profile?.role] || 'Uživatel'
  }

  // Funkce pro práci s notifikacemi
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    // Můžete přidat navigaci na základě typu notifikace
    if (notification.category === 'projects') {
      navigate('/projekty')
    } else if (notification.category === 'invoices') {
      navigate('/finance')
    }
  }

  const handleDeleteNotification = (e, notificationId) => {
    e.stopPropagation() // Zabrání kliknutí na celou notifikaci
    removeNotification(notificationId)
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead()
  }

  const formatNotificationTime = (timestamp) => {
    const now = new Date()
    const notificationTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Právě teď'
    if (diffInMinutes < 60) return `${diffInMinutes} min`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hod`
    return `${Math.floor(diffInMinutes / 1440)} dní`
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          {/* Mobile sidebar toggle */}
          <button
            onClick={onSidebarToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <i className="fas fa-bars text-gray-600" />
          </button>

          {/* Page title */}
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Search - placeholder for future */}
          <div className="hidden md:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Hledat..."
                className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Notifikace"
            >
              <i className="fas fa-bell text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {/* Header s možností označit vše jako přečtené */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">
                    Notifikace {unreadCount > 0 && `(${unreadCount})`}
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Označit vše jako přečtené
                    </button>
                  )}
                </div>

                {/* Notifications list */}
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                      <i className="fas fa-bell-slash text-2xl mb-2" />
                      <p>Žádné notifikace</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`group px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-4 transition-colors ${
                          notification.read 
                            ? 'border-transparent bg-white' 
                            : 'border-blue-500 bg-blue-50'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <i className={`${notification.icon} ${notification.color} mt-1 text-lg`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className={`text-sm font-medium ${
                                  notification.read ? 'text-gray-700' : 'text-gray-900'
                                }`}>
                                  {notification.title}
                                </p>
                                <p className={`text-sm mt-1 ${
                                  notification.read ? 'text-gray-500' : 'text-gray-700'
                                }`}>
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {formatNotificationTime(notification.timestamp)}
                                </p>
                              </div>
                              
                              {/* Tlačítko pro smazání */}
                              <button
                                onClick={(e) => handleDeleteNotification(e, notification.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 transition-opacity ml-2"
                                title="Smazat notifikaci"
                              >
                                <i className="fas fa-times text-gray-400 hover:text-gray-600 text-xs" />
                              </button>
                            </div>

                            {/* Indikátor nepřečtené notifikace */}
                            {!notification.read && (
                              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer s odkazem na všechny notifikace */}
                {notifications.length > 0 && (
                  <div className="px-4 py-2 border-t border-gray-200">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        setShowNotifications(false)
                        navigate('/notifications') // Pokud máte stránku se všemi notifikacemi
                      }}
                    >
                      Zobrazit všechny notifikace
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title={`${getUserDisplayName()} - ${getRoleLabel()}`}
            >
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                {getUserInitials()}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-gray-900">{getUserDisplayName()}</div>
                <div className="text-xs text-gray-500">{getRoleLabel()}</div>
              </div>
              <i className="fas fa-chevron-down text-gray-400 text-xs" />
            </button>

            {/* User dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-200">
                  <div className="text-sm font-medium text-gray-900">{getUserDisplayName()}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
                
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    navigate('/profile')
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <i className="fas fa-user w-4" />
                  <span>Můj profil</span>
                </button>
                
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    navigate('/settings')
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <i className="fas fa-cog w-4" />
                  <span>Nastavení</span>
                </button>
                
                <div className="border-t border-gray-200 my-1" />
                
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <i className="fas fa-sign-out-alt w-4" />
                  <span>Odhlásit se</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default TopBar
