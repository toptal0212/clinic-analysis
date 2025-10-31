'use client'

import React, { useMemo, useEffect, useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { 
  AlertCircle,
  PieChart
} from 'lucide-react'
import DemographicsCharts from './DemographicsCharts'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend } from 'chart.js'
import { Chart } from 'react-chartjs-2'
import Pagination from './Pagination'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend)

export default function TreatmentTrendAnalysis() {
  const { state } = useDashboard()
  const [majorPage, setMajorPage] = useState(1)
  const [mediumPage, setMediumPage] = useState(1)
  const [staffPage, setStaffPage] = useState(1)
  const itemsPerPage = 10


  // Get all daily accounts data
  const getAllDailyAccounts = () => {
    const allAccounts = []
    
    // Add data from dailyAccounts
    if (state.data.dailyAccounts?.length) {
      allAccounts.push(...state.data.dailyAccounts)
    }
    
    // Add data from clinicData
    if (state.data.clinicData) {
      Object.values(state.data.clinicData).forEach(clinic => {
        if (clinic.dailyAccounts?.length) {
          allAccounts.push(...clinic.dailyAccounts)
        }
      })
    }
    
    return allAccounts
  }

  // Calculate treatment trends (stacked categories + line)
  const treatmentTrends = useMemo(() => {
    const allData = getAllDailyAccounts()
    
    if (allData.length === 0) {
      return []
    }

    // Group data by month
    const monthlyData = new Map<string, any>()
    
    allData.forEach((record: any) => {
      const date = new Date(record.recordDate || record.visitDate || record.treatmentDate || record.accountingDate || new Date())
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          month: date.getMonth(),
          year: date.getFullYear(),
          monthLabel: `${date.getFullYear().toString().slice(2)}年${date.getMonth() + 1}月`,
          salesBeauty: 0,
          salesDevice: 0,
          salesOther: 0,
          accounts: 0,
          firstVisitPatients: 0,
          repeatVisits: 0,
          totalVisits: 0
        })
      }
      
      const monthData = monthlyData.get(monthKey)
      const amount = record.totalWithTax || 0
      const cat = (record.treatmentCategory || record.category || '').toString()
      if (/機器|レーザー|脱毛|device|laser/i.test(cat)) monthData.salesDevice += amount
      else if (/施術|美容|手術|treatment|surgery/i.test(cat)) monthData.salesBeauty += amount
      else monthData.salesOther += amount
      monthData.accounts += 1
      
      if (record.isFirst === true) {
        monthData.firstVisitPatients += 1
      } else {
        monthData.repeatVisits += 1
      }
      monthData.totalVisits += 1
    })

    // Convert to array and calculate derived metrics
    return Array.from(monthlyData.values()).map((data: any) => ({
      ...data,
      repeatRate: data.totalVisits > 0 ? (data.repeatVisits / data.totalVisits) * 100 : 0,
      unitPrice: data.accounts > 0 ? (data.salesBeauty + data.salesDevice + data.salesOther) / data.accounts : 0
    })).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return a.month - b.month
    })
  }, [state.data.dailyAccounts, state.data.clinicData])

  // Chart.js data (stacked bars for sales categories + line for accounts)
  const trendChartData = useMemo(() => {
    const labels = treatmentTrends.map(t => t.monthLabel)
    const toVals = (key: 'salesBeauty' | 'salesDevice' | 'salesOther' | 'accounts') => treatmentTrends.map(t => t[key] || 0)
    return {
      labels,
      datasets: [
        { type: 'bar' as const, label: '美容施術', data: toVals('salesBeauty'), backgroundColor: 'rgba(59, 130, 246, 0.6)', stack: 'sales' },
        { type: 'bar' as const, label: '美容機器', data: toVals('salesDevice'), backgroundColor: 'rgba(245, 158, 11, 0.6)', stack: 'sales' },
        { type: 'bar' as const, label: 'その他', data: toVals('salesOther'), backgroundColor: 'rgba(16, 185, 129, 0.6)', stack: 'sales' },
        { type: 'line' as const, label: '会計数', data: toVals('accounts'), borderColor: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.2)', yAxisID: 'y1', tension: 0.2, borderWidth: 2, pointRadius: 2 }
      ]
    }
  }, [treatmentTrends])

  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { position: 'top' as const, labels: { usePointStyle: true, padding: 12 } },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const v = ctx.parsed.y
            if (ctx.dataset.type === 'line') return `会計数: ${v.toLocaleString()}件`
            return `${ctx.dataset.label}: ¥${v.toLocaleString()}`
          }
        }
      }
    },
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { stacked: true, ticks: { callback: (v: any) => `¥${(v/1000000).toFixed(0)}M` } },
      y1: { type: 'linear' as const, position: 'right' as const, grid: { drawOnChartArea: false }, ticks: { callback: (v: any) => `${v}件` } }
    }
  }

  // Calculate major categories from real data
  const majorCategories = useMemo(() => {
    const allData = getAllDailyAccounts()
    if (allData.length === 0) return []

    const categoryMap = new Map<string, { sales: number, accounts: number, firstVisits: number, repeatVisits: number }>()
    
    allData.forEach((record: any) => {
      // Prefer paymentItems[0].category as used elsewhere, then fall back
      const category = record.paymentItems?.[0]?.category || record.treatmentCategory || record.category || '未分類'
      const amount = record.totalWithTax || 0
      const isFirst = record.isFirst === true
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { sales: 0, accounts: 0, firstVisits: 0, repeatVisits: 0 })
      }
      
      const catData = categoryMap.get(category)!
      catData.sales += amount
      catData.accounts += 1
      if (isFirst) catData.firstVisits += 1
      else catData.repeatVisits += 1
    })

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        sales: data.sales,
        accounts: data.accounts,
        unitPrice: data.accounts > 0 ? data.sales / data.accounts : 0,
        repeatRate: data.accounts > 0 ? (data.repeatVisits / data.accounts) * 100 : 0
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10) // Top 10 categories
  }, [state.data.dailyAccounts, state.data.clinicData])

  // Calculate medium categories from real data
  const mediumCategories = useMemo(() => {
    const allData = getAllDailyAccounts()
    if (allData.length === 0) return []

    const categoryMap = new Map<string, { sales: number, accounts: number, firstVisits: number, repeatVisits: number }>()
    
    allData.forEach((record: any) => {
      // Prefer paymentItems[0].name as used elsewhere, then fall back
      const category = record.paymentItems?.[0]?.name || record.treatmentName || record.treatment || '未分類'
      const amount = record.totalWithTax || 0
      const isFirst = record.isFirst === true
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { sales: 0, accounts: 0, firstVisits: 0, repeatVisits: 0 })
      }
      
      const catData = categoryMap.get(category)!
      catData.sales += amount
      catData.accounts += 1
      if (isFirst) catData.firstVisits += 1
      else catData.repeatVisits += 1
    })

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        sales: data.sales,
        accounts: data.accounts,
        unitPrice: data.accounts > 0 ? data.sales / data.accounts : 0,
        repeatRate: data.accounts > 0 ? (data.repeatVisits / data.accounts) * 100 : 0
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 15) // Top 15 categories
  }, [state.data.dailyAccounts, state.data.clinicData])

  // Calculate staff data from real data
  const staffData = useMemo(() => {
    const allData = getAllDailyAccounts()
    if (allData.length === 0) return []

    const staffMap = new Map<string, { sales: number, accounts: number, firstVisits: number, repeatVisits: number }>()
    
    allData.forEach((record: any) => {
      // Get staff name from paymentItems or direct field
      let staffName = 'その他'
      if (record.paymentItems?.length > 0) {
        staffName = record.paymentItems[0].mainStaffName || record.paymentItems[0].staffName || 'その他'
      } else if (record.staffName || record.doctorName) {
        staffName = record.staffName || record.doctorName
      }
      
      const amount = record.totalWithTax || 0
      const isFirst = record.isFirst === true
      
      if (!staffMap.has(staffName)) {
        staffMap.set(staffName, { sales: 0, accounts: 0, firstVisits: 0, repeatVisits: 0 })
      }
      
      const staffData = staffMap.get(staffName)!
      staffData.sales += amount
      staffData.accounts += 1
      if (isFirst) staffData.firstVisits += 1
      else staffData.repeatVisits += 1
    })

    return Array.from(staffMap.entries())
      .map(([name, data]) => ({
        name,
        sales: data.sales,
        accounts: data.accounts,
        unitPrice: data.accounts > 0 ? data.sales / data.accounts : 0,
        repeatRate: data.accounts > 0 ? (data.repeatVisits / data.accounts) * 100 : 0
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10) // Top 10 staff
  }, [state.data.dailyAccounts, state.data.clinicData])

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

  const hasRealData = getAllDailyAccounts().length > 0

  // Debug log
  useEffect(() => {
    console.log('📊 [TreatmentTrendAnalysis] Component rendered')
    console.log('📊 [TreatmentTrendAnalysis] Has real data:', hasRealData)
    console.log('📊 [TreatmentTrendAnalysis] Treatment trends count:', treatmentTrends.length)
  }, [hasRealData, treatmentTrends.length])

  // Show empty state if no data
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

  return (
    <div className="p-6 space-y-6">

      {/* Treatment Trend Analysis Chart */}
      <div className="p-6 bg-white border rounded-lg shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">治療別傾向分析</h3>
        <div className="h-80">
          <Chart type="bar" data={trendChartData as any} options={trendChartOptions as any} />
        </div>
      </div>

      {/* Detailed Trends Chart */}
      <div className="p-6 bg-white border rounded-lg shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">詳細トレンド</h3>
        
        <div className="space-y-4">
          {/* Accounts Trend */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">会計数</span>
              <span className="text-xs text-gray-500">
                {formatNumber(treatmentTrends[treatmentTrends.length - 1]?.accounts || 0)}
              </span>
            </div>
            <div className="p-2 rounded bg-gray-50">
              <div className="flex items-end h-16 space-x-1">
                {treatmentTrends.map((trend, i) => {
                  const maxValue = Math.max(...treatmentTrends.map(t => t.accounts))
                  const height = maxValue > 0 ? (trend.accounts / maxValue) * 100 : 0
                  const actualHeight = Math.max(height, 8)
                  return (
                    <div key={i} className="flex flex-col items-center flex-1 group">
                      <div className="relative w-full">
                        <div 
                          className="w-full transition-colors bg-blue-500 rounded-t hover:bg-blue-600"
                          style={{ height: `${actualHeight}px` }}
                          title={`${trend.monthLabel}: ${formatNumber(trend.accounts)}件`}
                        />
                        {/* Value label on top of bar */}
                        <div className="absolute transition-opacity transform -translate-x-1/2 opacity-0 -top-6 left-1/2 group-hover:opacity-100">
                          <div className="px-1 py-0.5 text-xs text-white bg-gray-800 rounded whitespace-nowrap">
                            {formatNumber(trend.accounts)}
                          </div>
                        </div>
                      </div>
                      {/* Month label */}
                      <div className="mt-1 text-xs text-gray-600 origin-left transform -rotate-45 whitespace-nowrap">
                        {trend.monthLabel}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* First Visit Patients Trend */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">売上初診患者数</span>
              <span className="text-xs text-gray-500">
                {formatNumber(treatmentTrends[treatmentTrends.length - 1]?.firstVisitPatients || 0)}
              </span>
            </div>
            <div className="p-2 rounded bg-gray-50">
              <div className="flex items-end h-16 space-x-1">
                {treatmentTrends.map((trend, i) => {
                  const maxValue = Math.max(...treatmentTrends.map(t => t.firstVisitPatients))
                  const height = maxValue > 0 ? (trend.firstVisitPatients / maxValue) * 100 : 0
                  const actualHeight = Math.max(height, 8)
                  return (
                    <div key={i} className="flex flex-col items-center flex-1 group">
                      <div className="relative w-full">
                        <div 
                          className="w-full transition-colors bg-indigo-500 rounded-t hover:bg-indigo-600"
                          style={{ height: `${actualHeight}px` }}
                          title={`${trend.monthLabel}: ${formatNumber(trend.firstVisitPatients)}人`}
                        />
                        {/* Value label on top of bar */}
                        <div className="absolute transition-opacity transform -translate-x-1/2 opacity-0 -top-6 left-1/2 group-hover:opacity-100">
                          <div className="px-1 py-0.5 text-xs text-white bg-gray-800 rounded whitespace-nowrap">
                            {formatNumber(trend.firstVisitPatients)}
                          </div>
                        </div>
                      </div>
                      {/* Month label */}
                      <div className="mt-1 text-xs text-gray-600 origin-left transform -rotate-45 whitespace-nowrap">
                        {trend.monthLabel}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Repeat Rate Trend */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">リピート率</span>
              <span className="text-xs text-gray-500">
                {(treatmentTrends[treatmentTrends.length - 1]?.repeatRate || 0).toFixed(1)}%
              </span>
            </div>
            <div className="p-2 rounded bg-gray-50">
              <div className="flex items-end h-16 space-x-1">
                {treatmentTrends.map((trend, i) => {
                  const maxValue = Math.max(...treatmentTrends.map(t => t.repeatRate))
                  const height = maxValue > 0 ? (trend.repeatRate / maxValue) * 100 : 0
                  const actualHeight = Math.max(height, 8)
                  return (
                    <div key={i} className="flex flex-col items-center flex-1 group">
                      <div className="relative w-full">
                        <div 
                          className="w-full transition-colors bg-green-500 rounded-t hover:bg-green-600"
                          style={{ height: `${actualHeight}px` }}
                          title={`${trend.monthLabel}: ${trend.repeatRate.toFixed(1)}%`}
                        />
                        {/* Value label on top of bar */}
                        <div className="absolute transition-opacity transform -translate-x-1/2 opacity-0 -top-6 left-1/2 group-hover:opacity-100">
                          <div className="px-1 py-0.5 text-xs text-white bg-gray-800 rounded whitespace-nowrap">
                            {trend.repeatRate.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      {/* Month label */}
                      <div className="mt-1 text-xs text-gray-600 origin-left transform -rotate-45 whitespace-nowrap">
                        {trend.monthLabel}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Unit Price Trend */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">会計単価</span>
              <span className="text-xs text-gray-500">
                {formatCurrency(treatmentTrends[treatmentTrends.length - 1]?.unitPrice || 0)}
              </span>
            </div>
            <div className="p-2 rounded bg-gray-50">
              <div className="flex items-end h-16 space-x-1">
                {treatmentTrends.map((trend, i) => {
                  const maxValue = Math.max(...treatmentTrends.map(t => t.unitPrice))
                  const height = maxValue > 0 ? (trend.unitPrice / maxValue) * 100 : 0
                  const actualHeight = Math.max(height, 8)
                  return (
                    <div key={i} className="flex flex-col items-center flex-1 group">
                      <div className="relative w-full">
                        <div 
                          className="w-full transition-colors bg-yellow-500 rounded-t hover:bg-yellow-600"
                          style={{ height: `${actualHeight}px` }}
                          title={`${trend.monthLabel}: ${formatCurrency(trend.unitPrice)}`}
                        />
                        {/* Value label on top of bar */}
                        <div className="absolute transition-opacity transform -translate-x-1/2 opacity-0 -top-6 left-1/2 group-hover:opacity-100">
                          <div className="px-1 py-0.5 text-xs text-white bg-gray-800 rounded whitespace-nowrap">
                            {formatCurrency(trend.unitPrice)}
                          </div>
                        </div>
                      </div>
                      {/* Month label */}
                      <div className="mt-1 text-xs text-gray-600 origin-left transform -rotate-45 whitespace-nowrap">
                        {trend.monthLabel}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demographics Section */}
      <div className="p-6 bg-white border rounded-lg shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">顧客属性分析</h3>
        <DemographicsCharts />
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Major Categories Table */}
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">大カテゴリー別売上</h3>
          <div className="overflow-x-auto">
            {majorCategories.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <p>データがありません</p>
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">大カテゴリー</th>
                    <th className="py-2 text-right">売上</th>
                    <th className="py-2 text-right">会計数</th>
                    <th className="py-2 text-right">会計単価</th>
                    <th className="py-2 text-right">リピート率</th>
                  </tr>
                </thead>
                <tbody>
                  {(majorCategories.length > itemsPerPage
                    ? majorCategories.slice((majorPage - 1) * itemsPerPage, majorPage * itemsPerPage)
                    : majorCategories
                  ).map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-2">{item.category}</td>
                      <td className="py-2 text-right">{formatCurrency(item.sales)}</td>
                      <td className="py-2 text-right">{formatNumber(item.accounts)}</td>
                      <td className="py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-2 text-right">{item.repeatRate.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {majorCategories.length > itemsPerPage && (
            <Pagination
              currentPage={majorPage}
              totalPages={Math.ceil(majorCategories.length / itemsPerPage)}
              onPageChange={setMajorPage}
              totalItems={majorCategories.length}
              itemsPerPage={itemsPerPage}
            />
          )}
        </div>

        {/* Medium Categories Table */}
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">中カテゴリー別売上</h3>
          <div className="overflow-x-auto">
            {mediumCategories.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <p>データがありません</p>
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">中カテゴリー</th>
                    <th className="py-2 text-right">売上</th>
                    <th className="py-2 text-right">会計数</th>
                    <th className="py-2 text-right">会計単価</th>
                    <th className="py-2 text-right">リピート率</th>
                  </tr>
                </thead>
                <tbody>
                  {(mediumCategories.length > itemsPerPage
                    ? mediumCategories.slice((mediumPage - 1) * itemsPerPage, mediumPage * itemsPerPage)
                    : mediumCategories
                  ).map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-2">{item.category}</td>
                      <td className="py-2 text-right">{formatCurrency(item.sales)}</td>
                      <td className="py-2 text-right">{formatNumber(item.accounts)}</td>
                      <td className="py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-2 text-right">{item.repeatRate.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {mediumCategories.length > itemsPerPage && (
            <Pagination
              currentPage={mediumPage}
              totalPages={Math.ceil(mediumCategories.length / itemsPerPage)}
              onPageChange={setMediumPage}
              totalItems={mediumCategories.length}
              itemsPerPage={itemsPerPage}
            />
          )}
        </div>

        {/* Staff Table */}
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">ドクター別売上</h3>
          <div className="overflow-x-auto">
            {staffData.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <p>データがありません</p>
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Staff Name1</th>
                    <th className="py-2 text-right">売上</th>
                    <th className="py-2 text-right">会計数</th>
                    <th className="py-2 text-right">会計単価</th>
                    <th className="py-2 text-right">リピート率</th>
                  </tr>
                </thead>
                <tbody>
                  {(staffData.length > itemsPerPage
                    ? staffData.slice((staffPage - 1) * itemsPerPage, staffPage * itemsPerPage)
                    : staffData
                  ).map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-2">{item.name}</td>
                      <td className="py-2 text-right">{formatCurrency(item.sales)}</td>
                      <td className="py-2 text-right">{formatNumber(item.accounts)}</td>
                      <td className="py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-2 text-right">{item.repeatRate.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {staffData.length > itemsPerPage && (
            <Pagination
              currentPage={staffPage}
              totalPages={Math.ceil(staffData.length / itemsPerPage)}
              onPageChange={setStaffPage}
              totalItems={staffData.length}
              itemsPerPage={itemsPerPage}
            />
          )}
        </div>
      </div>
    </div>
  )
}
