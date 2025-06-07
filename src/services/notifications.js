import { useEffect } from 'react'
import { useNotificationsStore } from '../services/notifications'

// Custom hook pro snadnější práci s notifikacemi
export const useNotifications = () => {
  const store = useNotificationsStore()

  // Inicializace demo dat při prvním načtení (jen pro development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && store.notifications.length === 0) {
      store.initializeDemoData()
    }
  }, [])

  return {
    // State
    notifications: store.notifications,
    unreadCount: store.unreadCount,
    isLoading: store.isLoading,

    // Actions
    addNotification: store.addNotification,
    markAsRead: store.markAsRead,
    markAllAsRead: store.markAllAsRead,
    removeNotification: store.removeNotification,
    clearAll: store.clearAllNotifications,

    // Utility functions
    getUnread: store.getUnreadNotifications,
    getByPriority: store.getNotificationsByPriority,
    
    // Helpers
    hasUnread: store.unreadCount > 0,
    isEmpty: store.notifications.length === 0
  }
}

export default useNotifications
