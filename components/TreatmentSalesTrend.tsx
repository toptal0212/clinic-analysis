'use client'

import React, { useMemo, useEffect, useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { categorizeTreatment } from '@/lib/treatmentCategories'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, ArcElement } from 'chart.js'
import { Chart, Doughnut, Scatter } from 'react-chartjs-2'
import { AlertCircle } from 'lucide-react'
import Pagination from './Pagination'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, ArcElement)

export default function TreatmentSalesTrend() {
  const { state } = useDashboard()
  const [selectedClinic, setSelectedClinic] = useState<string>('全院')
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

  // Get available clinics
  const availableClinics = useMemo(() => {
    const allData = getAllDailyAccounts()
    const clinics = new Set<string>(['全院'])
    allData.forEach((r: any) => {
      const clinic = r.clinicName || 'その他'
      if (clinic) clinics.add(clinic)
    })
    return Array.from(clinics).sort()
  }, [state.data.dailyAccounts, state.data.clinicData])

  // Filter data by selected clinic
  const filteredData = useMemo(() => {
    const allData = getAllDailyAccounts()
    if (selectedClinic === '全院') return allData
    return allData.filter((r: any) => (r.clinicName || 'その他') === selectedClinic)
  }, [selectedClinic, state.data.dailyAccounts, state.data.clinicData])

  // Detect uncategorized treatments
  const uncategorizedTreatments = useMemo(() => {
    const uncategorized: Array<{ record: any, category: string, name: string }> = []
    
    filteredData.forEach((record: any) => {
      if (Array.isArray(record.paymentItems) && record.paymentItems.length > 0) {
        record.paymentItems.forEach((item: any) => {
          const category = item.category || ''
          const name = item.name || ''
          const categorized = categorizeTreatment(category, name)
          
          // Check if it's truly uncategorized (should not happen with current logic, but check anyway)
          if (!category && !name) {
            uncategorized.push({ record, category: '未分類', name: '未分類' })
          }
        })
      } else {
        const category = record.treatmentCategory || ''
        const name = record.treatmentName || ''
        if (!category && !name) {
          uncategorized.push({ record, category: '未分類', name: '未分類' })
        }
      }
    })
    
    return uncategorized
  }, [filteredData])

  // Calculate category trends (stacked bar chart data) - using categorizeTreatment
  const categoryTrends = useMemo(() => {
    if (filteredData.length === 0) {
      return []
    }

    // Group data by month
    const monthlyData = new Map<string, { sales: { [key: string]: number }, accounts: number, unitPrice: number, patients: { new: number, existing: number } }>()
    
    filteredData.forEach((record: any) => {
      const date = new Date(record.recordDate || record.visitDate || record.treatmentDate || record.accountingDate)
      if (isNaN(date.getTime())) return

      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { sales: {}, accounts: 0, unitPrice: 0, patients: { new: 0, existing: 0 } })
      }

      const monthData = monthlyData.get(monthKey)!
      
      // Categorize using categorizeTreatment
      let majorCategory = 'その他'
      if (Array.isArray(record.paymentItems) && record.paymentItems.length > 0) {
        record.paymentItems.forEach((item: any) => {
          const categorized = categorizeTreatment(item.category || '', item.name || '')
          // Map specialty to major category name
          if (categorized.specialty === 'surgery') majorCategory = '美容外科'
          else if (categorized.specialty === 'dermatology') majorCategory = '美容皮膚科'
          else if (categorized.specialty === 'hair_removal') majorCategory = '脱毛'
          else if (categorized.specialty === 'other') {
            if (categorized.subcategory === 'ピアス') majorCategory = 'ピアス'
            else if (categorized.subcategory === '物販') majorCategory = '物販'
            else if (categorized.subcategory === '麻酔・針・パック') majorCategory = '麻酔・針・パック'
            else majorCategory = 'その他'
          }
          
          const amount = item.priceWithTax || 0
          monthData.sales[majorCategory] = (monthData.sales[majorCategory] || 0) + amount
        })
      } else {
        const categorized = categorizeTreatment(record.treatmentCategory || '', record.treatmentName || '')
        if (categorized.specialty === 'surgery') majorCategory = '美容外科'
        else if (categorized.specialty === 'dermatology') majorCategory = '美容皮膚科'
        else if (categorized.specialty === 'hair_removal') majorCategory = '脱毛'
        else if (categorized.specialty === 'other') {
          if (categorized.subcategory === 'ピアス') majorCategory = 'ピアス'
          else if (categorized.subcategory === '物販') majorCategory = '物販'
          else if (categorized.subcategory === '麻酔・針・パック') majorCategory = '麻酔・針・パック'
          else majorCategory = 'その他'
        }
        
        const amount = record.totalWithTax || 0
        monthData.sales[majorCategory] = (monthData.sales[majorCategory] || 0) + amount
      }
      
      monthData.accounts += 1
      monthData.unitPrice += record.totalWithTax || 0
      
      // Count patients by type
      const isFirst = record.isFirst === true || record.isFirstVisit === true
      if (isFirst) {
        monthData.patients.new += 1
      } else {
        monthData.patients.existing += 1
      }
    })

    const sortedMonths = Array.from(monthlyData.keys()).sort()
    const categories = Array.from(new Set(filteredData.flatMap((r: any) => {
      if (Array.isArray(r.paymentItems) && r.paymentItems.length > 0) {
        return r.paymentItems.map((item: any) => {
          const categorized = categorizeTreatment(item.category || '', item.name || '')
          if (categorized.specialty === 'surgery') return '美容外科'
          else if (categorized.specialty === 'dermatology') return '美容皮膚科'
          else if (categorized.specialty === 'hair_removal') return '脱毛'
          else if (categorized.specialty === 'other') {
            if (categorized.subcategory === 'ピアス') return 'ピアス'
            else if (categorized.subcategory === '物販') return '物販'
            else if (categorized.subcategory === '麻酔・針・パック') return '麻酔・針・パック'
            else return 'その他'
          }
          return 'その他'
        })
      }
      const categorized = categorizeTreatment(r.treatmentCategory || '', r.treatmentName || '')
      if (categorized.specialty === 'surgery') return '美容外科'
      else if (categorized.specialty === 'dermatology') return '美容皮膚科'
      else if (categorized.specialty === 'hair_removal') return '脱毛'
      else if (categorized.specialty === 'other') {
        if (categorized.subcategory === 'ピアス') return 'ピアス'
        else if (categorized.subcategory === '物販') return '物販'
        else if (categorized.subcategory === '麻酔・針・パック') return '麻酔・針・パック'
        else return 'その他'
      }
      return 'その他'
    })))

    return sortedMonths.map(month => {
      const data = monthlyData.get(month)!
      const date = new Date(month)
      const monthName = `${String(date.getFullYear()).slice(-2)}年${date.getMonth() + 1}月`
      return {
        month: monthName,
        monthLabel: monthName,
        sales: categories.reduce((acc, cat) => ({ ...acc, [cat]: data.sales[cat] || 0 }), {}),
        totalSales: Object.values(data.sales).reduce((sum, val) => sum + val, 0),
        accounts: data.accounts,
        unitPrice: data.accounts > 0 ? data.unitPrice / data.accounts : 0,
        patients: data.patients
      }
    })
  }, [filteredData])

  // Chart data for Category Trend (Stacked Bar Chart)
  const stackedChartData = useMemo(() => {
    if (categoryTrends.length === 0) {
      return { labels: [], datasets: [] }
    }

    const labels = categoryTrends.map(trend => trend.month)
    const categories = Array.from(new Set(categoryTrends.flatMap(t => Object.keys(t.sales))))
    
    // Color palette matching image
    const palette: { [key: string]: string } = {
      '美容外科': '#F59E0B',
      '美容皮膚科': '#10B981',
      '脱毛': '#EC4899',
      '物販': '#8B5CF6',
      'その他': '#06B6D4',
      'ピアス': '#F97316',
      '麻酔・針・パック': '#84CC16'
    }

    const datasets: any[] = categories.map((category) => ({
      type: 'bar' as const,
      label: category,
      data: categoryTrends.map(trend => trend.sales[category] || 0),
      backgroundColor: palette[category] || '#9CA3AF',
      borderColor: palette[category] || '#9CA3AF',
      borderWidth: 1,
      stack: 'sales',
      yAxisID: 'y'
    }))

    // Add line for total sales
    datasets.push({
      type: 'line' as const,
      label: '売上',
      data: categoryTrends.map(trend => trend.totalSales),
      borderColor: '#F97316',
      backgroundColor: 'rgba(249, 115, 22, 0.1)',
      borderWidth: 2,
      fill: false,
      yAxisID: 'y1',
      pointRadius: 4,
      pointBackgroundColor: '#F97316'
    })

    return { labels, datasets }
  }, [categoryTrends])

  const stackedChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 30,
        bottom: 10,
        left: 10,
        right: 10
      }
    },
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
        position: 'left' as const,
        beginAtZero: true,
        ticks: { 
          callback: (v: any) => `¥${(v/1000000).toFixed(0)}M`,
          padding: 10
        },
        title: {
          display: true,
          text: '売上金額',
          padding: { top: 10, bottom: 0 }
        }
      },
      y1: {
        type: 'linear' as const,
        position: 'right' as const,
        grid: { drawOnChartArea: false },
        beginAtZero: true,
        ticks: {
          callback: (v: any) => `¥${(v/1000000).toFixed(0)}M`,
          padding: 10
        },
        title: {
          display: true,
          text: '総売上',
          padding: { top: 10, bottom: 0 }
        }
      }
    }
  } as any

  // Patient count chart (stacked bar + line)
  const patientChartData = useMemo(() => {
    if (categoryTrends.length === 0) {
      return { labels: [], datasets: [] }
    }

    const labels = categoryTrends.map(trend => trend.month)
    
    return {
      labels,
      datasets: [
        {
          type: 'bar' as const,
          label: '新規',
          data: categoryTrends.map(trend => trend.patients.new),
          backgroundColor: '#3B82F6',
          borderColor: '#3B82F6',
          borderWidth: 1,
          stack: 'patients',
          yAxisID: 'y'
        },
        {
          type: 'bar' as const,
          label: '既存',
          data: categoryTrends.map(trend => trend.patients.existing),
          backgroundColor: '#60A5FA',
          borderColor: '#60A5FA',
          borderWidth: 1,
          stack: 'patients',
          yAxisID: 'y'
        },
        {
          type: 'line' as const,
          label: '患者数',
          data: categoryTrends.map(trend => trend.patients.new + trend.patients.existing),
          borderColor: '#F97316',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          borderWidth: 2,
          fill: false,
          yAxisID: 'y1',
          pointRadius: 4,
          pointBackgroundColor: '#F97316'
        }
      ]
    }
  }, [categoryTrends])

  // Calculate metrics for center charts
  const centerMetrics = useMemo(() => {
    if (categoryTrends.length === 0) return null

    const latest = categoryTrends[categoryTrends.length - 1]
    const totalPatients = latest.patients.new + latest.patients.existing
    const repeatRate = totalPatients > 0 ? (latest.patients.existing / totalPatients) * 100 : 0

    return {
      accounts: latest.accounts,
      patients: totalPatients,
      unitPrice: latest.unitPrice,
      dailyUnitPrice: latest.accounts > 0 ? latest.totalSales / latest.accounts : 0,
      repeatRate
    }
  }, [categoryTrends])

  // Calculate category breakdown (major and medium)
  const categoryData = useMemo(() => {
    if (filteredData.length === 0) return { major: [], medium: [] }

    const majorMap = new Map<string, { sales: number, accounts: number }>()
    const mediumMap = new Map<string, { sales: number, accounts: number }>()
    
    filteredData.forEach((record: any) => {
      if (Array.isArray(record.paymentItems) && record.paymentItems.length > 0) {
        record.paymentItems.forEach((item: any) => {
          const categorized = categorizeTreatment(item.category || '', item.name || '')
          const amount = item.priceWithTax || 0
          
          // Major category
          let majorCategory = 'その他'
          if (categorized.specialty === 'surgery') majorCategory = '美容外科'
          else if (categorized.specialty === 'dermatology') majorCategory = '美容皮膚科'
          else if (categorized.specialty === 'hair_removal') majorCategory = '脱毛'
          else if (categorized.specialty === 'other') {
            if (categorized.subcategory === 'ピアス') majorCategory = 'ピアス'
            else if (categorized.subcategory === '物販') majorCategory = '物販'
            else if (categorized.subcategory === '麻酔・針・パック') majorCategory = '麻酔・針・パック'
            else majorCategory = 'その他'
          }
          
          // Medium category
          const mediumCategory = categorized.subcategory || item.name || 'その他'
          
          if (!majorMap.has(majorCategory)) {
            majorMap.set(majorCategory, { sales: 0, accounts: 0 })
          }
          const majorData = majorMap.get(majorCategory)!
          majorData.sales += amount
          majorData.accounts += 1

          if (!mediumMap.has(mediumCategory)) {
            mediumMap.set(mediumCategory, { sales: 0, accounts: 0 })
          }
          const mediumData = mediumMap.get(mediumCategory)!
          mediumData.sales += amount
          mediumData.accounts += 1
        })
      } else {
        const categorized = categorizeTreatment(record.treatmentCategory || '', record.treatmentName || '')
        const amount = record.totalWithTax || 0
        
        let majorCategory = 'その他'
        if (categorized.specialty === 'surgery') majorCategory = '美容外科'
        else if (categorized.specialty === 'dermatology') majorCategory = '美容皮膚科'
        else if (categorized.specialty === 'hair_removal') majorCategory = '脱毛'
        else if (categorized.specialty === 'other') {
          if (categorized.subcategory === 'ピアス') majorCategory = 'ピアス'
          else if (categorized.subcategory === '物販') majorCategory = '物販'
          else if (categorized.subcategory === '麻酔・針・パック') majorCategory = '麻酔・針・パック'
          else majorCategory = 'その他'
        }
        
        const mediumCategory = categorized.subcategory || record.treatmentName || 'その他'
        
        if (!majorMap.has(majorCategory)) {
          majorMap.set(majorCategory, { sales: 0, accounts: 0 })
        }
        const majorData = majorMap.get(majorCategory)!
        majorData.sales += amount
        majorData.accounts += 1

        if (!mediumMap.has(mediumCategory)) {
          mediumMap.set(mediumCategory, { sales: 0, accounts: 0 })
        }
        const mediumData = mediumMap.get(mediumCategory)!
        mediumData.sales += amount
        mediumData.accounts += 1
      }
    })

    const majorCategories = Array.from(majorMap.entries())
      .map(([category, data]) => ({
        category,
        sales: data.sales,
        accounts: data.accounts,
        unitPrice: data.accounts > 0 ? data.sales / data.accounts : 0,
        appointmentRate: 0 // Calculate if needed
      }))
      .filter(item => item.category !== '未分類') // Remove uncategorized
      .sort((a, b) => b.sales - a.sales)

    const mediumCategories = Array.from(mediumMap.entries())
      .map(([category, data]) => ({
        category,
        sales: data.sales,
        accounts: data.accounts,
        unitPrice: data.accounts > 0 ? data.sales / data.accounts : 0,
        appointmentRate: 0 // Calculate if needed
      }))
      .filter(item => item.category !== '未分類') // Remove uncategorized
      .sort((a, b) => b.sales - a.sales)

    return { major: majorCategories, medium: mediumCategories }
  }, [filteredData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ja-JP').format(Math.round(num))
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

  return (
    <div className="p-6 space-y-6">
      {/* Clinic Selector */}
      <div className="flex items-center mb-4 space-x-4">
        <label className="text-sm font-medium text-gray-700">院選択:</label>
        <select
          value={selectedClinic}
          onChange={(e) => setSelectedClinic(e.target.value)}
          className="px-3 py-2 bg-white border border-gray-300 rounded-md"
        >
          {availableClinics.map(clinic => (
            <option key={clinic} value={clinic}>{clinic}</option>
          ))}
        </select>
      </div>

      {/* Top Section: Sales Trend Chart */}
      <div className="p-6 bg-white border rounded-lg shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">売上推移と構成比</h3>
        <div className="h-96">
          <Chart type="bar" data={stackedChartData} options={stackedChartOptions} />
        </div>
      </div>

      {/* Bottom Left: Patient Count Chart */}
      <div className="p-6 bg-white border rounded-lg shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">患者数推移</h3>
        <div className="h-96">
          <Chart type="bar" data={patientChartData} options={stackedChartOptions} />
        </div>
      </div>

      {/* Center Section: Metrics Charts */}
      {centerMetrics && (
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">詳細指標</h3>
          <div className="space-y-4">
            {/* 件数 */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">件数</span>
                <span className="relative z-10 px-2 text-lg font-bold text-gray-900 bg-white">{formatNumber(centerMetrics.accounts)}</span>
              </div>
              <div className="relative w-full h-8 overflow-visible bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${Math.min((centerMetrics.accounts / Math.max(centerMetrics.accounts, 1)) * 100, 100)}%` }}
                >
                </div>
              </div>
            </div>

            {/* 患者数 */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">患者数</span>
                <span className="relative z-10 px-2 text-lg font-bold text-gray-900 bg-white">{formatNumber(centerMetrics.patients)}</span>
              </div>
              <div className="relative w-full h-8 overflow-visible bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${Math.min((centerMetrics.patients / Math.max(centerMetrics.patients, 1)) * 100, 100)}%` }}
                >
                </div>
              </div>
            </div>

            {/* リピート率 */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">リピート率</span>
                <span className="relative z-10 px-2 text-lg font-bold text-gray-900 bg-white">{centerMetrics.repeatRate.toFixed(1)}%</span>
              </div>
              <div className="relative w-full h-8 overflow-visible bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${Math.min(centerMetrics.repeatRate, 100)}%` }}
                >
                </div>
              </div>
            </div>

            {/* 会計単価 */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">会計単価</span>
                <span className="relative z-10 px-2 text-lg font-bold text-gray-900 bg-white">{formatCurrency(centerMetrics.dailyUnitPrice)}</span>
              </div>
              <div className="relative w-full h-8 overflow-visible bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-orange-500 rounded-full"
                  style={{ width: `${Math.min((centerMetrics.dailyUnitPrice / Math.max(centerMetrics.dailyUnitPrice, 1)) * 100, 100)}%` }}
                >
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Major Category Table */}
      <div className="p-6 bg-white border rounded-lg shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">大カテゴリ別売上</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">大カテゴリ</th>
                <th className="py-2 text-right">売上</th>
                <th className="py-2 text-right">件数</th>
                <th className="py-2 text-right">アポ率</th>
              </tr>
            </thead>
            <tbody>
              {(categoryData.major.length > itemsPerPage
                ? categoryData.major.slice((majorCategoryPage - 1) * itemsPerPage, majorCategoryPage * itemsPerPage)
                : categoryData.major
              ).map((item, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="py-2 font-medium">{item.category}</td>
                  <td className="py-2 text-right">{formatCurrency(item.sales)}</td>
                  <td className="py-2 text-right">{formatNumber(item.accounts)}</td>
                  <td className="py-2 text-right">{item.appointmentRate.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
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
        <h3 className="mb-4 text-lg font-semibold text-gray-900">中カテゴリ別売上</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">中カテゴリ</th>
                <th className="py-2 text-right">売上</th>
                <th className="py-2 text-right">件数</th>
                <th className="py-2 text-right">アポ率</th>
              </tr>
            </thead>
            <tbody>
              {(categoryData.medium.length > itemsPerPage
                ? categoryData.medium.slice((mediumCategoryPage - 1) * itemsPerPage, mediumCategoryPage * itemsPerPage)
                : categoryData.medium
              ).map((item, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="py-2 font-medium">{item.category}</td>
                  <td className="py-2 text-right">{formatCurrency(item.sales)}</td>
                  <td className="py-2 text-right">{formatNumber(item.accounts)}</td>
                  <td className="py-2 text-right">{item.appointmentRate.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
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
