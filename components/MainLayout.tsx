'use client'

import React, { useState, useEffect } from 'react'
import GlobalSidebar from './GlobalSidebar'
import SalesTableAnalysis from './SalesTableAnalysisClean'
import GoalManagement from './GoalManagement'
import Header from './Header'
import CSVImport from './CSVImport'
import { useDashboard } from '@/contexts/DashboardContext'

interface MainLayoutProps {
  dateRange: { start: Date, end: Date }
}

export default function MainLayout({ dateRange }: MainLayoutProps) {
  const [activeTab, setActiveTab] = useState('sales-analysis')
  const { state, loadData, dispatch } = useDashboard()

  // Load data when API is connected
  useEffect(() => {
    if (state.apiConnected && state.dataSource === 'api') {
      loadData()
    }
  }, [state.apiConnected, state.dataSource, loadData])
  
  // Handle CSV data import
  const handleCSVDataImported = (data: any[], errors: any[]) => {
    if (data.length > 0) {
      dispatch({
        type: 'SET_DATA',
        payload: {
          dailyAccounts: data
        }
      })
      dispatch({
        type: 'SET_API_CONNECTION',
        payload: {
          connected: true,
          apiKey: 'csv-import',
          dataSource: null, // CSV is not 'api' dataSource
          dateRange: {
            start: dateRange.start.toISOString().split('T')[0],
            end: dateRange.end.toISOString().split('T')[0]
          }
        }
      })
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        // Calculate real data from API
        const totalRevenue = state.data.dailyAccounts?.reduce((sum: number, record: any) => 
          sum + (record.totalWithTax || 0), 0) || 0
        const totalCount = state.data.dailyAccounts?.length || 0
        const averageUnitPrice = totalCount > 0 ? totalRevenue / totalCount : 0
        
        const formatCurrency = (amount: number) => {
          return new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: 'JPY',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(amount)
        }
        
        return (
          <div className="p-6">
            <h1 className="mb-6 text-2xl font-bold text-gray-900">ダッシュボード</h1>
            {!state.apiConnected && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  APIに接続するか、CSVファイルをインポートしてデータを表示してください。
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">総売上</h3>
                <div className="text-3xl font-bold text-blue-600">
                  {formatCurrency(totalRevenue)}
                </div>
                <p className="mt-2 text-sm text-gray-500">総売上</p>
              </div>
              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">来院数</h3>
                <div className="text-3xl font-bold text-green-600">
                  {totalCount.toLocaleString('ja-JP')}
                </div>
                <p className="mt-2 text-sm text-gray-500">総来院数</p>
              </div>
              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">平均単価</h3>
                <div className="text-3xl font-bold text-purple-600">
                  {formatCurrency(averageUnitPrice)}
                </div>
                <p className="mt-2 text-sm text-gray-500">平均単価</p>
              </div>
            </div>
          </div>
        )

      case 'sales-analysis':
        return <SalesTableAnalysis dateRange={dateRange} />

      case 'data-import':
        return (
          <CSVImport 
            onDataImported={handleCSVDataImported}
          />
        )

      case 'goals':
        return <GoalManagement />

      case 'clinic-management':
        return (
          <div className="p-6">
            <h1 className="mb-6 text-2xl font-bold text-gray-900">院別管理</h1>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">院別売上</h3>
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
              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">院別目標達成</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">横浜院</span>
                    <span className="font-semibold text-green-600">110%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">郡山院</span>
                    <span className="font-semibold text-red-600">75%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">水戸院</span>
                    <span className="font-semibold text-yellow-600">90%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'patient-analysis':
        return (
          <div className="p-6">
            <h1 className="mb-6 text-2xl font-bold text-gray-900">患者分析</h1>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">新規患者</h3>
                <div className="text-3xl font-bold text-blue-600">234</div>
                <p className="mt-2 text-sm text-gray-500">今月の新規患者数</p>
              </div>
              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">既存患者</h3>
                <div className="text-3xl font-bold text-green-600">1,000</div>
                <p className="mt-2 text-sm text-gray-500">今月の既存患者数</p>
              </div>
              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">リピート率</h3>
                <div className="text-3xl font-bold text-purple-600">65%</div>
                <p className="mt-2 text-sm text-gray-500">患者リピート率</p>
              </div>
            </div>
          </div>
        )

      case 'reports':
        return (
          <div className="p-6">
            <h1 className="mb-6 text-2xl font-bold text-gray-900">レポート</h1>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">月次レポート</h3>
                <p className="mb-4 text-gray-600">月次売上レポートの生成</p>
                <button className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">
                  レポート生成
                </button>
              </div>
              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">院別レポート</h3>
                <p className="mb-4 text-gray-600">院別売上レポートの生成</p>
                <button className="w-full px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700">
                  レポート生成
                </button>
              </div>
            </div>
          </div>
        )

      case 'treatment-trend':
        return (
          <div className="p-6">
            <h1 className="mb-6 text-2xl font-bold text-gray-900">治療別傾向分析</h1>
            <div className="p-6 bg-white border rounded-lg shadow-sm">
              <p className="text-gray-600">治療別傾向分析の内容がここに表示されます</p>
            </div>
          </div>
        )

      case 'treatment-sales':
        return (
          <div className="p-6">
            <h1 className="mb-6 text-2xl font-bold text-gray-900">治療売上推移</h1>
            <div className="p-6 bg-white border rounded-lg shadow-sm">
              <p className="text-gray-600">治療売上推移の内容がここに表示されます</p>
            </div>
          </div>
        )

      case 'annual-sales':
        return (
          <div className="p-6">
            <h1 className="mb-6 text-2xl font-bold text-gray-900">年間売上推移</h1>
            <div className="p-6 bg-white border rounded-lg shadow-sm">
              <p className="text-gray-600">年間売上推移の内容がここに表示されます</p>
            </div>
          </div>
        )

      case 'cancellation':
        return (
          <div className="p-6">
            <h1 className="mb-6 text-2xl font-bold text-gray-900">予約キャンセル</h1>
            <div className="p-6 bg-white border rounded-lg shadow-sm">
              <p className="text-gray-600">予約キャンセルの内容がここに表示されます</p>
            </div>
          </div>
        )

      case 'repeat-analysis':
        return (
          <div className="p-6">
            <h1 className="mb-6 text-2xl font-bold text-gray-900">リ ピー 卜分析</h1>
            <div className="p-6 bg-white border rounded-lg shadow-sm">
              <p className="text-gray-600">リピート分析の内容がここに表示されます</p>
            </div>
          </div>
        )

      case 'cross-sell':
        return (
          <div className="p-6">
            <h1 className="mb-6 text-2xl font-bold text-gray-900">クロスセル</h1>
            <div className="p-6 bg-white border rounded-lg shadow-sm">
              <p className="text-gray-600">クロスセルの内容がここに表示されます</p>
            </div>
          </div>
        )

      case 'staff-sales':
        return (
          <div className="p-6">
            <h1 className="mb-6 text-2xl font-bold text-gray-900">ス夕ッフ別売上</h1>
            <div className="p-6 bg-white border rounded-lg shadow-sm">
              <p className="text-gray-600">スタッフ別売上の内容がここに表示されます</p>
            </div>
          </div>
        )

      case 'sales-comparison':
        return (
          <div className="p-6">
            <h1 className="mb-6 text-2xl font-bold text-gray-900">売上比較</h1>
            <div className="p-6 bg-white border rounded-lg shadow-sm">
              <p className="text-gray-600">売上比較の内容がここに表示されます</p>
            </div>
          </div>
        )

      case 'customer-attributes':
        return (
          <div className="p-6">
            <h1 className="mb-6 text-2xl font-bold text-gray-900">顧客属性分析</h1>
            <div className="p-6 bg-white border rounded-lg shadow-sm">
              <p className="text-gray-600">顧客属性分析の内容がここに表示されます</p>
            </div>
          </div>
        )

      case 'clinic-comparison':
        return (
          <div className="p-6">
            <h1 className="mb-6 text-2xl font-bold text-gray-900">院比較</h1>
            <div className="p-6 bg-white border rounded-lg shadow-sm">
              <p className="text-gray-600">院比較の内容がここに表示されます</p>
            </div>
          </div>
        )

      case 'clinic-sales':
        return (
          <div className="p-6">
            <h1 className="mb-6 text-2xl font-bold text-gray-900">院別売上</h1>
            <div className="p-6 bg-white border rounded-lg shadow-sm">
              <p className="text-gray-600">院別売上の内容がここに表示されます</p>
            </div>
          </div>
        )

      case 'monthly-progress':
        return (
          <div className="p-6">
            <h1 className="mb-6 text-2xl font-bold text-gray-900">今月進捗</h1>
            <div className="p-6 bg-white border rounded-lg shadow-sm">
              <p className="text-gray-600">今月進捗の内容がここに表示されます</p>
            </div>
          </div>
        )

      case 'settings':
        return (
          <div className="p-6">
            <h1 className="mb-6 text-2xl font-bold text-gray-900">設定</h1>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">システム設定</h3>
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
              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">API設定</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">MF API URL</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="https://api.medicalforce.com" />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">API Key</label>
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
    <div className="flex min-h-screen bg-gray-50">
      <GlobalSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onMenuClick={() => {}} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
