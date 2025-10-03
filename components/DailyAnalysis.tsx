'use client'

import React, { useState, useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { CalculationEngine } from '@/lib/calculationEngine'
import { RevenueMetrics } from '@/lib/dataTypes'
import { 
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Eye,
  EyeOff
} from 'lucide-react'

interface DailyAnalysisProps {
  dateRange: { start: Date, end: Date }
}

export default function DailyAnalysis({ dateRange }: DailyAnalysisProps) {
  const { state } = useDashboard()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const calculationEngine = new CalculationEngine()

  const dailyData = useMemo(() => {
    if (state.data.patients.length === 0) return []

    const data: Array<RevenueMetrics & { dateString: string }> = []
    const currentDate = new Date(dateRange.start)
    const endDate = new Date(dateRange.end)

    while (currentDate <= endDate) {
      const dailyMetrics = calculationEngine.calculateDailyRevenueMetrics(
        state.data.patients,
        state.data.accounting,
        new Date(currentDate)
      )

      data.push({
        ...dailyMetrics,
        dateString: currentDate.toISOString().split('T')[0]
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return data
  }, [state.data.patients, state.data.accounting, dateRange])

  const selectedDayData = selectedDate 
    ? dailyData.find(d => d.dateString === selectedDate.toISOString().split('T')[0])
    : null

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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    }).format(date)
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />
    return null
  }

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600'
    if (current < previous) return 'text-red-600'
    return 'text-gray-600'
  }

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  return (
    <div className="space-y-6">
      {/* 日別売上チャート */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">日別売上推移</h3>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
          >
            {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span>{showDetails ? '詳細を隠す' : '詳細を表示'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {dailyData.map((day, index) => {
            const previousDay = index > 0 ? dailyData[index - 1] : null
            const isSelected = selectedDate && day.dateString === selectedDate.toISOString().split('T')[0]
            
            return (
              <div
                key={day.dateString}
                onClick={() => setSelectedDate(new Date(day.date))}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-900">
                    {formatDate(day.date)}
                  </div>
                  <div className="text-lg font-bold text-gray-900 mt-1">
                    {formatCurrency(day.totalRevenue)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatNumber(day.totalCount)}件
                  </div>
                  
                  {showDetails && (
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">新規:</span>
                        <span className="font-medium">{formatNumber(day.newPatients.length)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">既存:</span>
                        <span className="font-medium">{formatNumber(day.existingPatients.length)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">単価:</span>
                        <span className="font-medium">{formatCurrency(day.dailyAverage)}</span>
                      </div>
                    </div>
                  )}

                  {previousDay && (
                    <div className="mt-2 flex items-center justify-center space-x-1">
                      {getTrendIcon(day.totalRevenue, previousDay.totalRevenue)}
                      <span className={`text-xs ${getTrendColor(day.totalRevenue, previousDay.totalRevenue)}`}>
                        {calculateTrend(day.totalRevenue, previousDay.totalRevenue).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 選択日の詳細情報 */}
      {selectedDayData && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {formatDate(selectedDayData.date)} の詳細
          </h3>

          {/* 基本情報 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(selectedDayData.totalRevenue)}
              </div>
              <div className="text-sm text-gray-600">総売上</div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(selectedDayData.totalCount)}
              </div>
              <div className="text-sm text-gray-600">総件数</div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(selectedDayData.dailyAverage)}
              </div>
              <div className="text-sm text-gray-600">当日単価</div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(selectedDayData.sameDayNewAverage)}
              </div>
              <div className="text-sm text-gray-600">新規当日単価</div>
            </div>
          </div>

          {/* 患者区分別詳細 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 新規患者 */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">新規患者</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">件数:</span>
                  <span className="font-medium text-blue-900">
                    {formatNumber(selectedDayData.newPatients.length)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">売上:</span>
                  <span className="font-medium text-blue-900">
                    {formatCurrency(selectedDayData.newPatients.reduce((sum, p) => sum + p.totalAmount, 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">単価:</span>
                  <span className="font-medium text-blue-900">
                    {formatCurrency(selectedDayData.newAverage)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">当日単価:</span>
                  <span className="font-medium text-blue-900">
                    {formatCurrency(selectedDayData.sameDayNewAverage)}
                  </span>
                </div>
              </div>
            </div>

            {/* 既存患者 */}
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-3">既存患者</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-green-700">件数:</span>
                  <span className="font-medium text-green-900">
                    {formatNumber(selectedDayData.existingPatients.length)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-green-700">売上:</span>
                  <span className="font-medium text-green-900">
                    {formatCurrency(selectedDayData.existingPatients.reduce((sum, p) => sum + p.totalAmount, 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-green-700">単価:</span>
                  <span className="font-medium text-green-900">
                    {formatCurrency(selectedDayData.existingAverage)}
                  </span>
                </div>
              </div>
            </div>

            {/* その他 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">その他</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700">件数:</span>
                  <span className="font-medium text-gray-900">
                    {formatNumber(selectedDayData.otherPatients.length)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700">売上:</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(selectedDayData.otherPatients.reduce((sum, p) => sum + p.sameDayAmount, 0))}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  （単価計算対象外）
                </div>
              </div>
            </div>
          </div>

          {/* 患者詳細リスト */}
          {selectedDayData.newPatients.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-3">新規患者詳細</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        患者名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        施術内容
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        担当者
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        流入元
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        当日金額
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        総金額
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedDayData.newPatients.map((patientRevenue, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {patientRevenue.patient.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {patientRevenue.patient.treatmentName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {patientRevenue.patient.staff}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {patientRevenue.patient.referralSource}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(patientRevenue.sameDayAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(patientRevenue.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
