'use client'

import React, { useState, useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { CONSULTATION_MAPPINGS, ConsultationMapping } from '@/lib/consultationMapping'
import { detectHolidays, getHolidayStatistics } from '@/lib/holidayDetection'
import PersonalGoalProgress from './PersonalGoalProgress'
import { AlertCircle, Save, Plus, Trash2, Calendar } from 'lucide-react'

interface PersonalGoal {
  staffName: string
  targetAmount: number
  targetUnitPrice: number
}

export default function Settings() {
  const { state } = useDashboard()
  const [consultationMappings, setConsultationMappings] = useState<ConsultationMapping[]>(CONSULTATION_MAPPINGS)
  const [newConsultationName, setNewConsultationName] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState<'surgery' | 'dermatology' | 'hair_removal' | 'other'>('surgery')
  const [selectedSubcategory, setSelectedSubcategory] = useState('')
  const [personalGoals, setPersonalGoals] = useState<PersonalGoal[]>([])
  const [editingGoal, setEditingGoal] = useState<PersonalGoal | null>(null)
  const [newGoal, setNewGoal] = useState<PersonalGoal>({ staffName: '', targetAmount: 0, targetUnitPrice: 0 })

  // Get unique staff names from data
  const availableStaffNames = useMemo(() => {
    const staffSet = new Set<string>()
    if (state.data.dailyAccounts) {
      state.data.dailyAccounts.forEach((record: any) => {
        if (record.reservationStaffName) staffSet.add(record.reservationStaffName)
        if (Array.isArray(record.paymentItems)) {
          record.paymentItems.forEach((item: any) => {
            if (item.mainStaffName) staffSet.add(item.mainStaffName)
          })
        }
      })
    }
    return Array.from(staffSet).sort()
  }, [state.data.dailyAccounts])

  // Subcategories by specialty
  const subcategoriesBySpecialty = {
    surgery: ['二重', 'くま治療', '糸リフト', '小顔（S,BF)', '鼻・人中手術', 'ボディー脂肪吸引', '豊胸', 'その他外科'],
    dermatology: ['注入', 'スキン', 'スキン（インモード/HIFU）'],
    hair_removal: ['脱毛'],
    other: ['ピアス', '物販', '麻酔・針・パック']
  }

  const handleAddConsultationMapping = () => {
    if (!newConsultationName.trim() || !selectedSubcategory) return

    const newMapping: ConsultationMapping = {
      consultationName: newConsultationName.trim(),
      specialty: selectedSpecialty,
      subcategory: selectedSubcategory,
      categoryId: `${selectedSpecialty}_${selectedSubcategory.replace(/[（()]/g, '').replace(/[）)]/g, '').replace(/・/g, '_').replace(/\s/g, '_').toLowerCase()}`,
      requiresManualClassification: false
    }

    setConsultationMappings([...consultationMappings, newMapping])
    setNewConsultationName('')
    setSelectedSubcategory('')
  }

  const handleDeleteConsultationMapping = (index: number) => {
    setConsultationMappings(consultationMappings.filter((_, i) => i !== index))
  }

  const handleSaveSettings = () => {
    // Save to localStorage
    localStorage.setItem('consultationMappings', JSON.stringify(consultationMappings))
    localStorage.setItem('personalGoals', JSON.stringify(personalGoals))
    alert('設定を保存しました')
  }

  const handleAddGoal = () => {
    if (!newGoal.staffName || newGoal.targetAmount <= 0 || newGoal.targetUnitPrice <= 0) {
      alert('スタッフ名、目標金額、目標単価を入力してください')
      return
    }
    setPersonalGoals([...personalGoals, { ...newGoal }])
    setNewGoal({ staffName: '', targetAmount: 0, targetUnitPrice: 0 })
  }

  const handleDeleteGoal = (index: number) => {
    setPersonalGoals(personalGoals.filter((_, i) => i !== index))
  }

  // Load settings from localStorage on mount
  React.useEffect(() => {
    const savedMappings = localStorage.getItem('consultationMappings')
    if (savedMappings) {
      try {
        setConsultationMappings(JSON.parse(savedMappings))
      } catch (e) {
        console.error('Failed to load consultation mappings:', e)
      }
    }

    const savedGoals = localStorage.getItem('personalGoals')
    if (savedGoals) {
      try {
        setPersonalGoals(JSON.parse(savedGoals))
      } catch (e) {
        console.error('Failed to load personal goals:', e)
      }
    }
  }, [])

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">設定</h2>

      {/* Consultation-Category Mapping */}
      <div className="p-6 bg-white border rounded-lg shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">相談メニューとカテゴリの紐づけ</h3>
        
        {/* Add New Mapping */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="mb-3 text-sm font-medium text-gray-700">新しい紐づけを追加</h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700">相談名</label>
              <input
                type="text"
                value={newConsultationName}
                onChange={(e) => setNewConsultationName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 二重のご相談"
              />
            </div>
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700">専門分野</label>
              <select
                value={selectedSpecialty}
                onChange={(e) => {
                  setSelectedSpecialty(e.target.value as any)
                  setSelectedSubcategory('')
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="surgery">外科</option>
                <option value="dermatology">皮膚科</option>
                <option value="hair_removal">脱毛</option>
                <option value="other">その他</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700">サブカテゴリ</label>
              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                {subcategoriesBySpecialty[selectedSpecialty].map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddConsultationMapping}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Plus className="inline w-4 h-4 mr-1" />
                追加
              </button>
            </div>
          </div>
        </div>

        {/* Existing Mappings */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">相談名</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">専門分野</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">サブカテゴリ</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">手動分類</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {consultationMappings.map((mapping, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-900">{mapping.consultationName}</td>
                  <td className="px-4 py-2 text-gray-900">
                    {mapping.specialty === 'surgery' ? '外科' :
                     mapping.specialty === 'dermatology' ? '皮膚科' :
                     mapping.specialty === 'hair_removal' ? '脱毛' : 'その他'}
                  </td>
                  <td className="px-4 py-2 text-gray-900">{mapping.subcategory}</td>
                  <td className="px-4 py-2 text-gray-900">
                    {mapping.requiresManualClassification ? (
                      <span className="px-2 py-1 text-xs font-semibold text-yellow-700 bg-yellow-100 rounded">必要</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded">自動</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleDeleteConsultationMapping(index)}
                      className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="inline w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Holiday Detection */}
      <div className="p-6 bg-white border rounded-lg shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">定休日認識</h3>
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <Calendar className="inline w-4 h-4 mr-2" />
            予約がない日を定休日として自動認識します
          </p>
        </div>
        {(() => {
          const stats = getHolidayStatistics(state.data.dailyAccounts || [])
          return (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-xs font-medium text-gray-600">総日数</div>
                <div className="mt-1 text-2xl font-bold text-gray-900">{stats.totalDays}日</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-xs font-medium text-gray-600">営業日</div>
                <div className="mt-1 text-2xl font-bold text-green-700">{stats.workingDays}日</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-xs font-medium text-gray-600">定休日</div>
                <div className="mt-1 text-2xl font-bold text-red-700">{stats.holidayDays}日</div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="text-xs font-medium text-gray-600">定休日率</div>
                <div className="mt-1 text-2xl font-bold text-yellow-700">{stats.holidayRate.toFixed(1)}%</div>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Personal Goals */}
      <div className="p-6 bg-white border rounded-lg shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">個人目標設定</h3>
        
        {/* Add New Goal */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="mb-3 text-sm font-medium text-gray-700">新しい目標を追加</h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700">スタッフ名</label>
              <select
                value={newGoal.staffName}
                onChange={(e) => setNewGoal({ ...newGoal, staffName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                {availableStaffNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700">目標金額（円）</label>
              <input
                type="number"
                value={newGoal.targetAmount || ''}
                onChange={(e) => setNewGoal({ ...newGoal, targetAmount: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 1000000"
              />
            </div>
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700">目標単価（円）</label>
              <input
                type="number"
                value={newGoal.targetUnitPrice || ''}
                onChange={(e) => setNewGoal({ ...newGoal, targetUnitPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 50000"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddGoal}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Plus className="inline w-4 h-4 mr-1" />
                追加
              </button>
            </div>
          </div>
        </div>

        {/* Existing Goals */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">スタッフ名</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">目標金額</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">目標単価</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {personalGoals.map((goal, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-900">{goal.staffName}</td>
                  <td className="px-4 py-2 text-gray-900">¥{goal.targetAmount.toLocaleString()}</td>
                  <td className="px-4 py-2 text-gray-900">¥{goal.targetUnitPrice.toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleDeleteGoal(index)}
                      className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="inline w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Personal Goal Progress */}
      {personalGoals.length > 0 && (
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <PersonalGoalProgress goals={personalGoals} />
        </div>
      )}

      {/* Personal Goal Progress */}
      {personalGoals.length > 0 && (
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <PersonalGoalProgress goals={personalGoals} />
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Save className="inline w-4 h-4 mr-2" />
          設定を保存
        </button>
      </div>
    </div>
  )
}

