import React, { useState, useEffect } from 'react'
import { Button, Card, Input } from '../../components/ui'
import { formatCurrency, formatDate } from '../../utils/helpers'

const ReportsPage = () => {
  const [selectedReport, setSelectedReport] = useState('financial')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportData, setReportData] = useState(null)

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

  const generateReport = async () => {
    setIsGenerating(true)
    try {
      // Mock data generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockData = {
        financial: {
          totalIncome: 2450000,
          totalExpenses: 1650000,
          profit: 800000,
          profitMargin: 32.65,
          topExpenseCategories: [
            { name: 'Materiál', amount: 850000 },
            { name: 'Mzdy', amount: 450000 },
            { name: 'Nářadí', amount: 180000 },
            { name: 'Pohonné hmoty', amount: 120000 }
          ]
        },
        projects: {
          totalProjects: 12,
          completedProjects: 8,
          activeProjects: 3,
          overdue: 1,
          averageDelay: 5.2,
          completionRate: 66.7
        },
        employees: {
          totalEmployees: 15,
          averageHours: 162.5,
          productivity: 87.3,
          attendance: 94.2,
          topPerformers: [
            { name: 'Jan Dvořák', hours: 180, projects: 3 },
            { name: 'Petr Svoboda', hours: 175, projects: 2 },
            { name: 'Marie Nováková', hours: 170, projects: 4 }
          ]
        }
      }
      
      setReportData(mockData[selectedReport])
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const exportReport = (format) => {
    // Mock export functionality
    console.log(`Exporting report as ${format}`)
    // In real implementation, generate and download file
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
          onClick={() => generateReport()}
          loading={isGenerating}
          icon="fas fa-chart-bar"
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
            />
            <Input
              label="Datum do"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
            <div className="flex items-end">
              <Button
                onClick={generateReport}
                loading={isGenerating}
                className="w-full"
                icon="fas fa-refresh"
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
                onClick={() => exportReport('pdf')}
                icon="fas fa-file-pdf"
              >
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportReport('excel')}
                icon="fas fa-file-excel"
              >
                Excel
              </Button>
            </div>
          </div>
          
          <div className="p-6">
            {selectedReport === 'financial' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(reportData.totalIncome)}
                    </div>
                    <div className="text-sm text-gray-600">Celkové příjmy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(reportData.totalExpenses)}
                    </div>
                    <div className="text-sm text-gray-600">Celkové výdaje</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(reportData.profit)}
                    </div>
                    <div className="text-sm text-gray-600">Čistý zisk</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {reportData.profitMargin}%
                    </div>
                    <div className="text-sm text-gray-600">Marže</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top kategorie výdajů</h3>
                  <div className="space-y-3">
                    {reportData.topExpenseCategories.map((category, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{category.name}</span>
                        <span className="text-lg font-bold">{formatCurrency(category.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedReport === 'projects' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{reportData.totalProjects}</div>
                    <div className="text-sm text-gray-600">Celkem projektů</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{reportData.completedProjects}</div>
                    <div className="text-sm text-gray-600">Dokončené</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{reportData.overdue}</div>
                    <div className="text-sm text-gray-600">Po termínu</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900">Průměrné zpoždění</div>
                    <div className="text-2xl font-bold text-yellow-600">{reportData.averageDelay} dní</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900">Míra dokončení</div>
                    <div className="text-2xl font-bold text-green-600">{reportData.completionRate}%</div>
                  </div>
                </div>
              </div>
            )}

            {selectedReport === 'employees' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{reportData.totalEmployees}</div>
                    <div className="text-sm text-gray-600">Zaměstnanců</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{reportData.averageHours}h</div>
                    <div className="text-sm text-gray-600">Průměr hodin</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{reportData.productivity}%</div>
                    <div className="text-sm text-gray-600">Produktivita</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{reportData.attendance}%</div>
                    <div className="text-sm text-gray-600">Docházka</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top výkonnost</h3>
                  <div className="space-y-3">
                    {reportData.topPerformers.map((performer, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{performer.name}</span>
                        <div className="flex space-x-4 text-sm">
                          <span>{performer.hours}h</span>
                          <span>{performer.projects} projektů</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
                <li>• PDF pro prezentace a archivaci</li>
                <li>• Excel pro další analýzy</li>
                <li>• Možnost automatického zasílání</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ReportsPage
