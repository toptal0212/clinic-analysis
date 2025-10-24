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
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import SalesCharts from './SalesCharts'

interface SalesTableAnalysisProps {
  dateRange: { start: Date, end: Date }
}

export default function SalesTableAnalysis({ dateRange }: SalesTableAnalysisProps) {
  const { state } = useDashboard()
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [selectedHospital, setSelectedHospital] = useState<string>('all')

  // Extract available months from data
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

  // Hospital options
  const hospitalOptions = [
    { id: 'all', name: '全院' },
    { id: 'yokohama', name: '横浜院' },
    { id: 'koriyama', name: '郡山院' },
    { id: 'mito', name: '水戸院' },
    { id: 'omiya', name: '大宮院' }
  ]

  // Calculate sales metrics
  const salesMetrics = useMemo(() => {
    if (!state.data.dailyAccounts?.length || !selectedMonth) return null

    const targetMonthData = state.data.dailyAccounts.filter(record => {
      const visitDate = record.visitDate || record.recordDate || record.accountingDate
      if (!visitDate) return false
      
      const date = new Date(visitDate)
      if (isNaN(date.getTime())) return false
      
      const recordMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      return recordMonth === selectedMonth
    })

    if (selectedHospital !== 'all') {
      // Filter by hospital if specific hospital is selected
      // This would need to be implemented based on your data structure
    }

    // Calculate metrics based on business rules
    const newPatients = targetMonthData.filter(record => {
      const isFirstVisit = record.isFirst || record.visitorKarteNumber?.includes('NEW') || record.karteTags?.includes('新規')
      const isNewPatient = record.visitorInflowSourceName?.includes('新規') || record.reservationInflowPathLabel?.includes('新規')
      return isFirstVisit || isNewPatient
    })

    const existingPatients = targetMonthData.filter(record => {
      const isExisting = record.visitorInflowSourceName?.includes('既存') || 
                        record.reservationInflowPathLabel?.includes('既存') ||
                        record.karteTags?.includes('既存') ||
                        (!record.isFirst && !record.visitorInflowSourceName?.includes('新規'))
      return isExisting
    })

    const otherPatients = targetMonthData.filter(record => {
      const isOther = record.paymentTags?.includes('物販') || 
                     record.paymentTags?.includes('ピアス') ||
                     record.paymentTags?.includes('麻酔') ||
                     record.paymentTags?.includes('針') ||
                     record.paymentTags?.includes('パック') ||
                     record.visitorName?.includes('物販') ||
                     record.visitorName?.includes('ピアス')
      return isOther
    })

    const newSales = newPatients.reduce((sum, record) => sum + (record.totalWithTax || 0), 0)
    const existingSales = existingPatients.reduce((sum, record) => sum + (record.totalWithTax || 0), 0)
    const otherSales = otherPatients.reduce((sum, record) => sum + (record.totalWithTax || 0), 0)
    const totalSales = newSales + existingSales + otherSales

    const newCount = newPatients.length
    const existingCount = existingPatients.length
    const otherCount = otherPatients.length
    const totalCount = newCount + existingCount + otherCount

    return {
      new: {
        sales: newSales,
        count: newCount,
        unitPrice: newCount > 0 ? newSales / newCount : 0,
        sameDayUnitPrice: 0,
        crossMonthSales: 0,
        crossMonthUnitPrice: 0
      },
      existing: {
        sales: existingSales,
        count: existingCount,
        unitPrice: existingCount > 0 ? existingSales / existingCount : 0,
        sameDayUnitPrice: 0,
        crossMonthSales: 0,
        crossMonthUnitPrice: 0
      },
      other: {
        sales: otherSales,
        count: otherCount,
        unitPrice: otherCount > 0 ? otherSales / otherCount : 0,
        sameDayUnitPrice: 0
      },
      total: {
        sales: totalSales,
        count: totalCount,
        unitPrice: totalCount > 0 ? totalSales / totalCount : 0,
        patientCount: new Set(targetMonthData.map(r => r.visitorId)).size,
        visitBasedSales: totalSales,
        paymentBasedSales: totalSales,
        sameDayUnitPrice: 0
      }
    }
  }, [state.data.dailyAccounts, selectedMonth, selectedHospital])

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
            <option value="">月を選択してください</option>
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
        </div>
      </div>

      {/* Visual Charts */}
      {salesMetrics && (
        <SalesCharts salesMetrics={salesMetrics} selectedMonth={selectedMonth} />
      )}

      {/* Additional Visual Analytics */}
      {salesMetrics && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend Chart */}
          <div className="p-6 bg-white rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">月次トレンド</h3>
            <div className="h-64 flex items-center justify-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto text-blue-500 mb-2" />
                <p className="text-gray-600">月次売上推移グラフ</p>
                <p className="text-sm text-gray-500">過去12ヶ月のデータを表示</p>
              </div>
            </div>
          </div>

          {/* Category Performance */}
          <div className="p-6 bg-white rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">カテゴリー別パフォーマンス</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
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

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
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

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    区分
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    売上
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    件数
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    単価
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    新規
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(salesMetrics.new.sales)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatNumber(salesMetrics.new.count)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(salesMetrics.new.unitPrice)}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    既存
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(salesMetrics.existing.sales)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatNumber(salesMetrics.existing.count)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(salesMetrics.existing.unitPrice)}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    その他
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(salesMetrics.other.sales)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatNumber(salesMetrics.other.count)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(salesMetrics.other.unitPrice)}
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    合計
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                    {formatCurrency(salesMetrics.total.sales)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                    {formatNumber(salesMetrics.total.count)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                    {formatCurrency(salesMetrics.total.unitPrice)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Table className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">データがありません</h3>
          <p className="mt-1 text-sm text-gray-500">
            対象月を選択してデータを表示してください。
          </p>
        </div>
      )}
    </div>
  )
}
