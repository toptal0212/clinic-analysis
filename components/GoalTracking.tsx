'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
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
  const { state } = useDashboard()
  const [goals, setGoals] = useState<StaffGoal[]>([])
  const [editingGoal, setEditingGoal] = useState<StaffGoal | null>(null)
  const [editForm, setEditForm] = useState<Partial<StaffGoal>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newGoal, setNewGoal] = useState<Partial<StaffGoal>>({
    staffName: '',
    targetAmount: 0,
    targetNewAverage: 0,
    targetExistingAverage: 0,
    targetBeautyRevenue: 0,
    targetOtherRevenue: 0
  })

  // スタッフデータを日計表データから取得
  const staffData = useMemo(() => {
    if (!state.apiConnected || !state.data.dailyAccounts.length) return []

    const staffMap = new Map<string, {
      staffName: string
      totalRevenue: number
      totalCount: number
      newCount: number
      existingCount: number
      newRevenue: number
      existingRevenue: number
      beautyRevenue: number
      otherRevenue: number
    }>()

    // 今月のデータをフィルタリング
    const currentMonth = new Date()
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

    state.data.dailyAccounts.forEach(record => {
      const recordDate = new Date(record.recordDate)
      if (recordDate >= startOfMonth && recordDate <= endOfMonth) {
        const staffName = record.visitorStaffName || '未設定'
        
        if (!staffMap.has(staffName)) {
          staffMap.set(staffName, {
            staffName,
            totalRevenue: 0,
            totalCount: 0,
            newCount: 0,
            existingCount: 0,
            newRevenue: 0,
            existingRevenue: 0,
            beautyRevenue: 0,
            otherRevenue: 0
          })
        }

        const staff = staffMap.get(staffName)!
        staff.totalRevenue += record.totalWithTax || 0
        staff.totalCount += 1

        if (record.isFirst) {
          staff.newCount += 1
          staff.newRevenue += record.totalWithTax || 0
        } else {
          staff.existingCount += 1
          staff.existingRevenue += record.totalWithTax || 0
        }

        // 美容・その他の分類（簡易版）
        const treatment = record.visitorTreatmentName || ''
        if (treatment.includes('外科') || treatment.includes('皮膚') || treatment.includes('脱毛')) {
          staff.beautyRevenue += record.totalWithTax || 0
        } else {
          staff.otherRevenue += record.totalWithTax || 0
        }
      }
    })

    return Array.from(staffMap.values())
  }, [state.data.dailyAccounts, state.apiConnected])

  // 目標設定の初期化
  const initializeGoals = () => {
    const defaultGoals: StaffGoal[] = staffData.map((staff, index) => ({
      staffId: `staff-${index + 1}`,
      staffName: staff.staffName,
      targetAmount: 5000000, // デフォルト目標金額
      targetNewAverage: 150000, // デフォルト新規単価目標
      targetExistingAverage: 80000, // デフォルト既存単価目標
      targetBeautyRevenue: 4000000, // 美容売上目標
      targetOtherRevenue: 1000000, // その他売上目標
      currentAmount: staff.totalRevenue,
      currentNewAverage: staff.newCount > 0 ? staff.newRevenue / staff.newCount : 0,
      currentExistingAverage: staff.existingCount > 0 ? staff.existingRevenue / staff.existingCount : 0,
      currentBeautyRevenue: staff.beautyRevenue,
      currentOtherRevenue: staff.otherRevenue,
      achievementRate: staff.totalRevenue / 5000000 * 100,
      newAchievementRate: staff.newCount > 0 ? (staff.newRevenue / staff.newCount) / 150000 * 100 : 0,
      existingAchievementRate: staff.existingCount > 0 ? (staff.existingRevenue / staff.existingCount) / 80000 * 100 : 0,
      beautyAchievementRate: staff.beautyRevenue / 4000000 * 100,
      otherAchievementRate: staff.otherRevenue / 1000000 * 100
    }))
    setGoals(defaultGoals)
  }

  // スタッフデータが変更されたら目標を初期化
  useEffect(() => {
    if (staffData.length > 0 && goals.length === 0) {
      initializeGoals()
    }
  }, [staffData])

  // 現在の実績を更新
  const updatedGoals = useMemo(() => {
    if (staffData.length === 0) return goals

    return goals.map(goal => {
      const staff = staffData.find(s => s.staffName === goal.staffName)
      if (!staff) return goal

      const newAchievementRate = staff.newCount > 0 ? (staff.newRevenue / staff.newCount) / goal.targetNewAverage * 100 : 0
      const existingAchievementRate = staff.existingCount > 0 ? (staff.existingRevenue / staff.existingCount) / goal.targetExistingAverage * 100 : 0
      const beautyAchievementRate = goal.targetBeautyRevenue > 0 ? staff.beautyRevenue / goal.targetBeautyRevenue * 100 : 0
      const otherAchievementRate = goal.targetOtherRevenue > 0 ? staff.otherRevenue / goal.targetOtherRevenue * 100 : 0

      return {
        ...goal,
        currentAmount: staff.totalRevenue,
        currentNewAverage: staff.newCount > 0 ? staff.newRevenue / staff.newCount : 0,
        currentExistingAverage: staff.existingCount > 0 ? staff.existingRevenue / staff.existingCount : 0,
        currentBeautyRevenue: staff.beautyRevenue,
        currentOtherRevenue: staff.otherRevenue,
        achievementRate: goal.targetAmount > 0 ? staff.totalRevenue / goal.targetAmount * 100 : 0,
        newAchievementRate,
        existingAchievementRate,
        beautyAchievementRate,
        otherAchievementRate
      }
    })
  }, [goals, staffData])

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
    if (rate >= 100) return 'bg-green-500'
    if (rate >= 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const handleEdit = (goal: StaffGoal) => {
    setEditingGoal(goal)
    setEditForm({
      targetAmount: goal.targetAmount,
      targetNewAverage: goal.targetNewAverage,
      targetExistingAverage: goal.targetExistingAverage,
      targetBeautyRevenue: goal.targetBeautyRevenue,
      targetOtherRevenue: goal.targetOtherRevenue
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
    if (!newGoal.staffName) return

    const goal: StaffGoal = {
      staffId: `staff-${Date.now()}`,
      staffName: newGoal.staffName,
      targetAmount: newGoal.targetAmount || 0,
      targetNewAverage: newGoal.targetNewAverage || 0,
      targetExistingAverage: newGoal.targetExistingAverage || 0,
      targetBeautyRevenue: newGoal.targetBeautyRevenue || 0,
      targetOtherRevenue: newGoal.targetOtherRevenue || 0,
      currentAmount: 0,
      currentNewAverage: 0,
      currentExistingAverage: 0,
      currentBeautyRevenue: 0,
      currentOtherRevenue: 0,
      achievementRate: 0,
      newAchievementRate: 0,
      existingAchievementRate: 0,
      beautyAchievementRate: 0,
      otherAchievementRate: 0
    }

    setGoals([...goals, goal])
    setNewGoal({
      staffName: '',
      targetAmount: 0,
      targetNewAverage: 0,
      targetExistingAverage: 0,
      targetBeautyRevenue: 0,
      targetOtherRevenue: 0
    })
    setShowAddForm(false)
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

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">目標達成率管理</h2>
          <p className="text-gray-600">スタッフ別の目標設定と達成状況を管理します</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>目標追加</span>
        </button>
      </div>

      {/* 目標一覧 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {updatedGoals.map((goal) => (
          <div key={goal.staffId} className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Users className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">{goal.staffName}</h3>
              </div>
              <button
                onClick={() => handleEdit(goal)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            {/* 総合達成率 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">総合達成率</span>
                <span className={`text-lg font-bold ${getAchievementColor(goal.achievementRate)}`}>
                  {goal.achievementRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${getAchievementBgColor(goal.achievementRate)}`}
                  style={{ width: `${Math.min(goal.achievementRate, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>{formatCurrency(goal.currentAmount)}</span>
                <span>{formatCurrency(goal.targetAmount)}</span>
              </div>
            </div>

            {/* 詳細指標 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">新規単価</div>
                <div className="text-lg font-bold text-gray-900">
                  {formatCurrency(goal.currentNewAverage)}
                </div>
                <div className={`text-xs ${getAchievementColor(goal.newAchievementRate)}`}>
                  目標: {formatCurrency(goal.targetNewAverage)} ({goal.newAchievementRate.toFixed(1)}%)
                </div>
              </div>

              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">既存単価</div>
                <div className="text-lg font-bold text-gray-900">
                  {formatCurrency(goal.currentExistingAverage)}
                </div>
                <div className={`text-xs ${getAchievementColor(goal.existingAchievementRate)}`}>
                  目標: {formatCurrency(goal.targetExistingAverage)} ({goal.existingAchievementRate.toFixed(1)}%)
                </div>
              </div>

              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">美容売上</div>
                <div className="text-lg font-bold text-gray-900">
                  {formatCurrency(goal.currentBeautyRevenue)}
                </div>
                <div className={`text-xs ${getAchievementColor(goal.beautyAchievementRate)}`}>
                  目標: {formatCurrency(goal.targetBeautyRevenue)} ({goal.beautyAchievementRate.toFixed(1)}%)
                </div>
              </div>

              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">その他売上</div>
                <div className="text-lg font-bold text-gray-900">
                  {formatCurrency(goal.currentOtherRevenue)}
                </div>
                <div className={`text-xs ${getAchievementColor(goal.otherAchievementRate)}`}>
                  目標: {formatCurrency(goal.targetOtherRevenue)} ({goal.otherAchievementRate.toFixed(1)}%)
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 目標編集モーダル */}
      {editingGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingGoal.staffName} の目標編集
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  目標金額
                </label>
                <input
                  type="number"
                  value={editForm.targetAmount || 0}
                  onChange={(e) => setEditForm({ ...editForm, targetAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  新規単価目標
                </label>
                <input
                  type="number"
                  value={editForm.targetNewAverage || 0}
                  onChange={(e) => setEditForm({ ...editForm, targetNewAverage: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  既存単価目標
                </label>
                <input
                  type="number"
                  value={editForm.targetExistingAverage || 0}
                  onChange={(e) => setEditForm({ ...editForm, targetExistingAverage: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  美容売上目標
                </label>
                <input
                  type="number"
                  value={editForm.targetBeautyRevenue || 0}
                  onChange={(e) => setEditForm({ ...editForm, targetBeautyRevenue: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  その他売上目標
                </label>
                <input
                  type="number"
                  value={editForm.targetOtherRevenue || 0}
                  onChange={(e) => setEditForm({ ...editForm, targetOtherRevenue: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 目標追加モーダル */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">新しい目標を追加</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  スタッフ名
                </label>
                <input
                  type="text"
                  value={newGoal.staffName || ''}
                  onChange={(e) => setNewGoal({ ...newGoal, staffName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  目標金額
                </label>
                <input
                  type="number"
                  value={newGoal.targetAmount || 0}
                  onChange={(e) => setNewGoal({ ...newGoal, targetAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  新規単価目標
                </label>
                <input
                  type="number"
                  value={newGoal.targetNewAverage || 0}
                  onChange={(e) => setNewGoal({ ...newGoal, targetNewAverage: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  既存単価目標
                </label>
                <input
                  type="number"
                  value={newGoal.targetExistingAverage || 0}
                  onChange={(e) => setNewGoal({ ...newGoal, targetExistingAverage: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
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
        </div>
      )}
    </div>
  )
}