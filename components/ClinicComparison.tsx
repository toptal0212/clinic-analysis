'use client'

import React, { useState, useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Calendar,
  Building2
} from 'lucide-react'

interface ClinicComparisonProps {
  dateRange: { start: Date, end: Date }
}

export default function ClinicComparison({ dateRange }: ClinicComparisonProps) {
  const { state } = useDashboard()
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'count' | 'average'>('revenue')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'beauty' | 'other'>('all')
  const [selectedIndicator, setSelectedIndicator] = useState<'total' | 'new' | 'existing'>('total')
  const [selectedAnalysisCategory, setSelectedAnalysisCategory] = useState<'referral' | 'treatment'>('referral')

  // 表示指標データの計算
  const displayIndicators = useMemo(() => {
    if (!state.apiConnected || !state.data.dailyAccounts.length) return null

    const filteredData = state.data.dailyAccounts.filter(record => {
      const recordDate = new Date(record.recordDate)
      return recordDate >= dateRange.start && recordDate <= dateRange.end
    })

    const totalRevenue = filteredData.reduce((sum, record) => sum + (record.totalWithTax || 0), 0)
    const totalCount = filteredData.length
    const newCount = filteredData.filter(record => record.isFirst === true).length
    const existingCount = filteredData.filter(record => record.isFirst === false).length
    const newRevenue = filteredData.filter(record => record.isFirst === true).reduce((sum, record) => sum + (record.totalWithTax || 0), 0)
    const existingRevenue = filteredData.filter(record => record.isFirst === false).reduce((sum, record) => sum + (record.totalWithTax || 0), 0)

    return {
      totalRevenue,
      totalCount,
      newCount,
      existingCount,
      newRevenue,
      existingRevenue,
      totalAverage: totalCount > 0 ? totalRevenue / totalCount : 0,
      newAverage: newCount > 0 ? newRevenue / newCount : 0,
      existingAverage: existingCount > 0 ? existingRevenue / existingCount : 0
    }
  }, [state.data.dailyAccounts, state.apiConnected, dateRange])

  // カテゴリー別分析データ
  const categoryAnalysis = useMemo(() => {
    if (!state.apiConnected || !state.data.dailyAccounts.length) return { referral: {}, treatment: {} }

    const filteredData = state.data.dailyAccounts.filter(record => {
      const recordDate = new Date(record.recordDate)
      return recordDate >= dateRange.start && recordDate <= dateRange.end
    })

    const referralData = filteredData.reduce((acc, record) => {
      const source = record.visitorInflowSourceName || 'その他'
      if (!acc[source]) {
        acc[source] = { count: 0, revenue: 0, newCount: 0, existingCount: 0 }
      }
      acc[source].count += 1
      acc[source].revenue += record.totalWithTax || 0
      if (record.isFirst) {
        acc[source].newCount += 1
      } else {
        acc[source].existingCount += 1
      }
      return acc
    }, {} as Record<string, { count: number, revenue: number, newCount: number, existingCount: number }>)

    const treatmentData = filteredData.reduce((acc, record) => {
      const treatment = record.visitorTreatmentName || 'その他'
      if (!acc[treatment]) {
        acc[treatment] = { count: 0, revenue: 0, newCount: 0, existingCount: 0 }
      }
      acc[treatment].count += 1
      acc[treatment].revenue += record.totalWithTax || 0
      if (record.isFirst) {
        acc[treatment].newCount += 1
      } else {
        acc[treatment].existingCount += 1
      }
      return acc
    }, {} as Record<string, { count: number, revenue: number, newCount: number, existingCount: number }>)

    return { referral: referralData, treatment: treatmentData }
  }, [state.data.dailyAccounts, state.apiConnected, dateRange])

  // 月別推移データ
  const monthlyTrends = useMemo(() => {
    if (!state.apiConnected || !state.data.dailyAccounts.length) return []

    const monthlyData = new Map<string, any>()

    state.data.dailyAccounts.forEach(record => {
      const recordDate = new Date(record.recordDate)
      if (recordDate >= dateRange.start && recordDate <= dateRange.end) {
        const monthKey = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, {
            year: recordDate.getFullYear(),
            month: recordDate.getMonth() + 1,
            totalRevenue: 0,
            totalCount: 0,
            newCount: 0,
            existingCount: 0,
            newRevenue: 0,
            existingRevenue: 0
          })
        }

        const monthData = monthlyData.get(monthKey)!
        monthData.totalRevenue += record.totalWithTax || 0
        monthData.totalCount += 1
        
        if (record.isFirst) {
          monthData.newCount += 1
          monthData.newRevenue += record.totalWithTax || 0
        } else {
          monthData.existingCount += 1
          monthData.existingRevenue += record.totalWithTax || 0
        }
      }
    })

    return Array.from(monthlyData.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return a.month - b.month
    })
  }, [state.data.dailyAccounts, state.apiConnected, dateRange])

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
      month: 'short'
    }).format(date)
  }

  if (!displayIndicators) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="text-center text-gray-500">
          データがありません
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 表示指標メニュー */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">表示指標</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* 総売上 */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">総売上</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(displayIndicators.totalRevenue)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>

          {/* 総来院者数 */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">総来院者数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(displayIndicators.totalCount)}人
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
                  {formatNumber(displayIndicators.newCount)}人
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
                  {formatNumber(displayIndicators.existingCount)}人
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
                  {formatCurrency(displayIndicators.totalAverage)}
                </p>
              </div>
              <Target className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          {/* 新規平均単価 */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">新規平均単価</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(displayIndicators.newAverage)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* カテゴリーメニュー */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">カテゴリー別分析</h3>
        
        {/* カテゴリー選択 */}
        <div className="mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setSelectedAnalysisCategory('referral')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedAnalysisCategory === 'referral'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              流入元別
            </button>
            <button
              onClick={() => setSelectedAnalysisCategory('treatment')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedAnalysisCategory === 'treatment'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              施術別
            </button>
          </div>
        </div>

        {/* カテゴリー分析結果 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(selectedAnalysisCategory === 'referral' ? categoryAnalysis.referral : categoryAnalysis.treatment)
          .sort(([,a], [,b]) => (b as any).revenue - (a as any).revenue)
          .slice(0, 6)
          .map(([category, data]: [string, any]) => (
            <div key={category} className="p-4 border rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-2">{category}</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatCurrency(data.revenue)}
              </div>
              <div className="text-sm text-gray-600">
                件数: {formatNumber(data.count)}件
              </div>
              <div className="text-sm text-gray-600">
                単価: {formatCurrency(data.count > 0 ? data.revenue / data.count : 0)}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                新規: {formatNumber(data.newCount)}件 / 既存: {formatNumber(data.existingCount)}件
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 全体 - 売上比較 */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">全体 - 売上比較</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* 新規 vs 既存売上比較 */}
          <div>
            <h4 className="mb-3 font-semibold text-gray-800">新規 vs 既存売上比較</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">新規患者</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-900">
                    {formatCurrency(displayIndicators.newRevenue)}
                  </div>
                  <div className="text-sm text-green-700">
                    {formatNumber(displayIndicators.newCount)}件
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">既存患者</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-900">
                    {formatCurrency(displayIndicators.existingRevenue)}
                  </div>
                  <div className="text-sm text-blue-700">
                    {formatNumber(displayIndicators.existingCount)}件
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 売上構成比 */}
          <div>
            <h4 className="mb-3 font-semibold text-gray-800">売上構成比</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">新規患者</span>
                <span className="font-medium">
                  {((displayIndicators.newRevenue / displayIndicators.totalRevenue) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${(displayIndicators.newRevenue / displayIndicators.totalRevenue) * 100}%` }}
                ></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">既存患者</span>
                <span className="font-medium">
                  {((displayIndicators.existingRevenue / displayIndicators.totalRevenue) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${(displayIndicators.existingRevenue / displayIndicators.totalRevenue) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 月別推移 */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">月別推移</h3>
        <div className="space-y-4">
          {monthlyTrends.map((month, index) => {
            const previousMonth = index > 0 ? monthlyTrends[index - 1] : null
            const revenueChange = previousMonth 
              ? ((month.totalRevenue - previousMonth.totalRevenue) / previousMonth.totalRevenue) * 100
              : 0

            return (
              <div key={`${month.year}-${month.month}`} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">
                    {formatDate(new Date(month.year, month.month - 1, 1))}
                  </h4>
                  {previousMonth && (
                    <div className="flex items-center space-x-2">
                      {revenueChange > 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : revenueChange < 0 ? (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      ) : null}
                      <span className={`text-sm font-medium ${
                        revenueChange > 0 ? 'text-green-600' : 
                        revenueChange < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {revenueChange > 0 ? '+' : ''}{revenueChange.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(month.totalRevenue)}
                    </div>
                    <div className="text-sm text-gray-600">総売上</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatNumber(month.totalCount)}
                    </div>
                    <div className="text-sm text-gray-600">総件数</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatNumber(month.newCount)}
                    </div>
                    <div className="text-sm text-gray-600">新規件数</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatNumber(month.existingCount)}
                    </div>
                    <div className="text-sm text-gray-600">既存件数</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}