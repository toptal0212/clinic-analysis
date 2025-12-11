'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend } from 'chart.js'
import { Chart } from 'react-chartjs-2'
import { AlertCircle } from 'lucide-react'
import { categorizeTreatment } from '@/lib/treatmentCategories'
import Pagination from './Pagination'

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

// Hierarchical category structure
interface CategoryHierarchy {
  mainCategory: string
  mainKey: string
  subcategories: { key: CategoryKey; label: string; categoryIds: string[] }[]
}

const CATEGORY_HIERARCHY: CategoryHierarchy[] = [
  {
    mainCategory: '外科',
    mainKey: 'surgery',
    subcategories: [
      { key: 'doubleEyelid', label: '二重', categoryIds: ['surgery_double_eyelid'] },
      { key: 'darkCircle', label: 'くま治療', categoryIds: ['surgery_dark_circles'] },
      { key: 'threadLift', label: '糸リフト', categoryIds: ['surgery_thread_lift'] },
      { key: 'faceSlimming', label: '小顔（S,BF)', categoryIds: ['surgery_face_slimming'] },
      { key: 'noseSurgery', label: '鼻・人中手術', categoryIds: ['surgery_nose_philtrum'] },
      { key: 'bodyLiposuction', label: 'ボディー脂肪吸引', categoryIds: ['surgery_body_liposuction'] },
      { key: 'breastAugmentation', label: '豊胸', categoryIds: ['surgery_breast_augmentation'] },
      { key: 'otherSurgery', label: 'その他外科', categoryIds: ['surgery_other'] },
    ]
  },
  {
    mainCategory: '皮膚科',
    mainKey: 'dermatology',
    subcategories: [
      { key: 'injection', label: '注入', categoryIds: ['dermatology_injection'] },
      { key: 'skin', label: 'スキン', categoryIds: ['dermatology_skin'] },
      { key: 'skin', label: 'スキン（インモード/HIFU）', categoryIds: ['dermatology_skin'] }, // Note: Same categoryId, different label
    ]
  },
  {
    mainCategory: '脱毛',
    mainKey: 'hairRemoval',
    subcategories: [
      { key: 'hairRemoval', label: '脱毛', categoryIds: ['hair_removal'] },
    ]
  },
  {
    mainCategory: 'その他',
    mainKey: 'other',
    subcategories: [
      { key: 'products', label: 'ピアス', categoryIds: ['other_piercing'] },
      { key: 'products', label: '物販', categoryIds: ['other_products'] },
      { key: 'products', label: '麻酔・針・パック', categoryIds: ['other_anesthesia_needle_pack'] },
    ]
  }
]

// Flattened list for backward compatibility
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
  patientType: { main: string; sub?: string }
  visitTreatmentLabel: string
  name: string
  age: string
  reservationContent: string
  procedureWish: string
  referralSource: string // 知ったきっかけ
  reservationRoute: string // 来院経路
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

