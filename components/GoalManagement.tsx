'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useDashboard } from '@/contexts'
import { 
  Target, 
  Upload, 
  Download, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  Edit3,
  Save,
  X,
  Plus,
  Trash2,
  BarChart3
} from 'lucide-react'
import { saveGoalsToStorage, loadGoalsFromStorage, exportGoalsToCSV } from '@/lib/goalStorage'

interface StaffGoal {
  staffId: string
  staffName: string
  targetAmount: number
  targetNewAverage: number
  targetExistingAverage: number
  targetBeautyRevenue: number
  targetOtherRevenue: number
  currentAmount: number
  currentNewAverage: number
  currentExistingAverage: number
  currentBeautyRevenue: number
  currentOtherRevenue: number
  achievementRate: number
  newAchievementRate: number
  existingAchievementRate: number
  beautyAchievementRate: number
  otherAchievementRate: number
}

export default function GoalManagement() {
  const { state } = useDashboard()
  const [staffGoals, setStaffGoals] = useState<StaffGoal[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingGoal, setEditingGoal] = useState<StaffGoal | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)

  // Load goals from localStorage on component mount
  useEffect(() => {
    const savedGoals = loadGoalsFromStorage()
    if (savedGoals.length === 0) {
      // Add sample goals for demonstration
      const sampleGoals: StaffGoal[] = [
        {
          staffId: 'sample_1',
          staffName: '田中太郎',
          targetAmount: 5000000,
          targetNewAverage: 150000,
          targetExistingAverage: 120000,
          targetBeautyRevenue: 4000000,
          targetOtherRevenue: 1000000,
          currentAmount: 6000000,
          currentNewAverage: 160000,
          currentExistingAverage: 130000,
          currentBeautyRevenue: 4800000,
          currentOtherRevenue: 1200000,
          achievementRate: 120,
          newAchievementRate: 106.7,
          existingAchievementRate: 108.3,
          beautyAchievementRate: 120,
          otherAchievementRate: 120
        },
        {
          staffId: 'sample_2',
          staffName: '佐藤花子',
          targetAmount: 4000000,
          targetNewAverage: 140000,
          targetExistingAverage: 110000,
          targetBeautyRevenue: 3200000,
          targetOtherRevenue: 800000,
          currentAmount: 3400000,
          currentNewAverage: 135000,
          currentExistingAverage: 105000,
          currentBeautyRevenue: 2720000,
          currentOtherRevenue: 680000,
          achievementRate: 85,
          newAchievementRate: 96.4,
          existingAchievementRate: 95.5,
          beautyAchievementRate: 85,
          otherAchievementRate: 85
        }
      ]
      setStaffGoals(sampleGoals)
      saveGoalsToStorage(sampleGoals)
    } else {
      setStaffGoals(savedGoals)
    }
  }, [])

  // Extract unique staff names from data
  const availableStaff = useMemo(() => {
    if (!state.data.dailyAccounts?.length) {
      // Return sample staff for testing if no data
      return ['田中太郎', '佐藤花子', '鈴木一郎', '高橋美咲', '山田健太']
    }
    
    const staffSet = new Set<string>()
    state.data.dailyAccounts.forEach((record: any) => {
      if (record.paymentItems?.length) {
        record.paymentItems.forEach((item: any) => {
          if (item.mainStaffName) {
            staffSet.add(item.mainStaffName)
          }
        })
      }
    })
    
    // If no staff found in data, return sample staff
    if (staffSet.size === 0) {
      return ['田中太郎', '佐藤花子', '鈴木一郎', '高橋美咲', '山田健太']
    }
    
    return Array.from(staffSet).sort()
  }, [state.data.dailyAccounts])

  // Calculate current performance for goals based on actual data
  const calculateCurrentPerformance = (staffName: string) => {
    if (!state.data.dailyAccounts?.length) return {
      currentAmount: 0,
      currentNewAverage: 0,
      currentExistingAverage: 0,
      currentBeautyRevenue: 0,
      currentOtherRevenue: 0
    }

    const staffRecords = state.data.dailyAccounts.filter((record: any) => 
      record.paymentItems?.some((item: any) => item.mainStaffName === staffName)
    )

    const totalAmount = staffRecords.reduce((sum: number, record: any) => sum + (record.totalWithTax || 0), 0)
    const recordCount = staffRecords.length
    const averageAmount = recordCount > 0 ? totalAmount / recordCount : 0

    // Calculate beauty vs other revenue (simplified - you can enhance this based on treatment categories)
    const beautyRevenue = totalAmount * 0.8 // Assuming 80% beauty revenue
    const otherRevenue = totalAmount * 0.2 // Assuming 20% other revenue

    return {
      currentAmount: totalAmount,
      currentNewAverage: averageAmount,
      currentExistingAverage: averageAmount,
      currentBeautyRevenue: beautyRevenue,
      currentOtherRevenue: otherRevenue
    }
  }

  const handleGoalUpdate = (goal: StaffGoal) => {
    // Calculate current performance
    const currentPerformance = calculateCurrentPerformance(goal.staffName)
    
    const updatedGoal = {
      ...goal,
      ...currentPerformance,
      achievementRate: goal.targetAmount > 0 ? (currentPerformance.currentAmount / goal.targetAmount) * 100 : 0,
      newAchievementRate: goal.targetNewAverage > 0 ? (currentPerformance.currentNewAverage / goal.targetNewAverage) * 100 : 0,
      existingAchievementRate: goal.targetExistingAverage > 0 ? (currentPerformance.currentExistingAverage / goal.targetExistingAverage) * 100 : 0,
      beautyAchievementRate: goal.targetBeautyRevenue > 0 ? (currentPerformance.currentBeautyRevenue / goal.targetBeautyRevenue) * 100 : 0,
      otherAchievementRate: goal.targetOtherRevenue > 0 ? (currentPerformance.currentOtherRevenue / goal.targetOtherRevenue) * 100 : 0
    }

    setStaffGoals(prev => {
      const existingIndex = prev.findIndex(g => g.staffId === goal.staffId)
      let updatedGoals
      
      if (existingIndex >= 0) {
        updatedGoals = [...prev]
        updatedGoals[existingIndex] = updatedGoal
      } else {
        updatedGoals = [...prev, updatedGoal]
      }
      
      // Save to localStorage
      saveGoalsToStorage(updatedGoals)
      return updatedGoals
    })
  }

  const handleAddGoal = () => {
    const newGoal: StaffGoal = {
      staffId: `goal_${Date.now()}`,
      staffName: '',
      targetAmount: 0,
      targetNewAverage: 0,
      targetExistingAverage: 0,
      targetBeautyRevenue: 0,
      targetOtherRevenue: 0,
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
    setEditingGoal(newGoal)
    setIsEditing(true)
  }

  const handleEditGoal = (goal: StaffGoal) => {
    setEditingGoal(goal)
    setIsEditing(true)
  }

  const handleSaveGoal = () => {
    if (editingGoal) {
      handleGoalUpdate(editingGoal)
      setIsEditing(false)
      setEditingGoal(null)
    }
  }

  const handleDeleteGoal = (goalId: string) => {
    const updatedGoals = staffGoals.filter(g => g.staffId !== goalId)
    setStaffGoals(updatedGoals)
    saveGoalsToStorage(updatedGoals)
  }

  const handleExportGoals = () => {
    if (staffGoals.length === 0) {
      alert('エクスポートする目標データがありません')
      return
    }
    
    // Create CSV content with proper headers
    const headers = [
      'スタッフ名',
      '目標金額',
      '新規単価目標',
      '既存単価目標', 
      '美容売上目標',
      'その他売上目標',
      '実績金額',
      '新規単価実績',
      '既存単価実績',
      '美容売上実績',
      'その他売上実績',
      '達成率',
      '新規達成率',
      '既存達成率',
      '美容達成率',
      'その他達成率'
    ]
    
    const csvRows = [
      headers.join(','),
      ...staffGoals.map(goal => [
        goal.staffName,
        goal.targetAmount,
        goal.targetNewAverage,
        goal.targetExistingAverage,
        goal.targetBeautyRevenue,
        goal.targetOtherRevenue,
        goal.currentAmount,
        goal.currentNewAverage,
        goal.currentExistingAverage,
        goal.currentBeautyRevenue,
        goal.currentOtherRevenue,
        goal.achievementRate.toFixed(1),
        goal.newAchievementRate.toFixed(1),
        goal.existingAchievementRate.toFixed(1),
        goal.beautyAchievementRate.toFixed(1),
        goal.otherAchievementRate.toFixed(1)
      ].join(','))
    ]
    
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-')
    link.setAttribute('download', `goals_export_${timestamp}.csv`)
    
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
    
    alert(`目標データをエクスポートしました: ${staffGoals.length}件のレコード`)
  }

  const handleImportGoals = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'text/csv') {
      setCsvFile(file)
      setShowImportModal(true)
    } else {
      alert('CSVファイルを選択してください')
    }
  }

  const parseCSVGoals = async (file: File) => {
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        throw new Error('CSVファイルにデータがありません')
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      const importedGoals: StaffGoal[] = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
        
        if (values.length >= 6) { // Minimum required fields
          const goal: StaffGoal = {
            staffId: `imported_${Date.now()}_${i}`,
            staffName: values[0] || '',
            targetAmount: parseFloat(values[1]) || 0,
            targetNewAverage: parseFloat(values[2]) || 0,
            targetExistingAverage: parseFloat(values[3]) || 0,
            targetBeautyRevenue: parseFloat(values[4]) || 0,
            targetOtherRevenue: parseFloat(values[5]) || 0,
            currentAmount: parseFloat(values[6]) || 0,
            currentNewAverage: parseFloat(values[7]) || 0,
            currentExistingAverage: parseFloat(values[8]) || 0,
            currentBeautyRevenue: parseFloat(values[9]) || 0,
            currentOtherRevenue: parseFloat(values[10]) || 0,
            achievementRate: parseFloat(values[11]) || 0,
            newAchievementRate: parseFloat(values[12]) || 0,
            existingAchievementRate: parseFloat(values[13]) || 0,
            beautyAchievementRate: parseFloat(values[14]) || 0,
            otherAchievementRate: parseFloat(values[15]) || 0
          }
          
          // If current performance is not provided in CSV, calculate it
          if (goal.currentAmount === 0) {
            const currentPerformance = calculateCurrentPerformance(goal.staffName)
            Object.assign(goal, currentPerformance)
            
            // Recalculate achievement rates
            goal.achievementRate = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
            goal.newAchievementRate = goal.targetNewAverage > 0 ? (goal.currentNewAverage / goal.targetNewAverage) * 100 : 0
            goal.existingAchievementRate = goal.targetExistingAverage > 0 ? (goal.currentExistingAverage / goal.targetExistingAverage) * 100 : 0
            goal.beautyAchievementRate = goal.targetBeautyRevenue > 0 ? (goal.currentBeautyRevenue / goal.targetBeautyRevenue) * 100 : 0
            goal.otherAchievementRate = goal.targetOtherRevenue > 0 ? (goal.currentOtherRevenue / goal.targetOtherRevenue) * 100 : 0
          }
          
          importedGoals.push(goal)
        }
      }

      setStaffGoals(prev => {
        const updatedGoals = [...prev, ...importedGoals]
        saveGoalsToStorage(updatedGoals)
        return updatedGoals
      })

      alert(`目標データをインポートしました: ${importedGoals.length}件のレコード`)
      setShowImportModal(false)
      setCsvFile(null)
    } catch (error) {
      console.error('CSV parsing error:', error)
      alert('CSVファイルの解析に失敗しました')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">目標達成率管理</h1>
        <p className="text-gray-600">スタッフの目標設定と達成率の管理</p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={handleAddGoal}
          className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          新規目標追加
        </button>
        
        <label className="flex items-center px-4 py-2 text-white bg-green-600 rounded-md cursor-pointer hover:bg-green-700">
          <Upload className="w-4 h-4 mr-2" />
          CSVインポート
          <input
            type="file"
            accept=".csv"
            onChange={handleImportGoals}
            className="hidden"
          />
        </label>
        
        <button
          onClick={handleExportGoals}
          className="flex items-center px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700"
        >
          <Download className="w-4 h-4 mr-2" />
          CSVエクスポート
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-4">
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">目標設定済み</p>
              <p className="text-2xl font-bold text-gray-900">{staffGoals.length}人</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">達成者数</p>
              <p className="text-2xl font-bold text-gray-900">
                {staffGoals.filter(goal => goal.achievementRate >= 100).length}人
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">未達成者数</p>
              <p className="text-2xl font-bold text-gray-900">
                {staffGoals.filter(goal => goal.achievementRate < 100).length}人
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">平均達成率</p>
              <p className="text-2xl font-bold text-gray-900">
                {staffGoals.length > 0 
                  ? (staffGoals.reduce((sum, goal) => sum + goal.achievementRate, 0) / staffGoals.length).toFixed(1)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-2">
        {/* Achievement Rate Chart */}
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">達成率分布</h3>
          <div className="space-y-4">
            {staffGoals.map((goal) => (
              <div key={goal.staffId} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{goal.staffName}</span>
                    <span className={`text-sm font-semibold ${getAchievementColor(goal.achievementRate)}`}>
                      {goal.achievementRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 overflow-hidden bg-gray-200 rounded-full">
                    <div 
                      className={`h-2 rounded-full ${
                        goal.achievementRate >= 100 ? 'bg-green-500' : 
                        goal.achievementRate >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(goal.achievementRate, 150)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Comparison */}
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">売上実績比較</h3>
          <div className="space-y-4">
            {staffGoals.map((goal) => (
              <div key={goal.staffId} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div>
                  <div className="text-sm font-medium text-gray-900">{goal.staffName}</div>
                  <div className="text-xs text-gray-500">
                    目標: {formatCurrency(goal.targetAmount)} | 実績: {formatCurrency(goal.currentAmount)}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold ${getAchievementColor(goal.achievementRate)}`}>
                    {goal.achievementRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {goal.currentAmount >= goal.targetAmount ? '達成' : '未達成'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Goals Table */}
      <div className="overflow-hidden bg-white border rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">目標一覧</h3>
          <p className="text-sm text-gray-500">{staffGoals.length}件の目標が設定されています</p>
        </div>

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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{goal.staffName}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-900 whitespace-nowrap">
                    {formatCurrency(goal.targetAmount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-900 whitespace-nowrap">
                    {formatCurrency(goal.currentAmount)}
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAchievementBgColor(goal.achievementRate)} ${getAchievementColor(goal.achievementRate)}`}>
                      {goal.achievementRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-900 whitespace-nowrap">
                    {formatCurrency(goal.currentNewAverage)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-900 whitespace-nowrap">
                    {formatCurrency(goal.currentExistingAverage)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-900 whitespace-nowrap">
                    {formatCurrency(goal.currentBeautyRevenue)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-900 whitespace-nowrap">
                    {formatCurrency(goal.currentOtherRevenue)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-center whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleEditGoal(goal)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.staffId)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && editingGoal && (
        <div className="fixed inset-0 z-50 w-full h-full overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="relative p-5 mx-auto bg-white border rounded-md shadow-lg top-20 w-96">
            <div className="mt-3">
              <h3 className="mb-4 text-lg font-medium text-gray-900">
                {editingGoal.staffId.startsWith('goal_') ? '新規目標追加' : '目標編集'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">スタッフ名</label>
                  <select
                    value={editingGoal.staffName}
                    onChange={(e) => setEditingGoal({...editingGoal, staffName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">スタッフを選択してください</option>
                    {availableStaff.map(staff => (
                      <option key={staff} value={staff}>{staff}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">目標金額</label>
                  <input
                    type="number"
                    value={editingGoal.targetAmount}
                    onChange={(e) => setEditingGoal({...editingGoal, targetAmount: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">新規単価目標</label>
                  <input
                    type="number"
                    value={editingGoal.targetNewAverage}
                    onChange={(e) => setEditingGoal({...editingGoal, targetNewAverage: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">既存単価目標</label>
                  <input
                    type="number"
                    value={editingGoal.targetExistingAverage}
                    onChange={(e) => setEditingGoal({...editingGoal, targetExistingAverage: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">美容売上目標</label>
                  <input
                    type="number"
                    value={editingGoal.targetBeautyRevenue}
                    onChange={(e) => setEditingGoal({...editingGoal, targetBeautyRevenue: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">その他売上目標</label>
                  <input
                    type="number"
                    value={editingGoal.targetOtherRevenue}
                    onChange={(e) => setEditingGoal({...editingGoal, targetOtherRevenue: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end mt-6 space-x-3">
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditingGoal(null)
                  }}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  <X className="w-4 h-4 mr-1" />
                  キャンセル
                </button>
                <button
                  onClick={handleSaveGoal}
                  className="flex items-center px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  <Save className="w-4 h-4 mr-1" />
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && csvFile && (
        <div className="fixed inset-0 z-50 w-full h-full overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="relative p-5 mx-auto bg-white border rounded-md shadow-lg top-20 w-96">
            <div className="mt-3">
              <h3 className="mb-4 text-lg font-medium text-gray-900">CSVインポート</h3>
              <p className="mb-4 text-sm text-gray-600">
                ファイル: {csvFile.name}
              </p>
              <p className="mb-6 text-sm text-gray-600">
                CSVファイルから目標データをインポートします。既存のデータに追加されます。
              </p>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowImportModal(false)
                    setCsvFile(null)
                  }}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  <X className="w-4 h-4 mr-1" />
                  キャンセル
                </button>
                <button
                  onClick={() => parseCSVGoals(csvFile)}
                  className="flex items-center px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  インポート
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
