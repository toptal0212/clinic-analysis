'use client'

import React, { useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend } from 'chart.js'
import { Chart } from 'react-chartjs-2'
import { AlertCircle } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend)

export default function ClinicSales() {
  const { state } = useDashboard()

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

  // Calculate time series data (monthly trends)
  const timeSeriesData = useMemo(() => {
    const allData = getAllDailyAccounts()
    if (allData.length === 0) return { labels: [], datasets: [] }

    const now = new Date()
    const months = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        year: date.getFullYear(),
        month: date.getMonth(),
        label: `${String(date.getFullYear()).slice(-2)}年${date.getMonth() + 1}月`
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

  // Calculate day-of-week data (stacked bars)
  const dayOfWeekData = useMemo(() => {
    const allData = getAllDailyAccounts()
    if (allData.length === 0) return { labels: [], datasets: [] }

    const dayNames = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日']
    const dayData = new Array(7).fill(0).map(() => ({
      visitors: 0,
      revenue: 0,
      unitPrice: 0,
      firstVisitConversion: 0,
      repeatRate: 0,
      count: 0
    }))

    allData.forEach((r: any) => {
      const date = parseDate(r)
      if (!date) return
      
      const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
      dayData[dayOfWeek].count += 1
      dayData[dayOfWeek].revenue += r.totalWithTax || 0
      
      const isFirst = r.isFirst === true || r.isFirstVisit === true
      if (isFirst) {
        dayData[dayOfWeek].firstVisitConversion += 1
      } else {
        dayData[dayOfWeek].repeatRate += 1
      }
    })

    dayData.forEach(day => {
      day.visitors = day.count
      day.unitPrice = day.count > 0 ? day.revenue / day.count : 0
      day.firstVisitConversion = day.count > 0 ? (day.firstVisitConversion / day.count) * 100 : 0
      day.repeatRate = day.count > 0 ? (day.repeatRate / day.count) * 100 : 0
    })

    return {
      labels: dayNames,
      datasets: [
        {
          type: 'bar' as const,
          label: '来院数',
          data: dayData.map(d => d.visitors),
          backgroundColor: '#3B82F6',
          stack: 'visitors'
        },
        {
          type: 'bar' as const,
          label: '売上',
          data: dayData.map(d => d.revenue),
          backgroundColor: '#F97316',
          stack: 'revenue',
          yAxisID: 'y1'
        },
        {
          type: 'bar' as const,
          label: '会計単価',
          data: dayData.map(d => d.unitPrice),
          backgroundColor: '#F59E0B',
          stack: 'unitPrice',
          yAxisID: 'y2'
        },
        {
          type: 'bar' as const,
          label: '初診成約率',
          data: dayData.map(d => d.firstVisitConversion),
          backgroundColor: '#F97316',
          stack: 'conversion',
          yAxisID: 'y3'
        },
        {
          type: 'bar' as const,
          label: 'リピート率',
          data: dayData.map(d => d.repeatRate),
          backgroundColor: '#F59E0B',
          stack: 'repeat',
          yAxisID: 'y3'
        }
      ]
    }
  }, [state.data.dailyAccounts, state.data.clinicData])

  // Calculate daily clinic sales table
  const dailyClinicSales = useMemo(() => {
    const allData = getAllDailyAccounts()
    if (allData.length === 0) return []

    // Get unique dates (last 7 days)
    const dates = new Set<string>()
    const now = new Date()
    for (let i = 0; i < 7; i++) {
      const date = new Date(now)
      date.setDate(now.getDate() - i)
      dates.add(date.toISOString().split('T')[0])
    }

    const sortedDates = Array.from(dates).sort().reverse() // Most recent first

    // Get unique clinics
    const clinics = new Set<string>()
    allData.forEach((r: any) => {
      const clinic = r.clinicName || 'その他'
      clinics.add(clinic)
    })

    return Array.from(clinics).map(clinic => {
      const clinicRecords = allData.filter((r: any) => (r.clinicName || 'その他') === clinic)
      
      const dailyStats = sortedDates.map(dateStr => {
        const dayRecords = clinicRecords.filter((r: any) => {
          const date = parseDate(r)
          if (!date) return false
          return date.toISOString().split('T')[0] === dateStr
        })

        const revenue = dayRecords.reduce((sum, r) => sum + (r.totalWithTax || 0), 0)
        const count = dayRecords.length
        const unitPrice = count > 0 ? revenue / count : 0

        return {
          date: dateStr,
          dateLabel: new Date(dateStr).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/'),
          revenue,
          unitPrice,
          visitors: count
        }
      })

      return {
        clinic,
        dailyStats
      }
    }).sort((a, b) => {
      const aTotal = a.dailyStats.reduce((sum, d) => sum + d.revenue, 0)
      const bTotal = b.dailyStats.reduce((sum, d) => sum + d.revenue, 0)
      return bTotal - aTotal
    })
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

  const timeSeriesOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 10,
          font: { size: 10 }
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

  const dayOfWeekOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 10,
          font: { size: 10 }
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false
      }
    },
    scales: {
      x: { stacked: true },
      y: {
        stacked: true,
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
        {/* Left: Time Series Chart */}
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">売上・来院数推移</h3>
          <div className="h-96">
            <Chart type="line" data={timeSeriesData} options={timeSeriesOptions} />
          </div>
        </div>

        {/* Right: Day of Week Chart */}
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">曜日別分析</h3>
          <div className="h-96">
            <Chart type="bar" data={dayOfWeekData} options={dayOfWeekOptions} />
          </div>
        </div>
      </div>

      {/* Bottom: Daily Clinic Sales Table */}
      <div className="p-6 bg-white border rounded-lg shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">院別売上</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold sticky left-0 bg-gray-50 z-10">院名</th>
                {dailyClinicSales[0]?.dailyStats.map((stat, idx) => (
                  <th key={idx} colSpan={3} className="px-2 py-3 text-center font-semibold border-l">
                    {stat.dateLabel}
                  </th>
                ))}
              </tr>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-2 text-left font-semibold sticky left-0 bg-gray-50 z-10"></th>
                {dailyClinicSales[0]?.dailyStats.map((stat, idx) => (
                  <React.Fragment key={idx}>
                    <th className="px-2 py-2 text-center font-medium text-xs border-l">売上</th>
                    <th className="px-2 py-2 text-center font-medium text-xs">会計単価</th>
                    <th className="px-2 py-2 text-center font-medium text-xs">来院数</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {dailyClinicSales.map((clinicData, clinicIdx) => (
                <tr key={clinicIdx} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium sticky left-0 bg-white z-10">{clinicData.clinic}</td>
                  {clinicData.dailyStats.map((stat, statIdx) => (
                    <React.Fragment key={statIdx}>
                      <td className="px-2 py-3 text-right border-l">{formatCurrency(stat.revenue)}</td>
                      <td className="px-2 py-3 text-right">{formatCurrency(stat.unitPrice)}</td>
                      <td className="px-2 py-3 text-right">{formatNumber(stat.visitors)}</td>
                    </React.Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

