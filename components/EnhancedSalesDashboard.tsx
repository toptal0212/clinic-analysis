'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3,
  PieChart,
  Target,
  Filter,
  Eye,
  EyeOff,
  Building
} from 'lucide-react'
import { useDashboard } from '@/contexts/DashboardContext'
import { categorizeTreatment } from '@/lib/treatmentCategories'

interface SalesData {
  clinic: string
  totalSales: number
  totalVisits: number
  averageUnitPrice: number
  categories: {
    surgery: {
      total: number
      visits: number
      procedures: {
        doubleEyelid: number
        darkCircle: number
        threadLift: number
        faceSlimming: number
        noseSurgery: number
        bodyLiposuction: number
        breastAugmentation: number
        otherSurgery: number
      }
    }
    dermatology: {
      total: number
      visits: number
      procedures: {
        injection: number
        skin: number
      }
    }
    hairRemoval: {
      total: number
      visits: number
    }
    other: {
      total: number
      visits: number
      procedures: {
        piercing: number
        products: number
        anesthesia: number
      }
    }
  }
}

interface AlertData {
  type: 'missing_referral' | 'missing_staff' | 'invalid_treatment' | 'data_mismatch'
  message: string
  severity: 'error' | 'warning'
  count: number
  details: string[]
}

interface GoalData {
  clinic: string
  targetSales: number
  targetVisits: number
  targetUnitPrice: number
  currentSales: number
  currentVisits: number
  currentUnitPrice: number
  achievementRate: number
}

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

const formatMonthValue = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

const CLINIC_NAME_MAP: Record<string, string> = {
  yokohama: '横浜院',
  koriyama: '郡山院',
  mito: '水戸院',
  omiya: '大宮院'
}

const CLINIC_TABLE_TITLE =
  '担当者\t院\t新/既/物\t来院日/施術日\t名前\t年齢\t予約内容\t処置希望\t知ったきっかけ\t来院経路\t処置内容\t二重\tくま治療\t糸リフト\t小顔（S,BF)\t鼻・人中手術\tボディー脂肪吸引\t豊胸\tその他外科\t注入\tスキン\t脱毛\t物販/ピアス\t予約金\t後日振込日/予約金\t合計\tU/C\t管理'

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

