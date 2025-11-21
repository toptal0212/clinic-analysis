'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend } from 'chart.js'
import { Chart } from 'react-chartjs-2'
import { AlertCircle } from 'lucide-react'
import { categorizeTreatment } from '@/lib/treatmentCategories'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend)

type CategoryKey =
  | 'doubleEyelid'
  | 'darkCircle'
  | 'threadLift'
  | 'faceSlimming'
  | 'noseSurgery'
  | 'bodyLiposuction'
  | 'breastAugmentation'
  | 'otherSurgery'
  | 'injection'
  | 'skin'
  | 'hairRemoval'
  | 'products'

const CATEGORY_COLUMNS: { key: CategoryKey; label: string; categoryIds: string[] }[] = [
  { key: 'doubleEyelid', label: '二重', categoryIds: ['surgery_double_eyelid'] },
  { key: 'darkCircle', label: 'くま治療', categoryIds: ['surgery_dark_circles'] },
  { key: 'threadLift', label: '糸リフト', categoryIds: ['surgery_thread_lift'] },
  { key: 'faceSlimming', label: '小顔（S,BF)', categoryIds: ['surgery_face_slimming'] },
  { key: 'noseSurgery', label: '鼻・人中手術', categoryIds: ['surgery_nose_philtrum'] },
  { key: 'bodyLiposuction', label: 'ボディー脂肪吸引', categoryIds: ['surgery_body_liposuction'] },
  { key: 'breastAugmentation', label: '豊胸', categoryIds: ['surgery_breast_augmentation'] },
  { key: 'otherSurgery', label: 'その他外科', categoryIds: ['surgery_other'] },
  { key: 'injection', label: '注入', categoryIds: ['dermatology_injection'] },
  { key: 'skin', label: 'スキン', categoryIds: ['dermatology_skin'] },
  { key: 'hairRemoval', label: '脱毛', categoryIds: ['hair_removal'] },
  { key: 'products', label: '物販/ピアス', categoryIds: ['other_products', 'other_piercing'] }
]

interface ClinicSalesRow {
  id: string
  staff: string
  clinic: string
  patientType: string
  visitTreatmentLabel: string
  name: string
  age: string
  reservationContent: string
  procedureWish: string
  referralSource: string
  reservationRoute: string
  procedureDetail: string
  categories: Record<CategoryKey, number>
  depositAmount: number
  scheduledPaymentLabel: string
  totalAmount: number
  balanceStatus: string
  hasDeposit: boolean
  detailUrl?: string
}

const CLINIC_NAME_MAP: Record<string, string> = {
  yokohama: '横浜院',
  koriyama: '郡山院',
  mito: '水戸院',
  omiya: '大宮院'
}

const CLINIC_TABLE_TITLE =
  '担当者\t院\t新/既/物\t来院日/施術日\t名前\t年齢\t予約内容\t処置希望\t知ったきっかけ\t予約経路\t処置内容\t二重\tくま治療\t糸リフト\t小顔（S,BF)\t鼻・人中手術\tボディー脂肪吸引\t豊胸\tその他外科\t注入\tスキン\t脱毛\t物販/ピアス\t予約金\t後日振込日/予約金\t合計\tU/C\t管理'

const parseDateValue = (value: Date | string | null | undefined) => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return isNaN(date.getTime()) ? null : date
}

