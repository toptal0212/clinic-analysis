'use client'

import React from 'react'
import { BarChart3, TrendingUp, Target, Users } from 'lucide-react'
import { StaffGoal } from '@/lib/dataTypes'

interface GoalProgressChartProps {
  staffGoals: StaffGoal[]
  selectedStaff?: string
}

export default function GoalProgressChart({ staffGoals, selectedStaff }: GoalProgressChartProps) {
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

  // Filter data based on selected staff
  const filteredGoals = selectedStaff 
    ? staffGoals.filter(goal => goal.staffName === selectedStaff)
    : staffGoals

  // Calculate progress data for charts
  const progressData = filteredGoals.map(goal => ({
    staffName: goal.staffName,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    achievementRate: goal.achievementRate,
    newAchievementRate: goal.newAchievementRate,
    existingAchievementRate: goal.existingAchievementRate,
    beautyAchievementRate: goal.beautyAchievementRate,
    otherAchievementRate: goal.otherAchievementRate
  }))

  const getAchievementColor = (rate: number) => {
    if (rate >= 100) return 'bg-green-500'
    if (rate >= 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getAchievementTextColor = (rate: number) => {
    if (rate >= 100) return 'text-green-700'
    if (rate >= 80) return 'text-yellow-700'
    return 'text-red-700'
  }

  return (
    <div className="space-y-6">
      {/* Overall Achievement Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-blue-600">総目標金額</p>
              <p className="text-xl font-semibold text-blue-900">
                {formatCurrency(progressData.reduce((sum, goal) => sum + goal.targetAmount, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-green-600">総実績金額</p>
              <p className="text-xl font-semibold text-green-900">
                {formatCurrency(progressData.reduce((sum, goal) => sum + goal.currentAmount, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="flex items-center">
            <Target className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-purple-600">平均達成率</p>
              <p className="text-xl font-semibold text-purple-900">
                {formatPercentage(
                  progressData.length > 0 
                    ? progressData.reduce((sum, goal) => sum + goal.achievementRate, 0) / progressData.length
                    : 0
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-orange-50 rounded-lg">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-orange-600">達成者数</p>
              <p className="text-xl font-semibold text-orange-900">
                {progressData.filter(goal => goal.achievementRate >= 100).length}/{progressData.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Staff Progress Bars */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">スタッフ別達成状況</h3>
        
        <div className="space-y-4">
          {progressData.map((goal, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{goal.staffName}</h4>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-gray-600">
                    目標: {formatCurrency(goal.targetAmount)}
                  </span>
                  <span className="text-gray-600">
                    実績: {formatCurrency(goal.currentAmount)}
                  </span>
                  <span className={`font-semibold ${getAchievementTextColor(goal.achievementRate)}`}>
                    {formatPercentage(goal.achievementRate)}
                  </span>
                </div>
              </div>

              {/* Main Achievement Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>総合達成率</span>
                  <span>{formatPercentage(goal.achievementRate)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${getAchievementColor(goal.achievementRate)}`}
                    style={{ width: `${Math.min(goal.achievementRate, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-gray-600">新規単価</p>
                  <p className={`font-semibold ${getAchievementTextColor(goal.newAchievementRate)}`}>
                    {formatPercentage(goal.newAchievementRate)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600">既存単価</p>
                  <p className={`font-semibold ${getAchievementTextColor(goal.existingAchievementRate)}`}>
                    {formatPercentage(goal.existingAchievementRate)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600">美容売上</p>
                  <p className={`font-semibold ${getAchievementTextColor(goal.beautyAchievementRate)}`}>
                    {formatPercentage(goal.beautyAchievementRate)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600">その他売上</p>
                  <p className={`font-semibold ${getAchievementTextColor(goal.otherAchievementRate)}`}>
                    {formatPercentage(goal.otherAchievementRate)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievement Distribution Chart */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">達成率分布</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {progressData.filter(goal => goal.achievementRate < 80).length}
            </div>
            <div className="text-sm text-red-600">未達成 (80%未満)</div>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {progressData.filter(goal => goal.achievementRate >= 80 && goal.achievementRate < 100).length}
            </div>
            <div className="text-sm text-yellow-600">要注意 (80-99%)</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {progressData.filter(goal => goal.achievementRate >= 100).length}
            </div>
            <div className="text-sm text-green-600">達成 (100%以上)</div>
          </div>
        </div>
      </div>

      {/* Monthly Progress Trend (Placeholder for future implementation) */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">月次進捗トレンド</h3>
        <div className="text-center py-8 text-gray-500">
          <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>月次進捗データの表示機能は今後実装予定です</p>
        </div>
      </div>
    </div>
  )
}
