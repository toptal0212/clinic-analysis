'use client'

import React, { useState, useMemo } from 'react'
import { Target, TrendingUp, Users, DollarSign, BarChart3, PieChart } from 'lucide-react'
import { StaffGoal } from '@/lib/dataTypes'

interface GoalTrackingProps {
  dateRange: { start: Date, end: Date }
  staffGoals: StaffGoal[]
  onGoalUpdate: (goal: StaffGoal) => void
  availableStaff: string[]
  onRefreshGoals?: () => void
}

interface GoalFormData {
  staffName: string
  targetAmount: number
  targetNewAverage: number
  targetExistingAverage: number
  targetBeautyRevenue: number
  targetOtherRevenue: number
}

export default function GoalTracking({ dateRange, staffGoals, onGoalUpdate, availableStaff, onRefreshGoals }: GoalTrackingProps) {
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<StaffGoal | null>(null)
  const [formData, setFormData] = useState<GoalFormData>({
    staffName: '',
    targetAmount: 0,
    targetNewAverage: 0,
    targetExistingAverage: 0,
    targetBeautyRevenue: 0,
    targetOtherRevenue: 0
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  // Calculate overall achievement metrics
  const overallMetrics = useMemo(() => {
    if (staffGoals.length === 0) return null

    const totalTarget = staffGoals.reduce((sum, goal) => sum + goal.targetAmount, 0)
    const totalCurrent = staffGoals.reduce((sum, goal) => sum + goal.currentAmount, 0)
    const overallAchievement = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0

    const achievedGoals = staffGoals.filter(goal => goal.achievementRate >= 100).length
    const achievementRate = staffGoals.length > 0 ? (achievedGoals / staffGoals.length) * 100 : 0

    return {
      totalTarget,
      totalCurrent,
      overallAchievement,
      achievedGoals,
      totalGoals: staffGoals.length,
      achievementRate
    }
  }, [staffGoals])

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const goal: StaffGoal = {
      staffId: editingGoal?.staffId || `staff_${Date.now()}`,
      staffName: formData.staffName,
      targetAmount: formData.targetAmount,
      targetNewAverage: formData.targetNewAverage,
      targetExistingAverage: formData.targetExistingAverage,
      targetBeautyRevenue: formData.targetBeautyRevenue,
      targetOtherRevenue: formData.targetOtherRevenue,
      currentAmount: editingGoal?.currentAmount || 0,
      currentNewAverage: editingGoal?.currentNewAverage || 0,
      currentExistingAverage: editingGoal?.currentExistingAverage || 0,
      currentBeautyRevenue: editingGoal?.currentBeautyRevenue || 0,
      currentOtherRevenue: editingGoal?.currentOtherRevenue || 0,
      achievementRate: editingGoal?.achievementRate || 0,
      newAchievementRate: editingGoal?.newAchievementRate || 0,
      existingAchievementRate: editingGoal?.existingAchievementRate || 0,
      beautyAchievementRate: editingGoal?.beautyAchievementRate || 0,
      otherAchievementRate: editingGoal?.otherAchievementRate || 0
    }

    onGoalUpdate(goal)
    setShowGoalForm(false)
    setEditingGoal(null)
    setFormData({
      staffName: '',
      targetAmount: 0,
      targetNewAverage: 0,
      targetExistingAverage: 0,
      targetBeautyRevenue: 0,
      targetOtherRevenue: 0
    })
  }

  const handleEditGoal = (goal: StaffGoal) => {
    setEditingGoal(goal)
    setFormData({
      staffName: goal.staffName,
      targetAmount: goal.targetAmount,
      targetNewAverage: goal.targetNewAverage,
      targetExistingAverage: goal.targetExistingAverage,
      targetBeautyRevenue: goal.targetBeautyRevenue,
      targetOtherRevenue: goal.targetOtherRevenue
    })
    setShowGoalForm(true)
  }

  const getAchievementColor = (rate: number) => {
    if (rate >= 100) return 'text-green-600 bg-green-100'
    if (rate >= 80) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getAchievementIcon = (rate: number) => {
    if (rate >= 100) return '🎯'
    if (rate >= 80) return '📈'
    return '📉'
  }

  return (
    <div className="p-6 bg-white border rounded-lg shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">目標達成率管理</h3>
            <p className="text-sm text-gray-600">
              各スタッフの目標設定と達成状況を管理します
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowGoalForm(true)}
              className="flex items-center px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              <Target className="w-4 h-4 mr-1" />
              目標設定
            </button>
            {onRefreshGoals && (
              <button
                onClick={onRefreshGoals}
                className="flex items-center px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                <TrendingUp className="w-4 h-4 mr-1" />
                実績更新
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Overall Metrics */}
      {overallMetrics && (
        <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-4">
          <div className="p-4 rounded-lg bg-blue-50">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 mr-3 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600">総目標金額</p>
                <p className="text-xl font-semibold text-blue-900">
                  {formatCurrency(overallMetrics.totalTarget)}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-green-50">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 mr-3 text-green-600" />
              <div>
                <p className="text-sm text-green-600">総実績金額</p>
                <p className="text-xl font-semibold text-green-900">
                  {formatCurrency(overallMetrics.totalCurrent)}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-purple-50">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 mr-3 text-purple-600" />
              <div>
                <p className="text-sm text-purple-600">全体達成率</p>
                <p className="text-xl font-semibold text-purple-900">
                  {formatPercentage(overallMetrics.overallAchievement)}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-orange-50">
            <div className="flex items-center">
              <Users className="w-8 h-8 mr-3 text-orange-600" />
              <div>
                <p className="text-sm text-orange-600">達成者数</p>
                <p className="text-xl font-semibold text-orange-900">
                  {overallMetrics.achievedGoals}/{overallMetrics.totalGoals}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goal Form Modal */}
      {showGoalForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 mx-4 bg-white rounded-lg">
            <h4 className="mb-4 text-lg font-semibold text-gray-900">
              {editingGoal ? '目標編集' : '新規目標設定'}
            </h4>
            
            <form onSubmit={handleGoalSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  スタッフ選択
                </label>
                <select
                  value={formData.staffName}
                  onChange={(e) => setFormData({...formData, staffName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">スタッフを選択してください</option>
                  {availableStaff.map(staff => (
                    <option key={staff} value={staff}>{staff}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  目標金額
                </label>
                <input
                  type="number"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({...formData, targetAmount: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    新規単価目標
                  </label>
                  <input
                    type="number"
                    value={formData.targetNewAverage}
                    onChange={(e) => setFormData({...formData, targetNewAverage: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    既存単価目標
                  </label>
                  <input
                    type="number"
                    value={formData.targetExistingAverage}
                    onChange={(e) => setFormData({...formData, targetExistingAverage: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    美容売上目標
                  </label>
                  <input
                    type="number"
                    value={formData.targetBeautyRevenue}
                    onChange={(e) => setFormData({...formData, targetBeautyRevenue: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    その他売上目標
                  </label>
                  <input
                    type="number"
                    value={formData.targetOtherRevenue}
                    onChange={(e) => setFormData({...formData, targetOtherRevenue: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end pt-4 space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowGoalForm(false)
                    setEditingGoal(null)
                  }}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  {editingGoal ? '更新' : '設定'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Goals Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                スタッフ名
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                目標金額
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                実績金額
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                達成率
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                新規単価
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                既存単価
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                美容売上
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                その他売上
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {staffGoals.map((goal) => (
              <tr key={goal.staffId} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {goal.staffName}
                </td>
                <td className="px-6 py-4 text-sm text-center text-gray-900">
                  {formatCurrency(goal.targetAmount)}
                </td>
                <td className="px-6 py-4 text-sm text-center text-gray-900">
                  {formatCurrency(goal.currentAmount)}
                </td>
                <td className="px-6 py-4 text-sm text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAchievementColor(goal.achievementRate)}`}>
                    <span className="mr-1">{getAchievementIcon(goal.achievementRate)}</span>
                    {formatPercentage(goal.achievementRate)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-center text-gray-900">
                  <div className="flex flex-col">
                    <span className="font-medium">{formatCurrency(goal.currentNewAverage)}</span>
                    <span className="text-xs text-gray-500">目標: {formatCurrency(goal.targetNewAverage)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-center text-gray-900">
                  <div className="flex flex-col">
                    <span className="font-medium">{formatCurrency(goal.currentExistingAverage)}</span>
                    <span className="text-xs text-gray-500">目標: {formatCurrency(goal.targetExistingAverage)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-center text-gray-900">
                  <div className="flex flex-col">
                    <span className="font-medium">{formatCurrency(goal.currentBeautyRevenue)}</span>
                    <span className="text-xs text-gray-500">目標: {formatCurrency(goal.targetBeautyRevenue)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-center text-gray-900">
                  <div className="flex flex-col">
                    <span className="font-medium">{formatCurrency(goal.currentOtherRevenue)}</span>
                    <span className="text-xs text-gray-500">目標: {formatCurrency(goal.targetOtherRevenue)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-center">
                  <button
                    onClick={() => handleEditGoal(goal)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    編集
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {staffGoals.length === 0 && (
        <div className="py-8 text-center">
          <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">まだ目標が設定されていません</p>
          <p className="text-sm text-gray-400">「目標設定」ボタンから目標を設定してください</p>
        </div>
      )}
    </div>
  )
}