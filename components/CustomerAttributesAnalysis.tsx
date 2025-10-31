'use client'

import React, { useMemo, useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, ArcElement } from 'chart.js'
import { Chart, Doughnut } from 'react-chartjs-2'
import Pagination from './Pagination'
import { AlertCircle } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, ArcElement)

export default function CustomerAttributesAnalysis() {
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

  // Calculate annual sales trend (stacked bar + line)
  const annualSalesTrend = useMemo(() => {
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

    // Group by category for stacked bars
    const categoryMap = new Map<string, number[]>()
    const monthlyTotal = new Array(12).fill(0)
    
    months.forEach((m, idx) => {
      const monthData = allData.filter((r: any) => {
        const date = parseDate(r)
        if (!date) return false
        return date.getFullYear() === m.year && date.getMonth() === m.month
      })

      monthData.forEach((r: any) => {
        const category = r.paymentItems?.[0]?.category || r.treatmentCategory || 'その他'
        if (!categoryMap.has(category)) {
          categoryMap.set(category, new Array(12).fill(0))
        }
        const amount = r.totalWithTax || 0
        categoryMap.get(category)![idx] += amount
        monthlyTotal[idx] += amount
      })
    })

    const categories = Array.from(categoryMap.keys())
    const palette = [
      '#F59E0B', '#10B981', '#EC4899', '#22C55E', '#3B82F6', '#8B5CF6', '#06B6D4', '#F97316'
    ]

    const datasets: any[] = categories.slice(0, 8).map((category, idx) => ({
      type: 'bar' as const,
      label: category,
      data: categoryMap.get(category)!,
      backgroundColor: palette[idx % palette.length],
      stack: 'sales'
    }))

    datasets.push({
      type: 'line' as const,
      label: '累計売上',
      data: monthlyTotal,
      borderColor: '#EF4444',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderWidth: 2,
      pointRadius: 4,
      fill: false
    })

    return {
      labels: months.map(m => m.label),
      datasets
    }
  }, [state.data.dailyAccounts, state.data.clinicData])

  // Calculate visits trend (stacked bar + line)
  const visitsTrend = useMemo(() => {
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

    const firstVisitCount = new Array(12).fill(0)
    const repeatVisitCount = new Array(12).fill(0)
    const totalCount = new Array(12).fill(0)

    months.forEach((m, idx) => {
      const monthData = allData.filter((r: any) => {
        const date = parseDate(r)
        if (!date) return false
        return date.getFullYear() === m.year && date.getMonth() === m.month
      })

      monthData.forEach((r: any) => {
        const isFirst = r.isFirst === true || r.isFirstVisit === true
        if (isFirst) {
          firstVisitCount[idx] += 1
        } else {
          repeatVisitCount[idx] += 1
        }
        totalCount[idx] += 1
      })
    })

    return {
      labels: months.map(m => m.label),
      datasets: [
        {
          type: 'bar' as const,
          label: '初診',
          data: firstVisitCount,
          backgroundColor: '#93C5FD',
          stack: 'visits'
        },
        {
          type: 'bar' as const,
          label: '再診',
          data: repeatVisitCount,
          backgroundColor: '#1E40AF',
          stack: 'visits'
        },
        {
          type: 'line' as const,
          label: '合計',
          data: totalCount,
          borderColor: '#F97316',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          borderWidth: 2,
          pointRadius: 4,
          fill: false
        }
      ]
    }
  }, [state.data.dailyAccounts, state.data.clinicData])

  // Calculate demographics for pie charts
  const demographics = useMemo(() => {
    const allData = getAllDailyAccounts()
    
    const ageMap = new Map<string, number>()
    const genderMap = new Map<string, number>()
    const visitTypeMap = new Map<string, number>()
    const prefectureMap = new Map<string, number>()

    // Log sample record structure for debugging
    if (allData.length > 0) {
      console.log('📊 [CustomerAttributesAnalysis] Sample record structure:', {
        firstRecord: allData[0],
        sampleFields: {
          visitorAge: allData[0]?.visitorAge,
          visitorGender: allData[0]?.visitorGender,
          visitorInflowSourceName: allData[0]?.visitorInflowSourceName,
          isFirst: allData[0]?.isFirst,
          age: allData[0]?.age,
          gender: allData[0]?.gender,
          patientAge: allData[0]?.patientAge,
          patientGender: allData[0]?.patientGender
        }
      })
    }

    allData.forEach((r: any) => {
      // Age groups - check actual API field names first (visitorAge), then fallback to other field names
      const ageNum = Number(r.visitorAge ?? r.age ?? r.patientAge ?? r.ageGroup ?? null)
      if (Number.isFinite(ageNum) && ageNum > 0 && ageNum < 150) {
        const decade = `${Math.floor(ageNum / 10) * 10}代`
        ageMap.set(decade, (ageMap.get(decade) || 0) + 1)
      } else {
        // Count records without age as "不明"
        ageMap.set('不明', (ageMap.get('不明') || 0) + 1)
      }

      // Gender - check actual API field names first (visitorGender), then fallback
      const gender = (r.visitorGender ?? r.gender ?? r.patientGender ?? r.sex ?? 'その他').toString().trim()
      const genderLabel = gender || 'その他'
      genderMap.set(genderLabel, (genderMap.get(genderLabel) || 0) + 1)

      // Visit type - check isFirst field (direct from API), then fallback
      const isFirst = r.isFirst === true || r.isFirstVisit === true || r.isNewPatient === true || r.visitType === 'first' || r.visitType === '初診'
      const visitType = isFirst ? '初診' : '再診'
      visitTypeMap.set(visitType, (visitTypeMap.get(visitType) || 0) + 1)

      // Prefecture - check visitorColumnValues or other field names
      // Note: Prefecture might be in visitorColumnValues array or separate field
      let prefecture = 'その他'
      if (r.visitorColumnValues && Array.isArray(r.visitorColumnValues)) {
        // Try to find prefecture in column values
        const prefValue = r.visitorColumnValues.find((v: any) => 
          typeof v === 'string' && (v.includes('都') || v.includes('県') || v.includes('府'))
        )
        if (prefValue) prefecture = prefValue
      }
      if (prefecture === 'その他') {
        prefecture = (r.prefecture ?? r.patientPrefecture ?? r.pref ?? r.addressPrefecture ?? 'その他').toString().trim()
      }
      const prefectureLabel = prefecture || 'その他'
      prefectureMap.set(prefectureLabel, (prefectureMap.get(prefectureLabel) || 0) + 1)
    })

    const createChartData = (map: Map<string, number>, palette: string[]) => {
      const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1])
      
      // If no data, return a default empty chart
      if (entries.length === 0) {
        return {
          labels: ['データなし'],
          datasets: [{
            data: [1],
            backgroundColor: ['#9CA3AF'],
            borderWidth: 0
          }]
        }
      }

      // Ensure we have at least some colors
      const colors = entries.length <= palette.length 
        ? palette.slice(0, entries.length)
        : [...palette, ...Array(entries.length - palette.length).fill('#9CA3AF')]

      return {
        labels: entries.map(([label]) => label),
        datasets: [{
          data: entries.map(([, value]) => value),
          backgroundColor: colors,
          borderWidth: 0
        }]
      }
    }

    const agePalette = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316']
    const genderPalette = ['#EC4899', '#3B82F6', '#9CA3AF']
    const visitPalette = ['#10B981', '#3B82F6']
    const prefecturePalette = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

    const result = {
      age: createChartData(ageMap, agePalette),
      gender: createChartData(genderMap, genderPalette),
      visitType: createChartData(visitTypeMap, visitPalette),
      prefecture: createChartData(prefectureMap, prefecturePalette)
    }

    // Debug logging
    console.log('📊 [CustomerAttributesAnalysis] Demographics calculated:', {
      totalRecords: allData.length,
      ageGroups: {
        entries: Array.from(ageMap.entries()),
        total: Array.from(ageMap.values()).reduce((a, b) => a + b, 0)
      },
      genders: {
        entries: Array.from(genderMap.entries()),
        total: Array.from(genderMap.values()).reduce((a, b) => a + b, 0)
      },
      visitTypes: {
        entries: Array.from(visitTypeMap.entries()),
        total: Array.from(visitTypeMap.values()).reduce((a, b) => a + b, 0)
      },
      prefectures: {
        entries: Array.from(prefectureMap.entries()),
        total: Array.from(prefectureMap.values()).reduce((a, b) => a + b, 0)
      },
      chartData: {
        age: result.age.labels.length > 0 ? result.age : 'empty',
        gender: result.gender.labels.length > 0 ? result.gender : 'empty',
        visitType: result.visitType.labels.length > 0 ? result.visitType : 'empty',
        prefecture: result.prefecture.labels.length > 0 ? result.prefecture : 'empty'
      }
    })

    return result
  }, [state.data.dailyAccounts, state.data.clinicData])

  // Calculate scatter plot data (visits vs sales by patient)
  const scatterData = useMemo(() => {
    const allData = getAllDailyAccounts()
    if (allData.length === 0) return { datasets: [] }

    const patientMap = new Map<string, { visits: number, sales: number, medicalRecordNo: string }>()

    allData.forEach((r: any) => {
      const medicalRecordNo = (
        r.visitorKarteNumber || r.visitorCode || r.medicalRecordNo || r.patientCode || r.patientId || '不明'
      ).toString()
      let amount = 0
      if (Array.isArray(r.paymentItems) && r.paymentItems.length > 0) {
        amount = r.paymentItems.reduce((s: number, it: any) => s + (it.priceWithTax || 0), 0)
      } else {
        amount = r.totalWithTax || 0
      }

      if (!patientMap.has(medicalRecordNo)) {
        patientMap.set(medicalRecordNo, { visits: 0, sales: 0, medicalRecordNo })
      }

      const patient = patientMap.get(medicalRecordNo)!
      patient.visits += 1
      patient.sales += amount
    })

    const points = Array.from(patientMap.values())
      .filter(p => p.visits > 0 && p.sales > 0)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 100) // Limit to top 100 for performance

    return {
      datasets: [{
        label: '患者データ',
        data: points.map(p => ({
          x: p.visits,
          y: p.sales,
          medicalRecordNo: p.medicalRecordNo
        })),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    }
  }, [state.data.dailyAccounts, state.data.clinicData])

  // Patient data table
  const patientTableData = useMemo(() => {
    const allData = getAllDailyAccounts()
    if (allData.length === 0) return []

    const patientMap = new Map<string, { visits: number, sales: number, medicalRecordNo: string }>()

    allData.forEach((r: any) => {
      const medicalRecordNo = (
        r.visitorKarteNumber || r.visitorCode || r.medicalRecordNo || r.patientCode || r.patientId || '不明'
      ).toString()
      let amount = 0
      if (Array.isArray(r.paymentItems) && r.paymentItems.length > 0) {
        amount = r.paymentItems.reduce((s: number, it: any) => s + (it.priceWithTax || 0), 0)
      } else {
        amount = r.totalWithTax || 0
      }

      if (!patientMap.has(medicalRecordNo)) {
        patientMap.set(medicalRecordNo, { visits: 0, sales: 0, medicalRecordNo })
      }

      const patient = patientMap.get(medicalRecordNo)!
      patient.visits += 1
      patient.sales += amount
    })

    return Array.from(patientMap.values())
      .map(p => ({
        medicalRecordNo: p.medicalRecordNo,
        visits: p.visits,
        unitPrice: p.visits > 0 ? p.sales / p.visits : 0,
        sales: p.sales
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 50)
  }, [state.data.dailyAccounts, state.data.clinicData])

  // Pagination states for tables
  const [patientPage, setPatientPage] = useState(1)
  const [clinicTreatmentPage, setClinicTreatmentPage] = useState(1)
  const itemsPerPage = 10

  // Clinic and treatment sales table
  const clinicTreatmentTableData = useMemo(() => {
    const allData = getAllDailyAccounts()
    if (allData.length === 0) return []

    return allData
      .map((r: any) => {
        const date = parseDate(r)
        return {
          date: date ? date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }) : '不明',
          clinic: r.clinicName || '不明',
          treatment: r.paymentItems?.[0]?.name || r.treatmentName || r.treatmentCategory || '不明',
          sales: Array.isArray(r.paymentItems) && r.paymentItems.length > 0
            ? r.paymentItems.reduce((s: number, it: any) => s + (it.priceWithTax || 0), 0)
            : (r.totalWithTax || 0)
        }
      })
      .sort((a, b) => {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        return dateB.getTime() - dateA.getTime()
      })
      .slice(0, 100)
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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 10,
          font: { size: 11 }
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
          callback: (value: any) => {
            if (value >= 1000000) return `¥${(value / 1000000).toFixed(0)}M`
            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
            return value.toLocaleString()
          }
        }
      }
    }
  }

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 12,
          font: { size: 11 }
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || ''
            const value = context.parsed || 0
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
            return `${label}: ${percentage}%`
          }
        }
      }
    }
  }

  const scatterOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const point = context.raw
            const medicalRecordNo = point.medicalRecordNo || point.label || '不明'
            return `カルテNo: ${medicalRecordNo}, 来院数: ${point.x}, 売上: ${formatCurrency(point.y)}`
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: '来院回数'
        },
        type: 'linear',
        position: 'bottom'
      },
      y: {
        title: {
          display: true,
          text: '売上'
        },
        type: 'linear',
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

  return (
    <div className="p-6 space-y-6">
      {/* Top Section: Charts and Demographics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Sales Trend Charts */}
        <div className="space-y-6">
          {/* Annual Sales Trend */}
          <div className="p-6 bg-white border rounded-lg shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">年間売上推移</h3>
            <div className="h-64">
              <Chart type="bar" data={annualSalesTrend} options={chartOptions} />
            </div>
          </div>

          {/* Visits Trend */}
          <div className="p-6 bg-white border rounded-lg shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">来院数推移</h3>
            <div className="h-64">
              <Chart type="bar" data={visitsTrend} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Right: Demographics Pie Charts */}
        <div className="space-y-6">
          <div className="p-6 bg-white border rounded-lg shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">年代別</h3>
            <div className="h-60">
              {demographics?.age && demographics.age.labels.length > 0 && demographics.age.datasets[0].data.some((d: number) => d > 0) ? (
                <Doughnut data={demographics.age} options={pieChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <p className="text-sm">データがありません</p>
                    <p className="mt-1 text-xs">APIに接続するかCSVファイルをインポートしてください</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 bg-white border rounded-lg shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">性別別</h3>
            <div className="h-60">
              {demographics?.gender && demographics.gender.labels.length > 0 && demographics.gender.datasets[0].data.some((d: number) => d > 0) ? (
                <Doughnut data={demographics.gender} options={pieChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <p className="text-sm">データがありません</p>
                    <p className="mt-1 text-xs">APIに接続するかCSVファイルをインポートしてください</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 bg-white border rounded-lg shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">初診・再診別</h3>
            <div className="h-60">
              {demographics?.visitType && demographics.visitType.labels.length > 0 && demographics.visitType.datasets[0].data.some((d: number) => d > 0) ? (
                <Doughnut data={demographics.visitType} options={pieChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <p className="text-sm">データがありません</p>
                    <p className="mt-1 text-xs">APIに接続するかCSVファイルをインポートしてください</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 bg-white border rounded-lg shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">都道府県別</h3>
            <div className="h-60">
              {demographics?.prefecture && demographics.prefecture.labels.length > 0 && demographics.prefecture.datasets[0].data.some((d: number) => d > 0) ? (
                <Doughnut data={demographics.prefecture} options={pieChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <p className="text-sm">データがありません</p>
                    <p className="mt-1 text-xs">APIに接続するかCSVファイルをインポートしてください</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Scatter Plot and Tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Scatter Plot */}
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">来院回数 vs 売上</h3>
          <div className="h-80">
            <Chart type="scatter" data={scatterData} options={scatterOptions} />
          </div>
        </div>

        {/* Patient Data Table */}
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">患者詳細</h3>
          <div className="overflow-x-auto max-h-80">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="border-b">
                  <th className="px-3 py-2 font-semibold text-left">カルテNo</th>
                  <th className="px-3 py-2 font-semibold text-right">来院数</th>
                  <th className="px-3 py-2 font-semibold text-right">来院単価</th>
                  <th className="px-3 py-2 font-semibold text-right">売上</th>
                </tr>
              </thead>
              <tbody>
                {(patientTableData.length > itemsPerPage
                  ? patientTableData.slice((patientPage - 1) * itemsPerPage, patientPage * itemsPerPage)
                  : patientTableData
                ).map((patient, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium">{patient.medicalRecordNo}</td>
                    <td className="px-3 py-2 text-right">{formatNumber(patient.visits)}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(patient.unitPrice)}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(patient.sales)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {patientTableData.length > itemsPerPage && (
            <Pagination
              currentPage={patientPage}
              totalPages={Math.ceil(patientTableData.length / itemsPerPage)}
              onPageChange={setPatientPage}
              totalItems={patientTableData.length}
              itemsPerPage={itemsPerPage}
            />
          )}
        </div>

        {/* Clinic and Treatment Sales Table */}
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">院別・治療別売上</h3>
          <div className="overflow-x-auto max-h-80">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="border-b">
                  <th className="px-3 py-2 font-semibold text-left">日付</th>
                  <th className="px-3 py-2 font-semibold text-left">院</th>
                  <th className="px-3 py-2 font-semibold text-left">治療</th>
                  <th className="px-3 py-2 font-semibold text-right">売上</th>
                </tr>
              </thead>
              <tbody>
                {(clinicTreatmentTableData.length > itemsPerPage
                  ? clinicTreatmentTableData.slice((clinicTreatmentPage - 1) * itemsPerPage, clinicTreatmentPage * itemsPerPage)
                  : clinicTreatmentTableData
                ).map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2">{row.date}</td>
                    <td className="px-3 py-2">{row.clinic}</td>
                    <td className="px-3 py-2">{row.treatment}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(row.sales)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {clinicTreatmentTableData.length > itemsPerPage && (
            <Pagination
              currentPage={clinicTreatmentPage}
              totalPages={Math.ceil(clinicTreatmentTableData.length / itemsPerPage)}
              onPageChange={setClinicTreatmentPage}
              totalItems={clinicTreatmentTableData.length}
              itemsPerPage={itemsPerPage}
            />
          )}
        </div>
      </div>
    </div>
  )
}