const buildCategoryTotals = (items: any[] | undefined): Record<CategoryKey, number> => {
  const totals = CATEGORY_COLUMNS.reduce((acc, column) => {
    acc[column.key] = 0
    return acc
  }, {} as Record<CategoryKey, number>)

  if (!items || !Array.isArray(items)) {
    return totals
  }

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

export default function EnhancedSalesDashboard() {
  const { state } = useDashboard()
  const [selectedTab, setSelectedTab] = useState<'overview' | 'clinic-breakdown' | 'category-drilldown'>('overview')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showAlerts, setShowAlerts] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const selectedClinicId = state.selectedClinic || 'all'
  const selectedClinicName = CLINIC_NAME_MAP[selectedClinicId] || (selectedClinicId === 'all' ? 'all' : selectedClinicId)

  const dailyAccounts = state.data?.dailyAccounts || []

  const clinicOptions = useMemo(() => {
    const set = new Set<string>()
    dailyAccounts.forEach(record => {
      const label =
        record.clinicName ||
        CLINIC_NAME_MAP[record.clinicId as keyof typeof CLINIC_NAME_MAP] ||
        '未設定'
      if (label) set.add(label)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ja'))
  }, [dailyAccounts])

  const availableMonths = useMemo(() => {
    const months = new Set<string>()
    dailyAccounts.forEach(record => {
      const rawDate =
        record.recordDate ||
        record.visitDate ||
        record.treatmentDate ||
        record.accountingDate
      if (!rawDate) return
      const date = new Date(rawDate)
      if (isNaN(date.getTime())) return
      months.add(formatMonthValue(date))
    })
    return Array.from(months).sort().reverse()
  }, [dailyAccounts])

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
    if (!dailyAccounts.length) return []

    const [filterYear, filterMonth] = (tableFilters.month || '').split('-').map(num => parseInt(num, 10))

    const filteredRecords = dailyAccounts.filter(record => {
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
  }, [dailyAccounts, tableFilters])

  // Mock data - replace with real data from your API
  const salesData: SalesData[] = [
    {
      clinic: '横浜院',
      totalSales: 15000000,
      totalVisits: 120,
      averageUnitPrice: 125000,
      categories: {
        surgery: {
          total: 8000000,
          visits: 60,
          procedures: {
            doubleEyelid: 3000000,
            darkCircle: 2000000,
            threadLift: 1500000,
            faceSlimming: 1000000,
            noseSurgery: 500000,
            bodyLiposuction: 0,
            breastAugmentation: 0,
            otherSurgery: 0
          }
        },
        dermatology: {
          total: 5000000,
          visits: 40,
          procedures: {
            injection: 3000000,
            skin: 2000000
          }
        },
        hairRemoval: {
          total: 1500000,
          visits: 20
        },
        other: {
          total: 500000,
          visits: 20,
          procedures: {
            piercing: 200000,
            products: 200000,
            anesthesia: 100000
          }
        }
      }
    }
  ]

  const alerts: AlertData[] = [
    {
      type: 'missing_referral',
      message: '流入経路が未入力の患者がいます',
      severity: 'error',
      count: 15,
      details: ['田中太郎', '佐藤花子', '鈴木一郎']
    },
    {
      type: 'missing_staff',
      message: '担当者が未入力の患者がいます',
      severity: 'warning',
      count: 8,
      details: ['山田次郎', '高橋美咲']
    },
    {
      type: 'invalid_treatment',
      message: '分類できない施術内容があります',
      severity: 'error',
      count: 3,
      details: ['新施術A', '新施術B', '新施術C']
    }
  ]

  const goals: GoalData[] = [
    {
      clinic: '横浜院',
      targetSales: 20000000,
      targetVisits: 150,
      targetUnitPrice: 130000,
      currentSales: 15000000,
      currentVisits: 120,
      currentUnitPrice: 125000,
      achievementRate: 75
    }
  ]

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


  const getAlertIcon = (type: AlertData['type']) => {
    switch (type) {
      case 'missing_referral':
      case 'invalid_treatment':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'missing_staff':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'data_mismatch':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />
    }
  }

  const getAlertColor = (severity: AlertData['severity']) => {
    switch (severity) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const toggleCategoryExpansion = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const filteredData = useMemo(() => {
    if (selectedClinicId === 'all') return salesData
    return salesData.filter(data => data.clinic === selectedClinicName)
  }, [selectedClinicId, selectedClinicName, salesData])

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">売上分析ダッシュボード</h1>
        <p className="text-gray-600">詳細な売上分析とデータ品質管理</p>
      </div>

      {/* Alerts Section */}
      {showAlerts && alerts.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">データ品質アラート</h2>
            <button
              onClick={() => setShowAlerts(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <EyeOff className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getAlertColor(alert.severity)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getAlertIcon(alert.type)}
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm opacity-75">{alert.count}件のデータに問題があります</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{alert.count}件</p>
                    <p className="text-xs opacity-75">MFで修正が必要</p>
                  </div>
                </div>
                {alert.details.length > 0 && (
                  <div className="pl-8 mt-3">
                    <p className="mb-1 text-sm font-medium">該当患者:</p>
                    <div className="flex flex-wrap gap-2">
                      {alert.details.map((detail, idx) => (
                        <span key={idx} className="px-2 py-1 text-xs bg-white bg-opacity-50 rounded">
                          {detail}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setSelectedTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="inline w-4 h-4 mr-1" />
              売上総覧
            </button>
            <button
              onClick={() => setSelectedTab('clinic-breakdown')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'clinic-breakdown'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Building className="inline w-4 h-4 mr-1" />
              院別売上
            </button>
            <button
              onClick={() => setSelectedTab('category-drilldown')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'category-drilldown'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <PieChart className="inline w-4 h-4 mr-1" />
              カテゴリー詳細
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="p-4 bg-white border rounded-lg shadow-sm">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 mr-3 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600">総売上</p>
                  <p className="text-xl font-semibold text-blue-900">
                    {formatCurrency(filteredData.reduce((sum, data) => sum + data.totalSales, 0))}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border rounded-lg shadow-sm">
              <div className="flex items-center">
                <Users className="w-8 h-8 mr-3 text-green-600" />
                <div>
                  <p className="text-sm text-green-600">総来院数</p>
                  <p className="text-xl font-semibold text-green-900">
                    {formatNumber(filteredData.reduce((sum, data) => sum + data.totalVisits, 0))}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border rounded-lg shadow-sm">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 mr-3 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-600">平均単価</p>
                  <p className="text-xl font-semibold text-purple-900">
                    {formatCurrency(
                      filteredData.reduce((sum, data) => sum + data.averageUnitPrice, 0) / filteredData.length
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border rounded-lg shadow-sm">
              <div className="flex items-center">
                <Target className="w-8 h-8 mr-3 text-orange-600" />
                <div>
                  <p className="text-sm text-orange-600">目標達成率</p>
                  <p className="text-xl font-semibold text-orange-900">
                    {goals.reduce((sum, goal) => sum + goal.achievementRate, 0) / goals.length}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="p-6 bg-white border rounded-lg shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">売上構成比</h3>
              <div className="space-y-4">
                {['surgery', 'dermatology', 'hairRemoval', 'other'].map((category) => {
                  const categoryData = filteredData.reduce((sum, data) => {
                    const cat = data.categories[category as keyof typeof data.categories]
                    return sum + (cat?.total || 0)
                  }, 0)
                  const totalSales = filteredData.reduce((sum, data) => sum + data.totalSales, 0)
                  const percentage = totalSales > 0 ? (categoryData / totalSales) * 100 : 0

                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {category === 'surgery' ? '外科' : 
                           category === 'dermatology' ? '皮膚科' :
                           category === 'hairRemoval' ? '脱毛' : 'その他'}
                        </span>
                        <span className="text-sm text-gray-600">
                          {formatCurrency(categoryData)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full">
                        <div 
                          className={`h-3 rounded-full ${
                            category === 'surgery' ? 'bg-red-500' :
                            category === 'dermatology' ? 'bg-blue-500' :
                            category === 'hairRemoval' ? 'bg-green-500' : 'bg-purple-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="p-6 bg-white border rounded-lg shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">院別目標達成状況</h3>
              <div className="space-y-4">
                {goals.map((goal, index) => (
                  <div key={index} className="p-4 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{goal.clinic}</span>
                      <span className={`text-sm font-medium ${
                        goal.achievementRate >= 100 ? 'text-green-600' :
                        goal.achievementRate >= 80 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {goal.achievementRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div 
                        className={`h-2 rounded-full ${
                          goal.achievementRate >= 100 ? 'bg-green-500' :
                          goal.achievementRate >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(goal.achievementRate, 100)}%` }}
                      ></div>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      目標: {formatCurrency(goal.targetSales)} / 実績: {formatCurrency(goal.currentSales)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'clinic-breakdown' && (
        <div className="space-y-6">
          {/* Filter Panel */}
          <div className="p-4 bg-white border rounded-lg shadow-sm">
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

          {/* Detailed Clinic Sales Table */}
          <div className="overflow-hidden bg-white border rounded-lg shadow-sm">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100">
              <div className="overflow-x-auto whitespace-pre text-[11px]">
                {CLINIC_TABLE_TITLE}
              </div>
            </div>
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
                    <th className="px-3 py-2 text-left text-gray-500 uppercase">来院経路</th>
                    <th className="px-3 py-2 text-left text-gray-500 uppercase">処置内容</th>
                    {CATEGORY_COLUMNS.map(column => (
                      <th key={column.key} className="px-3 py-2 text-right text-gray-500 uppercase whitespace-nowrap">
                        {column.label}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-right text-gray-500 uppercase">予約金</th>
                    <th className="px-3 py-2 text-center text-gray-500 uppercase">後日振込日/予約金</th>
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
                        <td className="px-3 py-2 text-gray-700">{row.reservationContent}</td>
                        <td className="px-3 py-2 text-gray-700">{row.procedureWish}</td>
                        <td className="px-3 py-2 text-gray-700">{row.referralSource}</td>
                        <td className="px-3 py-2 text-gray-700">{row.reservationRoute}</td>
                        <td className="px-3 py-2 text-gray-700">{row.procedureDetail}</td>
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
                              className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-200 rounded hover:bg-blue-50"
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
      )}

      {selectedTab === 'category-drilldown' && (
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">カテゴリー選択:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全カテゴリー</option>
              <option value="surgery">外科</option>
              <option value="dermatology">皮膚科</option>
              <option value="hairRemoval">脱毛</option>
              <option value="other">その他</option>
            </select>
          </div>

          {/* Drill-down Categories */}
          <div className="space-y-4">
            {/* Surgery Category */}
            <div className="bg-white border rounded-lg shadow-sm">
              <button
                onClick={() => toggleCategoryExpansion('surgery')}
                className="flex items-center justify-between w-full p-4 text-left hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="font-medium text-gray-900">外科</span>
                  <span className="text-sm text-gray-500">
                    {formatCurrency(filteredData.reduce((sum, data) => sum + data.categories.surgery.total, 0))}
                  </span>
                </div>
                {expandedCategories.has('surgery') ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {expandedCategories.has('surgery') && (
                <div className="p-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[
                      { key: 'doubleEyelid', label: '二重', value: 'doubleEyelid' },
                      { key: 'darkCircle', label: 'くま治療', value: 'darkCircle' },
                      { key: 'threadLift', label: '糸リフト', value: 'threadLift' },
                      { key: 'faceSlimming', label: '小顔（S,BF)', value: 'faceSlimming' },
                      { key: 'noseSurgery', label: '鼻・人中手術', value: 'noseSurgery' },
                      { key: 'bodyLiposuction', label: 'ボディー脂肪吸引', value: 'bodyLiposuction' },
                      { key: 'breastAugmentation', label: '豊胸', value: 'breastAugmentation' },
                      { key: 'otherSurgery', label: 'その他外科', value: 'otherSurgery' }
                    ].map((procedure) => {
                      const total = filteredData.reduce((sum, data) => 
                        sum + data.categories.surgery.procedures[procedure.value as keyof typeof data.categories.surgery.procedures], 0
                      )
                      return (
                        <div key={procedure.key} className="p-3 rounded-lg bg-gray-50">
                          <div className="text-sm font-medium text-gray-900">{procedure.label}</div>
                          <div className="text-lg font-semibold text-gray-900">{formatCurrency(total)}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Dermatology Category */}
            <div className="bg-white border rounded-lg shadow-sm">
              <button
                onClick={() => toggleCategoryExpansion('dermatology')}
                className="flex items-center justify-between w-full p-4 text-left hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="font-medium text-gray-900">皮膚科</span>
                  <span className="text-sm text-gray-500">
                    {formatCurrency(filteredData.reduce((sum, data) => sum + data.categories.dermatology.total, 0))}
                  </span>
                </div>
                {expandedCategories.has('dermatology') ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {expandedCategories.has('dermatology') && (
                <div className="p-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {[
                      { key: 'injection', label: '注入', value: 'injection' },
                      { key: 'skin', label: 'スキン', value: 'skin' }
                    ].map((procedure) => {
                      const total = filteredData.reduce((sum, data) => 
                        sum + data.categories.dermatology.procedures[procedure.value as keyof typeof data.categories.dermatology.procedures], 0
                      )
                      return (
                        <div key={procedure.key} className="p-3 rounded-lg bg-gray-50">
                          <div className="text-sm font-medium text-gray-900">{procedure.label}</div>
                          <div className="text-lg font-semibold text-gray-900">{formatCurrency(total)}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Hair Removal Category */}
            <div className="bg-white border rounded-lg shadow-sm">
              <button
                onClick={() => toggleCategoryExpansion('hairRemoval')}
                className="flex items-center justify-between w-full p-4 text-left hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="font-medium text-gray-900">脱毛</span>
                  <span className="text-sm text-gray-500">
                    {formatCurrency(filteredData.reduce((sum, data) => sum + data.categories.hairRemoval.total, 0))}
                  </span>
                </div>
                {expandedCategories.has('hairRemoval') ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>

            {/* Other Category */}
            <div className="bg-white border rounded-lg shadow-sm">
              <button
                onClick={() => toggleCategoryExpansion('other')}
                className="flex items-center justify-between w-full p-4 text-left hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-purple-500 rounded"></div>
                  <span className="font-medium text-gray-900">その他</span>
                  <span className="text-sm text-gray-500">
                    {formatCurrency(filteredData.reduce((sum, data) => sum + data.categories.other.total, 0))}
                  </span>
                </div>
                {expandedCategories.has('other') ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {expandedCategories.has('other') && (
                <div className="p-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {[
                      { key: 'piercing', label: 'ピアス', value: 'piercing' },
                      { key: 'products', label: '物販', value: 'products' },
                      { key: 'anesthesia', label: '麻酔・針・パック', value: 'anesthesia' }
                    ].map((procedure) => {
                      const total = filteredData.reduce((sum, data) => 
                        sum + data.categories.other.procedures[procedure.value as keyof typeof data.categories.other.procedures], 0
                      )
                      return (
                        <div key={procedure.key} className="p-3 rounded-lg bg-gray-50">
                          <div className="text-sm font-medium text-gray-900">{procedure.label}</div>
                          <div className="text-lg font-semibold text-gray-900">{formatCurrency(total)}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
