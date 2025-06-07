import { create } from 'zustand'
import { toast } from 'react-hot-toast'

// Constants
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error', 
  WARNING: 'warning',
  INFO: 'info'
}

export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium', 
  HIGH: 'high',
  URGENT: 'urgent'
}

// Debug mode
const DEBUG = process.env.NODE_ENV === 'development'

const debugLog = (message, data = null) => {
  if (DEBUG) {
    console.log(`[Notifications] ${message}`, data)
  }
}

// Toast notification service for temporary messages
export const notificationService = {
  success: (message, options = {}) => {
    debugLog('Success notification:', message)
    return notificationService.show(message, NOTIFICATION_TYPES.SUCCESS, options)
  },

  error: (message, options = {}) => {
    debugLog('Error notification:', message)
    return notificationService.show(message, NOTIFICATION_TYPES.ERROR, options)
  },

  warning: (message, options = {}) => {
    debugLog('Warning notification:', message)
    return notificationService.show(message, NOTIFICATION_TYPES.WARNING, options)
  },

  info: (message, options = {}) => {
    debugLog('Info notification:', message)
    return notificationService.show(message, NOTIFICATION_TYPES.INFO, options)
  },

  show: (message, type = NOTIFICATION_TYPES.INFO, options = {}) => {
    const defaultOptions = {
      duration: 4000,
      position: 'top-right'
    }

    const updateOptions = {
      ...defaultOptions,
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

  dismiss: (toastId) => {
    debugLog('Dismissing notification:', toastId)
    toast.dismiss(toastId)
  },

  dismissAll: () => {
    debugLog('Dismissing all notifications')
    toast.dismiss()
  },

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
export const useNotificationsStore = create((set, get) => ({
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
      icon: 'fas fa-info-circle',
      color: 'text-blue-600',
      category: 'general',
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
        unreadCount: wasUnread ? 
          Math.max(0, state.unreadCount - 1) : state.unreadCount
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
  },

  // Inicializace s demo daty (pro testování)
  initializeDemoData: () => {
    const demoNotifications = [
      {
        title: 'Nový projekt',
        message: 'Projekt "Stavba domu" byl přidělen',
        icon: 'fas fa-building',
        color: 'text-blue-600',
        category: 'projects',
        priority: NOTIFICATION_PRIORITIES.MEDIUM
      },
      {
        title: 'Faktura po splatnosti',
        message: 'Faktura #2024001 je po splatnosti',
        icon: 'fas fa-exclamation-triangle',
        color: 'text-red-600',
        category: 'invoices',
        priority: NOTIFICATION_PRIORITIES.HIGH
      },
      {
        title: 'Dokončen materiál',
        message: 'Objednávka cementu byla doručena',
        icon: 'fas fa-box',
        color: 'text-green-600',
        category: 'materials',
        priority: NOTIFICATION_PRIORITIES.LOW,
        read: true
      }
    ]

    demoNotifications.forEach(notification => {
      get().addNotification(notification)
    })
  }
}))

// Helper functions for common notification scenarios
export const notifications = {
  projectCreated: (projectName) => {
    notificationService.success(`Projekt "${projectName}" byl úspěšně vytvořen`)
    useNotificationsStore.getState().addNotification({
      title: 'Nový projekt',
      message: `Projekt "${projectName}" byl přidán`,
      icon: 'fas fa-building',
      color: 'text-blue-600',
      category: 'projects'
    })
  },

  projectCompleted: (projectName) => {
    notificationService.success(`Projekt "${projectName}" byl dokončen`)
    useNotificationsStore.getState().addNotification({
      title: 'Projekt dokončen',
      message: `Projekt "${projectName}" byl úspěšně dokončen`,
      icon: 'fas fa-check-circle',
      color: 'text-green-600',
      priority: NOTIFICATION_PRIORITIES.HIGH,
      category: 'projects'
    })
  },

  invoiceOverdue: (invoiceNumber, clientName) => {
    notificationService.warning(`Faktura ${invoiceNumber} pro ${clientName} je po splatnosti`)
    useNotificationsStore.getState().addNotification({
      title: 'Faktura po splatnosti',
      message: `Faktura ${invoiceNumber} pro ${clientName} je po splatnosti`,
      icon: 'fas fa-exclamation-triangle',
      color: 'text-red-600',
      priority: NOTIFICATION_PRIORITIES.HIGH,
      category: 'invoices'
    })
  },

  invoicePaid: (invoiceNumber) => {
    notificationService.success(`Faktura ${invoiceNumber} byla zaplacena`)
    useNotificationsStore.getState().addNotification({
      title: 'Faktura zaplacena',
      message: `Faktura ${invoiceNumber} byla označena jako zaplacená`,
      icon: 'fas fa-check-circle',
      color: 'text-green-600',
      category: 'invoices'
    })
  },

  materialLowStock: (materialName, currentStock) => {
    notificationService.warning(`Nízký stav materiálu: ${materialName} (${currentStock})`)
    useNotificationsStore.getState().addNotification({
      title: 'Nízký stav materiálu',
      message: `${materialName} má nízký stav (${currentStock})`,
      icon: 'fas fa-exclamation-triangle',
      color: 'text-orange-600',
      priority: NOTIFICATION_PRIORITIES.MEDIUM,
      category: 'materials'
    })
  },

  materialDelivered: (materialName) => {
    notificationService.success(`Materiál ${materialName} byl doručen`)
    useNotificationsStore.getState().addNotification({
      title: 'Materiál doručen',
      message: `Objednávka ${materialName} byla doručena`,
      icon: 'fas fa-box',
      color: 'text-green-600',
      category: 'materials'
    })
  }
}

export default notificationService
