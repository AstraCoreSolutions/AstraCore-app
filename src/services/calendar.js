import { supabase } from '../config/supabase'
import { debugLog, debugError } from '../utils/helpers'
import { addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, parseISO } from 'date-fns'
import { cs } from 'date-fns/locale'

/**
 * Calendar Service
 * Handles calendar events, project scheduling, and time management
 */

export const EVENT_TYPES = {
  PROJECT: 'project',
  MEETING: 'meeting',
  DEADLINE: 'deadline',
  MAINTENANCE: 'maintenance',
  VACATION: 'vacation',
  OTHER: 'other'
}

export const EVENT_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
}

export const calendarService = {
  // Get calendar events for date range
  async getEvents(startDate, endDate, filters = {}) {
    try {
      debugLog('Loading calendar events:', startDate, endDate)

      const events = []

      // Get project events
      if (!filters.excludeProjects) {
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select(`
            id, name, start_date, end_date, estimated_end_date, status,
            client:clients(name)
          `)
          .or(`start_date.gte.${startDate},end_date.lte.${endDate},estimated_end_date.lte.${endDate}`)
          .eq('is_active', true)

        if (projectsError) throw projectsError

        // Add project start events
        projects.forEach(project => {
          if (project.start_date) {
            events.push({
              id: `project-start-${project.id}`,
              title: `Začátek: ${project.name}`,
              date: project.start_date,
              time: '09:00',
              type: EVENT_TYPES.PROJECT,
              priority: EVENT_PRIORITIES.HIGH,
              description: `Začátek projektu pro ${project.client?.name || 'klienta'}`,
              projectId: project.id,
              color: '#10B981', // Green
              allDay: false
            })
          }

          // Add project end events
          const endDate = project.end_date || project.estimated_end_date
          if (endDate) {
            events.push({
              id: `project-end-${project.id}`,
              title: `Deadline: ${project.name}`,
              date: endDate,
              time: '17:00',
              type: EVENT_TYPES.DEADLINE,
              priority: EVENT_PRIORITIES.CRITICAL,
              description: `Termín dokončení projektu`,
              projectId: project.id,
              color: project.end_date ? '#EF4444' : '#F59E0B', // Red for hard deadline, amber for estimated
              allDay: false
            })
          }
        })
      }

      // Get equipment maintenance events
      if (!filters.excludeMaintenance) {
        const { data: equipment, error: equipmentError } = await supabase
          .from('equipment')
          .select('id, name, next_maintenance_date')
          .not('next_maintenance_date', 'is', null)
          .gte('next_maintenance_date', startDate)
          .lte('next_maintenance_date', endDate)

        if (equipmentError) throw equipmentError

        equipment.forEach(item => {
          events.push({
            id: `maintenance-${item.id}`,
            title: `Údržba: ${item.name}`,
            date: item.next_maintenance_date,
            time: '10:00',
            type: EVENT_TYPES.MAINTENANCE,
            priority: EVENT_PRIORITIES.MEDIUM,
            description: `Plánovaná údržba nářadí`,
            equipmentId: item.id,
            color: '#8B5CF6', // Purple
            allDay: false
          })
        })
      }

      // Get invoice due dates
      if (!filters.excludeInvoices) {
        const { data: invoices, error: invoicesError } = await supabase
          .from('invoices')
          .select(`
            id, number, due_date, total_amount, status,
            client:clients(name)
          `)
          .gte('due_date', startDate)
          .lte('due_date', endDate)
          .neq('status', 'paid')

        if (invoicesError) throw invoicesError

        invoices.forEach(invoice => {
          const isOverdue = new Date(invoice.due_date) < new Date()
          events.push({
            id: `invoice-${invoice.id}`,
            title: `Splatnost: ${invoice.number}`,
            date: invoice.due_date,
            time: '23:59',
            type: EVENT_TYPES.DEADLINE,
            priority: isOverdue ? EVENT_PRIORITIES.CRITICAL : EVENT_PRIORITIES.HIGH,
            description: `Splatnost faktury pro ${invoice.client?.name} (${invoice.total_amount} Kč)`,
            invoiceId: invoice.id,
            color: isOverdue ? '#DC2626' : '#F59E0B', // Dark red for overdue, amber for due
            allDay: true
          })
        })
      }

      // Apply additional filters
      let filteredEvents = events

      if (filters.type) {
        filteredEvents = filteredEvents.filter(event => event.type === filters.type)
      }

      if (filters.priority) {
        filteredEvents = filteredEvents.filter(event => event.priority === filters.priority)
      }

      if (filters.projectId) {
        filteredEvents = filteredEvents.filter(event => event.projectId === filters.projectId)
      }

      // Sort by date and time
      filteredEvents.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`)
        const dateB = new Date(`${b.date} ${b.time}`)
        return dateA - dateB
      })

      debugLog('Calendar events loaded:', filteredEvents.length)
      return { data: filteredEvents, error: null }

    } catch (error) {
      debugError('Failed to load calendar events:', error)
      return { data: [], error: error.message }
    }
  },

  // Get events for specific date
  async getEventsForDate(date) {
    try {
      debugLog('Loading events for date:', date)

      const { data: events, error } = await this.getEvents(date, date)

      if (error) throw new Error(error)

      return { data: events, error: null }

    } catch (error) {
      debugError('Failed to load events for date:', error)
      return { data: [], error: error.message }
    }
  },

  // Get upcoming events (next 7 days)
  async getUpcomingEvents(days = 7) {
    try {
      debugLog('Loading upcoming events for', days, 'days')

      const today = format(new Date(), 'yyyy-MM-dd')
      const futureDate = format(addDays(new Date(), days), 'yyyy-MM-dd')

      const { data: events, error } = await this.getEvents(today, futureDate)

      if (error) throw new Error(error)

      return { data: events, error: null }

    } catch (error) {
      debugError('Failed to load upcoming events:', error)
      return { data: [], error: error.message }
    }
  },

  // Get overdue items
  async getOverdueItems() {
    try {
      debugLog('Loading overdue items')

      const today = format(new Date(), 'yyyy-MM-dd')
      const overdueTasks = []

      // Overdue project deadlines
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id, name, end_date, estimated_end_date,
          client:clients(name)
        `)
        .lt('end_date', today)
        .neq('status', 'completed')
        .eq('is_active', true)

      if (projectsError) throw projectsError

      projects.forEach(project => {
        overdueTasks.push({
          id: `overdue-project-${project.id}`,
          title: `Projekt: ${project.name}`,
          dueDate: project.end_date,
          type: 'project',
          description: `Projekt pro ${project.client?.name} je po termínu`,
          priority: EVENT_PRIORITIES.CRITICAL,
          projectId: project.id
        })
      })

      // Overdue invoices
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          id, number, due_date, total_amount,
          client:clients(name)
        `)
        .lt('due_date', today)
        .neq('status', 'paid')

      if (invoicesError) throw invoicesError

      invoices.forEach(invoice => {
        overdueTasks.push({
          id: `overdue-invoice-${invoice.id}`,
          title: `Faktura: ${invoice.number}`,
          dueDate: invoice.due_date,
          type: 'invoice',
          description: `Neuhrazená faktura pro ${invoice.client?.name} (${invoice.total_amount} Kč)`,
          priority: EVENT_PRIORITIES.CRITICAL,
          invoiceId: invoice.id
        })
      })

      // Overdue maintenance
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select('id, name, next_maintenance_date')
        .lt('next_maintenance_date', today)
        .neq('status', 'maintenance')

      if (equipmentError) throw equipmentError

      equipment.forEach(item => {
        overdueTasks.push({
          id: `overdue-maintenance-${item.id}`,
          title: `Údržba: ${item.name}`,
          dueDate: item.next_maintenance_date,
          type: 'maintenance',
          description: `Nářadí vyžaduje údržbu`,
          priority: EVENT_PRIORITIES.HIGH,
          equipmentId: item.id
        })
      })

      // Sort by due date (most overdue first)
      overdueTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))

      debugLog('Overdue items loaded:', overdueTasks.length)
      return { data: overdueTasks, error: null }

    } catch (error) {
      debugError('Failed to load overdue items:', error)
      return { data: [], error: error.message }
    }
  },

  // Get calendar data for month view
  async getMonthData(year, month) {
    try {
      debugLog('Loading month data:', year, month)

      const startDate = format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd')
      const endDate = format(endOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd')

      const { data: events, error } = await this.getEvents(startDate, endDate)

      if (error) throw new Error(error)

      // Group events by date
      const eventsByDate = events.reduce((acc, event) => {
        const date = event.date
        if (!acc[date]) {
          acc[date] = []
        }
        acc[date].push(event)
        return acc
      }, {})

      debugLog('Month data loaded:', Object.keys(eventsByDate).length, 'days with events')
      return { data: eventsByDate, error: null }

    } catch (error) {
      debugError('Failed to load month data:', error)
      return { data: {}, error: error.message }
    }
  },

  // Get calendar data for week view
  async getWeekData(date) {
    try {
      debugLog('Loading week data for:', date)

      const startDate = format(startOfWeek(parseISO(date), { locale: cs }), 'yyyy-MM-dd')
      const endDate = format(endOfWeek(parseISO(date), { locale: cs }), 'yyyy-MM-dd')

      const { data: events, error } = await this.getEvents(startDate, endDate)

      if (error) throw new Error(error)

      // Group events by date
      const eventsByDate = events.reduce((acc, event) => {
        const date = event.date
        if (!acc[date]) {
          acc[date] = []
        }
        acc[date].push(event)
        return acc
      }, {})

      debugLog('Week data loaded')
      return { data: { startDate, endDate, events: eventsByDate }, error: null }

    } catch (error) {
      debugError('Failed to load week data:', error)
      return { data: { events: {} }, error: error.message }
    }
  },

  // Helper functions
  formatEventTime(event) {
    if (event.allDay) {
      return 'Celý den'
    }
    return event.time
  },

  getEventColor(event) {
    return event.color || '#6B7280' // Default gray
  },

  getEventIcon(eventType) {
    const icons = {
      [EVENT_TYPES.PROJECT]: '📁',
      [EVENT_TYPES.MEETING]: '👥',
      [EVENT_TYPES.DEADLINE]: '⏰',
      [EVENT_TYPES.MAINTENANCE]: '🔧',
      [EVENT_TYPES.VACATION]: '🏖️',
      [EVENT_TYPES.OTHER]: '📅'
    }
    return icons[eventType] || '📅'
  },

  getPriorityColor(priority) {
    const colors = {
      [EVENT_PRIORITIES.LOW]: '#10B981',      // Green
      [EVENT_PRIORITIES.MEDIUM]: '#F59E0B',   // Amber
      [EVENT_PRIORITIES.HIGH]: '#EF4444',     // Red
      [EVENT_PRIORITIES.CRITICAL]: '#DC2626'  // Dark red
    }
    return colors[priority] || '#6B7280'
  },

  // Generate iCal export
  exportToiCal(events, filename = 'calendar.ics') {
    try {
      debugLog('Exporting calendar to iCal:', events.length, 'events')

      let icalContent = 'BEGIN:VCALENDAR\r\n'
      icalContent += 'VERSION:2.0\r\n'
      icalContent += 'PRODID:-//AstraCore Solutions//Calendar//CS\r\n'
      icalContent += 'CALSCALE:GREGORIAN\r\n'

      events.forEach(event => {
        icalContent += 'BEGIN:VEVENT\r\n'
        icalContent += `UID:${event.id}@astracore.pro\r\n`
        icalContent += `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}\r\n`
        
        if (event.allDay) {
          icalContent += `DTSTART;VALUE=DATE:${event.date.replace(/-/g, '')}\r\n`
        } else {
          const dateTime = `${event.date.replace(/-/g, '')}T${event.time.replace(':', '')}00`
          icalContent += `DTSTART:${dateTime}\r\n`
        }
        
        icalContent += `SUMMARY:${event.title}\r\n`
        if (event.description) {
          icalContent += `DESCRIPTION:${event.description}\r\n`
        }
        icalContent += `PRIORITY:${event.priority === EVENT_PRIORITIES.CRITICAL ? '1' : event.priority === EVENT_PRIORITIES.HIGH ? '5' : '9'}\r\n`
        icalContent += 'END:VEVENT\r\n'
      })

      icalContent += 'END:VCALENDAR\r\n'

      // Download file
      const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      debugLog('iCal export completed')
      return { success: true }

    } catch (error) {
      debugError('Failed to export iCal:', error)
      return { success: false, error: error.message }
    }
  }
}

export default calendarService
