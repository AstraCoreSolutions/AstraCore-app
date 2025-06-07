import { create } from 'zustand'
import toast from 'react-hot-toast'
import { debugLog, debugError } from '../utils/helpers'

/**
 * Notification Service
 * Handles all notifications - toast, system alerts, email notifications
 */

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  LOADING: 'loading'
}

// Notification priorities
export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
}

// Toast notification service
export const notificationService = {
  // Show success notification
  success: (message, options = {}) => {
    debugLog('Success notification:', message)
    
    return toast.success(message, {
      duration: options.duration || 3000,
      position: options.position || 'top-right',
      icon: options.icon || '✅',
      ...options
    })
  },

  // Show error notification
  error: (message, options = {}) => {
    debugError('Error notification:', message)
    
    return toast.error(message, {
      duration: options.duration || 5000,
      position: options.position || 'top-right',
      icon: options.icon || '❌',
      ...options
    })
  },

  // Show warning notification
  warning: (message, options = {}) => {
    debugLog('Warning notification:', message)
    
    return toast(message, {
      duration: options.duration || 4000,
      position: options.position || 'top-right',
      icon: options.icon || '⚠️',
      style: {
        background: '#F59E0B',
        color: '#fff',
      },
      ...options
    })
  },

  // Show info notification
  info: (message, options = {}) => {
    debugLog('Info notification:', message)
    
    return toast(message, {
      duration: options.duration || 4000,
      position: options.position || 'top-right',
      icon: options.icon || 'ℹ️',
      style: {
        background: '#3B82F6',
        color: '#fff',
      },
      ...options
    })
  },

  // Show loading notification
  loading: (message, options = {}) => {
    debugLog('Loading notification:', message)
    
    return toast.loading(message, {
      position: options.position || 'top-right',
      ...options
    })
  },

  // Update existing notification
  update: (toastId, message, type = 'success', options = {}) => {
    debugLog('Updating notification:', toastId, message, type)
    
    const updateOptions = {
      id: toastId,
      ...options
    }

    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return toast.success(message, updateOptions)
      case NOTIFICATION_TYPES.ERROR:
        return toast.error(message, updateOptions)
      case NOTIFICATION_TYPES.WARNING:
        return toast(message, {
          ...updateOptions,
          icon: '⚠️',
          style: { background: '#F59E0B', color: '#fff' }
        })
      case NOTIFICATION_TYPES.INFO:
        return toast(message, {
          ...updateOptions,
          icon: 'ℹ️',
          style: { background: '#3B82F6', color: '#fff' }
        })
      default:
        return toast(message, updateOptions)
    }
  },

  // Dismiss notification
  dismiss: (toastId) => {
    debugLog('Dismissing notification:', toastId)
    toast.dismiss(toastId)
  },

  // Dismiss all notifications
  dismissAll: () => {
    debugLog('Dismissing all notifications')
    toast.dismiss()
  },

  // Promise-based notification
  promise: (promise, messages, options = {}) => {
    debugLog('Promise notification:', messages)
    
    return toast.promise(
      promise,
      {
        loading: messages.loading || 'Loading...',
        success: messages.success || 'Success!',
        error: messages.error || 'Something went wrong!'
      },
      {
        position: options.position || 'top-right',
        ...options
      }
    )
  }
}

// System notifications store for persistent notifications
const useNotificationsStore = create((set, get) => ({
  // State
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  // Actions
  addNotification: (notification) => {
    const newNotification = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
      priority: NOTIFICATION_PRIORITIES.MEDIUM,
      ...notification
    }

    set(state => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }))

    debugLog('Added notification:', newNotification)
    return newNotification
  },

  markAsRead: (notificationId) => {
    set(state => ({
      notifications: state.notifications.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      ),
      unreadCount: Math.max(0, state.unreadCount - 1)
    }))

    debugLog('Marked notification as read:', notificationId)
  },

  markAllAsRead: () => {
    set(state => ({
      notifications: state.notifications.map(notif => ({ ...notif, read: true })),
      unreadCount: 0
    }))

    debugLog('Marked all notifications as read')
  },

  removeNotification: (notificationId) => {
    set(state => {
      const notification = state.notifications.find(n => n.id === notificationId)
      const wasUnread = notification && !notification.read

      return {
        notifications: state.notifications.filter(notif => notif.id !== notificationId),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
      }
    })

    debugLog('Removed notification:', notificationId)
  },

  clearAllNotifications: () => {
    set({
      notifications: [],
      unreadCount: 0
    })

    debugLog('Cleared all notifications')
  },

  getUnreadNotifications: () => {
    const { notifications } = get()
    return notifications.filter(notif => !notif.read)
  },

  getNotificationsByPriority: (priority) => {
    const { notifications } = get()
    return notifications.filter(notif => notif.priority === priority)
  }
}))

