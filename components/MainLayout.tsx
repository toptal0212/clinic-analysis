'use client'

import React, { useState } from 'react'
import GlobalSidebar from './GlobalSidebar'
import SalesTableAnalysis from './SalesTableAnalysisClean'
import GoalManagement from './GoalManagement'
import { useDashboard } from '@/contexts/DashboardContext'

interface MainLayoutProps {
  dateRange: { start: Date, end: Date }
}

export default function MainLayout({ dateRange }: MainLayoutProps) {
  const [activeTab, setActiveTab] = useState('sales-analysis')
  const { state } = useDashboard()

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">ダッシュボード</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-6 bg-white rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">総売上</h3>
                <div className="text-3xl font-bold text-blue-600">¥15,000,000</div>
                <p className="text-sm text-gray-500 mt-2">今月の売上</p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">来院数</h3>
                <div className="text-3xl font-bold text-green-600">1,234</div>
                <p className="text-sm text-gray-500 mt-2">今月の来院数</p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">平均単価</h3>
                <div className="text-3xl font-bold text-purple-600">¥125,000</div>
                <p className="text-sm text-gray-500 mt-2">平均単価</p>
              </div>
            </div>
          </div>
        )

      case 'sales-analysis':
        return <SalesTableAnalysis dateRange={dateRange} />

      case 'data-import':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">データインポート</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 bg-white rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">CSVインポート</h3>
                <p className="text-gray-600 mb-4">CSVファイルからデータをインポート</p>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <div className="text-gray-500">CSVファイルをドラッグ&ドロップ</div>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">API連携</h3>
                <p className="text-gray-600 mb-4">外部システムとのAPI連携</p>
                <div className="space-y-4">
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    MF API連携
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'goals':
        return <GoalManagement />

      case 'clinic-management':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">院別管理</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 bg-white rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">院別売上</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">横浜院</span>
                    <span className="font-semibold">¥8,000,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">郡山院</span>
                    <span className="font-semibold">¥4,000,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">水戸院</span>
                    <span className="font-semibold">¥3,000,000</span>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">院別目標達成</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">横浜院</span>
                    <span className="text-green-600 font-semibold">110%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">郡山院</span>
                    <span className="text-red-600 font-semibold">75%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">水戸院</span>
                    <span className="text-yellow-600 font-semibold">90%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'patient-analysis':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">患者分析</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-6 bg-white rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">新規患者</h3>
                <div className="text-3xl font-bold text-blue-600">234</div>
                <p className="text-sm text-gray-500 mt-2">今月の新規患者数</p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">既存患者</h3>
                <div className="text-3xl font-bold text-green-600">1,000</div>
                <p className="text-sm text-gray-500 mt-2">今月の既存患者数</p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">リピート率</h3>
                <div className="text-3xl font-bold text-purple-600">65%</div>
                <p className="text-sm text-gray-500 mt-2">患者リピート率</p>
              </div>
            </div>
          </div>
        )

      case 'reports':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">レポート</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 bg-white rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">月次レポート</h3>
                <p className="text-gray-600 mb-4">月次売上レポートの生成</p>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  レポート生成
                </button>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">院別レポート</h3>
                <p className="text-gray-600 mb-4">院別売上レポートの生成</p>
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                  レポート生成
                </button>
              </div>
            </div>
          </div>
        )

      case 'settings':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">設定</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 bg-white rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">システム設定</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">データ保持期間</span>
                    <select className="px-3 py-1 border border-gray-300 rounded-md">
                      <option>1年</option>
                      <option>2年</option>
                      <option>3年</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">自動バックアップ</span>
                    <input type="checkbox" className="rounded" defaultChecked />
                  </div>
                </div>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">API設定</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">MF API URL</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="https://api.medicalforce.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                    <input type="password" className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="••••••••••••••••" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return <SalesTableAnalysis dateRange={dateRange} />
    }
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <GlobalSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  )
}
