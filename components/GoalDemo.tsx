'use client'

import React from 'react'
import { Download, Upload, Trash2 } from 'lucide-react'
import { exportGoalsToCSV, importGoalsFromCSV, clearGoalsFromStorage } from '@/lib/goalStorage'

interface GoalDemoProps {
  staffGoals: any[]
  onImportGoals: (goals: any[]) => void
  onClearGoals: () => void
}

export default function GoalDemo({ staffGoals, onImportGoals, onClearGoals }: GoalDemoProps) {
  const handleExportGoals = () => {
    if (staffGoals.length === 0) {
      alert('エクスポートする目標データがありません')
      return
    }
    
    const csvContent = exportGoalsToCSV(staffGoals)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    
    // Create filename with timestamp
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-')
    link.setAttribute('download', `goals_export_${timestamp}.csv`)
    
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up the URL object
    URL.revokeObjectURL(url)
    
    alert(`目標データをエクスポートしました: ${staffGoals.length}件のレコード`)
  }

  const handleImportGoals = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const csvContent = e.target?.result as string
        const importedGoals = importGoalsFromCSV(csvContent)
        onImportGoals(importedGoals)
        alert(`目標をインポートしました: ${importedGoals.length}件`)
      }
      reader.readAsText(file)
    }
  }

  const handleClearGoals = () => {
    if (confirm('すべての目標データを削除しますか？')) {
      clearGoalsFromStorage()
      onClearGoals()
      alert('目標データを削除しました')
    }
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h4 className="font-medium text-gray-900 mb-3">目標データ管理</h4>
      <div className="flex space-x-2">
        <button
          onClick={handleExportGoals}
          className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Download className="w-4 h-4 mr-1" />
          エクスポート
        </button>
        
        <label className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer">
          <Upload className="w-4 h-4 mr-1" />
          インポート
          <input
            type="file"
            accept=".csv"
            onChange={handleImportGoals}
            className="hidden"
          />
        </label>
        
        <button
          onClick={handleClearGoals}
          className="flex items-center px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          全削除
        </button>
      </div>
      
      <div className="mt-3 text-xs text-gray-600">
        <p>• エクスポート: 現在の目標データをCSVファイルで保存</p>
        <p>• インポート: CSVファイルから目標データを読み込み</p>
        <p>• 全削除: すべての目標データを削除</p>
      </div>
    </div>
  )
}