// Helper functions for common notification scenarios
export const notifications = {
  // Project notifications
  projectCreated: (projectName) => {
    notificationService.success(`Projekt "${projectName}" byl úspěšně vytvořen`)
    useNotificationsStore.getState().addNotification({
      title: 'Nový projekt',
      message: `Projekt "${projectName}" byl přidán`,
      type: NOTIFICATION_TYPES.SUCCESS,
      category: 'projects'
    })
  },

  projectCompleted: (projectName) => {
    notificationService.success(`Projekt "${projectName}" byl dokončen`)
    useNotificationsStore.getState().addNotification({
      title: 'Projekt dokončen',
      message: `Projekt "${projectName}" byl úspěšně dokončen`,
      type: NOTIFICATION_TYPES.SUCCESS,
      priority: NOTIFICATION_PRIORITIES.HIGH,
      category: 'projects'
    })
  },

  // Invoice notifications
  invoiceOverdue: (invoiceNumber, clientName) => {
    notificationService.warning(`Faktura ${invoiceNumber} pro ${clientName} je po splatnosti`)
    useNotificationsStore.getState().addNotification({
      title: 'Faktura po splatnosti',
      message: `Faktura ${invoiceNumber} pro ${clientName} je po splatnosti`,
      type: NOTIFICATION_TYPES.WARNING,
      priority: NOTIFICATION_PRIORITIES.HIGH,
      category: 'invoices'
    })
  },

  invoicePaid: (invoiceNumber) => {
    notificationService.success(`Faktura ${invoiceNumber} byla zaplacena`)
    useNotificationsStore.getState().addNotification({
      title: 'Faktura zaplacena',
      message: `Faktura ${invoiceNumber} byla označena jako zaplacená`,
      type: NOTIFICATION_TYPES.SUCCESS,
      category: 'invoices'
    })
  },

  // Material notifications
  materialLowStock: (materialName, currentStock) => {
    notificationService.warning(`Nízký stav materiálu: ${materialName} (${currentStock})`)
    useNotificationsStore.getState().addNotification({
      title: 'Nízký stav materiálu',
      message: `${materialName} má nízký stav (${currentStock})`,
      type: NOTIFICATION_TYPES.WARNING,
      priority: NOTIFICATION_PRIORITIES.MEDIUM,
      category: 'materials'
    })
  },

  // Equipment notifications
  equipmentMaintenance: (equipmentName) => {
    notificationService.info(`${equipmentName} vyžaduje údržbu`)
    useNotificationsStore.getState().addNotification({
      title: 'Údržba nářadí',
      message: `${equipmentName} vyžaduje plánovanou údržbu`,
      type: NOTIFICATION_TYPES.INFO,
      priority: NOTIFICATION_PRIORITIES.MEDIUM,
      category: 'equipment'
    })
  },

  // Employee notifications
  employeeAdded: (employeeName) => {
    notificationService.success(`Zaměstnanec ${employeeName} byl přidán`)
    useNotificationsStore.getState().addNotification({
      title: 'Nový zaměstnanec',
      message: `${employeeName} byl přidán do systému`,
      type: NOTIFICATION_TYPES.SUCCESS,
      category: 'employees'
    })
  },

  // System notifications
  backupCompleted: () => {
    notificationService.success('Záloha dat byla dokončena')
    useNotificationsStore.getState().addNotification({
      title: 'Záloha dokončena',
      message: 'Automatická záloha dat byla úspěšně dokončena',
      type: NOTIFICATION_TYPES.SUCCESS,
      category: 'system'
    })
  },

  systemError: (errorMessage) => {
    notificationService.error(`Systémová chyba: ${errorMessage}`)
    useNotificationsStore.getState().addNotification({
      title: 'Systémová chyba',
      message: errorMessage,
      type: NOTIFICATION_TYPES.ERROR,
      priority: NOTIFICATION_PRIORITIES.CRITICAL,
      category: 'system'
    })
  }
}

export { useNotificationsStore }
export default notificationService
