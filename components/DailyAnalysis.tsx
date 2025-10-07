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
    if (!state.apiConnected || !state.data.dailyAccounts.length) return []

    // Group daily accounts by date
    const dailyGroups = new Map<string, any[]>()
    
    state.data.dailyAccounts.forEach(record => {
      const recordDate = new Date(record.recordDate).toISOString().split('T')[0]
      if (!dailyGroups.has(recordDate)) {
        dailyGroups.set(recordDate, [])
      }
      dailyGroups.get(recordDate)!.push(record)
    })

    const data: Array<{
      dateString: string
      totalRevenue: number
      totalCount: number
      newCount: number
      existingCount: number
      newRevenue: number
      existingRevenue: number
      dailyAverage: number
      newDailyAverage: number
      existingDailyAverage: number
      newPatients: any[]
      existingPatients: any[]
    }> = []

    const currentDate = new Date(dateRange.start)
    const endDate = new Date(dateRange.end)

    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0]
      const dayRecords = dailyGroups.get(dateString) || []

      // Calculate metrics for this day
      const totalRevenue = dayRecords.reduce((sum, record) => sum + (record.totalWithTax || 0), 0)
      const totalCount = dayRecords.length
      
      const newPatients = dayRecords.filter(record => record.isFirst === true)
      const existingPatients = dayRecords.filter(record => record.isFirst === false)
      
      const newCount = newPatients.length
      const existingCount = existingPatients.length
      
      const newRevenue = newPatients.reduce((sum, record) => sum + (record.totalWithTax || 0), 0)
      const existingRevenue = existingPatients.reduce((sum, record) => sum + (record.totalWithTax || 0), 0)
      
      const dailyAverage = totalCount > 0 ? totalRevenue / totalCount : 0
      const newDailyAverage = newCount > 0 ? newRevenue / newCount : 0
      const existingDailyAverage = existingCount > 0 ? existingRevenue / existingCount : 0

      data.push({
        dateString,
        totalRevenue,
        totalCount,
        newCount,
        existingCount,
        newRevenue,
        existingRevenue,
        dailyAverage,
        newDailyAverage,
        existingDailyAverage,
        newPatients,
        existingPatients
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return data
  }, [state.data.dailyAccounts, state.apiConnected, dateRange])

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
    if (current > previous) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (current < previous) return <TrendingDown className="w-4 h-4 text-red-500" />
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
      {/* 日別分析サマリー */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">日別分析サマリー</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">総売上</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(dailyData.reduce((sum, day) => sum + day.totalRevenue, 0))}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">総件数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(dailyData.reduce((sum, day) => sum + day.totalCount, 0))}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">平均単価</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    dailyData.length > 0 
                      ? dailyData.reduce((sum, day) => sum + day.dailyAverage, 0) / dailyData.length
                      : 0
                  )}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">新規患者数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(dailyData.reduce((sum, day) => sum + day.newCount, 0))}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 日別売上チャート */}
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">日別売上推移</h3>
            <p className="text-sm text-gray-600">
              {new Date(dateRange.start).toLocaleDateString('ja-JP', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })} ～ {new Date(dateRange.end).toLocaleDateString('ja-JP', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })} の分析データ (過去30日間)
            </p>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
          >
            {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showDetails ? '詳細を隠す' : '詳細を表示'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
          {dailyData.map((day, index) => {
            const previousDay = index > 0 ? dailyData[index - 1] : null
            const isSelected = selectedDate && day.dateString === selectedDate.toISOString().split('T')[0]
            
            return (
              <div
                key={day.dateString}
                onClick={() => setSelectedDate(new Date(day.dateString))}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-xs font-medium text-gray-900">
                    {formatDate(new Date(day.dateString))}
                  </div>
                  <div className="mt-1 text-sm font-bold text-gray-900">
                    {formatCurrency(day.totalRevenue)}
                  </div>
                  <div className="text-xs text-gray-600">
                    {formatNumber(day.totalCount)}件
                  </div>
                  
                  {showDetails && (
                    <div className="mt-1 space-y-0.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">新規:</span>
                        <span className="font-medium">{formatNumber(day.newCount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">既存:</span>
                        <span className="font-medium">{formatNumber(day.existingCount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">単価:</span>
                        <span className="font-medium">{formatCurrency(day.dailyAverage)}</span>
                      </div>
                    </div>
                  )}

                  {previousDay && (
                    <div className="flex items-center justify-center mt-1 space-x-1">
                      {getTrendIcon(day.totalRevenue, previousDay.totalRevenue)}
                      <span className={`text-xs ${getTrendColor(day.totalRevenue, previousDay.totalRevenue)}`}>
                        {calculateTrend(day.totalRevenue, previousDay.totalRevenue).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 表示指標 */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">表示指標</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* 総来院者数 */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">総来院者数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(dailyData.reduce((sum, day) => sum + day.totalCount, 0))}人
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          {/* 新規来院者数 */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">新規来院者数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(dailyData.reduce((sum, day) => sum + day.newCount, 0))}人
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>

          {/* 既存来院者数 */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">既存来院者数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(dailyData.reduce((sum, day) => sum + day.existingCount, 0))}人
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          {/* 平均単価 */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">平均単価</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    dailyData.length > 0 
                      ? dailyData.reduce((sum, day) => sum + day.dailyAverage, 0) / dailyData.length
                      : 0
                  )}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          {/* 新規平均単価 */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">新規平均単価</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    dailyData.length > 0 
                      ? dailyData.reduce((sum, day) => sum + day.newDailyAverage, 0) / dailyData.length
                      : 0
                  )}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-600" />
            </div>
          </div>

          {/* 既存平均単価 */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">既存平均単価</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    dailyData.length > 0 
                      ? dailyData.reduce((sum, day) => sum + day.existingDailyAverage, 0) / dailyData.length
                      : 0
                  )}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* カテゴリー別分析 */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">カテゴリー別分析</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* 流入元別分析 */}
          <div>
            <h4 className="mb-3 font-semibold text-gray-800 text-md">流入元別分析</h4>
            <div className="space-y-2">
              {(() => {
                const referralSourceData = dailyData.reduce((acc, day) => {
                  day.newPatients.concat(day.existingPatients).forEach(record => {
                    const source = record.visitorInflowSourceName || 'その他'
                    if (!acc[source]) {
                      acc[source] = { count: 0, revenue: 0 }
                    }
                    acc[source].count += 1
                    acc[source].revenue += record.totalWithTax || 0
                  })
                  return acc
                }, {} as Record<string, { count: number, revenue: number }>)

                return Object.entries(referralSourceData)
                  .sort(([,a], [,b]) => b.revenue - a.revenue)
                  .slice(0, 5)
                  .map(([source, data]) => (
                    <div key={source} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div>
                        <div className="font-medium text-gray-900">{source}</div>
                        <div className="text-sm text-gray-600">{formatNumber(data.count)}件</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{formatCurrency(data.revenue)}</div>
                        <div className="text-sm text-gray-600">
                          単価: {formatCurrency(data.count > 0 ? data.revenue / data.count : 0)}
                        </div>
                      </div>
                    </div>
                  ))
              })()}
            </div>
          </div>

          {/* 施術別分析 */}
          <div>
            <h4 className="mb-3 font-semibold text-gray-800 text-md">施術別分析</h4>
            <div className="space-y-2">
              {(() => {
                const treatmentData = dailyData.reduce((acc, day) => {
                  day.newPatients.concat(day.existingPatients).forEach(record => {
                    const treatment = record.visitorTreatmentName || 'その他'
                    if (!acc[treatment]) {
                      acc[treatment] = { count: 0, revenue: 0 }
                    }
                    acc[treatment].count += 1
                    acc[treatment].revenue += record.totalWithTax || 0
                  })
                  return acc
                }, {} as Record<string, { count: number, revenue: number }>)

                return Object.entries(treatmentData)
                  .sort(([,a], [,b]) => b.revenue - a.revenue)
                  .slice(0, 5)
                  .map(([treatment, data]) => (
                    <div key={treatment} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div>
                        <div className="font-medium text-gray-900">{treatment}</div>
                        <div className="text-sm text-gray-600">{formatNumber(data.count)}件</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{formatCurrency(data.revenue)}</div>
                        <div className="text-sm text-gray-600">
                          単価: {formatCurrency(data.count > 0 ? data.revenue / data.count : 0)}
                        </div>
                      </div>
                    </div>
                  ))
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* 選択日の詳細情報 */}
      {selectedDayData && (
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            {formatDate(new Date(selectedDayData.dateString))} の詳細
          </h3>

          {/* 基本情報 */}
          <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-4">
            <div className="p-4 text-center rounded-lg bg-gray-50">
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(selectedDayData.totalRevenue)}
              </div>
              <div className="text-sm text-gray-600">総売上</div>
            </div>

            <div className="p-4 text-center rounded-lg bg-gray-50">
              <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(selectedDayData.totalCount)}
              </div>
              <div className="text-sm text-gray-600">総件数</div>
            </div>

            <div className="p-4 text-center rounded-lg bg-gray-50">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(selectedDayData.dailyAverage)}
              </div>
              <div className="text-sm text-gray-600">当日単価</div>
            </div>

            <div className="p-4 text-center rounded-lg bg-gray-50">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(selectedDayData.newDailyAverage)}
              </div>
              <div className="text-sm text-gray-600">新規当日単価</div>
            </div>
          </div>

          {/* 患者区分別詳細 */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* 新規患者 */}
            <div className="p-4 rounded-lg bg-blue-50">
              <h4 className="mb-3 font-semibold text-blue-900">新規患者</h4>
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
                    {formatCurrency(selectedDayData.newPatients.reduce((sum, p) => sum + (p.totalWithTax || 0), 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">単価:</span>
                  <span className="font-medium text-blue-900">
                    {formatCurrency(selectedDayData.newDailyAverage)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">当日単価:</span>
                  <span className="font-medium text-blue-900">
                    {formatCurrency(selectedDayData.newDailyAverage)}
                  </span>
                </div>
              </div>
            </div>

            {/* 既存患者 */}
            <div className="p-4 rounded-lg bg-green-50">
              <h4 className="mb-3 font-semibold text-green-900">既存患者</h4>
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
                    {formatCurrency(selectedDayData.existingPatients.reduce((sum, p) => sum + (p.totalWithTax || 0), 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-green-700">単価:</span>
                  <span className="font-medium text-green-900">
                    {formatCurrency(selectedDayData.existingDailyAverage)}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* 患者詳細リスト */}
          {selectedDayData.newPatients.length > 0 && (
            <div className="mt-6">
              <h4 className="mb-3 font-semibold text-gray-900">新規患者詳細</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        患者名
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        施術内容
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        担当者
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        流入元
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        当日金額
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        総金額
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedDayData.newPatients.map((record, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                          {record.visitorName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {record.visitorTreatmentName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {record.visitorStaffName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {record.visitorInflowSourceName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {formatCurrency(record.totalWithTax || 0)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                          {formatCurrency(record.totalWithTax || 0)}
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
