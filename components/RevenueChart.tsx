'use client'

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js'
import { Chart } from 'react-chartjs-2'
import { useDashboard } from '@/contexts/DashboardContext'
import { useMemo } from 'react'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend)

export default function RevenueChart() {
  const { state } = useDashboard()

  const chartData = useMemo(() => {
    // Use trend data from daily accounts if available, otherwise show empty state
    if (!state.apiConnected || !state.trendData.monthly.labels.length) {
      return {
        labels: ['データ未接続'],
        datasets: [
          {
            type: 'bar' as const,
            label: '来院数',
            data: [0],
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderColor: 'rgba(59, 130, 246, 0.8)',
            borderWidth: 1,
            yAxisID: 'y',
          },
          {
            type: 'line' as const,
            label: '累積売上',
            data: [0],
            borderColor: 'rgba(239, 68, 68, 1)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 3,
            fill: false,
            tension: 0,
            yAxisID: 'y1',
          }
        ]
      }
    }

    // Use monthly trend data from daily accounts (2 years)
    const { labels, visitCounts, revenues } = state.trendData.monthly

    return {
      labels,
      datasets: [
        {
          type: 'bar' as const,
          label: '来院数',
          data: visitCounts,
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgba(59, 130, 246, 0.8)',
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          type: 'line' as const,
          label: '累積売上',
          data: revenues,
          borderColor: 'rgba(239, 68, 68, 1)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 3,
          fill: false,
          tension: 0,
          yAxisID: 'y1',
        }
      ]
    }
  }, [state.apiConnected, state.trendData.monthly])

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
          padding: 20,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            if (context.datasetIndex === 0) {
              return `来院数: ${context.parsed.y.toLocaleString()}件`
            } else {
              return `累積売上: ¥${context.parsed.y.toLocaleString()}`
            }
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
        <h2 className="text-lg font-semibold text-gray-900">売上・来院数推移（2年間）</h2>
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