const formatDateLabel = (value: Date | string | null | undefined) => {
  const date = parseDateValue(value)
  if (!date) return '-'
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

const formatVisitTreatmentLabel = (visit: Date | string | null | undefined, treatment: Date | string | null | undefined) => {
  return `${formatDateLabel(visit)} / ${formatDateLabel(treatment)}`
}

const truncateText = (value: string | null | undefined, charLimit = 6) => {
  if (!value) return '-'
  const trimmed = value.trim()
  if (trimmed.length <= charLimit) return trimmed
  return `${trimmed.slice(0, charLimit)}…`
}

const buildCategoryTotals = (items: any[] | undefined): Record<CategoryKey, number> => {
  const totals = CATEGORY_COLUMNS.reduce((acc, column) => {
    acc[column.key] = 0
    return acc
  }, {} as Record<CategoryKey, number>)

  if (!items || !Array.isArray(items)) return totals

  items.forEach(item => {
    const result = categorizeTreatment(item.category || '', item.name || '')
    if (!result?.categoryId) return
    const matchedColumn = CATEGORY_COLUMNS.find(column => column.categoryIds.includes(result.categoryId))
    if (!matchedColumn) return
    totals[matchedColumn.key] += item.priceWithTax || 0
  })

  return totals
}

const determinePatientType = (record: any) => {
  const paymentTags = record.paymentTags || ''
  const visitorName = record.visitorName || ''
  if (
    paymentTags.includes('物販') ||
    paymentTags.includes('ピアス') ||
    visitorName.includes('物販') ||
    visitorName.includes('ピアス')
  ) {
    return '物販'
  }
  if (record.isFirst === true || record.isFirstVisit === true) return '新規'
  return '既存'
}

const getClinicLabel = (record: any) => {
  return (
    record.clinicName ||
    CLINIC_NAME_MAP[record.clinicId as keyof typeof CLINIC_NAME_MAP] ||
    '未設定'
  )
}

const formatMonthValue = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

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

  const allDailyAccounts = useMemo(() => getAllDailyAccounts(), [
    state.data?.dailyAccounts,
    state.data?.clinicData
  ])

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

  // Calculate time series data (monthly trends)
  const timeSeriesData = useMemo(() => {
    const allData = allDailyAccounts
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
  }, [allDailyAccounts])

  // Calculate day-of-week data (stacked bars)
  const dayOfWeekData = useMemo(() => {
    const allData = allDailyAccounts
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
  }, [allDailyAccounts])

  const clinicOptions = useMemo(() => {
    const set = new Set<string>()
    allDailyAccounts.forEach(record => {
      const label = getClinicLabel(record)
      if (label) set.add(label)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ja'))
  }, [allDailyAccounts])

  const availableMonths = useMemo(() => {
    const months = new Set<string>()
    allDailyAccounts.forEach(record => {
      const rawDate =
        record.recordDate ||
        record.visitDate ||
        record.treatmentDate ||
        record.accountingDate
      if (!rawDate) return
      const date = parseDateValue(rawDate)
      if (!date) return
      months.add(formatMonthValue(date))
    })
    return Array.from(months).sort().reverse()
  }, [allDailyAccounts])

  const defaultMonthValue = availableMonths[0] || formatMonthValue(new Date())

  const [tableFilterDraft, setTableFilterDraft] = useState(() => ({
    clinic: 'all',
    month: defaultMonthValue,
    sort: 'treatmentDate'
  }))

  const [tableFilters, setTableFilters] = useState(() => ({
    clinic: 'all',
    month: defaultMonthValue,
    sort: 'treatmentDate'
  }))

  useEffect(() => {
    setTableFilterDraft(prev => {
      if (prev.month === defaultMonthValue) return prev
      return { ...prev, month: defaultMonthValue }
    })
    setTableFilters(prev => {
      if (prev.month === defaultMonthValue) return prev
      return { ...prev, month: defaultMonthValue }
    })
  }, [defaultMonthValue])

  const handleFilterChange = (key: 'clinic' | 'month' | 'sort', value: string) => {
    setTableFilterDraft(prev => ({ ...prev, [key]: value }))
  }

  const handleApplyFilters = () => {
    setTableFilters(tableFilterDraft)
  }

  const clinicSalesRows = useMemo(() => {
    if (!allDailyAccounts.length) return []

    const [filterYear, filterMonth] = (tableFilters.month || '').split('-').map(num => parseInt(num, 10))

    const filteredRecords = allDailyAccounts.filter(record => {
      if (tableFilters.clinic !== 'all' && getClinicLabel(record) !== tableFilters.clinic) {
        return false
      }

      if (!isNaN(filterYear) && !isNaN(filterMonth)) {
        const date =
          parseDateValue(record.recordDate) ||
          parseDateValue(record.visitDate) ||
          parseDateValue(record.treatmentDate) ||
          parseDateValue(record.accountingDate)
        if (!date) return false
        if (date.getFullYear() !== filterYear || date.getMonth() + 1 !== filterMonth) {
          return false
        }
      }

      return true
    })

    const rows: ClinicSalesRow[] = filteredRecords.map((record, index) => {
      const paymentItems = Array.isArray(record.paymentItems) ? record.paymentItems : []
      const categories = buildCategoryTotals(paymentItems)
      const depositFromItems = paymentItems.reduce((sum: number, item: any) => {
        const deposit =
          (item.advancePaymentPriceWithTax || 0) +
          (item.advancePaymentTransactionPriceWithTax || 0)
        return sum + deposit
      }, 0)
      const depositAmount =
        depositFromItems +
        (record.advancePaymentTransactionPriceWithTax || 0) +
        (record.advancePaymentPriceWithTax || 0)

      const scheduledPaymentAmount = record.willPaidPrice || 0
      const scheduledPaymentDate = record.operateDate || record.orderingDate || null

      const totalAmount =
        paymentItems.reduce((sum: number, item: any) => sum + (item.priceWithTax || 0), 0) ||
        record.totalWithTax ||
        0

      const reservationContent =
        paymentItems.map((item: any) => item.category).filter(Boolean).join(', ') ||
        record.reservationMenuName ||
        record.reservationInflowPathLabel ||
        '-'

      const procedureDetail =
        paymentItems.map((item: any) => item.name).filter(Boolean).join(', ') ||
        record.treatmentName ||
        '-'

      const procedureWish =
        record.visitorColumnValues?.[0] ||
        paymentItems[0]?.name ||
        record.note ||
        '-'

      return {
        id: `${record.visitorId || 'record'}-${index}`,
        staff:
          paymentItems[0]?.mainStaffName ||
          record.reservationStaffName ||
          record.staffName ||
          '担当者不明',
        clinic: getClinicLabel(record),
        patientType: determinePatientType(record),
        visitTreatmentLabel: formatVisitTreatmentLabel(
          record.recordDate || record.visitDate,
          record.confirmedAt || record.treatmentDate
        ),
        name: record.visitorName || '-',
        age: record.visitorAge ? String(record.visitorAge) : '-',
        reservationContent,
        procedureWish,
        referralSource: record.visitorInflowSourceName || record.visitorInflowSourceLabel || '-',
        reservationRoute: record.reservationInflowPathLabel || '-',
        procedureDetail,
        categories,
        depositAmount,
        scheduledPaymentLabel:
          scheduledPaymentAmount > 0
            ? `${formatDateLabel(scheduledPaymentDate)} / ${formatCurrency(scheduledPaymentAmount)}`
            : '-',
        totalAmount,
        balanceStatus:
          record.isPaymentBalanced === true
            ? 'C'
            : record.isPaymentBalanced === false
            ? 'U'
            : '-',
        hasDeposit: depositAmount > 0,
        detailUrl: record.url
      }
    })

    const sortedRows = [...rows]
    if (tableFilters.sort === 'visitDate' || tableFilters.sort === 'treatmentDate') {
      sortedRows.sort((a, b) => b.visitTreatmentLabel.localeCompare(a.visitTreatmentLabel, 'ja'))
    } else if (tableFilters.sort === 'staff') {
      sortedRows.sort((a, b) => a.staff.localeCompare(b.staff, 'ja'))
    } else {
      sortedRows.sort((a, b) => b.visitTreatmentLabel.localeCompare(a.visitTreatmentLabel, 'ja'))
    }

    return sortedRows
  }, [allDailyAccounts, tableFilters])

  const hasRealData = allDailyAccounts.length > 0

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

      {/* Bottom: Detailed Clinic Sales Table */}
      <div className="space-y-4">
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">院別売上</h3>

          {/* Filter Panel */}
          <div className="p-4 mb-4 border rounded-lg bg-gray-50">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col">
                <label className="text-xs font-medium text-gray-600">院</label>
                <select
                  value={tableFilterDraft.clinic}
                  onChange={(e) => handleFilterChange('clinic', e.target.value)}
                  className="px-3 py-2 mt-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全院</option>
                  {clinicOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-medium text-gray-600">対象月</label>
                <input
                  type="month"
                  value={tableFilterDraft.month}
                  onChange={(e) => handleFilterChange('month', e.target.value)}
                  className="px-3 py-2 mt-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-medium text-gray-600">並び替え</label>
                <select
                  value={tableFilterDraft.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="px-3 py-2 mt-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="treatmentDate">施術日順</option>
                  <option value="visitDate">来院日順</option>
                  <option value="staff">担当者順</option>
                </select>
              </div>

              <button
                onClick={handleApplyFilters}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                検索
              </button>
            </div>
          </div>


          {/* Detailed Table */}
          <div className="overflow-x-auto">
            <table className="min-w-[1400px] divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-500 uppercase">担当者</th>
                  <th className="px-3 py-2 text-left text-gray-500 uppercase">院</th>
                  <th className="px-3 py-2 text-center text-gray-500 uppercase">新/既/物</th>
                  <th className="px-3 py-2 text-center text-gray-500 uppercase">来院日/施術日</th>
                  <th className="px-3 py-2 text-left text-gray-500 uppercase">名前</th>
                  <th className="px-3 py-2 text-center text-gray-500 uppercase">年齢</th>
                  <th className="px-3 py-2 text-left text-gray-500 uppercase">予約内容</th>
                  <th className="px-3 py-2 text-left text-gray-500 uppercase">処置希望</th>
                  <th className="px-3 py-2 text-left text-gray-500 uppercase">知ったきっかけ</th>
                  <th className="px-3 py-2 text-left text-gray-500 uppercase">予約経路</th>
                  <th className="px-3 py-2 text-left text-gray-500 uppercase">処置内容</th>
                  {CATEGORY_COLUMNS.map(column => (
                    <th key={column.key} className="px-3 py-2 text-right text-gray-500 uppercase whitespace-nowrap">
                      {column.label}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-right text-gray-500 uppercase">予約金</th>
                  <th className="px-3 py-2 text-center text-gray-500 uppercase whitespace-nowrap">後日振込日/予約金</th>
                  <th className="px-3 py-2 text-right text-gray-500 uppercase">合計</th>
                  <th className="px-3 py-2 text-center text-gray-500 uppercase">U/C</th>
                  <th className="px-3 py-2 text-center text-gray-500 uppercase">管理</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {clinicSalesRows.length === 0 ? (
                  <tr>
                    <td colSpan={11 + CATEGORY_COLUMNS.length + 5} className="px-6 py-10 text-sm text-center text-gray-500">
                      データがありません。フィルター条件を変更してください。
                    </td>
                  </tr>
                ) : (
                  clinicSalesRows.map(row => (
                    <tr key={row.id} className={row.hasDeposit ? 'bg-green-50/70' : 'hover:bg-gray-50'}>
                      <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">{row.staff}</td>
                      <td className="px-3 py-2 text-gray-900">{row.clinic}</td>
                      <td className="px-3 py-2 text-center text-gray-900">{row.patientType}</td>
                      <td className="px-3 py-2 text-center text-gray-700 whitespace-nowrap">{row.visitTreatmentLabel}</td>
                      <td className="px-3 py-2 text-gray-900 whitespace-nowrap">{row.name}</td>
                      <td className="px-3 py-2 text-center text-gray-900">{row.age}</td>
                      <td
                        className="px-3 py-2 text-gray-700 cursor-help w-36 whitespace-nowrap"
                        title={row.reservationContent || '-'}
                      >
                        {truncateText(row.reservationContent)}
                      </td>
                      <td
                        className="px-3 py-2 text-gray-700 cursor-help w-36 whitespace-nowrap"
                        title={row.procedureWish || '-'}
                      >
                        {truncateText(row.procedureWish)}
                      </td>
                      <td className="px-3 py-2 text-gray-700">{row.referralSource}</td>
                      <td className="px-3 py-2 text-gray-700">{row.reservationRoute}</td>
                      <td
                        className="px-3 py-2 text-gray-700 cursor-help w-36 whitespace-nowrap"
                        title={row.procedureDetail || '-'}
                      >
                        {truncateText(row.procedureDetail)}
                      </td>
                      {CATEGORY_COLUMNS.map(column => (
                        <td key={`${row.id}-${column.key}`} className="px-3 py-2 text-right text-gray-900 whitespace-nowrap">
                          {row.categories[column.key] > 0 ? formatCurrency(row.categories[column.key]) : '-'}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right text-gray-900">
                        {row.depositAmount > 0 ? formatCurrency(row.depositAmount) : '-'}
                      </td>
                      <td className="px-3 py-2 text-center text-gray-900 whitespace-nowrap">
                        {row.scheduledPaymentLabel}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-900">
                        {row.totalAmount > 0 ? formatCurrency(row.totalAmount) : '-'}
                      </td>
                      <td className="px-3 py-2 text-center text-gray-900">{row.balanceStatus}</td>
                      <td className="px-3 py-2 text-center">
                        {row.detailUrl ? (
                          <a
                            href={row.detailUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-20 px-3 py-1 text-xs font-medium text-blue-600 border border-blue-200 rounded hover:bg-blue-50"
                          >
                            詳細
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

