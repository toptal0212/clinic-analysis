'use client'

import React, { useState } from 'react'
import { 
  BarChart3, 
  Upload, 
  Target, 
  Table,
  Settings,
  Users,
  FileText,
  TrendingUp,
  Building2,
  PieChart
} from 'lucide-react'

interface GlobalSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function GlobalSidebar({ activeTab, onTabChange }: GlobalSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'ダッシュボード',
      icon: BarChart3,
      description: '売上分析・可視化'
    },
    {
      id: 'sales-analysis',
      label: '売上表分析',
      icon: Table,
      description: '売上・件数・単価分析'
    },
    {
      id: 'data-import',
      label: 'データインポート',
      icon: Upload,
      description: 'CSV・API連携'
    },
    {
      id: 'goals',
      label: '目標管理',
      icon: Target,
      description: 'スタッフ目標設定'
    },
    {
      id: 'clinic-management',
      label: '院別管理',
      icon: Building2,
      description: '院別売上・目標'
    },
    {
      id: 'patient-analysis',
      label: '患者分析',
      icon: Users,
      description: '患者データ分析'
    },
    {
      id: 'reports',
      label: 'レポート',
      icon: FileText,
      description: '分析レポート生成'
    },
    {
      id: 'settings',
      label: '設定',
      icon: Settings,
      description: 'システム設定'
    }
  ]

  return (
    <div className={`bg-white shadow-sm border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-gray-900">売上分析システム</h1>
              <p className="text-sm text-gray-500">クリニック売上管理</p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 text-gray-500 rounded-md hover:text-gray-700 hover:bg-gray-100"
          >
            <div className="w-4 h-4">
              {isCollapsed ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
              {!isCollapsed && (
                <div className="flex-1 text-left">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                </div>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-center text-gray-500">
            <div className="font-medium">クリニック売上分析ツール</div>
            <div>v1.0.0</div>
          </div>
        </div>
      )}
    </div>
  )
}
