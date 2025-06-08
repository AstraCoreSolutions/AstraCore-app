import React, { useState, useEffect } from 'react'
import { Button, Card, Input, Table, StatCard } from '../../components/ui'
import { formatCurrency, formatDate } from '../../utils/helpers'
import { supabase } from '../../config/supabase'
import toast from 'react-hot-toast'

const ReportsPage = () => {
  const [selectedReport, setSelectedReport] = useState('financial')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportData, setReportData] = useState(null)
  const [filters, setFilters] = useState({
    projectId: '',
    employeeId: '',
    clientId: ''
  })

  // Set default date range to current month
  useEffect(() => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    setDateFrom(firstDay.toISOString().split('T')[0])
    setDateTo(lastDay.toISOString().split('T')[0])
  }, [])

  const reportTypes = [
    {
      id: 'financial',
      title: 'Finanční přehled',
      description: 'Příjmy, výdaje a ziskovost',
      icon: 'fas fa-chart-line'
    },
    {
      id: 'projects',
      title: 'Stav projektů',
      description: 'Průběh a dokončení projektů',
      icon: 'fas fa-building'
    },
    {
      id: 'employees',
      title: 'Výkonnost zaměstnanců',
      description: 'Docházka a produktivita',
      icon: 'fas fa-users'
    },
    {
      id: 'materials',
      title: 'Spotřeba materiálu',
      description: 'Nákupy a využití materiálu',
      icon: 'fas fa-boxes'
    },
    {
      id: 'equipment',
      title: 'Využití nářadí',
      description: 'Efektivita využití nářadí',
      icon: 'fas fa-tools'
    },
    {
      id: 'clients',
      title: 'Analýza klientů',
      description: 'Spokojenost a opakovanost',
      icon: 'fas fa-user-tie'
    }
  ]

  // Generate Financial Report
  const generateFinancialReport = async () => {
    try {
      // Get transactions
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select(`
          *,
          project:projects(name),
          client:clients(name)
        `)
        .gte('transaction_date', dateFrom)
        .lte('transaction_date', dateTo)
        .order('transaction_date', { ascending: false })

      if (transError) throw transError

      // Get invoices
      const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(name),
          project:projects(name)
        `)
        .gte('issue_date', dateFrom)
        .lte('issue_date', dateTo)
        .order('issue_date', { ascending: false })

      if (invError) throw invError

      // Calculate totals
      const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)

      const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)

      const profit = income - expenses
      const profitMargin = income > 0 ? ((profit / income) * 100) : 0

      const paidInvoices = invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0)

      const unpaidInvoices = invoices
        .filter(inv => inv.status !== 'paid')
        .reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0)

      // Group expenses by category
      const expensesByCategory = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
          const category = t.category || 'Ostatní'
          acc[category] = (acc[category] || 0) + parseFloat(t.amount || 0)
          return acc
        }, {})

      const topExpenseCategories = Object.entries(expensesByCategory)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)

      return {
        summary: {
          totalIncome: income,
          totalExpenses: expenses,
          profit,
          profitMargin: profitMargin.toFixed(2)
        },
        invoices: {
          total: paidInvoices + unpaidInvoices,
          paid: paidInvoices,
          unpaid: unpaidInvoices,
          count: invoices.length
        },
        topExpenseCategories,
        transactions: transactions.map(t => ({
          ...t,
          formattedAmount: formatCurrency(t.amount),
          formattedDate: formatDate(t.transaction_date)
        })),
        invoicesList: invoices.map(inv => ({
          ...inv,
          formattedAmount: formatCurrency(inv.total_amount),
          formattedDate: formatDate(inv.issue_date)
        }))
      }
    } catch (error) {
      console.error('Error generating financial report:', error)
      throw error
    }
  }

  // Generate Projects Report
  const generateProjectsReport = async () => {
    try {
      const { data: projects, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(name),
          manager:profiles(first_name, last_name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const totalProjects = projects.length
      const completedProjects = projects.filter(p => p.status === 'completed').length
      const activeProjects = projects.filter(p => p.status === 'active').length
      const overdueProjects = projects.filter(p => 
        p.status === 'active' && 
        p.end_date && 
        new Date(p.end_date) < new Date()
      ).length

      const completionRate = totalProjects > 0 ? ((completedProjects / totalProjects) * 100) : 0

      // Calculate average delay for completed projects
      const completedWithDelay = projects.filter(p => 
        p.status === 'completed' && 
        p.end_date && 
        p.actual_end_date &&
        new Date(p.actual_end_date) > new Date(p.end_date)
      )

      const averageDelay = completedWithDelay.length > 0 
        ? completedWithDelay.reduce((sum, p) => {
            const planned = new Date(p.end_date)
            const actual = new Date(p.actual_end_date)
            const delay = Math.ceil((actual - planned) / (1000 * 60 * 60 * 24))
            return sum + delay
          }, 0) / completedWithDelay.length
        : 0

      return {
        summary: {
          totalProjects,
          completedProjects,
          activeProjects,
          overdueProjects,
          completionRate: completionRate.toFixed(1),
          averageDelay: averageDelay.toFixed(1)
        },
        projectsList: projects.map(p => ({
          ...p,
          clientName: p.client?.name || 'Bez klienta',
          managerName: p.manager ? `${p.manager.first_name} ${p.manager.last_name}` : 'Nepřiřazen',
          formattedStartDate: p.start_date ? formatDate(p.start_date) : '-',
          formattedEndDate: p.end_date ? formatDate(p.end_date) : '-',
          formattedBudget: p.budget ? formatCurrency(p.budget) : '-'
        }))
      }
    } catch (error) {
      console.error('Error generating projects report:', error)
      throw error
    }
  }

  // Generate Employees Report
  const generateEmployeesReport = async () => {
    try {
      // Get employees
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('status', 'active')

      if (empError) throw empError

      // Get attendance for the period
      const { data: attendance, error: attError } = await supabase
        .from('attendance')
        .select(`
          *,
          employee:employees(first_name, last_name)
        `)
        .gte('date', dateFrom)
        .lte('date', dateTo)

      if (attError) throw attError

      const totalEmployees = employees.length

      // Calculate statistics
      const totalHours = attendance.reduce((sum, a) => sum + parseFloat(a.hours_worked || 0), 0)
      const averageHours = totalEmployees > 0 ? (totalHours / totalEmployees) : 0

      // Employee performance
      const employeeStats = employees.map(emp => {
        const empAttendance = attendance.filter(a => a.employee_id === emp.id)
        const empHours = empAttendance.reduce((sum, a) => sum + parseFloat(a.hours_worked || 0), 0)
        const workingDays = empAttendance.length
        
        return {
          ...emp,
          totalHours: empHours,
          workingDays,
          averageHoursPerDay: workingDays > 0 ? (empHours / workingDays) : 0,
          productivity: empHours > 0 ? ((empHours / (workingDays * 8)) * 100) : 0
        }
      }).sort((a, b) => b.totalHours - a.totalHours)

      const topPerformers = employeeStats.slice(0, 5)

      return {
        summary: {
          totalEmployees,
          averageHours: averageHours.toFixed(1),
          totalHours: totalHours.toFixed(1),
          productivity: employeeStats.length > 0 
            ? (employeeStats.reduce((sum, emp) => sum + emp.productivity, 0) / employeeStats.length).toFixed(1)
            : '0'
        },
        topPerformers: topPerformers.map(emp => ({
          name: `${emp.first_name} ${emp.last_name}`,
          hours: emp.totalHours.toFixed(1),
          workingDays: emp.workingDays,
          productivity: emp.productivity.toFixed(1)
        })),
        allEmployees: employeeStats
      }
    } catch (error) {
      console.error('Error generating employees report:', error)
      throw error
    }
  }

  // Generate Materials Report
  const generateMaterialsReport = async () => {
    try {
      const { data: materials, error } = await supabase
        .from('materials')
        .select('*')
        .order('name')

      if (error) throw error

      const totalItems = materials.length
      const totalValue = materials.reduce((sum, m) => 
        sum + (parseFloat(m.price_per_unit || 0) * parseFloat(m.current_stock || 0)), 0
      )
      
      const lowStockItems = materials.filter(m => 
        parseFloat(m.current_stock || 0) <= parseFloat(m.min_stock || 0)
      )

      // Group by category
      const byCategory = materials.reduce((acc, material) => {
        const category = material.category || 'Ostatní'
        if (!acc[category]) {
          acc[category] = { count: 0, value: 0, items: [] }
        }
        acc[category].count++
        acc[category].value += parseFloat(material.price_per_unit || 0) * parseFloat(material.current_stock || 0)
        acc[category].items.push(material)
        return acc
      }, {})

      return {
        summary: {
          totalItems,
          totalValue,
          lowStockCount: lowStockItems.length,
          categoriesCount: Object.keys(byCategory).length
        },
        byCategory: Object.entries(byCategory).map(([category, data]) => ({
          category,
          count: data.count,
          value: data.value
        })),
        lowStockItems: lowStockItems.map(m => ({
          ...m,
          formattedValue: formatCurrency(parseFloat(m.price_per_unit || 0) * parseFloat(m.current_stock || 0))
        })),
        allMaterials: materials.map(m => ({
          ...m,
          formattedValue: formatCurrency(parseFloat(m.price_per_unit || 0) * parseFloat(m.current_stock || 0))
        }))
      }
    } catch (error) {
      console.error('Error generating materials report:', error)
      throw error
    }
  }

  // Main report generation function
  const generateReport = async () => {
    setIsGenerating(true)
    setReportData(null)

    try {
      let data = null

      switch (selectedReport) {
        case 'financial':
          data = await generateFinancialReport()
          break
        case 'projects':
          data = await generateProjectsReport()
          break
        case 'employees':
          data = await generateEmployeesReport()
          break
        case 'materials':
          data = await generateMaterialsReport()
          break
        default:
          toast.error('Nepodporovaný typ reportu')
          return
      }

      setReportData(data)
      toast.success('Report byl úspěšně vygenerován')

    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('Chyba při generování reportu: ' + error.message)
    } finally {
      setIsGenerating(false)
    }
  }

  // Export functions
  const exportToPDF = () => {
    toast.info('Export do PDF bude implementován v další verzi')
  }

  const exportToExcel = () => {
    if (!reportData) {
      toast.error('Nejdříve vygenerujte report')
      return
    }

    try {
      // Simple CSV export for now
      let csvContent = ''
      const reportTitle = reportTypes.find(t => t.id === selectedReport)?.title || 'Report'
      
      csvContent += `${reportTitle}\n`
      csvContent += `Období: ${formatDate(dateFrom)} - ${formatDate(dateTo)}\n\n`

      if (selectedReport === 'financial' && reportData.transactions) {
        csvContent += 'Datum,Typ,Částka,Popis,Projekt\n'
        reportData.transactions.forEach(t => {
          csvContent += `${t.formattedDate},${t.type === 'income' ? 'Příjem' : 'Výdaj'},${t.formattedAmount},"${t.description || ''}","${t.project?.name || ''}"\n`
        })
      }

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${reportTitle}_${dateFrom}_${dateTo}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Report byl exportován do CSV')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Chyba při exportu')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reporty & Analýzy</h1>
          <p className="text-gray-600">Generování a analýza obchodních dat</p>
        </div>
        <Button
          onClick={generateReport}
          loading={isGenerating}
          icon="fas fa-chart-bar"
          disabled={!dateFrom || !dateTo}
        >
          Generovat report
        </Button>
      </div>

      {/* Report Type Selection */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Typ reportu</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedReport(type.id)}
                className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                  selectedReport === type.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center mb-2">
                  <i className={`${type.icon} text-lg mr-3 ${
                    selectedReport === type.id ? 'text-primary-600' : 'text-gray-400'
                  }`} />
                  <h3 className="font-medium text-gray-900">{type.title}</h3>
                </div>
                <p className="text-sm text-gray-600">{type.description}</p>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Date Range & Filters */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Parametry reportu</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Datum od"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              required
            />
            <Input
              label="Datum do"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              required
            />
            <div className="flex items-end">
              <Button
                onClick={generateReport}
                loading={isGenerating}
                className="w-full"
                icon="fas fa-refresh"
                disabled={!dateFrom || !dateTo}
              >
                Aktualizovat
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Report Results */}
      {reportData && (
        <Card>
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Výsledky reportu - {reportTypes.find(t => t.id === selectedReport)?.title}
            </h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToPDF}
                icon="fas fa-file-pdf"
              >
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
                icon="fas fa-file-excel"
              >
                Excel
              </Button>
            </div>
          </div>

          <div className="p-6">
            {/* Financial Report */}
            {selectedReport === 'financial' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <StatCard
                    title="Celkové příjmy"
                    value={formatCurrency(reportData.summary.totalIncome)}
                    icon="fas fa-arrow-up"
                    trend="positive"
                  />
                  <StatCard
                    title="Celkové výdaje"
                    value={formatCurrency(reportData.summary.totalExpenses)}
                    icon="fas fa-arrow-down"
                    trend="negative"
                  />
                  <StatCard
                    title="Čistý zisk"
                    value={formatCurrency(reportData.summary.profit)}
                    icon="fas fa-chart-line"
                    trend={reportData.summary.profit >= 0 ? "positive" : "negative"}
                  />
                  <StatCard
                    title="Marže"
                    value={`${reportData.summary.profitMargin}%`}
                    icon="fas fa-percentage"
                  />
                </div>

                {reportData.topExpenseCategories.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Top kategorie výdajů</h3>
                    <div className="space-y-2">
                      {reportData.topExpenseCategories.map((category, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">{category.name}</span>
                          <span className="text-red-600 font-semibold">{formatCurrency(category.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Projects Report */}
            {selectedReport === 'projects' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <StatCard
                    title="Celkem projektů"
                    value={reportData.summary.totalProjects}
                    icon="fas fa-building"
                  />
                  <StatCard
                    title="Dokončené"
                    value={reportData.summary.completedProjects}
                    icon="fas fa-check-circle"
                    trend="positive"
                  />
                  <StatCard
                    title="Aktivní"
                    value={reportData.summary.activeProjects}
                    icon="fas fa-play-circle"
                  />
                  <StatCard
                    title="Úspěšnost"
                    value={`${reportData.summary.completionRate}%`}
                    icon="fas fa-percentage"
                  />
                </div>

                {reportData.summary.overdueProjects > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <i className="fas fa-exclamation-triangle text-red-500 mr-2" />
                      <span className="text-red-700 font-medium">
                        {reportData.summary.overdueProjects} projektů je po termínu
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Employees Report */}
            {selectedReport === 'employees' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <StatCard
                    title="Zaměstnanci"
                    value={reportData.summary.totalEmployees}
                    icon="fas fa-users"
                  />
                  <StatCard
                    title="Celkem hodin"
                    value={reportData.summary.totalHours}
                    icon="fas fa-clock"
                  />
                  <StatCard
                    title="Průměr/zaměstnanec"
                    value={`${reportData.summary.averageHours}h`}
                    icon="fas fa-user-clock"
                  />
                  <StatCard
                    title="Produktivita"
                    value={`${reportData.summary.productivity}%`}
                    icon="fas fa-chart-line"
                  />
                </div>

                {reportData.topPerformers.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Top výkonnost</h3>
                    <div className="space-y-2">
                      {reportData.topPerformers.map((emp, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="font-medium">{emp.name}</span>
                            <span className="text-sm text-gray-500 ml-2">({emp.workingDays} dní)</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{emp.hours}h</div>
                            <div className="text-sm text-gray-500">{emp.productivity}% produktivita</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Materials Report */}
            {selectedReport === 'materials' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <StatCard
                    title="Celkem položek"
                    value={reportData.summary.totalItems}
                    icon="fas fa-boxes"
                  />
                  <StatCard
                    title="Celková hodnota"
                    value={formatCurrency(reportData.summary.totalValue)}
                    icon="fas fa-dollar-sign"
                  />
                  <StatCard
                    title="Nízký stav"
                    value={reportData.summary.lowStockCount}
                    icon="fas fa-exclamation-triangle"
                    trend={reportData.summary.lowStockCount > 0 ? "negative" : "positive"}
                  />
                  <StatCard
                    title="Kategorií"
                    value={reportData.summary.categoriesCount}
                    icon="fas fa-tags"
                  />
                </div>

                {reportData.lowStockItems.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Materiály s nízkým stavem</h3>
                    <div className="space-y-2">
                      {reportData.lowStockItems.map((material, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div>
                            <span className="font-medium">{material.name}</span>
                            <span className="text-sm text-gray-500 ml-2">({material.category})</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-red-600">{material.current_stock} {material.unit}</div>
                            <div className="text-sm text-gray-500">Min: {material.min_stock}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nápověda k reportům</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Finanční přehled</h4>
              <ul className="space-y-1">
                <li>• Zobrazuje příjmy a výdaje za vybrané období</li>
                <li>• Počítá čistý zisk a marži</li>
                <li>• Analyzuje top kategorie výdajů</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Stav projektů</h4>
              <ul className="space-y-1">
                <li>• Přehled všech projektů a jejich stavů</li>
                <li>• Sleduje dodržování termínů</li>
                <li>• Měří efektivitu dokončování</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Výkonnost zaměstnanců</h4>
              <ul className="space-y-1">
                <li>• Hodnotí produktivitu a docházku</li>
                <li>• Porovnává výkonnost týmu</li>
                <li>• Identifikuje top výkonnost</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Export možnosti</h4>
              <ul className="space-y-1">
                <li>• CSV pro Excel analýzy</li>
                <li>• PDF bude doplněno v další verzi</li>
                <li>• Automatické pojmenování souborů</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ReportsPage
