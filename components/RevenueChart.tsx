'use client'

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, BarController, LineElement, LineController, PointElement, Title, Tooltip, Legend } from 'chart.js'
import { Chart } from 'react-chartjs-2'
import { useDashboard } from '@/contexts/DashboardContext'
import { useMemo } from 'react'

ChartJS.register(CategoryScale, LinearScale, BarElement, BarController, LineElement, LineController, PointElement, Title, Tooltip, Legend)

export default function RevenueChart() {
  const { state } = useDashboard()

  const chartData = useMemo(() => {
    // Use trend data from daily accounts if available, otherwise show empty state
    if (!state.apiConnected || !state.data.clinicData) {
      return {
        labels: ['データ未接続'],
        datasets: []
      }
    }

    // Hospital configurations with colors
    const hospitalConfigs = [
      { id: 'yokohama', name: '横浜院', color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.1)' },
      { id: 'koriyama', name: '郡山院', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.1)' },
      { id: 'mito', name: '水戸院', color: '#8B5CF6', bgColor: 'rgba(139, 92, 246, 0.1)' },
      { id: 'omiya', name: '大宮院', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.1)' }
    ]

    // Get all months from all hospitals to create consistent labels
    const allMonths = new Set<string>()
    hospitalConfigs.forEach(hospital => {
      const clinicData = state.data.clinicData[hospital.id as keyof typeof state.data.clinicData]
      const dailyAccounts = clinicData?.dailyAccounts || []
      
      dailyAccounts.forEach(record => {
        const recordDate = new Date(record.recordDate)
        const monthKey = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`
        allMonths.add(monthKey)
      })
    })

    // Sort months chronologically
    const sortedMonths = Array.from(allMonths).sort()

    // Calculate data for each hospital
    const datasets: any[] = []
    
    hospitalConfigs.forEach(hospital => {
      const clinicData = state.data.clinicData[hospital.id as keyof typeof state.data.clinicData]
      const dailyAccounts = clinicData?.dailyAccounts || []
      
      // Calculate monthly data for this hospital
      const monthlyData = new Map<string, { visits: number, revenue: number }>()
      
      dailyAccounts.forEach(record => {
        const recordDate = new Date(record.recordDate)
        const monthKey = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { visits: 0, revenue: 0 })
        }
        
        const monthData = monthlyData.get(monthKey)!
        monthData.visits += 1
        monthData.revenue += record.totalWithTax || 0
      })

      // Create data arrays for this hospital (fill missing months with 0)
      const visitData = sortedMonths.map(month => monthlyData.get(month)?.visits || 0)
      const revenueData = sortedMonths.map(month => monthlyData.get(month)?.revenue || 0)

      // Add visit count dataset (bar chart)
      datasets.push({
        type: 'bar' as const,
        label: `${hospital.name} 来院数`,
        data: visitData,
        backgroundColor: hospital.bgColor,
        borderColor: hospital.color,
        borderWidth: 1,
        yAxisID: 'y',
        stack: 'visits', // Stack bars for visits
      })

      // Add revenue dataset (line chart)
      datasets.push({
        type: 'line' as const,
        label: `${hospital.name} 売上`,
        data: revenueData,
        borderColor: hospital.color,
        backgroundColor: hospital.bgColor,
        borderWidth: 3,
        fill: false,
        tension: 0.1,
        yAxisID: 'y1',
      })
    })

    return {
      labels: sortedMonths,
      datasets
    }
  }, [state.apiConnected, state.data.clinicData])

  // Year-over-year comparison summary
  const yearOverYearSummary = useMemo(() => {
    if (!state.apiConnected || !state.trendData.yearOverYear) {
      return null
    }

    const { currentYear, previousYear, growth } = state.trendData.yearOverYear
    
    return {
      currentYear: {
        visits: currentYear.visits.toLocaleString(),
        revenue: `¥${currentYear.revenue.toLocaleString()}`,
        months: currentYear.months
      },
      previousYear: {
        visits: previousYear.visits.toLocaleString(),
        revenue: `¥${previousYear.revenue.toLocaleString()}`,
        months: previousYear.months
      },
      growth: {
        visits: growth.visits > 0 ? `+${growth.visits}%` : `${growth.visits}%`,
        revenue: growth.revenue > 0 ? `+${growth.revenue}%` : `${growth.revenue}%`
      }
    }
  }, [state.apiConnected, state.trendData.yearOverYear])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          filter: function(legendItem: any, chartData: any) {
            // Show only one legend item per hospital (either visits or revenue)
            return legendItem.text.includes('来院数')
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || ''
            const value = context.parsed.y
            if (label.includes('来院数')) {
              return `${label}: ${value.toLocaleString()}件`
            } else if (label.includes('売上')) {
              return `${label}: ¥${value.toLocaleString()}`
            }
            return `${label}: ${value.toLocaleString()}`
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value: any) {
            return value.toLocaleString() + '件'
          }
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: function(value: any) {
            return '¥' + (value / 1000000).toFixed(0) + 'M'
          }
        }
      },
    },
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-lg font-semibold text-gray-900">売上・来院数推移（全院比較）</h2>
        <p className="mt-1 text-sm text-gray-600">4つのクリニックの月別推移を同時表示</p>
        
        {/* Hospital Color Legend */}
        <div className="flex flex-wrap gap-4 mt-3 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#3B82F6' }}></div>
            <span className="text-gray-700">横浜院</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10B981' }}></div>
            <span className="text-gray-700">郡山院</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#8B5CF6' }}></div>
            <span className="text-gray-700">水戸院</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#F59E0B' }}></div>
            <span className="text-gray-700">大宮院</span>
          </div>
        </div>
        {yearOverYearSummary && (
          <div className="mt-2 text-sm text-gray-600">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <span className="font-medium">今年:</span>
                <span>来院数 {yearOverYearSummary.currentYear.visits}件</span>
                <span>売上 {yearOverYearSummary.currentYear.revenue}</span>
                <span className="font-medium text-green-600">
                  {yearOverYearSummary.growth.visits} / {yearOverYearSummary.growth.revenue}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="card-content">
        <div className="chart-container">
          <Chart type="bar" data={chartData} options={options} />
        </div>
        {yearOverYearSummary && (
          <div className="p-3 mt-4 rounded-lg bg-gray-50">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="mb-2 font-medium text-gray-700">今年の実績</h4>
                <div className="space-y-1">
                  <div>来院数: {yearOverYearSummary.currentYear.visits}件</div>
                  <div>売上: {yearOverYearSummary.currentYear.revenue}</div>
                </div>
              </div>
              <div>
                <h4 className="mb-2 font-medium text-gray-700">前年同期比較</h4>
                <div className="space-y-1">
                  <div>来院数: {yearOverYearSummary.previousYear.visits}件</div>
                  <div>売上: {yearOverYearSummary.previousYear.revenue}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}