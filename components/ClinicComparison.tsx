'use client'

import React, { useState, useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js'
import { Line } from 'react-chartjs-2'
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

export default function ClinicComparison() {
  const { state } = useDashboard()
  const [leftClinic, setLeftClinic] = useState<string>('')
  const [rightClinic, setRightClinic] = useState<string>('')
  const [dateRangeStart, setDateRangeStart] = useState<string>('2023-01-01')
  const [dateRangeEnd, setDateRangeEnd] = useState<string>(new Date().toISOString().split('T')[0])

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

  // Get available clinics from data
  const availableClinics = useMemo(() => {
    const allData = getAllDailyAccounts()
    const clinics = new Set<string>()
    allData.forEach((r: any) => {
      const clinic = r.clinicName || 'その他'
      if (clinic) clinics.add(clinic)
    })
    return Array.from(clinics).sort()
  }, [state.data.dailyAccounts, state.data.clinicData])

  // Initialize clinic selections with first available clinics when data is available
  React.useEffect(() => {
    if (availableClinics.length > 0) {
      if (!leftClinic && availableClinics[0]) {
        setLeftClinic(availableClinics[0])
      }
      if (!rightClinic && availableClinics.length > 1 && availableClinics[1]) {
        setRightClinic(availableClinics[1])
      } else if (!rightClinic && availableClinics[0]) {
        setRightClinic(availableClinics[0])
      }
    }
  }, [availableClinics, leftClinic, rightClinic])

  // Resolve selected clinics with fallback to first two available
  const resolvedLeftClinic = useMemo(() => {
    if (leftClinic && availableClinics.includes(leftClinic)) return leftClinic
    return availableClinics[0] || ''
  }, [leftClinic, availableClinics])

  const resolvedRightClinic = useMemo(() => {
    if (rightClinic && availableClinics.includes(rightClinic)) return rightClinic
    return availableClinics[1] || availableClinics[0] || ''
  }, [rightClinic, availableClinics])

  // Calculate monthly metrics for a clinic
  const calculateClinicMetrics = (clinicName: string) => {
    const allData = getAllDailyAccounts()
    const clinicData = allData.filter((r: any) => (r.clinicName || 'その他') === clinicName)

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    // Current month data
    const currentMonthData = clinicData.filter((r: any) => {
      const date = parseDate(r)
      if (!date) return false
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth
    })

    // Last month data
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
    const lastMonthData = clinicData.filter((r: any) => {
      const date = parseDate(r)
      if (!date) return false
      return date.getFullYear() === lastMonthYear && date.getMonth() === lastMonth
    })

    // Last year same month data
    const lastYearMonthData = clinicData.filter((r: any) => {
      const date = parseDate(r)
      if (!date) return false
      return date.getFullYear() === currentYear - 1 && date.getMonth() === currentMonth
    })

    const currentVisitors = currentMonthData.length
    const currentRevenue = currentMonthData.reduce((sum, r) => sum + (Array.isArray(r.paymentItems) && r.paymentItems.length>0 ? r.paymentItems.reduce((s:any,it:any)=>s+(it.priceWithTax||0),0) : (r.totalWithTax||0)), 0)
    const currentUnitPrice = currentVisitors > 0 ? currentRevenue / currentVisitors : 0

    const lastMonthVisitors = lastMonthData.length
    const lastMonthRevenue = lastMonthData.reduce((sum, r) => sum + (Array.isArray(r.paymentItems) && r.paymentItems.length>0 ? r.paymentItems.reduce((s:any,it:any)=>s+(it.priceWithTax||0),0) : (r.totalWithTax||0)), 0)
    const lastMonthUnitPrice = lastMonthVisitors > 0 ? lastMonthRevenue / lastMonthVisitors : 0

    const lastYearVisitors = lastYearMonthData.length
    const lastYearRevenue = lastYearMonthData.reduce((sum, r) => sum + (Array.isArray(r.paymentItems) && r.paymentItems.length>0 ? r.paymentItems.reduce((s:any,it:any)=>s+(it.priceWithTax||0),0) : (r.totalWithTax||0)), 0)
    const lastYearUnitPrice = lastYearVisitors > 0 ? lastYearRevenue / lastYearVisitors : 0

    // Forecast (simple: assume linear growth)
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const daysPassed = now.getDate()
    const forecastFactor = daysInMonth / daysPassed

    const forecastVisitors = Math.round(currentVisitors * forecastFactor)
    const forecastRevenue = Math.round(currentRevenue * forecastFactor)

    return {
      currentVisitors,
      currentRevenue,
      currentUnitPrice,
      forecastVisitors,
      forecastRevenue,
      visitorMoM: lastMonthVisitors > 0 ? (currentVisitors / lastMonthVisitors) * 100 : 100,
      visitorYoY: lastYearVisitors > 0 ? (currentVisitors / lastYearVisitors) * 100 : 100,
      unitPriceMoM: lastMonthUnitPrice > 0 ? (currentUnitPrice / lastMonthUnitPrice) * 100 : 100,
      unitPriceYoY: lastYearUnitPrice > 0 ? (currentUnitPrice / lastYearUnitPrice) * 100 : 100,
      revenueMoM: lastMonthRevenue > 0 ? (currentRevenue / lastMonthRevenue) * 100 : 100,
      revenueYoY: lastYearRevenue > 0 ? (currentRevenue / lastYearRevenue) * 100 : 100
    }
  }

  // Calculate annual trends for a clinic
  const calculateAnnualTrends = (clinicName: string) => {
    const allData = getAllDailyAccounts()
    const clinicData = allData.filter((r: any) => (r.clinicName || 'その他') === clinicName)

    const startDate = new Date(dateRangeStart)
    const endDate = new Date(dateRangeEnd)
    
    const years: number[] = []
    for (let y = startDate.getFullYear(); y <= endDate.getFullYear(); y++) {
      years.push(y)
    }

    const monthlyData: { [year: number]: { [month: number]: any } } = {}

    clinicData.forEach((r: any) => {
      const date = parseDate(r)
      if (!date || date < startDate || date > endDate) return

      const year = date.getFullYear()
      const month = date.getMonth()

      if (!monthlyData[year]) monthlyData[year] = {}
      if (!monthlyData[year][month]) {
        monthlyData[year][month] = {
          visitors: 0,
          revenue: 0,
          firstVisits: 0,
          repeatVisits: 0,
          count: 0
        }
      }

      monthlyData[year][month].count += 1
      monthlyData[year][month].revenue += (Array.isArray(r.paymentItems) && r.paymentItems.length>0 ? r.paymentItems.reduce((s:any,it:any)=>s+(it.priceWithTax||0),0) : (r.totalWithTax||0))
      
      const isFirst = r.isFirst === true || r.isFirstVisit === true
      if (isFirst) {
        monthlyData[year][month].firstVisits += 1
      } else {
        monthlyData[year][month].repeatVisits += 1
      }
    })

    // Build chart data for each metric
    const months = Array.from({ length: 12 }, (_, i) => i)
    const currentYear = new Date().getFullYear()

    const buildDataset = (getValue: (data: any) => number, labelSuffix: string) => {
      const datasets = years.map(year => ({
        label: `${year}年${labelSuffix}`,
        data: months.map(month => {
          const data = monthlyData[year]?.[month]
          return data ? getValue(data) : 0
        }),
        borderColor: year === currentYear ? '#EF4444' : year === currentYear - 1 ? '#3B82F6' : '#9CA3AF',
        backgroundColor: year === currentYear ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
        borderWidth: year === currentYear ? 2 : 1,
        pointRadius: 2,
        tension: 0.2
      }))
      return {
        labels: months.map(m => `${m + 1}月`),
        datasets
      }
    }

    return {
      visitors: buildDataset(d => d.count, ''),
      revenue: buildDataset(d => d.revenue, ''),
      unitPrice: buildDataset(d => d.count > 0 ? d.revenue / d.count : 0, ''),
      firstVisitConversion: buildDataset(d => d.count > 0 ? (d.firstVisits / d.count) * 100 : 0, ''),
      repeatRate: buildDataset(d => d.count > 0 ? (d.repeatVisits / d.count) * 100 : 0, '')
    }
  }

  // Calculate category breakdown for a clinic
  const calculateCategoryBreakdown = (clinicName: string) => {
    const allData = getAllDailyAccounts()
    const clinicData = allData.filter((r: any) => (r.clinicName || 'その他') === clinicName)

    const now = new Date()
    const last28Days = new Date(now)
    last28Days.setDate(now.getDate() - 28)
    const prev28Days = new Date(last28Days)
    prev28Days.setDate(last28Days.getDate() - 28)
    const prevYear28Days = new Date(last28Days)
    prevYear28Days.setFullYear(last28Days.getFullYear() - 1)
    const prevYear28DaysEnd = new Date(now)
    prevYear28DaysEnd.setFullYear(now.getFullYear() - 1)

    const categoryMap = new Map<string, {
      sales28Days: number
      salesPrev28Days: number
      salesPrevYear28Days: number
      accounts: number
      firstVisits: number
    }>()

    clinicData.forEach((r: any) => {
      const date = parseDate(r)
      if (!date) return

      const category = r.paymentItems?.[0]?.category || r.treatmentCategory || 'その他'
      const amount = (Array.isArray(r.paymentItems) && r.paymentItems.length>0 ? r.paymentItems.reduce((s:any,it:any)=>s+(it.priceWithTax||0),0) : (r.totalWithTax||0))
      const isFirst = r.isFirst === true || r.isFirstVisit === true

      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          sales28Days: 0,
          salesPrev28Days: 0,
          salesPrevYear28Days: 0,
          accounts: 0,
          firstVisits: 0
        })
      }

      const catData = categoryMap.get(category)!

      if (date >= last28Days) {
        catData.sales28Days += amount
        catData.accounts += 1
        if (isFirst) catData.firstVisits += 1
      }

      if (date >= prev28Days && date < last28Days) {
        catData.salesPrev28Days += amount
      }

      if (date >= prevYear28Days && date < prevYear28DaysEnd) {
        catData.salesPrevYear28Days += amount
      }
    })

    return Array.from(categoryMap.entries()).map(([category, data]) => {
      const totalSales = Array.from(categoryMap.values()).reduce((sum, d) => sum + d.sales28Days, 0)
      return {
        category,
        sales28Days: data.sales28Days,
        firstVisitConversion: data.accounts > 0 ? (data.firstVisits / data.accounts) * 100 : 0,
        unitPrice: data.accounts > 0 ? data.sales28Days / data.accounts : 0,
        salesComparison28Days: data.sales28Days - data.salesPrev28Days,
        salesComparisonPrevYear: data.salesPrevYear28Days
      }
    }).sort((a, b) => b.sales28Days - a.sales28Days)
  }

  const leftMetrics = useMemo(() => calculateClinicMetrics(leftClinic), [leftClinic, state.data.dailyAccounts, state.data.clinicData])
  const rightMetrics = useMemo(() => calculateClinicMetrics(rightClinic), [rightClinic, state.data.dailyAccounts, state.data.clinicData])

  const leftTrends = useMemo(() => calculateAnnualTrends(leftClinic), [leftClinic, dateRangeStart, dateRangeEnd, state.data.dailyAccounts, state.data.clinicData])
  const rightTrends = useMemo(() => calculateAnnualTrends(rightClinic), [rightClinic, dateRangeStart, dateRangeEnd, state.data.dailyAccounts, state.data.clinicData])

  const leftCategories = useMemo(() => calculateCategoryBreakdown(leftClinic), [leftClinic, state.data.dailyAccounts, state.data.clinicData])
  const rightCategories = useMemo(() => calculateCategoryBreakdown(rightClinic), [rightClinic, state.data.dailyAccounts, state.data.clinicData])

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

  const chartOptions = {
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
        ticks: {
          callback: (value: any) => {
            if (value >= 1000000) return `¥${(value / 1000000).toFixed(0)}M`
            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
            return value.toLocaleString()
          }
        }
      }
    }
  }

  const ClinicSummaryCards = ({ clinicName, metrics }: { clinicName: string, metrics: typeof leftMetrics }) => (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="p-4 bg-white border rounded-lg shadow-sm">
        <div className="mb-1 text-sm text-gray-600">今月の来院数</div>
        <div className="mb-1 text-2xl font-bold text-gray-900">{formatNumber(metrics.currentVisitors)}件</div>
        <div className="mb-1 text-xs text-gray-500">予測: {formatNumber(metrics.forecastVisitors)}件</div>
        <div className="flex items-center space-x-1 text-xs">
          <span>予測 vs 先月:</span>
          {metrics.visitorMoM >= 100 ? (
            <span className="flex items-center text-green-600">
              <TrendingUp className="w-3 h-3" />
              {metrics.visitorMoM.toFixed(0)}%
            </span>
          ) : (
            <span className="flex items-center text-red-600">
              <TrendingDown className="w-3 h-3" />
              {metrics.visitorMoM.toFixed(0)}%
            </span>
          )}
              </div>
        <div className="flex items-center space-x-1 text-xs">
          <span>予測 vs 前年:</span>
          {metrics.visitorYoY >= 100 ? (
            <span className="flex items-center text-green-600">
              <TrendingUp className="w-3 h-3" />
              {metrics.visitorYoY.toFixed(0)}%
            </span>
          ) : (
            <span className="flex items-center text-red-600">
              <TrendingDown className="w-3 h-3" />
              {metrics.visitorYoY.toFixed(0)}%
            </span>
          )}
            </div>
          </div>

      <div className="p-4 bg-white border rounded-lg shadow-sm">
        <div className="mb-1 text-sm text-gray-600">今月の単価</div>
        <div className="mb-1 text-2xl font-bold text-gray-900">{formatCurrency(metrics.currentUnitPrice)}</div>
        <div className="mb-1 text-xs text-gray-500">&nbsp;</div>
        <div className="flex items-center space-x-1 text-xs">
          <span>予測 vs 先月:</span>
          {metrics.unitPriceMoM >= 100 ? (
            <span className="flex items-center text-green-600">
              <TrendingUp className="w-3 h-3" />
              {metrics.unitPriceMoM.toFixed(0)}%
            </span>
          ) : (
            <span className="flex items-center text-red-600">
              <TrendingDown className="w-3 h-3" />
              {metrics.unitPriceMoM.toFixed(0)}%
            </span>
          )}
              </div>
        <div className="flex items-center space-x-1 text-xs">
          <span>予測 vs 前年:</span>
          {metrics.unitPriceYoY >= 100 ? (
            <span className="flex items-center text-green-600">
              <TrendingUp className="w-3 h-3" />
              {metrics.unitPriceYoY.toFixed(0)}%
            </span>
          ) : (
            <span className="flex items-center text-red-600">
              <TrendingDown className="w-3 h-3" />
              {metrics.unitPriceYoY.toFixed(0)}%
            </span>
          )}
            </div>
          </div>

      <div className="p-4 bg-white border rounded-lg shadow-sm">
        <div className="mb-1 text-sm text-gray-600">今月の売上</div>
        <div className="mb-1 text-2xl font-bold text-gray-900">{formatCurrency(metrics.currentRevenue)}</div>
        <div className="mb-1 text-xs text-gray-500">予測: {formatCurrency(metrics.forecastRevenue)}</div>
        <div className="flex items-center space-x-1 text-xs">
          <span>予測 vs 先月:</span>
          {metrics.revenueMoM >= 100 ? (
            <span className="flex items-center text-green-600">
              <TrendingUp className="w-3 h-3" />
              {metrics.revenueMoM.toFixed(0)}%
            </span>
          ) : (
            <span className="flex items-center text-red-600">
              <TrendingDown className="w-3 h-3" />
              {metrics.revenueMoM.toFixed(0)}%
            </span>
          )}
              </div>
        <div className="flex items-center space-x-1 text-xs">
          <span>予測 vs 前年:</span>
          {metrics.revenueYoY >= 100 ? (
            <span className="flex items-center text-green-600">
              <TrendingUp className="w-3 h-3" />
              {metrics.revenueYoY.toFixed(0)}%
            </span>
          ) : (
            <span className="flex items-center text-red-600">
              <TrendingDown className="w-3 h-3" />
              {metrics.revenueYoY.toFixed(0)}%
            </span>
          )}
            </div>
          </div>
    </div>
  )

  const ClinicTrendCharts = ({ clinicName, trends }: { clinicName: string, trends: typeof leftTrends }) => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">{clinicName} / 年間推移</h3>
      <div className="mb-4 text-xs text-gray-500">赤が今年</div>
      
      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 bg-white border rounded-lg">
          <h4 className="mb-2 text-sm font-medium text-gray-700">来院数</h4>
          <div className="h-48">
            <Line data={trends.visitors} options={chartOptions} />
        </div>
      </div>

        <div className="p-4 bg-white border rounded-lg">
          <h4 className="mb-2 text-sm font-medium text-gray-700">売上</h4>
          <div className="h-48">
            <Line data={trends.revenue} options={chartOptions} />
          </div>
        </div>

        <div className="p-4 bg-white border rounded-lg">
          <h4 className="mb-2 text-sm font-medium text-gray-700">会計単価</h4>
          <div className="h-48">
            <Line data={trends.unitPrice} options={chartOptions} />
        </div>
      </div>

        <div className="p-4 bg-white border rounded-lg">
          <h4 className="mb-2 text-sm font-medium text-gray-700">初診成約率</h4>
          <div className="h-48">
            <Line data={trends.firstVisitConversion} options={{
              ...chartOptions,
              scales: {
                ...chartOptions.scales,
                y: {
                  ticks: {
                    callback: (value: any) => `${value.toFixed(0)}%`
                  }
                }
              }
            }} />
                </div>
              </div>
              
        <div className="p-4 bg-white border rounded-lg">
          <h4 className="mb-2 text-sm font-medium text-gray-700">リピート率</h4>
          <div className="h-48">
            <Line data={trends.repeatRate} options={{
              ...chartOptions,
              scales: {
                ...chartOptions.scales,
                y: {
                  ticks: {
                    callback: (value: any) => `${value.toFixed(0)}%`
                  }
                }
              }
            }} />
                  </div>
                </div>
              </div>
            </div>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Clinic Selectors */}
      <div className="flex items-center mb-6 space-x-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">院選択 (左):</label>
          <select
            value={leftClinic}
            onChange={(e) => setLeftClinic(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md"
          >
            {availableClinics.map(clinic => (
              <option key={clinic} value={clinic}>{clinic}</option>
            ))}
          </select>
              </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">院選択 (右):</label>
          <select
            value={rightClinic}
            onChange={(e) => setRightClinic(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md"
          >
            {availableClinics.map(clinic => (
              <option key={clinic} value={clinic}>{clinic}</option>
            ))}
          </select>
              </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">年間推移期間変更:</label>
          <input
            type="date"
            value={dateRangeStart}
            onChange={(e) => setDateRangeStart(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md"
          />
          <span>〜</span>
          <input
            type="date"
            value={dateRangeEnd}
            onChange={(e) => setDateRangeEnd(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {/* Summary Cards - Side by Side */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ClinicSummaryCards clinicName={leftClinic} metrics={leftMetrics} />
        <ClinicSummaryCards clinicName={rightClinic} metrics={rightMetrics} />
                </div>
                
      {/* Annual Trend Charts - Side by Side */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ClinicTrendCharts clinicName={leftClinic} trends={leftTrends} />
        <ClinicTrendCharts clinicName={rightClinic} trends={rightTrends} />
                  </div>
                  
      {/* Category Breakdown Tables - Side by Side */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">{leftClinic} / 大カテゴリー別</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-3 py-2 font-semibold text-left">大カテゴ..</th>
                  <th className="px-3 py-2 font-semibold text-right">売上_直近28日</th>
                  <th className="px-3 py-2 font-semibold text-right">初診成約率</th>
                  <th className="px-3 py-2 font-semibold text-right">会計単価</th>
                  <th className="px-3 py-2 font-semibold text-right">売上比較28日</th>
                  <th className="px-3 py-2 font-semibold text-right">売上比較前年28日</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const total = {
                    category: '総計',
                    sales28Days: leftCategories.reduce((sum, cat) => sum + cat.sales28Days, 0),
                    firstVisitConversion: leftCategories.reduce((sum, cat) => sum + cat.sales28Days * cat.firstVisitConversion, 0) / leftCategories.reduce((sum, cat) => sum + cat.sales28Days, 0) || 0,
                    unitPrice: leftCategories.reduce((sum, cat) => sum + cat.sales28Days, 0) / leftCategories.reduce((sum, cat) => sum + cat.sales28Days / cat.unitPrice || 0, 0) || 0,
                    salesComparison28Days: leftCategories.reduce((sum, cat) => sum + cat.salesComparison28Days, 0),
                    salesComparisonPrevYear: leftCategories.reduce((sum, cat) => sum + cat.salesComparisonPrevYear, 0)
                  }
                  const totalUnitPrice = leftCategories.reduce((sum, cat) => {
                    const count = cat.sales28Days / cat.unitPrice || 0
                    return sum + count
                  }, 0)
                  total.unitPrice = totalUnitPrice > 0 ? total.sales28Days / totalUnitPrice : 0

                  return [
                    <tr key="total" className="font-semibold border-b bg-gray-50">
                      <td className="px-3 py-2">{total.category}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(total.sales28Days)}</td>
                      <td className="px-3 py-2 text-right">{total.firstVisitConversion.toFixed(1)}%</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(total.unitPrice)}</td>
                      <td className={`px-3 py-2 text-right ${total.salesComparison28Days >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(total.salesComparison28Days)}
                      </td>
                      <td className="px-3 py-2 text-right">{formatCurrency(total.salesComparisonPrevYear)}</td>
                    </tr>,
                    ...leftCategories.map((cat, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium">{cat.category}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(cat.sales28Days)}</td>
                        <td className="px-3 py-2 text-right">{cat.firstVisitConversion.toFixed(1)}%</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(cat.unitPrice)}</td>
                        <td className={`px-3 py-2 text-right ${cat.salesComparison28Days >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(cat.salesComparison28Days)}
                        </td>
                        <td className="px-3 py-2 text-right">{formatCurrency(cat.salesComparisonPrevYear)}</td>
                      </tr>
                    ))
                  ]
                })()}
              </tbody>
            </table>
                    </div>
                  </div>
                  
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">{rightClinic} / 大カテゴリー別</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-3 py-2 font-semibold text-left">大カテゴ..</th>
                  <th className="px-3 py-2 font-semibold text-right">売上_直近28日</th>
                  <th className="px-3 py-2 font-semibold text-right">初診成約率</th>
                  <th className="px-3 py-2 font-semibold text-right">会計単価</th>
                  <th className="px-3 py-2 font-semibold text-right">売上比較28日</th>
                  <th className="px-3 py-2 font-semibold text-right">売上比較前年28日</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const total = {
                    category: '総計',
                    sales28Days: rightCategories.reduce((sum, cat) => sum + cat.sales28Days, 0),
                    firstVisitConversion: rightCategories.reduce((sum, cat) => sum + cat.sales28Days * cat.firstVisitConversion, 0) / rightCategories.reduce((sum, cat) => sum + cat.sales28Days, 0) || 0,
                    unitPrice: 0,
                    salesComparison28Days: rightCategories.reduce((sum, cat) => sum + cat.salesComparison28Days, 0),
                    salesComparisonPrevYear: rightCategories.reduce((sum, cat) => sum + cat.salesComparisonPrevYear, 0)
                  }
                  const totalUnitPrice = rightCategories.reduce((sum, cat) => {
                    const count = cat.sales28Days / cat.unitPrice || 0
                    return sum + count
                  }, 0)
                  total.unitPrice = totalUnitPrice > 0 ? total.sales28Days / totalUnitPrice : 0

                  return [
                    <tr key="total" className="font-semibold border-b bg-gray-50">
                      <td className="px-3 py-2">{total.category}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(total.sales28Days)}</td>
                      <td className="px-3 py-2 text-right">{total.firstVisitConversion.toFixed(1)}%</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(total.unitPrice)}</td>
                      <td className={`px-3 py-2 text-right ${total.salesComparison28Days >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(total.salesComparison28Days)}
                      </td>
                      <td className="px-3 py-2 text-right">{formatCurrency(total.salesComparisonPrevYear)}</td>
                    </tr>,
                    ...rightCategories.map((cat, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium">{cat.category}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(cat.sales28Days)}</td>
                        <td className="px-3 py-2 text-right">{cat.firstVisitConversion.toFixed(1)}%</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(cat.unitPrice)}</td>
                        <td className={`px-3 py-2 text-right ${cat.salesComparison28Days >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(cat.salesComparison28Days)}
                        </td>
                        <td className="px-3 py-2 text-right">{formatCurrency(cat.salesComparisonPrevYear)}</td>
                      </tr>
                    ))
                  ]
                })()}
              </tbody>
            </table>
              </div>
        </div>
      </div>
    </div>
  )
}
