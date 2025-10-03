'use client'

import React, { useState, useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { CalculationEngine } from '@/lib/calculationEngine'
import { RepeatAnalysis } from '@/lib/dataTypes'
import { 
  RefreshCw,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  Target,
  BarChart3
} from 'lucide-react'

export default function RepeatAnalysisComponent() {
  const { state } = useDashboard()
  const [selectedPeriod, setSelectedPeriod] = useState<'6months' | '12months'>('6months')
  const [selectedClinic, setSelectedClinic] = useState('all')
  const calculationEngine = new CalculationEngine()

  const repeatAnalysis = useMemo(() => {
    if (state.data.patients.length === 0) return null

    return calculationEngine.calculateRepeatAnalysis(
      state.data.patients,
      state.data.accounting,
      selectedPeriod
    )
  }, [state.data.patients, state.data.accounting, selectedPeriod])

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

  const formatDays = (days: number) => {
    if (days < 30) {
      return `${days}日`
    } else if (days < 365) {
      const months = Math.floor(days / 30)
      const remainingDays = days % 30
      return remainingDays > 0 ? `${months}ヶ月${remainingDays}日` : `${months}ヶ月`
    } else {
      const years = Math.floor(days / 365)
      const remainingDays = days % 365
      const months = Math.floor(remainingDays / 30)
      return months > 0 ? `${years}年${months}ヶ月` : `${years}年`
    }
  }

  const getRepeatRateColor = (rate: number) => {
    if (rate >= 70) return 'text-green-600'
    if (rate >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRepeatRateBgColor = (rate: number) => {
    if (rate >= 70) return 'bg-green-100'
    if (rate >= 50) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  const getRepeatRateBarColor = (rate: number) => {
    if (rate >= 70) return 'bg-green-500'
    if (rate >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (!repeatAnalysis) {
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
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <RefreshCw className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">リピート率分析</h2>
              <p className="text-sm text-gray-600">顧客満足度を測り、長期的な関係構築に繋げる</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as '6months' | '12months')}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="6months">6ヶ月以内</option>
              <option value="12months">12ヶ月以内</option>
            </select>
          </div>
        </div>
      </div>

      {/* リピート率サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">総患者数</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(repeatAnalysis.totalPatients)}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">リピート患者数</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(repeatAnalysis.repeatPatients)}
              </p>
            </div>
            <RefreshCw className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">リピート率</p>
              <p className={`text-2xl font-bold ${getRepeatRateColor(repeatAnalysis.repeatRate)}`}>
                {repeatAnalysis.repeatRate.toFixed(1)}%
              </p>
            </div>
            <Target className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">平均再来院期間</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatDays(repeatAnalysis.averageDaysToRepeat)}
              </p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* リピート率詳細 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">リピート率詳細</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* リピート率プログレスバー */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700">
                {selectedPeriod === '6months' ? '6ヶ月以内' : '12ヶ月以内'}リピート率
              </span>
              <span className={`text-lg font-bold ${getRepeatRateColor(repeatAnalysis.repeatRate)}`}>
                {repeatAnalysis.repeatRate.toFixed(1)}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div
                className={`h-4 rounded-full transition-all duration-500 ${getRepeatRateBarColor(repeatAnalysis.repeatRate)}`}
                style={{ width: `${Math.min(repeatAnalysis.repeatRate, 100)}%` }}
              ></div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">リピート患者:</span>
                <span className="font-medium">{formatNumber(repeatAnalysis.repeatPatients)}人</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">総患者数:</span>
                <span className="font-medium">{formatNumber(repeatAnalysis.totalPatients)}人</span>
              </div>
            </div>

            {/* 評価 */}
            <div className={`mt-4 p-3 rounded-lg ${getRepeatRateBgColor(repeatAnalysis.repeatRate)}`}>
              <div className="flex items-center space-x-2">
                {repeatAnalysis.repeatRate >= 70 ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : repeatAnalysis.repeatRate >= 50 ? (
                  <BarChart3 className="h-5 w-5 text-yellow-600" />
                ) : (
                  <Target className="h-5 w-5 text-red-600" />
                )}
                <span className={`font-medium ${getRepeatRateColor(repeatAnalysis.repeatRate)}`}>
                  {repeatAnalysis.repeatRate >= 70 ? '優秀' : 
                   repeatAnalysis.repeatRate >= 50 ? '良好' : '要改善'}
                </span>
              </div>
            </div>
          </div>

          {/* 再来院期間分析 */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4">再来院期間分析</h4>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">平均再来院期間</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatDays(repeatAnalysis.averageDaysToRepeat)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  初回来院から再来院までの平均期間
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700">リピート売上</span>
                  <span className="text-lg font-bold text-blue-900">
                    {formatCurrency(repeatAnalysis.repeatRevenue)}
                  </span>
                </div>
                <div className="text-xs text-blue-600">
                  リピート患者からの総売上
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-700">平均リピート売上</span>
                  <span className="text-lg font-bold text-green-900">
                    {formatCurrency(repeatAnalysis.averageRepeatRevenue)}
                  </span>
                </div>
                <div className="text-xs text-green-600">
                  リピート患者1人あたりの平均売上
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 改善提案 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">改善提案</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {repeatAnalysis.repeatRate < 50 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-900 mb-2">緊急改善が必要</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• 顧客満足度調査の実施</li>
                <li>• フォローアップ体制の強化</li>
                <li>• 施術品質の見直し</li>
                <li>• スタッフ教育の充実</li>
              </ul>
            </div>
          )}

          {repeatAnalysis.repeatRate >= 50 && repeatAnalysis.repeatRate < 70 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2">改善の余地あり</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• リピート率向上施策の検討</li>
                <li>• 顧客コミュニケーションの強化</li>
                <li>• メンテナンスプランの提案</li>
                <li>• アフターケアの充実</li>
              </ul>
            </div>
          )}

          {repeatAnalysis.repeatRate >= 70 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">優秀な成果</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• 現在の取り組みを継続</li>
                <li>• さらなる向上のための新施策</li>
                <li>• 成功事例の他スタッフへの展開</li>
                <li>• 顧客満足度の維持・向上</li>
              </ul>
            </div>
          )}

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">推奨アクション</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 定期的なリピート率モニタリング</li>
              <li>• 顧客フィードバックの収集・分析</li>
              <li>• スタッフ間での情報共有</li>
              <li>• 改善施策の効果測定</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 期間別比較 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">期間別比較</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">6ヶ月以内リピート率</h4>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {selectedPeriod === '6months' 
                ? repeatAnalysis.repeatRate.toFixed(1)
                : '計算中...'
              }%
            </div>
            <div className="text-sm text-gray-600">
              短期間でのリピート率（即効性の指標）
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">12ヶ月以内リピート率</h4>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {selectedPeriod === '12months' 
                ? repeatAnalysis.repeatRate.toFixed(1)
                : '計算中...'
              }%
            </div>
            <div className="text-sm text-gray-600">
              長期間でのリピート率（継続性の指標）
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
