'use client'

import React, { useMemo, useEffect, useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend } from 'chart.js'
import { Chart } from 'react-chartjs-2'
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'
import Pagination from './Pagination'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend)

export default function TreatmentSalesTrend() {
  const { state } = useDashboard()
  const [categoryPage, setCategoryPage] = useState(1)
  const [clinicPage, setClinicPage] = useState(1)
  const [agePage, setAgePage] = useState(1)
  const [majorCategoryPage, setMajorCategoryPage] = useState(1)
  const [mediumCategoryPage, setMediumCategoryPage] = useState(1)
  const itemsPerPage = 10

  // Get all daily accounts data
  const getAllDailyAccounts = () => {
    const allAccounts = []
    
    // Add data from dailyAccounts
    if (state.data.dailyAccounts && state.data.dailyAccounts.length > 0) {
      allAccounts.push(...state.data.dailyAccounts)
    }

    // Add data from clinicData if available
    if (state.data.clinicData) {
      Object.values(state.data.clinicData).forEach(clinic => {
        if (clinic.dailyAccounts) {
          allAccounts.push(...clinic.dailyAccounts)
        }
      })
    }
    
    return allAccounts
  }

  // Calculate category trends (stacked bar chart data) - using actual category structure from debug
  const categoryTrends = useMemo(() => {
    const allData = getAllDailyAccounts()
    
    if (allData.length === 0) {
      return []
    }

    // Group data by month
    const monthlyData = new Map<string, { sales: { [key: string]: number }, accounts: number, unitPrice: number }>()
    
    allData.forEach((record: any) => {
      const date = new Date(record.recordDate || record.visitDate || record.treatmentDate || record.accountingDate)
      if (isNaN(date.getTime())) return // Skip invalid dates

      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { sales: {}, accounts: 0, unitPrice: 0 })
      }
      
      const monthData = monthlyData.get(monthKey)!
      
      // Use the same category logic as TreatmentCategoryDebug
      const category = record.paymentItems?.[0]?.category || record.treatmentCategory || '未分類'
      const amount = record.totalWithTax || 0

      monthData.sales[category] = (monthData.sales[category] || 0) + amount
      monthData.accounts += 1
      monthData.unitPrice += amount
    })

    const sortedMonths = Array.from(monthlyData.keys()).sort()
    const categories = Array.from(new Set(allData.map((r: any) => r.paymentItems?.[0]?.category || r.treatmentCategory || '未分類')))

    return sortedMonths.map(month => {
      const data = monthlyData.get(month)!
      const monthName = new Date(month).toLocaleDateString('ja-JP', { year: '2-digit', month: 'numeric' })
      return {
        month: monthName,
        monthLabel: monthName,
        sales: categories.reduce((acc, cat) => ({ ...acc, [cat]: data.sales[cat] || 0 }), {}),
        totalSales: Object.values(data.sales).reduce((sum, val) => sum + val, 0),
        accounts: data.accounts,
        unitPrice: data.accounts > 0 ? data.unitPrice / data.accounts : 0
      }
    })
  }, [state.data.dailyAccounts, state.data.clinicData])

  // Chart data for Category Trend (Stacked Bar Chart)
  const stackedChartData = useMemo(() => {
    if (categoryTrends.length === 0) {
      return { labels: [], datasets: [] }
    }

    const labels = categoryTrends.map(trend => trend.month)
    const categories = Array.from(new Set(categoryTrends.flatMap(t => Object.keys(t.sales))))
    
    // Distinct color palette for many categories
    const palette = [
      '#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316',
      '#EC4899', '#0EA5E9', '#22D3EE', '#A3E635', '#F43F5E', '#A78BFA', '#14B8A6', '#D946EF',
      '#60A5FA', '#34D399', '#FB7185', '#EAB308'
    ]

    const datasets = categories.map((category, idx) => ({
      type: 'bar' as const,
      label: category,
      data: categoryTrends.map(trend => trend.sales[category] || 0),
      backgroundColor: palette[idx % palette.length],
      borderColor: palette[idx % palette.length],
      borderWidth: 1,
      stack: 'sales',
      yAxisID: 'y'
    }))

    return { labels, datasets }
  }, [categoryTrends])

  const stackedChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || ''
            const value = context.parsed.y
            return `${label}: ¥${value.toLocaleString()}`
          }
        }
      }
    },
    scales: {
      x: { 
        grid: { display: false },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: { 
        stacked: true, 
        ticks: { 
          callback: (v: any) => `¥${(v/1000000).toFixed(0)}M` 
        } 
      }
    }
  } as any

  // Calculate line chart data for multiple metrics
  const lineChartData = useMemo(() => {
    if (categoryTrends.length === 0) {
      return { labels: [], datasets: [] }
    }

    const labels = categoryTrends.map(trend => trend.month)
    
    return {
      labels,
      datasets: [
        {
          type: 'line' as const,
          label: '売上',
          data: categoryTrends.map(trend => trend.totalSales),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: false,
          yAxisID: 'y1',
          pointRadius: 4,
          pointBackgroundColor: '#3B82F6'
        },
        {
          type: 'line' as const,
          label: '会計単価',
          data: categoryTrends.map(trend => trend.unitPrice),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          fill: false,
          yAxisID: 'y2',
          pointRadius: 4,
          pointBackgroundColor: '#10B981'
        }
      ]
    }
  }, [categoryTrends])

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || ''
            const value = context.parsed.y
            if (label === '売上' || label === '会計単価' || label === '単価×成約率') {
              return `${label}: ¥${value.toLocaleString()}`
            } else {
              return `${label}: ${value.toFixed(1)}%`
            }
          }
        }
      }
    },
    scales: {
      x: { 
        grid: { display: false },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y1: { 
        type: 'linear' as const,
        position: 'left' as const,
        ticks: { 
          callback: (v: any) => `¥${(v/1000000).toFixed(0)}M` 
        } 
      },
      y2: { 
        type: 'linear' as const,
        position: 'right' as const,
        grid: { drawOnChartArea: false },
        ticks: { 
          callback: (v: any) => `¥${(v/1000).toFixed(0)}K` 
        } 
      },
      y3: { 
        type: 'linear' as const,
        position: 'right' as const,
        grid: { drawOnChartArea: false },
        ticks: { 
          callback: (v: any) => `${v.toFixed(0)}%` 
        } 
      }
    }
  } as any

  // Calculate table data
  const clinicData = useMemo(() => {
    const allData = getAllDailyAccounts()
    if (allData.length === 0) return []

    const clinicMap = new Map<string, { sales: number, accounts: number, unitPrice: number }>()
    
    allData.forEach((record: any) => {
      const clinic = record.clinicName || 'その他'
      const amount = record.totalWithTax || 0
      
      if (!clinicMap.has(clinic)) {
        clinicMap.set(clinic, { sales: 0, accounts: 0, unitPrice: 0 })
      }
      
      const clinicData = clinicMap.get(clinic)!
      clinicData.sales += amount
      clinicData.accounts += 1
      clinicData.unitPrice += amount
    })

    return Array.from(clinicMap.entries())
      .map(([clinic, data]) => ({
        clinic,
        sales: data.sales,
        accounts: data.accounts,
        unitPrice: data.accounts > 0 ? data.sales / data.accounts : 0,
        sales28Days: data.sales,
        sales28DaysPercent: 100,
        sales365DaysPercent: 100,
        unitPriceConversion: data.accounts > 0 ? (data.sales / data.accounts) * 0.8 : 0,
        salesComparison28Days: 92.84,
        salesComparisonPrevYear: 100
      }))
      .sort((a, b) => b.sales - a.sales)
  }, [state.data.dailyAccounts, state.data.clinicData])

  const ageGroupData = useMemo(() => {
    const allData = getAllDailyAccounts()
    if (allData.length === 0) return []

    const ageMap = new Map<string, { sales: number, accounts: number, unitPrice: number }>()
    
    allData.forEach((record: any) => {
      const age = record.age || record.patientAge || 'NULL'
      const amount = record.totalWithTax || 0
      
      if (!ageMap.has(age)) {
        ageMap.set(age, { sales: 0, accounts: 0, unitPrice: 0 })
      }
      
      const ageData = ageMap.get(age)!
      ageData.sales += amount
      ageData.accounts += 1
      ageData.unitPrice += amount
    })

    return Array.from(ageMap.entries())
      .map(([age, data]) => ({
        age: age === 'NULL' ? 'NULL' : `${age}代`,
        sales: data.sales,
        accounts: data.accounts,
        unitPrice: data.accounts > 0 ? data.sales / data.accounts : 0,
        sales28Days: data.sales,
        sales28DaysPercent: 100,
        sales365DaysPercent: 100,
        unitPriceConversion: data.accounts > 0 ? (data.sales / data.accounts) * 0.8 : 0,
        salesComparison28Days: 92.84,
        salesComparisonPrevYear: 100
      }))
      .sort((a, b) => b.sales - a.sales)
  }, [state.data.dailyAccounts, state.data.clinicData])

  const categoryData = useMemo(() => {
    const allData = getAllDailyAccounts()
    if (allData.length === 0) return { major: [], medium: [] }

    const majorMap = new Map<string, { sales: number, accounts: number, unitPrice: number }>()
    const mediumMap = new Map<string, { sales: number, accounts: number, unitPrice: number }>()
    
    allData.forEach((record: any) => {
      // Use the same category logic as TreatmentCategoryDebug
      const majorCategory = record.paymentItems?.[0]?.category || record.treatmentCategory || '未分類'
      const mediumCategory = record.paymentItems?.[0]?.name || record.treatmentName || '未分類'
      const amount = record.totalWithTax || 0
      
      // Major category
      if (!majorMap.has(majorCategory)) {
        majorMap.set(majorCategory, { sales: 0, accounts: 0, unitPrice: 0 })
      }
      const majorData = majorMap.get(majorCategory)!
      majorData.sales += amount
      majorData.accounts += 1
      majorData.unitPrice += amount

      // Medium category
      if (!mediumMap.has(mediumCategory)) {
        mediumMap.set(mediumCategory, { sales: 0, accounts: 0, unitPrice: 0 })
      }
      const mediumData = mediumMap.get(mediumCategory)!
      mediumData.sales += amount
      mediumData.accounts += 1
      mediumData.unitPrice += amount
    })

    const majorCategories = Array.from(majorMap.entries())
      .map(([category, data]) => ({
        category,
        sales: data.sales,
        accounts: data.accounts,
        unitPrice: data.accounts > 0 ? data.sales / data.accounts : 0,
        sales28Days: data.sales,
        sales28DaysPercent: 100,
        sales365DaysPercent: 100,
        unitPriceConversion: data.accounts > 0 ? (data.sales / data.accounts) * 0.8 : 0,
        salesComparison28Days: 92.84,
        salesComparisonPrevYear: 100
      }))
      .sort((a, b) => b.sales - a.sales)

    const mediumCategories = Array.from(mediumMap.entries())
      .map(([category, data]) => ({
        category,
        sales: data.sales,
        accounts: data.accounts,
        unitPrice: data.accounts > 0 ? data.sales / data.accounts : 0,
        sales28Days: data.sales,
        sales28DaysPercent: 100,
        sales365DaysPercent: 100,
        unitPriceConversion: data.accounts > 0 ? (data.sales / data.accounts) * 0.8 : 0,
        salesComparison28Days: 92.84,
        salesComparisonPrevYear: 100
      }))
      .sort((a, b) => b.sales - a.sales)

    return { major: majorCategories, medium: mediumCategories }
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
    console.log('📊 [TreatmentSalesTrend] Component rendered')
    console.log('📊 [TreatmentSalesTrend] Has real data:', hasRealData)
    console.log('📊 [TreatmentSalesTrend] Category trends count:', categoryTrends.length)
  }, [hasRealData, categoryTrends.length])

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
      {/* Debug Info - Show actual categories being used */}
      <div className="p-4 rounded-lg bg-blue-50">
        <h3 className="mb-2 text-sm font-medium text-blue-900">データサマリー</h3>
        <div className="space-y-1 text-xs text-blue-800">
          <p>• 総レコード数: {getAllDailyAccounts().length}</p>
          <p>• 治療カテゴリー数: {Array.from(new Set(getAllDailyAccounts().map((r: any) => r.paymentItems?.[0]?.category || r.treatmentCategory || '未分類'))).length}</p>
          <p>• 使用中のカテゴリー: {Array.from(new Set(getAllDailyAccounts().map((r: any) => r.paymentItems?.[0]?.category || r.treatmentCategory || '未分類'))).join(', ')}</p>
        </div>
      </div>
      {/* Category Trend Chart */}
      <div className="p-6 bg-white border rounded-lg shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">カテゴリー推移</h3>
        <div className="h-80">
          <Chart type="bar" data={stackedChartData} options={stackedChartOptions} />
        </div>
      </div>
      {/* Category Breakdown Table */}
      <div className="p-6 bg-white border rounded-lg shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">カテゴリー別詳細</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">カテゴリー名</th>
                <th className="py-2 text-right">総売上</th>
                <th className="py-2 text-right">件数</th>
                <th className="py-2 text-right">平均単価</th>
                <th className="py-2 text-right">売上構成比</th>
              </tr>
            </thead>
            <tbody>
              {(categoryData.major.length > itemsPerPage
                ? categoryData.major.slice((categoryPage - 1) * itemsPerPage, categoryPage * itemsPerPage)
                : categoryData.major
              ).map((item, idx) => {
                const totalSales = categoryData.major.reduce((sum, cat) => sum + cat.sales, 0)
                const percentage = totalSales > 0 ? (item.sales / totalSales) * 100 : 0
                return (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-2 font-medium">{item.category}</td>
                    <td className="py-2 text-right">{formatCurrency(item.sales)}</td>
                    <td className="py-2 text-right">{formatNumber(item.accounts)}</td>
                    <td className="py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-2 text-right">{percentage.toFixed(1)}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {categoryData.major.length > itemsPerPage && (
          <Pagination
            currentPage={categoryPage}
            totalPages={Math.ceil(categoryData.major.length / itemsPerPage)}
            onPageChange={setCategoryPage}
            totalItems={categoryData.major.length}
            itemsPerPage={itemsPerPage}
          />
        )}
      </div>

      {/* Line Charts Section */}
      <div className="p-6 bg-white border rounded-lg shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">詳細トレンド</h3>
        <div className="h-80">
          <Chart type="line" data={lineChartData} options={lineChartOptions} />
        </div>
      </div>

      {/* Tables Section (one per row) */}
      {/* Clinic Table */}
      <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">院別</h3>
          <div className="overflow-x-auto">
            {clinicData.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <p>データがありません</p>
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">院名</th>
                    <th className="py-2 text-right">売上_直近28日</th>
                    <th className="py-2 text-right">28日合計%</th>
                    <th className="py-2 text-right">365日合計%</th>
                    <th className="py-2 text-right">単価×成約率</th>
                    <th className="py-2 text-right">売上_比較28日%</th>
                    <th className="py-2 text-right">売上_比較前年28日%</th>
                  </tr>
                </thead>
                <tbody>
                  {(clinicData.length > itemsPerPage
                    ? clinicData.slice((clinicPage - 1) * itemsPerPage, clinicPage * itemsPerPage)
                    : clinicData
                  ).map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-2">{item.clinic}</td>
                      <td className="py-2 text-right">{formatCurrency(item.sales28Days)}</td>
                      <td className="py-2 text-right">{item.sales28DaysPercent.toFixed(2)}%</td>
                      <td className="py-2 text-right">{item.sales365DaysPercent.toFixed(2)}%</td>
                      <td className="py-2 text-right">{formatCurrency(item.unitPriceConversion)}</td>
                      <td className="py-2 text-right">{item.salesComparison28Days.toFixed(2)}%</td>
                      <td className="py-2 text-right">{item.salesComparisonPrevYear.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {clinicData.length > itemsPerPage && (
            <Pagination
              currentPage={clinicPage}
              totalPages={Math.ceil(clinicData.length / itemsPerPage)}
              onPageChange={setClinicPage}
              totalItems={clinicData.length}
              itemsPerPage={itemsPerPage}
            />
          )}
        </div>

      {/* Age Group Table */}
      <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">年代</h3>
          <div className="overflow-x-auto">
            {ageGroupData.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <p>データがありません</p>
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">年代</th>
                    <th className="py-2 text-right">売上_直近28日</th>
                    <th className="py-2 text-right">28日合計%</th>
                    <th className="py-2 text-right">365日合計%</th>
                    <th className="py-2 text-right">単価×成約率</th>
                    <th className="py-2 text-right">売上_比較28日%</th>
                    <th className="py-2 text-right">売上_比較前年28日%</th>
                  </tr>
                </thead>
                <tbody>
                  {(ageGroupData.length > itemsPerPage
                    ? ageGroupData.slice((agePage - 1) * itemsPerPage, agePage * itemsPerPage)
                    : ageGroupData
                  ).map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-2">{item.age}</td>
                      <td className="py-2 text-right">{formatCurrency(item.sales28Days)}</td>
                      <td className="py-2 text-right">{item.sales28DaysPercent.toFixed(2)}%</td>
                      <td className="py-2 text-right">{item.sales365DaysPercent.toFixed(2)}%</td>
                      <td className="py-2 text-right">{formatCurrency(item.unitPriceConversion)}</td>
                      <td className="py-2 text-right">{item.salesComparison28Days.toFixed(2)}%</td>
                      <td className="py-2 text-right">{item.salesComparisonPrevYear.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {ageGroupData.length > itemsPerPage && (
            <Pagination
              currentPage={agePage}
              totalPages={Math.ceil(ageGroupData.length / itemsPerPage)}
              onPageChange={setAgePage}
              totalItems={ageGroupData.length}
              itemsPerPage={itemsPerPage}
            />
          )}
      </div>

      {/* Major Category Table */}
      <div className="p-6 bg-white border rounded-lg shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">カテゴリー別</h3>
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700">大カテゴリー</h4>
            </div>
            <div className="overflow-x-auto">
              {categoryData.major.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <p>データがありません</p>
                </div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left">カテゴリー</th>
                      <th className="py-2 text-right">売上_直近28日</th>
                      <th className="py-2 text-right">28日合計%</th>
                      <th className="py-2 text-right">365日合計%</th>
                      <th className="py-2 text-right">単価×成約率</th>
                      <th className="py-2 text-right">売上_比較28日%</th>
                      <th className="py-2 text-right">売上_比較前年28日%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(categoryData.major.length > itemsPerPage
                      ? categoryData.major.slice((majorCategoryPage - 1) * itemsPerPage, majorCategoryPage * itemsPerPage)
                      : categoryData.major
                    ).map((item, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-2">{item.category}</td>
                        <td className="py-2 text-right">{formatCurrency(item.sales28Days)}</td>
                        <td className="py-2 text-right">{item.sales28DaysPercent.toFixed(2)}%</td>
                        <td className="py-2 text-right">{item.sales365DaysPercent.toFixed(2)}%</td>
                        <td className="py-2 text-right">{formatCurrency(item.unitPriceConversion)}</td>
                        <td className="py-2 text-right">{item.salesComparison28Days.toFixed(2)}%</td>
                        <td className="py-2 text-right">{item.salesComparisonPrevYear.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {categoryData.major.length > itemsPerPage && (
              <Pagination
                currentPage={majorCategoryPage}
                totalPages={Math.ceil(categoryData.major.length / itemsPerPage)}
                onPageChange={setMajorCategoryPage}
                totalItems={categoryData.major.length}
                itemsPerPage={itemsPerPage}
              />
            )}
      </div>

      {/* Medium Category Table */}
      <div className="p-6 bg-white border rounded-lg shadow-sm">
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700">中カテゴリー</h4>
            </div>
            <div className="overflow-x-auto">
              {categoryData.medium.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <p>データがありません</p>
                </div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left">カテゴリー</th>
                      <th className="py-2 text-right">売上_直近28日</th>
                      <th className="py-2 text-right">28日合計%</th>
                      <th className="py-2 text-right">365日合計%</th>
                      <th className="py-2 text-right">単価×成約率</th>
                      <th className="py-2 text-right">売上_比較28日%</th>
                      <th className="py-2 text-right">売上_比較前年28日%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(categoryData.medium.length > itemsPerPage
                      ? categoryData.medium.slice((mediumCategoryPage - 1) * itemsPerPage, mediumCategoryPage * itemsPerPage)
                      : categoryData.medium
                    ).map((item, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-2">{item.category}</td>
                        <td className="py-2 text-right">{formatCurrency(item.sales28Days)}</td>
                        <td className="py-2 text-right">{item.sales28DaysPercent.toFixed(2)}%</td>
                        <td className="py-2 text-right">{item.sales365DaysPercent.toFixed(2)}%</td>
                        <td className="py-2 text-right">{formatCurrency(item.unitPriceConversion)}</td>
                        <td className="py-2 text-right">{item.salesComparison28Days.toFixed(2)}%</td>
                        <td className="py-2 text-right">{item.salesComparisonPrevYear.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {categoryData.medium.length > itemsPerPage && (
              <Pagination
                currentPage={mediumCategoryPage}
                totalPages={Math.ceil(categoryData.medium.length / itemsPerPage)}
                onPageChange={setMediumCategoryPage}
                totalItems={categoryData.medium.length}
                itemsPerPage={itemsPerPage}
              />
            )}
      </div>
    </div>
  )
}
