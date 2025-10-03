'use client'

import React, { useState, useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { CalculationEngine } from '@/lib/calculationEngine'
import { StaffGoal } from '@/lib/dataTypes'
import { 
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Plus,
  Edit3,
  Save,
  X,
  Calendar,
  Award,
  AlertCircle
} from 'lucide-react'

export default function GoalTracking() {
  const { state, dispatch } = useDashboard()
  const [goals, setGoals] = useState<StaffGoal[]>([
    {
      staffId: 'staff-1',
      staffName: '田中 太郎',
      targetAmount: 5000000,
      targetNewAverage: 150000,
      targetExistingAverage: 80000,
      currentAmount: 0,
      currentNewAverage: 0,
      currentExistingAverage: 0,
      achievementRate: 0,
      newAchievementRate: 0,
      existingAchievementRate: 0
    },
    {
      staffId: 'staff-2',
      staffName: '佐藤 花子',
      targetAmount: 4500000,
      targetNewAverage: 140000,
      targetExistingAverage: 75000,
      currentAmount: 0,
      currentNewAverage: 0,
      currentExistingAverage: 0,
      achievementRate: 0,
      newAchievementRate: 0,
      existingAchievementRate: 0
    },
    {
      staffId: 'staff-3',
      staffName: '鈴木 一郎',
      targetAmount: 4000000,
      targetNewAverage: 130000,
      targetExistingAverage: 70000,
      currentAmount: 0,
      currentNewAverage: 0,
      currentExistingAverage: 0,
      achievementRate: 0,
      newAchievementRate: 0,
      existingAchievementRate: 0
    }
  ])
  const [editingGoal, setEditingGoal] = useState<StaffGoal | null>(null)
  const [editForm, setEditForm] = useState<Partial<StaffGoal>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newGoal, setNewGoal] = useState<Partial<StaffGoal>>({
    staffName: '',
    targetAmount: 0,
    targetNewAverage: 0,
    targetExistingAverage: 0
  })
  const calculationEngine = new CalculationEngine()

  // 現在の実績を計算
  const updatedGoals = useMemo(() => {
    if (state.data.patients.length === 0) return goals

    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    return calculationEngine.calculateStaffGoals(
      state.data.patients,
      state.data.accounting,
      goals,
      {
        start: new Date(currentYear, currentMonth - 1, 1),
        end: new Date(currentYear, currentMonth, 0)
      }
    )
  }, [state.data.patients, state.data.accounting, goals])

  const handleEdit = (goal: StaffGoal) => {
    setEditingGoal(goal)
    setEditForm({
      targetAmount: goal.targetAmount,
      targetNewAverage: goal.targetNewAverage,
      targetExistingAverage: goal.targetExistingAverage
    })
  }

  const handleSave = () => {
    if (!editingGoal) return

    const updatedGoals = goals.map(goal => 
      goal.staffId === editingGoal.staffId 
        ? { ...goal, ...editForm }
        : goal
    )

    setGoals(updatedGoals)
    setEditingGoal(null)
    setEditForm({})
  }

  const handleCancel = () => {
    setEditingGoal(null)
    setEditForm({})
  }

  const handleAddGoal = () => {
    if (!newGoal.staffName || !newGoal.targetAmount) return

    const goal: StaffGoal = {
      staffId: `staff-${Date.now()}`,
      staffName: newGoal.staffName,
      targetAmount: newGoal.targetAmount || 0,
      targetNewAverage: newGoal.targetNewAverage || 0,
      targetExistingAverage: newGoal.targetExistingAverage || 0,
      currentAmount: 0,
      currentNewAverage: 0,
      currentExistingAverage: 0,
      achievementRate: 0,
      newAchievementRate: 0,
      existingAchievementRate: 0
    }

    setGoals([...goals, goal])
    setNewGoal({
      staffName: '',
      targetAmount: 0,
      targetNewAverage: 0,
      targetExistingAverage: 0
    })
    setShowAddForm(false)
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

  const getAchievementColor = (rate: number) => {
    if (rate >= 100) return 'text-green-600'
    if (rate >= 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getAchievementBgColor = (rate: number) => {
    if (rate >= 100) return 'bg-green-100'
    if (rate >= 80) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  const getProgressBarColor = (rate: number) => {
    if (rate >= 100) return 'bg-green-500'
    if (rate >= 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Target className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">目標達成率管理</h2>
              <p className="text-sm text-gray-600">スタッフ個人の目標達成度を管理・可視化</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>目標追加</span>
          </button>
        </div>
      </div>

      {/* 目標追加フォーム */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">新しい目標を追加</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                スタッフ名
              </label>
              <input
                type="text"
                value={newGoal.staffName || ''}
                onChange={(e) => setNewGoal(prev => ({ ...prev, staffName: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="スタッフ名を入力"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                目標金額
              </label>
              <input
                type="number"
                value={newGoal.targetAmount || ''}
                onChange={(e) => setNewGoal(prev => ({ ...prev, targetAmount: parseInt(e.target.value) || 0 }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="目標金額"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                新規目標単価
              </label>
              <input
                type="number"
                value={newGoal.targetNewAverage || ''}
                onChange={(e) => setNewGoal(prev => ({ ...prev, targetNewAverage: parseInt(e.target.value) || 0 }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="新規目標単価"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                既存目標単価
              </label>
              <input
                type="number"
                value={newGoal.targetExistingAverage || ''}
                onChange={(e) => setNewGoal(prev => ({ ...prev, targetExistingAverage: parseInt(e.target.value) || 0 }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="既存目標単価"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleAddGoal}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              追加
            </button>
          </div>
        </div>
      )}

      {/* 目標達成率一覧 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {updatedGoals.map((goal) => {
          const isEditing = editingGoal?.staffId === goal.staffId

          return (
            <div key={goal.staffId} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Users className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {goal.staffName}
                  </h3>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => handleEdit(goal)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* 目標金額達成率 */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">目標金額達成率</span>
                  <span className={`text-sm font-bold ${getAchievementColor(goal.achievementRate)}`}>
                    {goal.achievementRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor(goal.achievementRate)}`}
                    style={{ width: `${Math.min(goal.achievementRate, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{formatCurrency(goal.currentAmount)}</span>
                  <span>{formatCurrency(goal.targetAmount)}</span>
                </div>
              </div>

              {/* 編集フォーム */}
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      目標金額
                    </label>
                    <input
                      type="number"
                      value={editForm.targetAmount || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, targetAmount: parseInt(e.target.value) || 0 }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      新規目標単価
                    </label>
                    <input
                      type="number"
                      value={editForm.targetNewAverage || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, targetNewAverage: parseInt(e.target.value) || 0 }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      既存目標単価
                    </label>
                    <input
                      type="number"
                      value={editForm.targetExistingAverage || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, targetExistingAverage: parseInt(e.target.value) || 0 }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={handleCancel}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleSave}
                      className="text-green-600 hover:text-green-800"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* 単価達成率 */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">新規単価達成率</span>
                        <span className={`text-sm font-bold ${getAchievementColor(goal.newAchievementRate)}`}>
                          {goal.newAchievementRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(goal.newAchievementRate)}`}
                          style={{ width: `${Math.min(goal.newAchievementRate, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{formatCurrency(goal.currentNewAverage)}</span>
                        <span>{formatCurrency(goal.targetNewAverage)}</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">既存単価達成率</span>
                        <span className={`text-sm font-bold ${getAchievementColor(goal.existingAchievementRate)}`}>
                          {goal.existingAchievementRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(goal.existingAchievementRate)}`}
                          style={{ width: `${Math.min(goal.existingAchievementRate, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{formatCurrency(goal.currentExistingAverage)}</span>
                        <span>{formatCurrency(goal.targetExistingAverage)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 達成状況インジケーター */}
                  <div className="mt-4 p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">総合評価</span>
                      <div className="flex items-center space-x-2">
                        {goal.achievementRate >= 100 ? (
                          <Award className="h-5 w-5 text-yellow-500" />
                        ) : goal.achievementRate >= 80 ? (
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className={`text-sm font-bold ${getAchievementColor(goal.achievementRate)}`}>
                          {goal.achievementRate >= 100 ? '目標達成' : 
                           goal.achievementRate >= 80 ? '順調' : '要改善'}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* 全体サマリー */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">全体サマリー</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-900">
              {updatedGoals.length}
            </div>
            <div className="text-sm text-blue-700">目標設定者数</div>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Award className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-900">
              {updatedGoals.filter(g => g.achievementRate >= 100).length}
            </div>
            <div className="text-sm text-green-700">目標達成者数</div>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-900">
              {updatedGoals.length > 0 
                ? (updatedGoals.reduce((sum, g) => sum + g.achievementRate, 0) / updatedGoals.length).toFixed(1)
                : 0}%
            </div>
            <div className="text-sm text-purple-700">平均達成率</div>
          </div>
        </div>
      </div>
    </div>
  )
}
