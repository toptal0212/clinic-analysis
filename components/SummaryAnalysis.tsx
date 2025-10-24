'use client'

import React, { useState, useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { CalculationEngine } from '@/lib/calculationEngine'
import { TreatmentHierarchy } from '@/lib/dataTypes'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Calendar,
  ChevronDown,
  ChevronRight,
  Building2
} from 'lucide-react'

interface SummaryData {
  totalRevenue: number
  totalCount: number
  newCount: number
  existingCount: number
  otherCount: number
  newRevenue: number
  existingRevenue: number
  otherRevenue: number
  newAverage: number
  existingAverage: number
  dailyAverage: number
  sameDayNewAverage: number
  hierarchy: {
    [key: string]: {
      [key: string]: {
        [key: string]: {
          revenue: number
          count: number
          average: number
        }
      }
    }
  }
  referralSourceSummary: Record<string, { count: number, revenue: number, newCount: number, existingCount: number }>
  treatmentSummary: Record<string, { count: number, revenue: number, newCount: number, existingCount: number }>
}

export default function SummaryAnalysis() {
  const { state } = useDashboard()
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['美容']))
  const [selectedHospital, setSelectedHospital] = useState<string>('all')
  const calculationEngine = new CalculationEngine()

  const summaryData = useMemo(() => {
    // Generate sample data if no real data is available
    if (!state.apiConnected || !state.data.dailyAccounts.length) {
      console.log('🔍 [DEBUG] SummaryAnalysis - Using sample data')
      return {
        totalRevenue: 15000000,
        totalCount: 150,
        newCount: 60,
        existingCount: 80,
        otherCount: 10,
        newRevenue: 9000000,
        existingRevenue: 5000000,
        otherRevenue: 1000000,
        newAverage: 150000,
        existingAverage: 62500,
        dailyAverage: 100000,
        sameDayNewAverage: 120000,
        hierarchy: {
          '外科': {
            '二重': { revenue: 6000000, count: 50, average: 120000 },
            'くま治療': { revenue: 4000000, count: 35, average: 114000 },
            '糸リフト': { revenue: 3000000, count: 25, average: 120000 },
            '小顔': { revenue: 2000000, count: 10, average: 200000 }
          },
          '皮膚科': {
            '注入': { revenue: 5000000, count: 150, average: 33333 },
            'スキン': { revenue: 3000000, count: 50, average: 60000 }
          },
          '脱毛': {
            '全身脱毛': { revenue: 2000000, count: 60, average: 33333 },
            '部分脱毛': { revenue: 1000000, count: 40, average: 25000 }
          },
          'その他': {
            'ピアス': { revenue: 500000, count: 20, average: 25000 },
            '物販': { revenue: 1000000, count: 20, average: 50000 },
            '麻酔・針・パック': { revenue: 500000, count: 10, average: 50000 }
          }
        },
        referralSourceSummary: {
          'Instagram': { count: 50, revenue: 5000000, newCount: 30, existingCount: 20 },
          'Google': { count: 40, revenue: 4000000, newCount: 25, existingCount: 15 },
          '紹介': { count: 30, revenue: 3000000, newCount: 15, existingCount: 15 },
          'その他': { count: 30, revenue: 3000000, newCount: 20, existingCount: 10 }
        }
      }
    }

    // Get data based on hospital selection
    let baseData = state.data.dailyAccounts
    if (selectedHospital !== 'all' && state.data.clinicData) {
      const clinicKey = selectedHospital as keyof typeof state.data.clinicData
      baseData = state.data.clinicData[clinicKey]?.dailyAccounts || []
    }

    // Filter to today's data only
    const today = new Date()
    const todayString = today.toISOString().split('T')[0] // YYYY-MM-DD format
    
    const dailyAccounts = baseData.filter(record => {
      const recordDate = new Date(record.recordDate).toISOString().split('T')[0]
      return recordDate === todayString
    })

    // If no data for today, show message
    if (dailyAccounts.length === 0) {
      return null
    }

    // 総売上と総件数の計算
    const totalRevenue = dailyAccounts.reduce((sum, record) => sum + (record.totalWithTax || 0), 0)
    const totalCount = dailyAccounts.length

    // 新規・既存患者の分類
    const newPatients = dailyAccounts.filter(record => record.isFirst === true)
    const existingPatients = dailyAccounts.filter(record => record.isFirst === false)

    const newCount = newPatients.length
    const existingCount = existingPatients.length

    // 売上計算
    const newRevenue = newPatients.reduce((sum, record) => sum + (record.totalWithTax || 0), 0)
    const existingRevenue = existingPatients.reduce((sum, record) => sum + (record.totalWithTax || 0), 0)

    // 単価計算
    const newAverage = newCount > 0 ? newRevenue / newCount : 0
    const existingAverage = existingCount > 0 ? existingRevenue / existingCount : 0
    const dailyAverage = totalCount > 0 ? totalRevenue / totalCount : 0

    // 当日単価（新規患者の当日売上のみ）
    const sameDayNewRevenue = newPatients.reduce((sum, record) => sum + (record.totalWithTax || 0), 0)
    const sameDayNewAverage = newCount > 0 ? sameDayNewRevenue / newCount : 0

    // 各レコードから 施術内容/担当者 を抽出（paymentItems ベース）
    const withDerived = dailyAccounts.map((record: any, index: number) => {
      const hasItems = Array.isArray(record.paymentItems) && record.paymentItems.length > 0
      const firstItem = hasItems ? record.paymentItems[0] : undefined
      const treatmentName = firstItem?.name || '未設定'
      const staffName = firstItem?.mainStaffName || record.reservationStaffName || '担当者不明'
      // Debug
      console.log('DailyAnalysis Debug:', {
        index,
        visitorId: record.visitorId,
        visitorName: record.visitorName,
        paymentItemsLength: Array.isArray(record.paymentItems) ? record.paymentItems.length : 0,
        derivedTreatmentName: treatmentName,
        derivedStaff: staffName
      })
      return { ...record, _treatmentName: treatmentName, _staffName: staffName }
    })

    // 患者区分別サマリー（流入元別）
    const referralSourceSummary = withDerived.reduce((acc, record) => {
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

    // 施術別分析（簡易版）
    const treatmentSummary = withDerived.reduce((acc, record: any) => {
      const treatment = record._treatmentName || 'その他'
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

    // 階層化データの構築（簡易版）
    const hierarchy: SummaryData['hierarchy'] = {
      '美容': {
        '外科': {},
        '皮膚科': {},
        '脱毛': {}
      },
      'その他': {
        'ピアス': {},
        '物販': {},
        '麻酔・針・パック': {}
      }
    }

    // 施術データを階層化（簡易分類）
    Object.entries(treatmentSummary).forEach(([treatment, data]: [string, any]) => {
      let mainCategory = 'その他'
      let subCategory = 'その他'
      let procedure = treatment

      // 簡易的な分類ロジック
      if (treatment.includes('外科') || treatment.includes('手術')) {
        mainCategory = '美容'
        subCategory = '外科'
      } else if (treatment.includes('皮膚') || treatment.includes('レーザー')) {
        mainCategory = '美容'
        subCategory = '皮膚科'
      } else if (treatment.includes('脱毛')) {
        mainCategory = '美容'
        subCategory = '脱毛'
      } else if (treatment.includes('ピアス')) {
        mainCategory = 'その他'
        subCategory = 'ピアス'
      } else if (treatment.includes('物販')) {
        mainCategory = 'その他'
        subCategory = '物販'
      } else {
        mainCategory = 'その他'
        subCategory = '麻酔・針・パック'
      }

      if (!hierarchy[mainCategory][subCategory][procedure]) {
        hierarchy[mainCategory][subCategory][procedure] = {
          revenue: 0,
          count: 0,
          average: 0
        }
      }

      hierarchy[mainCategory][subCategory][procedure].revenue = data.revenue
      hierarchy[mainCategory][subCategory][procedure].count = data.count
      hierarchy[mainCategory][subCategory][procedure].average = data.count > 0 ? data.revenue / data.count : 0
    })

    return {
      totalRevenue,
      totalCount,
      newCount,
      existingCount,
      otherCount: 0, // 日計表データでは新規・既存のみ
      newRevenue,
      existingRevenue,
      otherRevenue: 0,
      newAverage,
      existingAverage,
      dailyAverage,
      sameDayNewAverage,
      hierarchy,
      referralSourceSummary,
      treatmentSummary
    }
  }, [state.data.dailyAccounts, state.data.clinicData, state.apiConnected, selectedHospital])

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
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

  const hospitalOptions = [
    { id: 'all', name: '全院' },
    { id: 'yokohama', name: '横浜院' },
    { id: 'koriyama', name: '郡山院' },
    { id: 'mito', name: '水戸院' },
    { id: 'omiya', name: '大宮院' }
  ]

  if (!summaryData) {
    return (
      <div className="space-y-6">
        {/* Header with Hospital Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">サマリー分析</h2>
              <p className="text-gray-600">本日の売上・来院数サマリー</p>
            </div>
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
                    <Building2 className="w-4 h-4 inline mr-1" />
                    {hospital.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <div className="text-center text-gray-500">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">本日のサマリー分析</h3>
            <p>本日のデータがありません</p>
            <p className="mt-1 text-sm text-gray-400">
              {new Date().toLocaleDateString('ja-JP', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sample Data Notice */}
      {(!state.apiConnected || !state.data.dailyAccounts.length) && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            📊 サンプルデータを表示中 - 実際のデータを表示するにはAPIに接続してください
          </p>
        </div>
      )}

      {/* Header with Hospital Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">サマリー分析</h2>
            <p className="text-gray-600">本日の売上・来院数サマリー</p>
          </div>
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
                  <Building2 className="w-4 h-4 inline mr-1" />
                  {hospital.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 本日のサマリー分析ヘッダー */}
      <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
        <h2 className="text-xl font-semibold text-blue-900">本日のサマリー分析</h2>
        <p className="text-blue-700">
          {new Date().toLocaleDateString('ja-JP', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
          })}
        </p>
      </div>

      {/* サマリーKPIカード */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">総売上</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summaryData.totalRevenue)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">総件数</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(summaryData.totalCount)}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">当日単価</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summaryData.dailyAverage)}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">新規単価</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summaryData.newAverage)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* 患者区分別サマリー */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">患者区分別サマリー</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatNumber(summaryData.newCount)}
            </div>
            <div className="text-sm text-gray-600">新規患者</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(summaryData.newRevenue)}
            </div>
            <div className="text-sm text-gray-500">
              単価: {formatCurrency(summaryData.newAverage)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatNumber(summaryData.existingCount)}
            </div>
            <div className="text-sm text-gray-600">既存患者</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(summaryData.existingRevenue)}
            </div>
            <div className="text-sm text-gray-500">
              単価: {formatCurrency(summaryData.existingAverage)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {formatNumber(summaryData.otherCount)}
            </div>
            <div className="text-sm text-gray-600">その他</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(summaryData.otherRevenue)}
            </div>
            <div className="text-sm text-gray-500">
              （単価計算対象外）
            </div>
          </div>
        </div>
      </div>

      {/* 流入元別サマリー */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">流入元別サマリー</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(summaryData.referralSourceSummary)
            .sort(([,a], [,b]) => (b as any).revenue - (a as any).revenue)
            .slice(0, 9)
            .map(([source, data]: [string, any]) => (
            <div key={source} className="p-4 border rounded-lg">
              <div className="text-sm font-medium text-gray-600">{source}</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">
                {formatCurrency(data.revenue)}
              </div>
              <div className="text-sm text-gray-500">
                総件数: {formatNumber(data.count)}件
              </div>
              <div className="text-sm text-gray-500">
                新規: {formatNumber(data.newCount)}件 / 既存: {formatNumber(data.existingCount)}件
              </div>
              <div className="text-sm text-gray-500">
                単価: {formatCurrency(data.count > 0 ? data.revenue / data.count : 0)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 施術別サマリー */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">施術別サマリー</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(summaryData.treatmentSummary)
            .sort(([,a], [,b]) => (b as any).revenue - (a as any).revenue)
            .slice(0, 9)
            .map(([treatment, data]: [string, any]) => (
            <div key={treatment} className="p-4 border rounded-lg">
              <div className="text-sm font-medium text-gray-600">{treatment}</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">
                {formatCurrency(data.revenue)}
              </div>
              <div className="text-sm text-gray-500">
                総件数: {formatNumber(data.count)}件
              </div>
              <div className="text-sm text-gray-500">
                新規: {formatNumber(data.newCount)}件 / 既存: {formatNumber(data.existingCount)}件
              </div>
              <div className="text-sm text-gray-500">
                単価: {formatCurrency(data.count > 0 ? data.revenue / data.count : 0)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 階層化施術別分析 */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">施術別分析（階層化表示）</h3>
        
        {Object.entries(summaryData.hierarchy).map(([mainCategory, subCategories]) => (
          <div key={mainCategory} className="mb-6">
            <button
              onClick={() => toggleCategory(mainCategory)}
              className="flex items-center justify-between w-full p-4 transition-colors rounded-lg bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex items-center space-x-3">
                {expandedCategories.has(mainCategory) ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
                <span className="text-lg font-semibold text-gray-900">{mainCategory}</span>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  総売上: {formatCurrency(
                    Object.values(subCategories).reduce((mainSum: number, subCategory: any) => 
                      mainSum + Object.values(subCategory).reduce((subSum: number, procedure: any) => 
                        subSum + procedure.revenue, 0
                      ), 0
                    )
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  総件数: {formatNumber(
                    Object.values(subCategories).reduce((mainSum: number, subCategory: any) => 
                      mainSum + Object.values(subCategory).reduce((subSum: number, procedure: any) => 
                        subSum + procedure.count, 0
                      ), 0
                    )
                  )}
                </div>
              </div>
            </button>

            {expandedCategories.has(mainCategory) && (
              <div className="mt-4 space-y-4">
                {Object.entries(subCategories as any).map(([subCategory, procedures]) => (
                  <div key={subCategory} className="ml-6">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-25">
                      <span className="font-medium text-gray-800">{subCategory}</span>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          売上: {formatCurrency(
                            Object.values(procedures as any).reduce((sum: number, procedure: any) => 
                              sum + procedure.revenue, 0
                            )
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          件数: {formatNumber(
                            Object.values(procedures as any).reduce((sum: number, procedure: any) => 
                              sum + procedure.count, 0
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 ml-4 space-y-2">
                      {Object.entries(procedures as any).map(([procedure, data]) => (
                        <div key={procedure} className="flex items-center justify-between p-2 bg-white border rounded">
                          <span className="text-sm text-gray-700">{procedure}</span>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency((data as any).revenue)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatNumber((data as any).count)}件 (単価: {formatCurrency((data as any).average)})
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
