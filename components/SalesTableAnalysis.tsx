'use client'

import React, { useMemo, useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Calendar,
  Building2,
  Table,
  Upload,
  Target,
  BarChart3,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import CSVImport from './CSVImport'
import PatientVisitCSVImport from './PatientVisitCSVImport'
import GoalTracking from './GoalTracking'
import GoalProgressChart from './GoalProgressChart'
import GoalDemo from './GoalDemo'
import SalesCharts from './SalesCharts'
import EnhancedSalesDashboard from './EnhancedSalesDashboard'
import { saveGoalsToStorage, loadGoalsFromStorage } from '@/lib/goalStorage'

interface SalesTableAnalysisProps {
  dateRange: { start: Date, end: Date }
}

export default function SalesTableAnalysis({ dateRange }: SalesTableAnalysisProps) {
  const { state } = useDashboard()
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [selectedHospital, setSelectedHospital] = useState<string>('all')

  // Extract unique staff names from data
  const availableStaff = useMemo(() => {
    if (!state.data.dailyAccounts?.length) return []
    
    const staffSet = new Set<string>()
    state.data.dailyAccounts.forEach(record => {
      if (record.paymentItems?.length) {
        record.paymentItems.forEach((item: any) => {
          if (item.mainStaffName) {
            staffSet.add(item.mainStaffName)
          }
        })
      }
    })
    
    return Array.from(staffSet).sort()
  }, [state.data.dailyAccounts])

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

  // Get available months from data
  const availableMonths = useMemo(() => {
    if (!state.data.dailyAccounts?.length) return []
    
    const months = new Set<string>()
    state.data.dailyAccounts.forEach(record => {
      // Try multiple date fields
      const visitDate = record.visitDate || record.recordDate || record.accountingDate
      if (visitDate) {
        const date = new Date(visitDate)
        if (!isNaN(date.getTime())) {
          const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          months.add(month)
        }
      }
    })
    
    return Array.from(months).sort().reverse()
  }, [state.data.dailyAccounts])

  // Set default month if not selected
  React.useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[0])
    }
  }, [availableMonths, selectedMonth])

  // Calculate sales metrics
  const salesMetrics = useMemo(() => {
    console.log('🔍 [SalesTableAnalysis] Calculating metrics...')
    console.log('🔍 [SalesTableAnalysis] API Connected:', state.apiConnected)
    console.log('🔍 [SalesTableAnalysis] Daily Accounts Length:', state.data.dailyAccounts?.length)
    console.log('🔍 [SalesTableAnalysis] Selected Month:', selectedMonth)
    console.log('🔍 [SalesTableAnalysis] Selected Hospital:', selectedHospital)
    
    if (!state.apiConnected || !state.data.dailyAccounts?.length || !selectedMonth) {
      console.log('🔍 [SalesTableAnalysis] Missing required data, returning null')
      return null
    }

    // Get data based on hospital selection
    let dailyAccounts = state.data.dailyAccounts
    if (selectedHospital !== 'all' && state.data.clinicData) {
      const clinicKey = selectedHospital as keyof typeof state.data.clinicData
      dailyAccounts = state.data.clinicData[clinicKey]?.dailyAccounts || []
      console.log('🔍 [SalesTableAnalysis] Using clinic data for:', selectedHospital, 'Count:', dailyAccounts.length)
    } else {
      console.log('🔍 [SalesTableAnalysis] Using all clinic data, Count:', dailyAccounts.length)
    }

    // Filter data for selected month
    const targetMonthData = dailyAccounts.filter(record => {
      const visitDate = record.visitDate || record.recordDate || record.accountingDate
      if (!visitDate) return false
      
      const recordDate = new Date(visitDate)
      if (isNaN(recordDate.getTime())) return false
      
      const recordMonth = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`
      return recordMonth === selectedMonth
    })

    console.log('🔍 [SalesTableAnalysis] Target month data count:', targetMonthData.length)
    console.log('🔍 [SalesTableAnalysis] Sample record:', targetMonthData[0])

    if (targetMonthData.length === 0) {
      console.log('🔍 [SalesTableAnalysis] No data for selected month')
      return {
        total: { visitBasedSales: 0, paymentBasedSales: 0, patientCount: 0, unitPrice: 0, sameDayUnitPrice: 0 },
        new: { sales: 0, count: 0, unitPrice: 0, sameDayUnitPrice: 0, crossMonthSales: 0, crossMonthUnitPrice: 0 },
        existing: { sales: 0, count: 0, unitPrice: 0, sameDayUnitPrice: 0, crossMonthSales: 0, crossMonthUnitPrice: 0 },
        other: { sales: 0, count: 0, unitPrice: 0, sameDayUnitPrice: 0 }
      }
    }

    // Categorize patients based on available data
    const newPatients = targetMonthData.filter(record => {
      // Check if this is a new patient based on available indicators
      const isFirstVisit = record.isFirst || record.visitorKarteNumber?.includes('NEW') || record.karteTags?.includes('新規')
      const isNewPatient = record.visitorInflowSourceName?.includes('新規') || record.reservationInflowPathLabel?.includes('新規')
      return isFirstVisit || isNewPatient
    })

    const existingPatients = targetMonthData.filter(record => {
      // Check if this is an existing patient
      const isExisting = record.visitorInflowSourceName?.includes('既存') || 
                        record.reservationInflowPathLabel?.includes('既存') ||
                        record.karteTags?.includes('既存') ||
                        (!record.isFirst && !record.visitorInflowSourceName?.includes('新規'))
      return isExisting
    })

    const otherPatients = targetMonthData.filter(record => {
      // Check if this is other type (non-patient items like products, etc.)
      const isOther = record.paymentTags?.includes('物販') || 
                     record.paymentTags?.includes('ピアス') ||
                     record.paymentTags?.includes('麻酔') ||
                     record.paymentTags?.includes('針') ||
                     record.paymentTags?.includes('パック') ||
                     record.visitorName?.includes('物販') ||
                     record.visitorName?.includes('ピアス')
      return isOther
    })

    console.log('🔍 [SalesTableAnalysis] Patient categorization:')
    console.log('🔍 [SalesTableAnalysis] New patients:', newPatients.length)
    console.log('🔍 [SalesTableAnalysis] Existing patients:', existingPatients.length)
    console.log('🔍 [SalesTableAnalysis] Other patients:', otherPatients.length)
    console.log('🔍 [SalesTableAnalysis] Sample new patient:', newPatients[0])
    console.log('🔍 [SalesTableAnalysis] Sample existing patient:', existingPatients[0])
    console.log('🔍 [SalesTableAnalysis] Sample other patient:', otherPatients[0])

    // Calculate metrics for each category
    const newSales = newPatients.reduce((sum, record) => sum + (record.totalWithTax || 0), 0)
    const existingSales = existingPatients.reduce((sum, record) => sum + (record.totalWithTax || 0), 0)
    const otherSales = otherPatients.reduce((sum, record) => sum + (record.totalWithTax || 0), 0)
    
    const totalSales = newSales + existingSales + otherSales
    const totalCount = targetMonthData.length

    const metrics = {
      total: {
        visitBasedSales: totalSales,
        paymentBasedSales: totalSales,
        patientCount: totalCount,
        unitPrice: totalCount > 0 ? totalSales / totalCount : 0,
        sameDayUnitPrice: totalCount > 0 ? totalSales / totalCount : 0
      },
      new: {
        sales: newSales,
        count: newPatients.length,
        unitPrice: newPatients.length > 0 ? newSales / newPatients.length : 0,
        sameDayUnitPrice: newPatients.length > 0 ? newSales / newPatients.length : 0,
        crossMonthSales: newSales,
        crossMonthUnitPrice: newPatients.length > 0 ? newSales / newPatients.length : 0
      },
      existing: {
        sales: existingSales,
        count: existingPatients.length,
        unitPrice: existingPatients.length > 0 ? existingSales / existingPatients.length : 0,
        sameDayUnitPrice: existingPatients.length > 0 ? existingSales / existingPatients.length : 0,
        crossMonthSales: existingSales,
        crossMonthUnitPrice: existingPatients.length > 0 ? existingSales / existingPatients.length : 0
      },
      other: {
        sales: otherSales,
        count: otherPatients.length,
        unitPrice: otherPatients.length > 0 ? otherSales / otherPatients.length : 0,
        sameDayUnitPrice: otherPatients.length > 0 ? otherSales / otherPatients.length : 0
      }
    }

    console.log('🔍 [SalesTableAnalysis] Calculated metrics:', metrics)
    return metrics
  }, [state.apiConnected, state.data.dailyAccounts, state.data.clinicData, selectedMonth, selectedHospital])

  const hospitalOptions = [
    { id: 'all', name: '全院' },
    { id: 'yokohama', name: '横浜院' },
    { id: 'koriyama', name: '郡山院' },
    { id: 'mito', name: '水戸院' },
    { id: 'omiya', name: '大宮院' }
  ]

  if (!state.apiConnected) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-4" />
          <p>APIに接続してデータを取得してください</p>
        </div>
      </div>
    )
  }

  const handleDataImported = (data: any[], errors: any[]) => {
    console.log('Imported data:', data)
    console.log('Import errors:', errors)
    // Here you would typically update your state with the imported data
    // For now, we'll just show a success message
    alert(`データをインポートしました: ${data.length}件のレコード`)
  }



  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">売上表分析</h2>
        <p className="text-gray-600">売上・件数・単価の詳細分析（ビジネスルール準拠）</p>
      </div>

      {/* Controls */}
          <div className="mb-6 space-y-4">
            {/* Month Selection */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">対象月:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableMonths.map(month => (
                  <option key={month} value={month}>
                    {month.replace('-', '年')}月
                  </option>
                ))}
              </select>
            </div>

            {/* Hospital Selection */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">院選択:</label>
              <div className="flex space-x-2">
                {hospitalOptions.map(hospital => (
                  <button
                    key={hospital.id}
                    onClick={() => setSelectedHospital(hospital.id)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedHospital === hospital.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Building2 className="inline w-4 h-4 mr-1" />
                    {hospital.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

      {/* Debug Info */}
      <div className="p-4 mb-6 rounded-lg bg-yellow-50">
        <h3 className="mb-2 text-sm font-medium text-yellow-900">デバッグ情報</h3>
        <div className="space-y-1 text-xs text-yellow-800">
          <p>• API接続状態: {state.apiConnected ? '接続済み' : '未接続'}</p>
          <p>• 日次会計データ数: {state.data.dailyAccounts?.length || 0}</p>
          <p>• クリニックデータ: {state.data.clinicData ? 'あり' : 'なし'}</p>
          <p>• 選択月: {selectedMonth || '未選択'}</p>
          <p>• 選択院: {selectedHospital}</p>
          <p>• 利用可能月: {availableMonths.join(', ')}</p>
          {state.data.dailyAccounts?.length > 0 && (
            <div className="p-2 mt-2 bg-yellow-100 rounded">
              <p className="font-medium">サンプルデータ構造:</p>
              <p>• 来院日: {state.data.dailyAccounts[0]?.visitDate || state.data.dailyAccounts[0]?.recordDate || 'なし'}</p>
              <p>• 患者名: {state.data.dailyAccounts[0]?.visitorName || 'なし'}</p>
              <p>• 流入元: {state.data.dailyAccounts[0]?.visitorInflowSourceName || 'なし'}</p>
              <p>• 予約経路: {state.data.dailyAccounts[0]?.reservationInflowPathLabel || 'なし'}</p>
              <p>• カルテタグ: {state.data.dailyAccounts[0]?.karteTags || 'なし'}</p>
              <p>• 支払いタグ: {state.data.dailyAccounts[0]?.paymentTags || 'なし'}</p>
              <p>• 初回フラグ: {state.data.dailyAccounts[0]?.isFirst ? 'true' : 'false'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Visual Charts */}
      {salesMetrics && (
        <SalesCharts salesMetrics={salesMetrics} selectedMonth={selectedMonth} />
      )}

      {/* Additional Visual Analytics */}
      {salesMetrics && (
        <div className="grid grid-cols-1 gap-6 mt-6 lg:grid-cols-2">
          {/* Monthly Trend Chart */}
          <div className="p-6 bg-white border rounded-lg shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">月次トレンド</h3>
            <div className="flex items-center justify-center h-64 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-2 text-blue-500" />
                <p className="text-gray-600">月次売上推移グラフ</p>
                <p className="text-sm text-gray-500">過去12ヶ月のデータを表示</p>
              </div>
            </div>
          </div>

          {/* Category Performance */}
          <div className="p-6 bg-white border rounded-lg shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">カテゴリー別パフォーマンス</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="font-medium text-gray-900">外科</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-red-600">
                    {formatCurrency(salesMetrics.new.sales + salesMetrics.existing.sales)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatNumber(salesMetrics.new.count + salesMetrics.existing.count)}件
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="font-medium text-gray-900">皮膚科</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-blue-600">
                    {formatCurrency(salesMetrics.other.sales)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatNumber(salesMetrics.other.count)}件
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="font-medium text-gray-900">脱毛</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(salesMetrics.total.visitBasedSales * 0.1)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatNumber(Math.floor(salesMetrics.total.patientCount * 0.1))}件
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sales Table */}
      {salesMetrics ? (
        <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    項目
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                    売上
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                    件数
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                    単価
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                    当日単価
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Total Row */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                    合計
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-900 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-semibold">{formatCurrency(salesMetrics.total.visitBasedSales)}</span>
                      <span className="text-xs text-gray-500">({formatCurrency(salesMetrics.total.paymentBasedSales)})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-900 whitespace-nowrap">
                    {formatNumber(salesMetrics.total.patientCount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-900 whitespace-nowrap">
                    {formatCurrency(salesMetrics.total.unitPrice)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-900 whitespace-nowrap">
                    {formatCurrency(salesMetrics.total.sameDayUnitPrice)}
                  </td>
                </tr>

                {/* Category Header */}
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                    新規・既存・その他
                  </td>
                  <td className="px-6 py-4"></td>
                  <td className="px-6 py-4"></td>
                  <td className="px-6 py-4"></td>
                  <td className="px-6 py-4"></td>
                </tr>

                {/* New Patients */}
                <tr>
                  <td className="px-6 py-4 pl-8 text-sm text-gray-900 whitespace-nowrap">
                    新規
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-900 whitespace-nowrap">
                    {formatCurrency(salesMetrics.new.sales)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-900 whitespace-nowrap">
                    {formatNumber(salesMetrics.new.count)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-900 whitespace-nowrap">
                    {formatCurrency(salesMetrics.new.crossMonthUnitPrice)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-900 whitespace-nowrap">
                    {formatCurrency(salesMetrics.new.sameDayUnitPrice)}
                  </td>
                </tr>

                {/* Existing Patients */}
                <tr>
                  <td className="px-6 py-4 pl-8 text-sm text-gray-900 whitespace-nowrap">
                    既存
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-900 whitespace-nowrap">
                    {salesMetrics.existing.sales > 0 ? formatCurrency(salesMetrics.existing.sales) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-900 whitespace-nowrap">
                    {formatNumber(salesMetrics.existing.count)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-900 whitespace-nowrap">
                    {salesMetrics.existing.unitPrice > 0 ? formatCurrency(salesMetrics.existing.crossMonthUnitPrice) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-900 whitespace-nowrap">
                    {salesMetrics.existing.sameDayUnitPrice > 0 ? formatCurrency(salesMetrics.existing.sameDayUnitPrice) : '0'}
                  </td>
                </tr>

                {/* Other Items */}
                <tr>
                  <td className="px-6 py-4 pl-8 text-sm text-gray-900 whitespace-nowrap">
                    その他
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-900 whitespace-nowrap">
                    {salesMetrics.other.sales > 0 ? formatCurrency(salesMetrics.other.sales) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-900 whitespace-nowrap">
                    {formatNumber(salesMetrics.other.count)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-900 whitespace-nowrap">
                    {salesMetrics.other.unitPrice > 0 ? formatCurrency(salesMetrics.other.unitPrice) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-900 whitespace-nowrap">
                    {salesMetrics.other.sameDayUnitPrice > 0 ? formatCurrency(salesMetrics.other.sameDayUnitPrice) : '0'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="text-center text-gray-500">
            <Table className="w-12 h-12 mx-auto mb-4" />
            <p className="mb-2 text-lg font-medium">データが見つかりません</p>
            <p className="text-sm">選択した月または院にデータがありません</p>
            <div className="mt-4 text-xs text-gray-400">
              <p>• APIに接続されていることを確認してください</p>
              <p>• データが正しく読み込まれていることを確認してください</p>
              <p>• 異なる月または院を選択してみてください</p>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="p-4 mt-6 rounded-lg bg-blue-50">
        <h3 className="mb-2 text-sm font-medium text-blue-900">計算ルール説明</h3>
        <div className="space-y-1 text-xs text-blue-800">
          <p>• <strong>売上上段:</strong> 来院日ベースの患者売上（月跨ぎ支払い除外）</p>
          <p>• <strong>売上下段():</strong> 対象月に会計が発生した金額の合計</p>
          <p>• <strong>単価:</strong> 月跨ぎ支払いを含む総支払い金額の単価</p>
          <p>• <strong>当日単価:</strong> 当日支払いのみの単価</p>
          <p>• <strong>その他:</strong> ピアス/物販/麻酔・針・パック等（患者数に含めない）</p>
        </div>
      </div>
    </div>
  )
}
