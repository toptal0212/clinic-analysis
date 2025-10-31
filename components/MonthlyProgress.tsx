'use client'

import React, { useMemo, useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend } from 'chart.js'
import { Chart } from 'react-chartjs-2'
import { AlertCircle } from 'lucide-react'
import Pagination from './Pagination'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend)

export default function MonthlyProgress() {
  const { state } = useDashboard()
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Get all daily accounts data
  const getAllDailyAccounts = () => {
    const allData: any[] = []
    
    if (state.data?.dailyAccounts && Array.isArray(state.data.dailyAccounts)) {
      allData.push(...state.data.dailyAccounts)
    }
    
    if (state.data?.clinicData) {
      Object.values(state.data.clinicData).forEach((clinic: any) => {
        if (clinic?.dailyAccounts && Array.isArray(clinic.dailyAccounts)) {
          allData.push(...clinic.dailyAccounts)
        }
      })
    }
    
    return allData
  }

  // Helper to parse date
  const parseDate = (record: any): Date | null => {
    const dateStr = record.recordDate || record.visitDate || record.treatmentDate || record.accountingDate
    if (!dateStr) return null
    const date = new Date(dateStr)
    return isNaN(date.getTime()) ? null : date
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ja-JP').format(num)
  }

  // Calculate stacked bar chart data (left chart)
  const stackedBarData = useMemo(() => {
    const allData = getAllDailyAccounts()
    if (allData.length === 0) return { labels: [], datasets: [] }

    const now = new Date()
    const months: { year: number; month: number; label: string }[] = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        year: date.getFullYear(),
        month: date.getMonth(),
        label: `${String(date.getFullYear()).slice(-2)}年${date.getMonth() + 1}月1日`
      })
    }

    // Get unique categories
    const categories = new Set<string>()
    allData.forEach((r: any) => {
      const category = r.paymentItems?.[0]?.category || r.treatmentCategory || '未分類'
      categories.add(category)
    })

    const categoryArray = Array.from(categories)
    const colorPalette = ['#10B981', '#F97316', '#EC4899', '#3B82F6', '#14B8A6', '#A78BFA', '#8B5CF6', '#9CA3AF']

    const datasets: any[] = categoryArray.map((category, idx) => ({
      type: 'bar' as const,
      label: category,
      data: months.map(m => {
        const monthData = allData.filter((r: any) => {
          const date = parseDate(r)
          if (!date) return false
          return date.getFullYear() === m.year && date.getMonth() === m.month
        })
        return monthData
          .filter((r: any) => (r.paymentItems?.[0]?.category || r.treatmentCategory || '未分類') === category)
          .reduce((sum, r) => sum + (r.totalWithTax || 0), 0)
      }),
      backgroundColor: colorPalette[idx % colorPalette.length],
      stack: 'sales'
    }))

    // Calculate total sales line
    const totalSales = months.map(m => {
      const monthData = allData.filter((r: any) => {
        const date = parseDate(r)
        if (!date) return false
        return date.getFullYear() === m.year && date.getMonth() === m.month
      })
      return monthData.reduce((sum, r) => sum + (r.totalWithTax || 0), 0)
    })

    datasets.push({
      type: 'line' as const,
      label: '合計',
      data: totalSales,
      borderColor: '#EF4444',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderWidth: 3,
      pointRadius: 4,
      pointBackgroundColor: '#EF4444',
      fill: false,
      yAxisID: 'y1'
    })

    return {
      labels: months.map(m => m.label),
      datasets
    }
  }, [state.data.dailyAccounts, state.data.clinicData])

  // Calculate multi-line chart data (right chart)
  const multiLineData = useMemo(() => {
    const allData = getAllDailyAccounts()
    if (allData.length === 0) return { labels: [], datasets: [] }

    const now = new Date()
    const months: { year: number; month: number; label: string }[] = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        year: date.getFullYear(),
        month: date.getMonth(),
        label: `${String(date.getFullYear()).slice(-2)}年${date.getMonth() + 1}月1日`
      })
    }

    const visitors = new Array(12).fill(0)
    const revenue = new Array(12).fill(0)
    const unitPrice = new Array(12).fill(0)
    const firstVisitConversion = new Array(12).fill(0)
    const repeatRate = new Array(12).fill(0)

    months.forEach((m, idx) => {
      const monthData = allData.filter((r: any) => {
        const date = parseDate(r)
        if (!date) return false
        return date.getFullYear() === m.year && date.getMonth() === m.month
      })

      visitors[idx] = monthData.length
      revenue[idx] = monthData.reduce((sum, r) => sum + (r.totalWithTax || 0), 0)
      unitPrice[idx] = monthData.length > 0 ? revenue[idx] / monthData.length : 0

      const firstVisits = monthData.filter((r: any) => r.isFirst === true || r.isFirstVisit === true).length
      firstVisitConversion[idx] = monthData.length > 0 ? (firstVisits / monthData.length) * 100 : 0

      const repeatVisits = monthData.filter((r: any) => r.isFirst === false || r.isFirstVisit === false).length
      repeatRate[idx] = monthData.length > 0 ? (repeatVisits / monthData.length) * 100 : 0
    })

    return {
      labels: months.map(m => m.label),
      datasets: [
        {
          type: 'line' as const,
          label: '来院数',
          data: visitors,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.2
        },
        {
          type: 'line' as const,
          label: '売上',
          data: revenue,
          borderColor: '#F97316',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.2,
          yAxisID: 'y1'
        },
        {
          type: 'line' as const,
          label: '会計単価',
          data: unitPrice,
          borderColor: '#F59E0B',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.2,
          yAxisID: 'y2'
        },
        {
          type: 'line' as const,
          label: '初診成約率',
          data: firstVisitConversion,
          borderColor: '#F97316',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.2,
          yAxisID: 'y3'
        },
        {
          type: 'line' as const,
          label: 'リピート率',
          data: repeatRate,
          borderColor: '#F59E0B',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.2,
          yAxisID: 'y3'
        }
      ]
    }
  }, [state.data.dailyAccounts, state.data.clinicData])

  // Calculate monthly progress table data
  const monthlyProgressData = useMemo(() => {
    const allData = getAllDailyAccounts()
    if (allData.length === 0) return []

    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastYearMonth = new Date(now.getFullYear() - 1, now.getMonth(), 1)

    // Get unique clinics
    const clinics = new Set<string>()
    allData.forEach((r: any) => {
      const clinic = r.clinicName || 'その他'
      clinics.add(clinic)
    })

    const clinicData = Array.from(clinics).map(clinic => {
      const clinicRecords = allData.filter((r: any) => (r.clinicName || 'その他') === clinic)

      // Current month data
      const currentMonthData = clinicRecords.filter((r: any) => {
        const date = parseDate(r)
        if (!date) return false
        return date >= currentMonth && date < new Date(now.getFullYear(), now.getMonth() + 1, 1)
      })

      // Last month data
      const lastMonthData = clinicRecords.filter((r: any) => {
        const date = parseDate(r)
        if (!date) return false
        return date >= lastMonth && date < currentMonth
      })

      // Last year same month data
      const lastYearData = clinicRecords.filter((r: any) => {
        const date = parseDate(r)
        if (!date) return false
        return date >= lastYearMonth && date < new Date(now.getFullYear() - 1, now.getMonth() + 1, 1)
      })

      const currentRevenue = currentMonthData.reduce((sum, r) => sum + (r.totalWithTax || 0), 0)
      const currentVisitors = currentMonthData.length
      const currentUnitPrice = currentVisitors > 0 ? currentRevenue / currentVisitors : 0

      const lastMonthRevenue = lastMonthData.reduce((sum, r) => sum + (r.totalWithTax || 0), 0)
      const lastYearRevenue = lastYearData.reduce((sum, r) => sum + (r.totalWithTax || 0), 0)

      // Calculate forecast (projection based on actual data: current revenue / days passed * days in month)
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      const daysPassed = now.getDate()
      const forecastRevenue = daysPassed > 0 ? (currentRevenue / daysPassed) * daysInMonth : currentRevenue

      // Check if KPI exists in API data (check for kpi, targetKpi, kpiTarget, or similar fields)
      // If not available, we'll show null and handle in UI
      const kpi = null // KPI not available in API - will be shown as N/A

      // Calculate percentages based on actual data only
      const momPercent = lastMonthRevenue > 0 ? (forecastRevenue / lastMonthRevenue) * 100 : 0
      const yoyPercent = lastYearRevenue > 0 ? (forecastRevenue / lastYearRevenue) * 100 : 0

      // Evaluation rank: based on actual performance vs last month (if doing better than last month, rank higher)
      // Using forecast vs last month as basis since KPI isn't available
      const performanceRatio = lastMonthRevenue > 0 ? (forecastRevenue / lastMonthRevenue) : 1
      const rank = performanceRatio >= 1.2 ? 5 : performanceRatio >= 1.1 ? 4 : performanceRatio >= 1.0 ? 3 : performanceRatio >= 0.9 ? 2 : 1

      return {
        clinic,
        evaluationRank: rank,
        forecastRevenue: Math.round(forecastRevenue),
        currentRevenue: Math.round(currentRevenue),
        currentVisitors,
        currentUnitPrice: Math.round(currentUnitPrice),
        kpi: null, // KPI not available from API
        kpiProgress: null, // KPI progress not available without KPI
        momPercent: momPercent,
        yoyPercent: yoyPercent
      }
    }).sort((a, b) => b.currentRevenue - a.currentRevenue)

    // Calculate total row
    const total = {
      clinic: '総計',
      evaluationRank: 0,
      forecastRevenue: clinicData.reduce((sum, c) => sum + c.forecastRevenue, 0),
      currentRevenue: clinicData.reduce((sum, c) => sum + c.currentRevenue, 0),
      currentVisitors: clinicData.reduce((sum, c) => sum + c.currentVisitors, 0),
      currentUnitPrice: clinicData.reduce((sum, c) => sum + c.currentVisitors, 0) > 0
        ? Math.round(clinicData.reduce((sum, c) => sum + c.currentRevenue, 0) / clinicData.reduce((sum, c) => sum + c.currentVisitors, 0))
        : 0,
      kpi: null, // KPI not available from API
      kpiProgress: null, // KPI progress not available without KPI
      momPercent: 0,
      yoyPercent: 0
    }

    // Calculate total MoM and YoY from all data
    const allCurrentMonth = allData.filter((r: any) => {
      const date = parseDate(r)
      if (!date) return false
      return date >= currentMonth && date < new Date(now.getFullYear(), now.getMonth() + 1, 1)
    })
    const allLastMonth = allData.filter((r: any) => {
      const date = parseDate(r)
      if (!date) return false
      return date >= lastMonth && date < currentMonth
    })
    const allLastYear = allData.filter((r: any) => {
      const date = parseDate(r)
      if (!date) return false
      return date >= lastYearMonth && date < new Date(now.getFullYear() - 1, now.getMonth() + 1, 1)
    })

    const allCurrentRevenue = allCurrentMonth.reduce((sum, r) => sum + (r.totalWithTax || 0), 0)
    const allLastMonthRevenue = allLastMonth.reduce((sum, r) => sum + (r.totalWithTax || 0), 0)
    const allLastYearRevenue = allLastYear.reduce((sum, r) => sum + (r.totalWithTax || 0), 0)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const daysPassed = now.getDate()
    const allForecastRevenue = daysPassed > 0 ? (allCurrentRevenue / daysPassed) * daysInMonth : 0

    total.momPercent = allLastMonthRevenue > 0 ? (allForecastRevenue / allLastMonthRevenue) * 100 : 0
    total.yoyPercent = allLastYearRevenue > 0 ? (allForecastRevenue / allLastYearRevenue) * 100 : 0

    return [total, ...clinicData]
  }, [state.data.dailyAccounts, state.data.clinicData])

  const hasRealData = getAllDailyAccounts().length > 0

  if (!hasRealData) {
    return (
      <div className="p-6">
        <div className="p-8 text-center bg-white border rounded-lg shadow-sm">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg text-gray-600">データがありません</p>
          <p className="mt-2 text-sm text-gray-500">APIに接続するかCSVファイルをインポートしてデータを表示してください</p>
        </div>
      </div>
    )
  }

  const stackedBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 10,
          font: { size: 9 }
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || ''
            const value = context.parsed.y
            if (label === '合計') {
              return `${label}: ¥${value.toLocaleString()}`
            }
            return `${label}: ¥${value.toLocaleString()}`
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: { size: 9 }
        }
      },
      y: {
        stacked: true,
        ticks: {
          callback: (value: any) => {
            if (value >= 1000000) return `¥${(value / 1000000).toFixed(0)}M`
            if (value >= 1000) return `¥${(value / 1000).toFixed(0)}K`
            return `¥${value.toLocaleString()}`
          }
        }
      },
      y1: {
        type: 'linear' as const,
        position: 'right' as const,
        grid: { drawOnChartArea: false },
        ticks: {
          callback: (value: any) => {
            if (value >= 1000000) return `¥${(value / 1000000).toFixed(0)}M`
            if (value >= 1000) return `¥${(value / 1000).toFixed(0)}K`
            return `¥${value.toLocaleString()}`
          }
        }
      }
    }
  } as any

  const multiLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 10,
          font: { size: 9 }
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false
      }
    },
    scales: {
      y: {
        position: 'left' as const,
        ticks: {
          callback: (value: any) => value.toLocaleString()
        }
      },
      y1: {
        type: 'linear' as const,
        position: 'right' as const,
        grid: { drawOnChartArea: false },
        ticks: {
          callback: (value: any) => {
            if (value >= 1000000) return `¥${(value / 1000000).toFixed(0)}M`
            if (value >= 1000) return `¥${(value / 1000).toFixed(0)}K`
            return `¥${value.toLocaleString()}`
          }
        }
      },
      y2: {
        type: 'linear' as const,
        position: 'right' as const,
        grid: { drawOnChartArea: false },
        ticks: {
          callback: (value: any) => {
            if (value >= 1000) return `¥${(value / 1000).toFixed(0)}K`
            return `¥${value.toLocaleString()}`
          }
        }
      },
      y3: {
        type: 'linear' as const,
        position: 'right' as const,
        grid: { drawOnChartArea: false },
        ticks: {
          callback: (value: any) => `${value.toFixed(0)}%`
        }
      }
    }
  } as any

  return (
    <div className="p-6 space-y-6">
      {/* Top Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Stacked Bar Chart with Line */}
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">売上推移</h3>
          <div className="h-96">
            <Chart type="bar" data={stackedBarData} options={stackedBarOptions} />
          </div>
        </div>

        {/* Right: Multi-Line Chart */}
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">指標推移</h3>
          <div className="h-96">
            <Chart type="line" data={multiLineData} options={multiLineOptions} />
          </div>
        </div>
      </div>

      {/* Bottom: Monthly Progress Table */}
      <div className="p-6 bg-white border rounded-lg shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">今月売上進捗</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 font-semibold text-left">院</th>
                <th className="px-4 py-3 font-semibold text-center">評価ランク</th>
                <th className="px-4 py-3 font-semibold text-right">今月の売上見込み</th>
                <th className="px-4 py-3 font-semibold text-right">今月の売上</th>
                <th className="px-4 py-3 font-semibold text-right">今月の来院数</th>
                <th className="px-4 py-3 font-semibold text-right">今月の会計単価</th>
                <th className="px-4 py-3 font-semibold text-right">売上見込先月比</th>
                <th className="px-4 py-3 font-semibold text-right">売上見込前年比</th>
              </tr>
            </thead>
            <tbody>
              {(monthlyProgressData.length > itemsPerPage
                ? monthlyProgressData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                : monthlyProgressData
              ).map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{row.clinic}</td>
                  <td className="px-4 py-3 text-center">
                    {row.clinic === '総計' ? (
                      <span className="text-gray-400">-</span>
                    ) : (
                      <div className="flex justify-center space-x-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded ${
                              i <= row.evaluationRank
                                ? row.evaluationRank >= 5
                                  ? 'bg-green-500'
                                  : 'bg-orange-500'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">{formatCurrency(row.forecastRevenue)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(row.currentRevenue)}</td>
                  <td className="px-4 py-3 text-right">{formatNumber(row.currentVisitors)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(row.currentUnitPrice)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${row.momPercent >= 100 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {row.momPercent.toFixed(1)}%
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${row.yoyPercent >= 100 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {row.yoyPercent.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {monthlyProgressData.length > itemsPerPage && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(monthlyProgressData.length / itemsPerPage)}
            onPageChange={setCurrentPage}
            totalItems={monthlyProgressData.length}
            itemsPerPage={itemsPerPage}
          />
        )}
      </div>
    </div>
  )
}

