import { supabase } from '../supabase'
import { handleApiError } from '../utils/errorHandler'

/**
 * Employees API Service
 * Handles all employee-related operations
 */
export const employeesApi = {
  // Get all employees with profile data
  async getAll(filters = {}) {
    try {
      let query = supabase
        .from('employees')
        .select(`
          *,
          profile:profiles(
            id,
            email,
            first_name,
            last_name,
            phone,
            role,
            avatar_url,
            is_active
          )
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.department) {
        query = query.eq('department', filters.department)
      }
      if (filters.position) {
        query = query.ilike('position', `%${filters.position}%`)
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active)
      }
      if (filters.search) {
        query = query.or(`position.ilike.%${filters.search}%,employee_code.ilike.%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch employees')
    }
  },

  // Get employee by ID
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch employee')
    }
  },

  // Get employee by profile ID
  async getByProfileId(profileId) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('profile_id', profileId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch employee by profile')
    }
  },

  // Create new employee
  async create(employeeData) {
    try {
      // Generate employee code if not provided
      if (!employeeData.employee_code) {
        const { data: lastEmployee } = await supabase
          .from('employees')
          .select('employee_code')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        let nextNumber = 1
        if (lastEmployee?.employee_code) {
          const match = lastEmployee.employee_code.match(/EMP(\d+)/)
          if (match) {
            nextNumber = parseInt(match[1]) + 1
          }
        }
        employeeData.employee_code = `EMP${nextNumber.toString().padStart(3, '0')}`
      }

      const { data, error } = await supabase
        .from('employees')
        .insert([{
          ...employeeData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select(`
          *,
          profile:profiles(*)
        `)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to create employee')
    }
  },

  // Update employee
  async update(id, updates) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          profile:profiles(*)
        `)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to update employee')
    }
  },

  // Delete employee
  async delete(id) {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { data: null, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to delete employee')
    }
  },

  // Get employee attendance for date range
  async getAttendance(employeeId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          project:projects(name),
          approved_by_user:profiles!attendance_approved_by_fkey(first_name, last_name)
        `)
        .eq('employee_id', employeeId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch employee attendance')
    }
  },

  // Add attendance record
  async addAttendance(attendanceData) {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .insert([{
          ...attendanceData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select(`
          *,
          project:projects(name)
        `)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to add attendance record')
    }
  },

  // Update attendance record
  async updateAttendance(attendanceId, updates) {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', attendanceId)
        .select(`
          *,
          project:projects(name)
        `)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to update attendance record')
    }
  },

  // Get employee statistics
  async getStatistics(employeeId, year, month) {
    try {
      let startDate, endDate
      
      if (year && month) {
        startDate = `${year}-${month.toString().padStart(2, '0')}-01`
        const lastDay = new Date(year, month, 0).getDate()
        endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`
      } else if (year) {
        startDate = `${year}-01-01`
        endDate = `${year}-12-31`
      } else {
        const now = new Date()
        startDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        endDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${lastDay}`
      }

      const { data, error } = await supabase
        .from('attendance')
        .select('hours_worked, overtime_hours')
        .eq('employee_id', employeeId)
        .gte('date', startDate)
        .lte('date', endDate)

      if (error) throw error

      const statistics = {
        totalHours: data.reduce((sum, record) => sum + (record.hours_worked || 0), 0),
        overtimeHours: data.reduce((sum, record) => sum + (record.overtime_hours || 0), 0),
        workingDays: data.length,
        averageHoursPerDay: data.length > 0 ? data.reduce((sum, record) => sum + (record.hours_worked || 0), 0) / data.length : 0
      }

      return { data: statistics, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch employee statistics')
    }
  },

  // Get active employees
  async getActive() {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          profile:profiles(first_name, last_name, email, phone)
        `)
        .eq('is_active', true)
        .order('profile(first_name)')

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch active employees')
    }
  },

  // Get employees by department
  async getByDepartment(department) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          profile:profiles(first_name, last_name, email, phone)
        `)
        .eq('department', department)
        .eq('is_active', true)
        .order('profile(first_name)')

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return handleApiError(error, 'Failed to fetch employees by department')
    }
  }
}

export default employeesApi
