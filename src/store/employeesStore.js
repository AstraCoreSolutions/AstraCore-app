import { create } from 'zustand'
import { supabase, TABLES } from '../config/supabase.js'
import { EMPLOYEE_STATUS } from '../utils/constants.js'
import { debugLog, debugError } from '../utils/helpers.js'

const useEmployeesStore = create((set, get) => ({
  // State
  employees: [],
  currentEmployee: null,
  attendance: [],
  isLoading: false,
  error: null,
  filters: {
    status: '',
    position: '',
    search: ''
  },
  
  // Actions
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => {
    debugError('Employees error:', error)
    set({ error })
  },
  
  clearError: () => set({ error: null }),
  
  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
  
  // Load all employees
  loadEmployees: async () => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Loading employees...')
      
      const { data, error } = await supabase
        .from(TABLES.EMPLOYEES)
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      debugLog('Employees loaded:', data?.length || 0)
      set({ employees: data || [], isLoading: false })
      
    } catch (error) {
      debugError('Failed to load employees:', error)
      set({ error: error.message, isLoading: false })
    }
  },
  
  // Load single employee
  loadEmployee: async (employeeId) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Loading employee:', employeeId)
      
      const { data, error } = await supabase
        .from(TABLES.EMPLOYEES)
        .select('*')
        .eq('id', employeeId)
        .single()
      
      if (error) throw error
      
      debugLog('Employee loaded:', data)
      set({ currentEmployee: data, isLoading: false })
      
      return data
      
    } catch (error) {
      debugError('Failed to load employee:', error)
      set({ error: error.message, isLoading: false })
      return null
    }
  },
  
  // Add employee
  addEmployee: async (employeeData, creatorId) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Adding employee:', employeeData)
      
      const newEmployee = {
        ...employeeData,
        status: EMPLOYEE_STATUS.ACTIVE,
        created_by: creatorId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from(TABLES.EMPLOYEES)
        .insert([newEmployee])
        .select()
        .single()
      
      if (error) throw error
      
      debugLog('Employee added:', data)
      
      // Add to employees list
      set(state => ({
        employees: [data, ...state.employees],
        isLoading: false
      }))
      
      return { success: true, employee: data }
      
    } catch (error) {
      debugError('Failed to add employee:', error)
      set({ error: error.message, isLoading: false })
      return { success: false, error: error.message }
    }
  },
  
  // Update employee
  updateEmployee: async (employeeId, updates) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Updating employee:', employeeId, updates)
      
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from(TABLES.EMPLOYEES)
        .update(updateData)
        .eq('id', employeeId)
        .select()
        .single()
      
      if (error) throw error
      
      debugLog('Employee updated:', data)
      
      // Update in employees list
      set(state => ({
        employees: state.employees.map(e => e.id === employeeId ? data : e),
        currentEmployee: state.currentEmployee?.id === employeeId ? data : state.currentEmployee,
        isLoading: false
      }))
      
      return { success: true, employee: data }
      
    } catch (error) {
      debugError('Failed to update employee:', error)
      set({ error: error.message, isLoading: false })
      return { success: false, error: error.message }
    }
  },
  
  // Delete employee
  deleteEmployee: async (employeeId) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Deleting employee:', employeeId)
      
      const { error } = await supabase
        .from(TABLES.EMPLOYEES)
        .delete()
        .eq('id', employeeId)
      
      if (error) throw error
      
      debugLog('Employee deleted')
      
      // Remove from employees list
      set(state => ({
        employees: state.employees.filter(e => e.id !== employeeId),
        currentEmployee: state.currentEmployee?.id === employeeId ? null : state.currentEmployee,
        isLoading: false
      }))
      
      return { success: true }
      
    } catch (error) {
      debugError('Failed to delete employee:', error)
      set({ error: error.message, isLoading: false })
      return { success: false, error: error.message }
    }
  },
  
  // Load attendance records
  loadAttendance: async (employeeId, dateFrom, dateTo) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Loading attendance for employee:', employeeId)
      
      let query = supabase
        .from(TABLES.ATTENDANCE)
        .select(`
          *,
          employee:employees(id, first_name, last_name)
        `)
        .order('date', { ascending: false })
      
      if (employeeId) {
        query = query.eq('employee_id', employeeId)
      }
      
      if (dateFrom) {
        query = query.gte('date', dateFrom)
      }
      
      if (dateTo) {
        query = query.lte('date', dateTo)
      }
      
      const { data, error } = await query.limit(100)
      
      if (error) throw error
      
      debugLog('Attendance loaded:', data?.length || 0)
      set({ attendance: data || [], isLoading: false })
      
    } catch (error) {
      debugError('Failed to load attendance:', error)
      set({ error: error.message, isLoading: false })
    }
  },
  
  // Add attendance record
  addAttendanceRecord: async (attendanceData) => {
    set({ isLoading: true, error: null })
    
    try {
      debugLog('Adding attendance record:', attendanceData)
      
      const newRecord = {
        ...attendanceData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from(TABLES.ATTENDANCE)
        .insert([newRecord])
        .select(`
          *,
          employee:employees(id, first_name, last_name)
        `)
        .single()
      
      if (error) throw error
      
      debugLog('Attendance record added:', data)
      
      // Add to attendance list
      set(state => ({
        attendance: [data, ...state.attendance],
        isLoading: false
      }))
      
      return { success: true, record: data }
      
    } catch (error) {
      debugError('Failed to add attendance record:', error)
      set({ error: error.message, isLoading: false })
      return { success: false, error: error.message }
    }
  },
  
  // Get filtered employees
  getFilteredEmployees: () => {
    const { employees, filters } = get()
    
    return employees.filter(employee => {
      // Status filter
      if (filters.status && employee.status !== filters.status) {
        return false
      }
      
      // Position filter
      if (filters.position && employee.position !== filters.position) {
        return false
      }
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const searchFields = [
          employee.first_name,
          employee.last_name,
          employee.email,
          employee.phone,
          employee.position
        ].filter(Boolean)
        
        const matchesSearch = searchFields.some(field => 
          field.toLowerCase().includes(searchLower)
        )
        
        if (!matchesSearch) return false
      }
      
      return true
    })
  },
  
  // Get employee statistics
  getEmployeeStats: () => {
    const { employees } = get()
    
    return {
      total: employees.length,
      active: employees.filter(e => e.status === EMPLOYEE_STATUS.ACTIVE).length,
      inactive: employees.filter(e => e.status === EMPLOYEE_STATUS.INACTIVE).length,
      terminated: employees.filter(e => e.status === EMPLOYEE_STATUS.TERMINATED).length
    }
  },
  
  // Get employees by position
  getEmployeesByPosition: () => {
    const { employees } = get()
    const positions = {}
    
    employees.forEach(employee => {
      const position = employee.position || 'Neurčeno'
      if (!positions[position]) {
        positions[position] = []
      }
      positions[position].push(employee)
    })
    
    return positions
  },
  
  // Calculate employee working hours for period
  calculateWorkingHours: (employeeId, dateFrom, dateTo) => {
    const { attendance } = get()
    
    const employeeAttendance = attendance.filter(record => 
      record.employee_id === employeeId &&
      record.date >= dateFrom &&
      record.date <= dateTo
    )
    
    return employeeAttendance.reduce((total, record) => {
      return total + (parseFloat(record.hours_worked) || 0)
    }, 0)
  },
  
  // Get active employees for assignments
  getActiveEmployees: () => {
    const { employees } = get()
    return employees.filter(e => e.status === EMPLOYEE_STATUS.ACTIVE)
  }
}))

export default useEmployeesStore