const determinePatientType = (record: any): { main: string; sub?: string } => {
  const paymentTags = record.paymentTags || ''
  const visitorName = record.visitorName || ''
  
  // Check for "その他" category items
  if (
    paymentTags.includes('物販') ||
    paymentTags.includes('ピアス') ||
    paymentTags.includes('麻酔') ||
    paymentTags.includes('針') ||
    paymentTags.includes('パック') ||
    visitorName.includes('物販') ||
    visitorName.includes('ピアス')
  ) {
    // Determine subcategory
    if (paymentTags.includes('ピアス') || visitorName.includes('ピアス')) {
      return { main: 'その他', sub: 'ピアス' }
    }
    if (paymentTags.includes('物販') || visitorName.includes('物販')) {
      return { main: 'その他', sub: '物販' }
    }
    if (paymentTags.includes('麻酔') || paymentTags.includes('針') || paymentTags.includes('パック')) {
      return { main: 'その他', sub: '麻酔・針・パック' }
    }
    // Default to "その他（ピアス/物販/麻酔・針・パック等）"
    return { main: 'その他（ピアス/物販/麻酔・針・パック等）' }
  }
  
  if (record.isFirst === true || record.isFirstVisit === true) return { main: '新規' }
  return { main: '既存' }
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
    for (let i = 0; i <= 11; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        year: date.getFullYear(),
        month: date.getMonth(),
        label: `${String(date.getFullYear()).slice(-2)}年${date.getMonth() + 1}月`
      })
    }
    months.reverse() // Reverse to show newest first

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
          data: [...visitors].reverse(), // Reverse to match reversed months
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.2
        },
        {
          type: 'line' as const,
          label: '売上',
          data: [...revenue].reverse(), // Reverse to match reversed months
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
          data: [...unitPrice].reverse(), // Reverse to match reversed months
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
          data: [...firstVisitConversion].reverse(), // Reverse to match reversed months
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
          data: [...repeatRate].reverse(), // Reverse to match reversed months
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

  const allClinicNames = ['大宮院', '郡山院', '横浜院', '水戸院']

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
    return Array.from(months).sort().reverse() // Already reversed, newest first
  }, [allDailyAccounts])

  const defaultMonthValue = availableMonths[0] || formatMonthValue(new Date())

  // Map dashboard clinic ID to clinic name
  const getClinicNameFromId = (clinicId: string) => {
    if (clinicId === 'all') return 'all'
    const clinicNameMap: Record<string, string> = {
      'yokohama': '横浜院',
      'koriyama': '郡山院',
      'mito': '水戸院',
      'omiya': '大宮院'
    }
    return clinicNameMap[clinicId] || 'all'
  }

  const [tableFilterDraft, setTableFilterDraft] = useState(() => ({
    clinic: getClinicNameFromId(state.selectedClinic),
    month: defaultMonthValue,
    sort: 'treatmentDate'
  }))

  const [tableFilters, setTableFilters] = useState(() => ({
    clinic: getClinicNameFromId(state.selectedClinic),
    month: defaultMonthValue,
    sort: 'treatmentDate'
  }))

  // Sync with header clinic selection
  useEffect(() => {
    const clinicName = getClinicNameFromId(state.selectedClinic)
    setTableFilterDraft(prev => ({ ...prev, clinic: clinicName }))
    setTableFilters(prev => ({ ...prev, clinic: clinicName }))
  }, [state.selectedClinic])

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

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

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [tableFilters])

  const handleFilterChange = (key: 'clinic' | 'month' | 'sort', value: string) => {
    setTableFilterDraft(prev => ({ ...prev, [key]: value }))
  }

  const handleApplyFilters = () => {
    setTableFilters(tableFilterDraft)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const clinicSalesRows = useMemo(() => {
    if (!allDailyAccounts.length) return []

    const [filterYear, filterMonth] = (tableFilters.month || '').split('-').map(num => parseInt(num, 10))

    const filteredRecords = allDailyAccounts.filter(record => {
      if (tableFilters.clinic === 'all-comparison') {
        // For comparison view, include all clinics
        return true
      }
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
        referralSource: record.visitorInflowSourceName || record.visitorInflowSourceLabel || '-', // 知ったきっかけ
        reservationRoute: record.reservationInflowPathLabel || record.reservationRoute || '-', // 来院経路
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

  // Calculate totals for each main category
  const categoryTotals = useMemo(() => {
    const totals: Record<string, { revenue: number; count: number; unitPrice: number }> = {}
    
    clinicSalesRows.forEach(row => {
      CATEGORY_HIERARCHY.forEach(hierarchy => {
        if (!totals[hierarchy.mainKey]) {
          totals[hierarchy.mainKey] = { revenue: 0, count: 0, unitPrice: 0 }
        }
        
        hierarchy.subcategories.forEach(sub => {
          const amount = row.categories[sub.key] || 0
          if (amount > 0) {
            totals[hierarchy.mainKey].revenue += amount
            totals[hierarchy.mainKey].count += 1
          }
        })
      })
    })
    
    // Calculate unit prices
    Object.keys(totals).forEach(key => {
      if (totals[key].count > 0) {
        totals[key].unitPrice = totals[key].revenue / totals[key].count
      }
    })
    
    return totals
  }, [clinicSalesRows])

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
          <h3 className="mb-4 text-lg font-semibold text-gray-900">スタッフ別売上</h3>

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
                  <option value="all-comparison">全院比較</option>
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

          {/* Pagination Controls - Top */}
          <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="font-medium">全{clinicSalesRows.length}件</span>
                <span className="text-gray-400">|</span>
                <label htmlFor="clinic-sales-items-per-page" className="whitespace-nowrap">表示件数:</label>
                <select
                  id="clinic-sales-items-per-page"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="px-2 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10件</option>
                  <option value={20}>20件</option>
                  <option value={50}>50件</option>
                  <option value={100}>100件</option>
                  <option value={200}>200件</option>
                </select>
              </div>
              {clinicSalesRows.length > itemsPerPage && (
                <div className="text-sm text-gray-600">
                  {((currentPage - 1) * itemsPerPage + 1).toLocaleString()} - {Math.min(currentPage * itemsPerPage, clinicSalesRows.length).toLocaleString()} / {clinicSalesRows.length.toLocaleString()} 件
                </div>
              )}
            </div>
          </div>

          {/* Comparison View - Show clinics side by side */}
          {tableFilters.clinic === 'all-comparison' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {allClinicNames.map(clinicName => {
                  const clinicData = clinicSalesRows.filter(row => row.clinic === clinicName)
                  const totalRevenue = clinicData.reduce((sum, row) => sum + row.totalAmount, 0)
                  const totalCount = clinicData.length
                  const avgUnitPrice = totalCount > 0 ? totalRevenue / totalCount : 0
                  
                  return (
                    <div key={clinicName} className="p-4 bg-white border rounded-lg shadow-sm">
                      <h4 className="mb-3 text-lg font-semibold text-gray-900">{clinicName}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">売上:</span>
                          <span className="text-sm font-semibold text-gray-900">{formatCurrency(totalRevenue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">件数:</span>
                          <span className="text-sm font-semibold text-gray-900">{totalCount.toLocaleString()}件</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">平均単価:</span>
                          <span className="text-sm font-semibold text-gray-900">{formatCurrency(avgUnitPrice)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Detailed comparison table */}
              <div className="overflow-x-auto border rounded-md shadow-inner">
                <table className="min-w-[1400px] divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50">
                    {/* First row: Main headers */}
                    <tr>
                      <th rowSpan={2} className="px-3 py-2 text-left text-gray-500 uppercase border-r">担当者</th>
                      <th rowSpan={2} className="px-3 py-2 text-left text-gray-500 uppercase border-r">院</th>
                      <th rowSpan={2} className="px-3 py-2 text-center text-gray-500 uppercase border-r">新/既/その他</th>
                      <th rowSpan={2} className="px-3 py-2 text-center text-gray-500 uppercase border-r">来院日/施術日</th>
                      <th rowSpan={2} className="px-3 py-2 text-left text-gray-500 uppercase border-r">名前</th>
                      <th rowSpan={2} className="px-3 py-2 text-center text-gray-500 uppercase border-r">年齢</th>
                      <th rowSpan={2} className="px-3 py-2 text-left text-gray-500 uppercase border-r">予約内容</th>
                      <th rowSpan={2} className="px-3 py-2 text-left text-gray-500 uppercase border-r">処置希望</th>
                      <th rowSpan={2} className="px-3 py-2 text-left text-gray-500 uppercase border-r">知ったきっかけ</th>
                      <th rowSpan={2} className="px-3 py-2 text-left text-gray-500 uppercase border-r">来院経路</th>
                      <th rowSpan={2} className="px-3 py-2 text-left text-gray-500 uppercase border-r">処置内容</th>
                      {/* Main category headers */}
                      {CATEGORY_HIERARCHY.map((hierarchy, idx) => (
                        <th 
                          key={hierarchy.mainKey} 
                          colSpan={hierarchy.subcategories.length} 
                          className={`px-3 py-2 text-center text-gray-500 uppercase font-semibold border-x ${idx === 0 ? 'border-l-2' : ''} ${idx === CATEGORY_HIERARCHY.length - 1 ? 'border-r-2' : ''}`}
                        >
                          {hierarchy.mainCategory}
                        </th>
                      ))}
                      <th rowSpan={2} className="px-3 py-2 text-right text-gray-500 uppercase border-l">予約金</th>
                      <th rowSpan={2} className="px-3 py-2 text-center text-gray-500 uppercase whitespace-nowrap border-l">後日振込日/予約金</th>
                      <th rowSpan={2} className="px-3 py-2 text-right text-gray-500 uppercase border-l">合計</th>
                      <th rowSpan={2} className="px-3 py-2 text-center text-gray-500 uppercase border-l">U/C</th>
                      <th rowSpan={2} className="px-3 py-2 text-center text-gray-500 uppercase border-l">管理</th>
                    </tr>
                    {/* Second row: Subcategory headers */}
                    <tr>
                      {CATEGORY_HIERARCHY.map((hierarchy) => (
                        hierarchy.subcategories.map((sub, subIdx) => (
                          <th 
                            key={`${hierarchy.mainKey}-${sub.key}-${subIdx}`}
                            className="px-2 py-1 text-xs text-right text-gray-500 uppercase border-x"
                          >
                            {sub.label}
                          </th>
                        ))
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {clinicSalesRows.length === 0 ? (
                      <tr>
                        <td colSpan={11 + CATEGORY_HIERARCHY.reduce((sum, h) => sum + h.subcategories.length, 0) + 5} className="px-6 py-10 text-sm text-center text-gray-500">
                          データがありません。フィルター条件を変更してください。
                        </td>
                      </tr>
                    ) : (
                      clinicSalesRows
                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        .map(row => (
                        <tr key={row.id} className={row.hasDeposit ? 'bg-green-50/70' : 'hover:bg-gray-50'}>
                          <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">{row.staff}</td>
                          <td className="px-3 py-2 text-gray-900">{row.clinic}</td>
                          <td className="px-3 py-2 text-center text-gray-900">
                            {row.patientType.sub ? `${row.patientType.main}（${row.patientType.sub}）` : row.patientType.main}
                          </td>
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
                          {CATEGORY_HIERARCHY.map((hierarchy) => (
                            hierarchy.subcategories.map((sub, subIdx) => {
                              // For "スキン（インモード/HIFU）", check if it's the second skin entry
                              const isSkinInmode = sub.label === 'スキン（インモード/HIFU）'
                              const categoryValue = isSkinInmode ? 0 : (row.categories[sub.key] || 0)
                              return (
                                <td 
                                  key={`${row.id}-${hierarchy.mainKey}-${sub.key}-${subIdx}`} 
                                  className="px-2 py-2 text-right text-gray-900 whitespace-nowrap border-x"
                                >
                                  {categoryValue > 0 ? formatCurrency(categoryValue) : '-'}
                                </td>
                              )
                            })
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
          ) : (
            /* Regular Table View */
            <div className="overflow-x-auto border rounded-md shadow-inner">
              <table className="min-w-[1400px] divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                {/* First row: Main headers */}
                <tr>
                  <th rowSpan={2} className="px-3 py-2 text-left text-gray-500 uppercase border-r">担当者</th>
                  <th rowSpan={2} className="px-3 py-2 text-left text-gray-500 uppercase border-r">院</th>
                  <th rowSpan={2} className="px-3 py-2 text-center text-gray-500 uppercase border-r">新/既/その他</th>
                  <th rowSpan={2} className="px-3 py-2 text-center text-gray-500 uppercase border-r">来院日/施術日</th>
                  <th rowSpan={2} className="px-3 py-2 text-left text-gray-500 uppercase border-r">名前</th>
                  <th rowSpan={2} className="px-3 py-2 text-center text-gray-500 uppercase border-r">年齢</th>
                  <th rowSpan={2} className="px-3 py-2 text-left text-gray-500 uppercase border-r">予約内容</th>
                  <th rowSpan={2} className="px-3 py-2 text-left text-gray-500 uppercase border-r">処置希望</th>
                  <th rowSpan={2} className="px-3 py-2 text-left text-gray-500 uppercase border-r">知ったきっかけ</th>
                  <th rowSpan={2} className="px-3 py-2 text-left text-gray-500 uppercase border-r">予約経路</th>
                  <th rowSpan={2} className="px-3 py-2 text-left text-gray-500 uppercase border-r">処置内容</th>
                  {/* Main category headers */}
                  {CATEGORY_HIERARCHY.map((hierarchy, idx) => (
                    <th 
                      key={hierarchy.mainKey} 
                      colSpan={hierarchy.subcategories.length} 
                      className={`px-3 py-2 text-center text-gray-500 uppercase font-semibold border-x ${idx === 0 ? 'border-l-2' : ''} ${idx === CATEGORY_HIERARCHY.length - 1 ? 'border-r-2' : ''}`}
                    >
                      {hierarchy.mainCategory}
                    </th>
                  ))}
                  <th rowSpan={2} className="px-3 py-2 text-right text-gray-500 uppercase border-l">予約金</th>
                  <th rowSpan={2} className="px-3 py-2 text-center text-gray-500 uppercase whitespace-nowrap border-l">後日振込日/予約金</th>
                  <th rowSpan={2} className="px-3 py-2 text-right text-gray-500 uppercase border-l">合計</th>
                  <th rowSpan={2} className="px-3 py-2 text-center text-gray-500 uppercase border-l">U/C</th>
                  <th rowSpan={2} className="px-3 py-2 text-center text-gray-500 uppercase border-l">管理</th>
                </tr>
                {/* Second row: Subcategory headers */}
                <tr>
                  {CATEGORY_HIERARCHY.map((hierarchy) => (
                    hierarchy.subcategories.map((sub, subIdx) => (
                      <th 
                        key={`${hierarchy.mainKey}-${sub.key}-${subIdx}`}
                        className="px-2 py-1 text-xs text-right text-gray-500 uppercase border-x"
                      >
                        {sub.label}
                      </th>
                    ))
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {clinicSalesRows.length === 0 ? (
                  <tr>
                    <td colSpan={11 + CATEGORY_HIERARCHY.reduce((sum, h) => sum + h.subcategories.length, 0) + 5} className="px-6 py-10 text-sm text-center text-gray-500">
                      データがありません。フィルター条件を変更してください。
                    </td>
                  </tr>
                ) : (
                  clinicSalesRows
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map(row => (
                    <tr key={row.id} className={row.hasDeposit ? 'bg-green-50/70' : 'hover:bg-gray-50'}>
                      <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">{row.staff}</td>
                      <td className="px-3 py-2 text-gray-900">{row.clinic}</td>
                      <td className="px-3 py-2 text-center text-gray-900">
                        {row.patientType.sub ? `${row.patientType.main}（${row.patientType.sub}）` : row.patientType.main}
                      </td>
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
                      {CATEGORY_HIERARCHY.map((hierarchy) => (
                        hierarchy.subcategories.map((sub, subIdx) => {
                          // For "スキン（インモード/HIFU）", check if it's the second skin entry
                          const isSkinInmode = sub.label === 'スキン（インモード/HIFU）'
                          const categoryValue = isSkinInmode ? 0 : (row.categories[sub.key] || 0)
                          return (
                            <td 
                              key={`${row.id}-${hierarchy.mainKey}-${sub.key}-${subIdx}`} 
                              className="px-2 py-2 text-right text-gray-900 whitespace-nowrap border-x"
                            >
                              {categoryValue > 0 ? formatCurrency(categoryValue) : '-'}
                            </td>
                          )
                        })
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
                {/* Summary rows for each main category */}
                {clinicSalesRows.length > 0 && (
                  <>
                    {CATEGORY_HIERARCHY.map((hierarchy, hierarchyIdx) => {
                      const total = categoryTotals[hierarchy.mainKey] || { revenue: 0, count: 0, unitPrice: 0 }
                      return (
                        <tr key={`summary-${hierarchy.mainKey}`} className="bg-blue-50 font-semibold">
                          <td colSpan={11} className="px-3 py-2 text-left text-gray-900 border-r">
                            {hierarchy.mainCategory} 合計
                          </td>
                          {CATEGORY_HIERARCHY.map((h, hIdx) => {
                            if (hIdx === hierarchyIdx) {
                              return h.subcategories.map((sub, subIdx) => {
                                const subTotal = clinicSalesRows.reduce((sum, row) => {
                                  return sum + (row.categories[sub.key] || 0)
                                }, 0)
                                return (
                                  <td 
                                    key={`summary-${h.mainKey}-${sub.key}-${subIdx}`}
                                    className="px-2 py-2 text-right text-gray-900 whitespace-nowrap border-x"
                                  >
                                    {subTotal > 0 ? formatCurrency(subTotal) : '-'}
                                  </td>
                                )
                              })
                            } else {
                              return h.subcategories.map((sub, subIdx) => (
                                <td 
                                  key={`summary-empty-${h.mainKey}-${sub.key}-${subIdx}`}
                                  className="px-2 py-2 border-x"
                                ></td>
                              ))
                            }
                          })}
                          <td colSpan={5} className="px-3 py-2 text-right text-gray-900 border-l">
                            <div>売上: {formatCurrency(total.revenue)}</div>
                            <div className="text-xs text-gray-600">件数: {total.count}件</div>
                            <div className="text-xs text-gray-600">単価: {formatCurrency(total.unitPrice)}</div>
                          </td>
                        </tr>
                      )
                    })}
                  </>
                )}
              </tbody>
            </table>
          </div>
          )}

          {/* Pagination - Bottom */}
          {clinicSalesRows.length > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(clinicSalesRows.length / itemsPerPage)}
                onPageChange={setCurrentPage}
                totalItems={clinicSalesRows.length}
                itemsPerPage={itemsPerPage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

