'use client'

import React, { useState, useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { 
  RefreshCw,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  Target,
  Award,
  AlertCircle,
  DollarSign
} from 'lucide-react'

interface RepeatAnalysisData {
  period: '6months' | '12months'
  totalPatients: number
  repeatPatients: number
  repeatRate: number
  averageDaysToRepeat: number
  newPatientRetention: number
  existingPatientRetention: number
  revenueFromRepeats: number
  averageRevenuePerRepeat: number
}

export default function RepeatAnalysis() {
  const { state } = useDashboard()
  const [selectedPeriod, setSelectedPeriod] = useState<'6months' | '12months'>('6months')

  // リピート分析データの計算
  const repeatAnalysisData = useMemo(() => {
    if (!state.apiConnected || !state.data.dailyAccounts.length) return null

    const currentDate = new Date()
    const analysisStartDate = new Date(currentDate)
    analysisStartDate.setMonth(currentDate.getMonth() - (selectedPeriod === '6months' ? 6 : 12))

    // 分析期間内のデータをフィルタリング
    const analysisData = state.data.dailyAccounts.filter(record => {
      const recordDate = new Date(record.recordDate)
      return recordDate >= analysisStartDate && recordDate <= currentDate
    })

    // 患者別の来院履歴を整理
    const patientVisits = new Map<string, {
      firstVisit: Date
      visits: Array<{
        date: Date
        revenue: number
        isFirst: boolean
        treatmentName: string
      }>
    }>()

    analysisData.forEach(record => {
      const patientId = record.visitorId || record.visitorName || 'unknown'
      const visitDate = new Date(record.recordDate)
      
      if (!patientVisits.has(patientId)) {
        patientVisits.set(patientId, {
          firstVisit: visitDate,
          visits: []
        })
      }

      const patient = patientVisits.get(patientId)!
      patient.visits.push({
        date: visitDate,
        revenue: record.totalWithTax || 0,
        isFirst: record.isFirst || false,
        treatmentName: record.visitorTreatmentName || ''
      })

      // 初回来院日を更新（より早い日付の場合）
      if (visitDate < patient.firstVisit) {
        patient.firstVisit = visitDate
      }
    })

    // リピート患者の分析
    let totalPatients = 0
    let repeatPatients = 0
    let totalDaysToRepeat = 0
    let repeatCount = 0
    let newPatientRepeats = 0
    let existingPatientRepeats = 0
    let totalNewPatients = 0
    let totalExistingPatients = 0
    let revenueFromRepeats = 0

    patientVisits.forEach((patientData, patientId) => {
      const visits = patientData.visits.sort((a, b) => a.date.getTime() - b.date.getTime())
      
      if (visits.length === 0) return

      const firstVisit = visits[0]
      const isNewPatient = firstVisit.isFirst
      
      if (isNewPatient) {
        totalNewPatients++
      } else {
        totalExistingPatients++
      }

      totalPatients++

      // リピート判定（初回来院から6ヶ月または12ヶ月以内に再来院）
      const repeatThreshold = selectedPeriod === '6months' ? 6 : 12
      const thresholdDate = new Date(patientData.firstVisit)
      thresholdDate.setMonth(thresholdDate.getMonth() + repeatThreshold)

      const repeatVisits = visits.filter(visit => 
        visit.date > patientData.firstVisit && 
        visit.date <= thresholdDate &&
        !visit.isFirst
      )

      if (repeatVisits.length > 0) {
        repeatPatients++
        repeatCount += repeatVisits.length

        // 初回リピートまでの日数
        const firstRepeat = repeatVisits[0]
        const daysToFirstRepeat = Math.floor(
          (firstRepeat.date.getTime() - patientData.firstVisit.getTime()) / (1000 * 60 * 60 * 24)
        )
        totalDaysToRepeat += daysToFirstRepeat

        // 新規・既存別のリピート数
        if (isNewPatient) {
          newPatientRepeats++
        } else {
          existingPatientRepeats++
        }

        // リピートからの売上
        repeatVisits.forEach(visit => {
          revenueFromRepeats += visit.revenue
        })
      }
    })

    const repeatRate = totalPatients > 0 ? (repeatPatients / totalPatients) * 100 : 0
    const averageDaysToRepeat = repeatCount > 0 ? totalDaysToRepeat / repeatCount : 0
    const newPatientRetention = totalNewPatients > 0 ? (newPatientRepeats / totalNewPatients) * 100 : 0
    const existingPatientRetention = totalExistingPatients > 0 ? (existingPatientRepeats / totalExistingPatients) * 100 : 0
    const averageRevenuePerRepeat = repeatCount > 0 ? revenueFromRepeats / repeatCount : 0

    return {
      period: selectedPeriod,
      totalPatients,
      repeatPatients,
      repeatRate,
      averageDaysToRepeat,
      newPatientRetention,
      existingPatientRetention,
      revenueFromRepeats,
      averageRevenuePerRepeat
    }
  }, [state.data.dailyAccounts, state.apiConnected, selectedPeriod])

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

  const getRetentionColor = (rate: number) => {
    if (rate >= 70) return 'text-green-600'
    if (rate >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRetentionBgColor = (rate: number) => {
    if (rate >= 70) return 'bg-green-500'
    if (rate >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (!state.apiConnected) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="text-center text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>APIに接続されていません</p>
        </div>
      </div>
    )
  }

  if (!repeatAnalysisData) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="text-center text-gray-500">
          <p>データを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">リピート分析</h2>
          <p className="text-gray-600">顧客の再来院率とリピートパターンを分析します</p>
        </div>
        
        {/* 期間選択 */}
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedPeriod('6months')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === '6months'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            6ヶ月以内
          </button>
          <button
            onClick={() => setSelectedPeriod('12months')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === '12months'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            12ヶ月以内
          </button>
        </div>
      </div>

      {/* メトリクスカード */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* 総リピート率 */}
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">総リピート率</p>
              <p className={`text-3xl font-bold ${getRetentionColor(repeatAnalysisData.repeatRate)}`}>
                {repeatAnalysisData.repeatRate.toFixed(1)}%
              </p>
            </div>
            <RefreshCw className="w-8 h-8 text-blue-600" />
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getRetentionBgColor(repeatAnalysisData.repeatRate)}`}
                style={{ width: `${Math.min(repeatAnalysisData.repeatRate, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>{formatNumber(repeatAnalysisData.repeatPatients)}人</span>
              <span>{formatNumber(repeatAnalysisData.totalPatients)}人中</span>
            </div>
          </div>
        </div>

        {/* 平均再来院日数 */}
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">平均再来院日数</p>
              <p className="text-3xl font-bold text-gray-900">
                {Math.round(repeatAnalysisData.averageDaysToRepeat)}日
              </p>
            </div>
            <Clock className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>初回来院から{selectedPeriod === '6months' ? '6ヶ月' : '12ヶ月'}以内</p>
          </div>
        </div>

        {/* 新規患者リピート率 */}
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">新規患者リピート率</p>
              <p className={`text-3xl font-bold ${getRetentionColor(repeatAnalysisData.newPatientRetention)}`}>
                {repeatAnalysisData.newPatientRetention.toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getRetentionBgColor(repeatAnalysisData.newPatientRetention)}`}
                style={{ width: `${Math.min(repeatAnalysisData.newPatientRetention, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 既存患者リピート率 */}
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">既存患者リピート率</p>
              <p className={`text-3xl font-bold ${getRetentionColor(repeatAnalysisData.existingPatientRetention)}`}>
                {repeatAnalysisData.existingPatientRetention.toFixed(1)}%
              </p>
            </div>
            <Users className="w-8 h-8 text-orange-600" />
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getRetentionBgColor(repeatAnalysisData.existingPatientRetention)}`}
                style={{ width: `${Math.min(repeatAnalysisData.existingPatientRetention, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* 詳細分析 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* リピート売上分析 */}
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">リピート売上分析</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-6 h-6 text-green-600" />
                <div>
                  <div className="font-medium text-green-800">リピート売上総額</div>
                  <div className="text-sm text-green-600">
                    {formatNumber(repeatAnalysisData.repeatPatients)}人から
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-900">
                  {formatCurrency(repeatAnalysisData.revenueFromRepeats)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Target className="w-6 h-6 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-800">平均リピート単価</div>
                  <div className="text-sm text-blue-600">
                    1回あたりの平均売上
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-900">
                  {formatCurrency(repeatAnalysisData.averageRevenuePerRepeat)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 改善提案 */}
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">改善提案</h3>
          <div className="space-y-4">
            {repeatAnalysisData.repeatRate < 50 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-red-800">リピート率が低いです</div>
                    <div className="text-sm text-red-600 mt-1">
                      現在のリピート率は{repeatAnalysisData.repeatRate.toFixed(1)}%です。
                      アフターフォローやリピート促進施策の見直しを検討してください。
                    </div>
                  </div>
                </div>
              </div>
            )}

            {repeatAnalysisData.averageDaysToRepeat > 180 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-yellow-800">再来院間隔が長いです</div>
                    <div className="text-sm text-yellow-600 mt-1">
                      平均再来院日数は{Math.round(repeatAnalysisData.averageDaysToRepeat)}日です。
                      定期的なフォローアップやリマインド施策を検討してください。
                    </div>
                  </div>
                </div>
              </div>
            )}

            {repeatAnalysisData.repeatRate >= 70 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Award className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-green-800">優秀なリピート率です</div>
                    <div className="text-sm text-green-600 mt-1">
                      現在のリピート率は{repeatAnalysisData.repeatRate.toFixed(1)}%です。
                      この調子で顧客満足度の維持に努めてください。
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 期間別比較 */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">期間別比較</h3>
        <div className="text-sm text-gray-600">
          <p>現在の分析期間: {selectedPeriod === '6months' ? '6ヶ月' : '12ヶ月'}</p>
          <p>分析対象患者数: {formatNumber(repeatAnalysisData.totalPatients)}人</p>
          <p>リピート患者数: {formatNumber(repeatAnalysisData.repeatPatients)}人</p>
          <p>リピート率: {repeatAnalysisData.repeatRate.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  )
}