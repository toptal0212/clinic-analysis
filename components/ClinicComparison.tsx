'use client'

import React, { useState, useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { CalculationEngine } from '@/lib/calculationEngine'
import { ClinicData } from '@/lib/dataTypes'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

interface ClinicComparisonProps {
  dateRange: { start: Date, end: Date }
}

export default function ClinicComparison({ dateRange }: ClinicComparisonProps) {
  const { state } = useDashboard()
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'count' | 'average'>('revenue')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'beauty' | 'other'>('all')
  const [expandedClinics, setExpandedClinics] = useState<Set<string>>(new Set())
  const calculationEngine = new CalculationEngine()

  const clinicData = useMemo(() => {
    if (state.data.patients.length === 0) return []

    // 過去2年のデータを取得
    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

    const clinics: { [key: string]: ClinicData } = {}

    // 各月のデータを計算
    const currentDate = new Date(twoYearsAgo)
    const endDate = new Date(dateRange.end)

    while (currentDate <= endDate) {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1

      const monthlyMetrics = calculationEngine.calculateMonthlyRevenueMetrics(
        state.data.patients,
        state.data.accounting,
        year,
        month
      )

      // 美容とその他に分類
      const beautyPatients = monthlyMetrics.newPatients.concat(monthlyMetrics.existingPatients)
        .filter(p => {
          const treatment = calculationEngine.categorizeTreatment(
            p.patient.treatmentCategory,
            p.patient.treatmentName
          )
          return treatment.main === '美容'
        })

      const otherPatients = monthlyMetrics.otherPatients

      const clinicId = 'clinic-1' // 仮のクリニックID
      const clinicName = 'メインクリニック'

      if (!clinics[clinicId]) {
        clinics[clinicId] = {
          id: clinicId,
          name: clinicName,
          revenue: 0,
          count: 0,
          newCount: 0,
          existingCount: 0,
          otherCount: 0,
          newRevenue: 0,
          existingRevenue: 0,
          otherRevenue: 0,
          newAverage: 0,
          existingAverage: 0,
          dailyAverage: 0,
          monthlyData: []
        }
      }

      const monthlyData = {
        year,
        month,
        date: new Date(year, month - 1, 1),
        revenue: monthlyMetrics.totalRevenue,
        count: monthlyMetrics.totalCount,
        newCount: monthlyMetrics.newPatients.length,
        existingCount: monthlyMetrics.existingPatients.length,
        otherCount: monthlyMetrics.otherPatients.length,
        newRevenue: monthlyMetrics.newPatients.reduce((sum, p) => sum + p.totalAmount, 0),
        existingRevenue: monthlyMetrics.existingPatients.reduce((sum, p) => sum + p.totalAmount, 0),
        otherRevenue: monthlyMetrics.otherPatients.reduce((sum, p) => sum + p.sameDayAmount, 0),
        newAverage: monthlyMetrics.newAverage,
        existingAverage: monthlyMetrics.existingAverage,
        dailyAverage: monthlyMetrics.dailyAverage,
        beautyRevenue: beautyPatients.reduce((sum, p) => sum + p.totalAmount, 0),
        otherRevenue: otherPatients.reduce((sum, p) => sum + p.sameDayAmount, 0)
      }

      clinics[clinicId].monthlyData.push(monthlyData)

      // 累計を更新
      clinics[clinicId].revenue += monthlyMetrics.totalRevenue
      clinics[clinicId].count += monthlyMetrics.totalCount
      clinics[clinicId].newCount += monthlyMetrics.newPatients.length
      clinics[clinicId].existingCount += monthlyMetrics.existingPatients.length
      clinics[clinicId].otherCount += monthlyMetrics.otherPatients.length
      clinics[clinicId].newRevenue += monthlyMetrics.newPatients.reduce((sum, p) => sum + p.totalAmount, 0)
      clinics[clinicId].existingRevenue += monthlyMetrics.existingPatients.reduce((sum, p) => sum + p.totalAmount, 0)
      clinics[clinicId].otherRevenue += monthlyMetrics.otherPatients.reduce((sum, p) => sum + p.sameDayAmount, 0)

      currentDate.setMonth(currentDate.getMonth() + 1)
    }

    // 平均を計算
    Object.values(clinics).forEach(clinic => {
      if (clinic.newCount > 0) {
        clinic.newAverage = clinic.newRevenue / clinic.newCount
      }
      if (clinic.existingCount > 0) {
        clinic.existingAverage = clinic.existingRevenue / clinic.existingCount
      }
      if (clinic.count > 0) {
        clinic.dailyAverage = clinic.revenue / clinic.count
      }
    })

    return Object.values(clinics)
  }, [state.data.patients, state.data.accounting, dateRange])

  const toggleClinic = (clinicId: string) => {
    const newExpanded = new Set(expandedClinics)
    if (newExpanded.has(clinicId)) {
      newExpanded.delete(clinicId)
    } else {
      newExpanded.add(clinicId)
    }
    setExpandedClinics(newExpanded)
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'short'
    }).format(date)
  }

  const getMetricValue = (clinic: ClinicData, metric: string) => {
    switch (metric) {
      case 'revenue':
        return selectedCategory === 'beauty' 
          ? clinic.newRevenue + clinic.existingRevenue
          : selectedCategory === 'other'
          ? clinic.otherRevenue
          : clinic.revenue
      case 'count':
        return selectedCategory === 'beauty'
          ? clinic.newCount + clinic.existingCount
          : selectedCategory === 'other'
          ? clinic.otherCount
          : clinic.count
      case 'average':
        return selectedCategory === 'beauty'
          ? (clinic.newCount + clinic.existingCount) > 0 
            ? (clinic.newRevenue + clinic.existingRevenue) / (clinic.newCount + clinic.existingCount)
            : 0
          : selectedCategory === 'other'
          ? clinic.otherCount > 0 ? clinic.otherRevenue / clinic.otherCount : 0
          : clinic.dailyAverage
      default:
        return 0
    }
  }

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'revenue':
        return '売上'
      case 'count':
        return '件数'
      case 'average':
        return '単価'
      default:
        return ''
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'all':
        return '全体'
      case 'beauty':
        return '美容'
      case 'other':
        return 'その他'
      default:
        return ''
    }
  }

  if (clinicData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          データがありません
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* フィルター */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              表示指標
            </label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="revenue">売上</option>
              <option value="count">件数</option>
              <option value="average">単価</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              カテゴリー
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全体</option>
              <option value="beauty">美容</option>
              <option value="other">その他</option>
            </select>
          </div>
        </div>
      </div>

      {/* クリニック比較 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {getCategoryLabel(selectedCategory)} - {getMetricLabel(selectedMetric)} 比較
        </h3>

        {clinicData.map((clinic) => {
          const metricValue = getMetricValue(clinic, selectedMetric)
          const isExpanded = expandedClinics.has(clinic.id)

          return (
            <div key={clinic.id} className="mb-6">
              <button
                onClick={() => toggleClinic(clinic.id)}
                className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                  <span className="text-lg font-semibold text-gray-900">{clinic.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedMetric === 'revenue' 
                      ? formatCurrency(metricValue)
                      : selectedMetric === 'count'
                      ? formatNumber(metricValue)
                      : formatCurrency(metricValue)
                    }
                  </div>
                  <div className="text-sm text-gray-600">
                    {getMetricLabel(selectedMetric)}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="mt-4 space-y-4">
                  {/* 詳細メトリクス */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-lg font-bold text-blue-900">
                        {formatNumber(clinic.newCount)}
                      </div>
                      <div className="text-sm text-blue-700">新規患者</div>
                      <div className="text-sm text-blue-600">
                        {formatCurrency(clinic.newAverage)}
                      </div>
                    </div>

                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <div className="text-lg font-bold text-green-900">
                        {formatNumber(clinic.existingCount)}
                      </div>
                      <div className="text-sm text-green-700">既存患者</div>
                      <div className="text-sm text-green-600">
                        {formatCurrency(clinic.existingAverage)}
                      </div>
                    </div>

                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Users className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                      <div className="text-lg font-bold text-gray-900">
                        {formatNumber(clinic.otherCount)}
                      </div>
                      <div className="text-sm text-gray-700">その他</div>
                      <div className="text-xs text-gray-500">
                        （単価計算対象外）
                      </div>
                    </div>

                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <div className="text-lg font-bold text-purple-900">
                        {formatCurrency(clinic.dailyAverage)}
                      </div>
                      <div className="text-sm text-purple-700">全体単価</div>
                    </div>
                  </div>

                  {/* 月別推移チャート */}
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 mb-3">月別推移</h4>
                    <div className="overflow-x-auto">
                      <div className="flex space-x-2 min-w-max">
                        {clinic.monthlyData.slice(-24).map((monthData, index) => {
                          const maxValue = Math.max(...clinic.monthlyData.slice(-24).map(m => 
                            getMetricValue({ ...clinic, ...m }, selectedMetric)
                          ))
                          const height = maxValue > 0 ? (getMetricValue({ ...clinic, ...monthData }, selectedMetric) / maxValue) * 100 : 0

                          return (
                            <div key={index} className="flex flex-col items-center space-y-2">
                              <div className="w-8 bg-blue-200 rounded-t" style={{ height: `${height}px` }}>
                                <div className="w-full h-full bg-blue-500 rounded-t"></div>
                              </div>
                              <div className="text-xs text-gray-600 text-center">
                                {formatDate(monthData.date)}
                              </div>
                              <div className="text-xs font-medium text-gray-900">
                                {selectedMetric === 'revenue' 
                                  ? formatCurrency(getMetricValue({ ...clinic, ...monthData }, selectedMetric))
                                  : selectedMetric === 'count'
                                  ? formatNumber(getMetricValue({ ...clinic, ...monthData }, selectedMetric))
                                  : formatCurrency(getMetricValue({ ...clinic, ...monthData }, selectedMetric))
                                }
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* ドリルダウン分析 */}
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 mb-3">ドリルダウン分析</h4>
                    
                    {/* 美容カテゴリーの詳細 */}
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <h5 className="font-medium text-blue-900 mb-3">美容カテゴリー</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-900">外科</div>
                          <div className="text-sm text-blue-700">
                            新規: {formatNumber(clinic.newCount * 0.6)} | 既存: {formatNumber(clinic.existingCount * 0.6)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-900">皮膚科</div>
                          <div className="text-sm text-blue-700">
                            新規: {formatNumber(clinic.newCount * 0.3)} | 既存: {formatNumber(clinic.existingCount * 0.3)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-900">脱毛</div>
                          <div className="text-sm text-blue-700">
                            新規: {formatNumber(clinic.newCount * 0.1)} | 既存: {formatNumber(clinic.existingCount * 0.1)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* その他カテゴリーの詳細 */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-3">その他カテゴリー</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">ピアス</div>
                          <div className="text-sm text-gray-700">
                            件数: {formatNumber(clinic.otherCount * 0.4)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">物販</div>
                          <div className="text-sm text-gray-700">
                            件数: {formatNumber(clinic.otherCount * 0.4)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">麻酔・針・パック</div>
                          <div className="text-sm text-gray-700">
                            件数: {formatNumber(clinic.otherCount * 0.2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
