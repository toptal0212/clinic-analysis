'use client'

import React, { useMemo, useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js'
import { Line } from 'react-chartjs-2'
import Pagination from './Pagination'
import { AlertCircle } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

export default function SalesComparison() {
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

  // Calculate date ranges for comparisons
  const dateRanges = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    
    // Last 28 days
    const last28DaysEnd = new Date(now)
    const last28DaysStart = new Date(now)
    last28DaysStart.setDate(now.getDate() - 28)
    
    // Previous 28 days (for comparison)
    const prev28DaysEnd = new Date(last28DaysStart)
    prev28DaysEnd.setDate(prev28DaysEnd.getDate() - 1)
    const prev28DaysStart = new Date(prev28DaysEnd)
    prev28DaysStart.setDate(prev28DaysStart.getDate() - 28)
    
    // Last 7 days
    const last7DaysEnd = new Date(now)
    const last7DaysStart = new Date(now)
    last7DaysStart.setDate(now.getDate() - 7)
    
    // Previous 7 days (for comparison)
    const prev7DaysEnd = new Date(last7DaysStart)
    prev7DaysEnd.setDate(prev7DaysEnd.getDate() - 1)
    const prev7DaysStart = new Date(prev7DaysEnd)
    prev7DaysStart.setDate(prev7DaysStart.getDate() - 7)
    
    // Previous year same period (28 days)
    const prevYear28DaysStart = new Date(last28DaysStart)
    prevYear28DaysStart.setFullYear(prevYear28DaysStart.getFullYear() - 1)
    const prevYear28DaysEnd = new Date(last28DaysEnd)
    prevYear28DaysEnd.setFullYear(prevYear28DaysEnd.getFullYear() - 1)
    
    return {
      last28Days: { start: last28DaysStart, end: last28DaysEnd },
      prev28Days: { start: prev28DaysStart, end: prev28DaysEnd },
      last7Days: { start: last7DaysStart, end: last7DaysEnd },
      prev7Days: { start: prev7DaysStart, end: prev7DaysEnd },
      prevYear28Days: { start: prevYear28DaysStart, end: prevYear28DaysEnd }
    }
  }, [])

  // Filter data by date range
  const filterByDateRange = (data: any[], range: { start: Date, end: Date }) => {
    return data.filter((record: any) => {
      const date = parseDate(record)
      if (!date) return false
      return date >= range.start && date <= range.end
    })
  }

  // Calculate comparison metrics for a group of records
  const calculateComparison = (records: any[]) => {
    const last28DaysSales = filterByDateRange(records, dateRanges.last28Days)
      .reduce((sum, r) => sum + (r.totalWithTax || 0), 0)
    
    const prev28DaysSales = filterByDateRange(records, dateRanges.prev28Days)
      .reduce((sum, r) => sum + (r.totalWithTax || 0), 0)
    
    const last7DaysSales = filterByDateRange(records, dateRanges.last7Days)
      .reduce((sum, r) => sum + (r.totalWithTax || 0), 0)
    
    const prev7DaysSales = filterByDateRange(records, dateRanges.prev7Days)
      .reduce((sum, r) => sum + (r.totalWithTax || 0), 0)
    
    const prevYear28DaysSales = filterByDateRange(records, dateRanges.prevYear28Days)
      .reduce((sum, r) => sum + (r.totalWithTax || 0), 0)
    
    return {
      sales28Days: last28DaysSales,
      salesComparison7Days: last7DaysSales - prev7DaysSales,
      salesComparison28Days: last28DaysSales - prev28DaysSales,
      salesComparisonPrevYear: prevYear28DaysSales
    }
  }

  // Top line chart data (last 12 months)
  const lineChartData = useMemo(() => {
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

    const visitors = months.map(m => {
      return allData.filter((r: any) => {
        const date = parseDate(r)
        if (!date) return false
        return date.getFullYear() === m.year && date.getMonth() === m.month
      }).length
    })

    const revenue = months.map(m => {
      return allData.filter((r: any) => {
        const date = parseDate(r)
        if (!date) return false
        return date.getFullYear() === m.year && date.getMonth() === m.month
      }).reduce((sum, r) => sum + (r.totalWithTax || 0), 0)
    })

    const unitPrice = months.map((m, i) => {
      return visitors[i] > 0 ? revenue[i] / visitors[i] : 0
    })

    // Calculate first visit conversion rate and repeat rate
    const firstVisitRate = months.map(m => {
      const monthData = allData.filter((r: any) => {
        const date = parseDate(r)
        if (!date) return false
        return date.getFullYear() === m.year && date.getMonth() === m.month
      })
      const firstVisits = monthData.filter((r: any) => r.isFirst === true || r.isFirstVisit === true).length
      return monthData.length > 0 ? (firstVisits / monthData.length) * 100 : 0
    })

    const repeatRate = months.map(m => {
      const monthData = allData.filter((r: any) => {
        const date = parseDate(r)
        if (!date) return false
        return date.getFullYear() === m.year && date.getMonth() === m.month
      })
      const repeatVisits = monthData.filter((r: any) => r.isFirst === false || r.isFirstVisit === false).length
      return monthData.length > 0 ? (repeatVisits / monthData.length) * 100 : 0
    })

    return {
      labels: months.map(m => m.label),
      datasets: [
        {
          label: '来院数',
          data: visitors,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.2,
          pointRadius: 2
        },
        {
          label: '売上',
          data: revenue,
          borderColor: '#1E40AF',
          backgroundColor: 'rgba(30, 64, 175, 0.1)',
          tension: 0.2,
          pointRadius: 2
        },
        {
          label: '会計単価',
          data: unitPrice,
          borderColor: '#F59E0B',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.2,
          pointRadius: 2,
          yAxisID: 'y1'
        },
        {
          label: '初診成約率',
          data: firstVisitRate,
          borderColor: '#06B6D4',
          backgroundColor: 'rgba(6, 182, 212, 0.1)',
          tension: 0.2,
          pointRadius: 2,
          yAxisID: 'y2'
        },
        {
          label: 'リピート率',
          data: repeatRate,
          borderColor: '#F97316',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          tension: 0.2,
          pointRadius: 2,
          yAxisID: 'y2'
        }
      ]
    }
  }, [state.data.dailyAccounts, state.data.clinicData])

  // Clinic comparison data
  const clinicData = useMemo(() => {
    const allData = getAllDailyAccounts()
    const clinics = Array.from(new Set(allData.map((r: any) => r.clinicName || 'その他').filter(Boolean)))
    
    return clinics.map(clinic => {
      const clinicRecords = allData.filter((r: any) => (r.clinicName || 'その他') === clinic)
      const comparison = calculateComparison(clinicRecords)
      return {
        name: clinic,
        ...comparison
      }
    }).sort((a, b) => b.sales28Days - a.sales28Days)
  }, [state.data.dailyAccounts, state.data.clinicData, dateRanges])

  // Category comparison data
  const categoryData = useMemo(() => {
    const allData = getAllDailyAccounts()
    const majorCategories = new Map<string, any[]>()
    const mediumCategories = new Map<string, any[]>()
    
    allData.forEach((record: any) => {
      const majorCategory = record.paymentItems?.[0]?.category || record.treatmentCategory || '未分類'
      const mediumCategory = record.paymentItems?.[0]?.name || record.treatmentName || '未分類'
      
      if (!majorCategories.has(majorCategory)) {
        majorCategories.set(majorCategory, [])
      }
      majorCategories.get(majorCategory)!.push(record)
      
      if (!mediumCategories.has(mediumCategory)) {
        mediumCategories.set(mediumCategory, [])
      }
      mediumCategories.get(mediumCategory)!.push(record)
    })

    const major = Array.from(majorCategories.entries()).map(([category, records]) => {
      const comparison = calculateComparison(records)
      return {
        name: category,
        ...comparison
      }
    }).sort((a, b) => b.sales28Days - a.sales28Days)

    const medium = Array.from(mediumCategories.entries()).map(([category, records]) => {
      const comparison = calculateComparison(records)
      return {
        name: category,
        ...comparison
      }
    }).sort((a, b) => b.sales28Days - a.sales28Days)

    return { major, medium }
  }, [state.data.dailyAccounts, state.data.clinicData, dateRanges])

  // Gender comparison data
  const genderData = useMemo(() => {
    const allData = getAllDailyAccounts()
    const genders = new Map<string, any[]>()
    
    allData.forEach((record: any) => {
      const gender = (record.visitorGender || record.gender || record.patientGender || record.sex || 'その他').toString().trim() || 'その他'
      if (!genders.has(gender)) {
        genders.set(gender, [])
      }
      genders.get(gender)!.push(record)
    })

    return Array.from(genders.entries()).map(([gender, records]) => {
      const comparison = calculateComparison(records)
      return {
        name: gender,
        ...comparison
      }
    }).sort((a, b) => b.sales28Days - a.sales28Days)
  }, [state.data.dailyAccounts, state.data.clinicData, dateRanges])

  // Age group comparison data
  const ageGroupData = useMemo(() => {
    const allData = getAllDailyAccounts()
    const ageGroups = new Map<string, any[]>()
    
    allData.forEach((record: any) => {
      const rawAge = record.visitorAge ?? record.age ?? record.patientAge
      const ageNum = Number(rawAge)
      const ageGroup = Number.isFinite(ageNum) && ageNum > 0 ? `${Math.floor(ageNum / 10) * 10}` : 'NULL'
      if (!ageGroups.has(ageGroup)) {
        ageGroups.set(ageGroup, [])
      }
      ageGroups.get(ageGroup)!.push(record)
    })

    return Array.from(ageGroups.entries()).map(([ageGroup, records]) => {
      const comparison = calculateComparison(records)
      return {
        name: ageGroup,
        ...comparison
      }
    }).sort((a, b) => b.sales28Days - a.sales28Days)
  }, [state.data.dailyAccounts, state.data.clinicData, dateRanges])

  // Visit type comparison data
  const visitTypeData = useMemo(() => {
    const allData = getAllDailyAccounts()
    const visitTypes = new Map<string, any[]>()
    
    allData.forEach((record: any) => {
      const isFirst = record.isFirst === true || record.isFirstVisit === true
      const visitType = isFirst ? '初診' : '再診'
      if (!visitTypes.has(visitType)) {
        visitTypes.set(visitType, [])
      }
      visitTypes.get(visitType)!.push(record)
    })

    return Array.from(visitTypes.entries()).map(([visitType, records]) => {
      const comparison = calculateComparison(records)
      return {
        name: visitType,
        ...comparison
      }
    }).sort((a, b) => b.sales28Days - a.sales28Days)
  }, [state.data.dailyAccounts, state.data.clinicData, dateRanges])

  // Media source comparison data
  const mediaData = useMemo(() => {
    const allData = getAllDailyAccounts()
    const mediaSources = new Map<string, any[]>()
    
    allData.forEach((record: any) => {
      const media = (
        record.visitorInflowSourceName ||
        record.visitorInflowSourceLabel ||
        record.referralSource ||
        record.leadSource ||
        record.mediaSource ||
        record.appointmentRoute ||
        'その他・不明'
      ).toString().trim() || 'その他・不明'
      if (!mediaSources.has(media)) {
        mediaSources.set(media, [])
      }
      mediaSources.get(media)!.push(record)
    })

    return Array.from(mediaSources.entries()).map(([media, records]) => {
      const comparison = calculateComparison(records)
      return {
        name: media,
        ...comparison
      }
    }).sort((a, b) => b.sales28Days - a.sales28Days)
  }, [state.data.dailyAccounts, state.data.clinicData, dateRanges])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

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

  // Component for comparison table with bars
  const ComparisonTable = ({ title, data, subtitle }: { title: string, data: any[], subtitle?: string }) => {
    if (data.length === 0) return null
    const [page, setPage] = useState(1)
    const perPage = 10
    const rows = data.length > perPage ? data.slice((page - 1) * perPage, page * perPage) : data

    // Find max value for scaling bars
    const maxSales = Math.max(...data.map(d => d.sales28Days))
    const maxComparison7 = Math.max(...data.map(d => Math.abs(d.salesComparison7Days)), 1)
    const maxComparison28 = Math.max(...data.map(d => Math.abs(d.salesComparison28Days)), 1)
    const maxPrevYear = Math.max(...data.map(d => d.salesComparisonPrevYear))

    return (
      <div className="p-6 bg-white border rounded-lg shadow-sm">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <h4 className="mb-4 text-sm font-medium text-gray-700">{subtitle}</h4>}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 font-semibold text-left">項目</th>
                <th className="px-4 py-3 font-semibold text-right">売上_直近28日</th>
                <th className="px-4 py-3 font-semibold text-right">売上_比較7日</th>
                <th className="px-4 py-3 font-semibold text-right">売上_比較28日</th>
                <th className="px-4 py-3 font-semibold text-right">比較前年28日</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <span className="font-medium">{formatCurrency(item.sales28Days)}</span>
                      <div className="w-32 h-8 overflow-hidden bg-gray-100 rounded">
                        <div 
                          className="h-full bg-green-500"
                          style={{ width: `${Math.max(2, (item.sales28Days / maxSales) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <span className={`font-medium ${item.salesComparison7Days >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(item.salesComparison7Days)}
                      </span>
                      <div className="w-32 h-8 overflow-hidden bg-gray-100 rounded">
                        <div 
                          className={`h-full ${item.salesComparison7Days >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.max(2, (Math.abs(item.salesComparison7Days) / maxComparison7) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <span className={`font-medium ${item.salesComparison28Days >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(item.salesComparison28Days)}
                      </span>
                      <div className="w-32 h-8 overflow-hidden bg-gray-100 rounded">
                        <div 
                          className={`h-full ${item.salesComparison28Days >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.max(2, (Math.abs(item.salesComparison28Days) / maxComparison28) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <span className="font-medium">{formatCurrency(item.salesComparisonPrevYear)}</span>
                      <div className="w-32 h-8 overflow-hidden bg-gray-100 rounded">
                        <div 
                          className="h-full bg-green-500"
                          style={{ width: `${Math.max(2, (item.salesComparisonPrevYear / maxPrevYear) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.length > perPage && (
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(data.length / perPage)}
            onPageChange={setPage}
            totalItems={data.length}
            itemsPerPage={perPage}
          />
        )}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Top Line Chart */}
      <div className="p-6 bg-white border rounded-lg shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">売上比較トレンド</h3>
        <div className="h-96">
          <Line 
            data={lineChartData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom' as const,
                  labels: {
                    usePointStyle: true,
                    padding: 15
                  }
                },
                tooltip: {
                  mode: 'index' as const,
                  intersect: false,
                  callbacks: {
                    label: (context: any) => {
                      const label = context.dataset.label || ''
                      const value = context.parsed.y
                      if (label === '来院数') {
                        return `${label}: ${value.toLocaleString()}`
                      } else if (label === '売上' || label === '会計単価') {
                        return `${label}: ${formatCurrency(value)}`
                      } else {
                        return `${label}: ${value.toFixed(1)}%`
                      }
                    }
                  }
                }
              },
              scales: {
                y: {
                  type: 'linear',
                  position: 'left',
                  title: {
                    display: true,
                    text: '来院数・売上'
                  },
                  ticks: {
                    callback: (value: any) => {
                      if (value >= 1000000) {
                        return `¥${(value / 1000000).toFixed(0)}M`
                      } else if (value >= 1000) {
                        return `${(value / 1000).toFixed(0)}K`
                      }
                      return value.toLocaleString()
                    }
                  }
                },
                y1: {
                  type: 'linear',
                  position: 'right',
                  title: {
                    display: true,
                    text: '会計単価'
                  },
                  grid: {
                    drawOnChartArea: false
                  },
                  ticks: {
                    callback: (value: any) => {
                      if (value >= 1000000) {
                        return `¥${(value / 1000000).toFixed(0)}M`
                      } else if (value >= 1000) {
                        return `¥${(value / 1000).toFixed(0)}K`
                      }
                      return `¥${value.toLocaleString()}`
                    }
                  }
                },
                y2: {
                  type: 'linear',
                  position: 'right',
                  title: {
                    display: true,
                    text: '率 (%)'
                  },
                  grid: {
                    drawOnChartArea: false
                  },
                  ticks: {
                    callback: (value: any) => `${value.toFixed(0)}%`
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Comparison Tables */}
      <ComparisonTable title="院別" data={clinicData} />
      
      <ComparisonTable title="治療カテゴリー" subtitle="大カテゴリー" data={categoryData.major} />
      <ComparisonTable title="治療カテゴリー" subtitle="中カテゴリー" data={categoryData.medium} />
      
      <ComparisonTable title="性別" data={genderData} />
      
      <ComparisonTable title="年代" data={ageGroupData} />
      
      <ComparisonTable title="初診・再診" data={visitTypeData} />
      
      <ComparisonTable title="広告媒体" data={mediaData} />
    </div>
  )
}

