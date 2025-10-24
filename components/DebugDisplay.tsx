'use client'

import React, { useState, useEffect } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'

export default function DebugDisplay() {
  const { state } = useDashboard()
  const [debugLogs, setDebugLogs] = useState<string[]>([])

  useEffect(() => {
    // Add debug logs when data changes
    if (state.data.clinicData) {
      const logs = []
      
      logs.push(`🔍 API接続状態: ${state.apiConnected ? '接続済み' : '未接続'}`)
      logs.push(`📊 データソース: ${state.dataSource}`)
      
      if (state.data.clinicData) {
        logs.push('🏥 クリニックデータ:')
        logs.push(`  横浜院: ${state.data.clinicData.yokohama?.dailyAccounts?.length || 0} レコード`)
        logs.push(`  郡山院: ${state.data.clinicData.koriyama?.dailyAccounts?.length || 0} レコード`)
        logs.push(`  水戸院: ${state.data.clinicData.mito?.dailyAccounts?.length || 0} レコード`)
        logs.push(`  大宮院: ${state.data.clinicData.omiya?.dailyAccounts?.length || 0} レコード`)
      }
      
      if (state.data.dailyAccounts) {
        logs.push(`📈 総レコード数: ${state.data.dailyAccounts.length}`)
      }
      
      if (state.currentMonthMetrics) {
        logs.push(`💰 今月の売上: ¥${state.currentMonthMetrics.revenue.toLocaleString()}`)
        logs.push(`👥 今月の来院数: ${state.currentMonthMetrics.visitCount}`)
      }
      
      setDebugLogs(logs)
    }
  }, [state.data, state.apiConnected, state.dataSource, state.currentMonthMetrics])

  if (!state.apiConnected) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">🔍 デバッグ情報</h3>
        <p className="text-yellow-700">APIに接続されていません</p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="text-lg font-semibold text-blue-800 mb-2">🔍 デバッグ情報</h3>
      <div className="space-y-1">
        {debugLogs.map((log, index) => (
          <div key={index} className="text-sm text-blue-700 font-mono">
            {log}
          </div>
        ))}
      </div>
      
      {/* Sample Data Display */}
      {state.data.clinicData?.yokohama?.dailyAccounts?.length > 0 && (
        <div className="mt-4 p-3 bg-white rounded border">
          <h4 className="font-semibold text-gray-800 mb-2">📋 横浜院サンプルデータ:</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>日付: {state.data.clinicData.yokohama.dailyAccounts[0]?.recordDate}</div>
            <div>患者名: {state.data.clinicData.yokohama.dailyAccounts[0]?.visitorName}</div>
            <div>施術: {state.data.clinicData.yokohama.dailyAccounts[0]?.treatmentName}</div>
            <div>金額: ¥{state.data.clinicData.yokohama.dailyAccounts[0]?.totalWithTax?.toLocaleString()}</div>
          </div>
        </div>
      )}
    </div>
  )
}
