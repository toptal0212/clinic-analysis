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
  PieChart,
  ChevronDown,
  ChevronLeft,
  Download
} from 'lucide-react'

interface GlobalSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function GlobalSidebar({ activeTab, onTabChange }: GlobalSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const navigationItems = [
    { id: 'sales-analysis', label: '売上分析' },
    { id: 'treatment-trend', label: '治療別傾向分析' },
    { id: 'treatment-sales', label: '治療売上推移' },
    { id: 'annual-sales', label: '年間売上推移' },
    { id: 'cancellation', label: '予約キャンセル' },
    { id: 'repeat-analysis', label: 'リ ピー 卜分析' },
    { id: 'cross-sell', label: 'クロスセル' },
    { id: 'staff-sales', label: 'ス夕ッフ別売上' },
    { id: 'sales-comparison', label: '売上比較' },
    { id: 'customer-attributes', label: '顧客属性分析' },
    { id: 'clinic-comparison', label: '院比較' },
    { id: 'clinic-sales', label: '院別売上' },
    { id: 'monthly-progress', label: '今月進捗' }
  ]

  return (
    <div className={`bg-blue-100 border-r-2 border-blue-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } h-screen flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-blue-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
                <span className="text-sm font-bold text-white">C</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">CliniCheck</h1>
                <p className="text-xs text-gray-600">MARKETING DASHBOARD</p>
              </div>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <button className="flex items-center px-2 py-1 space-x-1 text-xs text-blue-800 bg-blue-200 rounded">
              <span>MENU</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 text-gray-600 hover:text-gray-800"
            >
              <ChevronLeft className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded transition-colors relative ${
              activeTab === item.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-blue-200 hover:text-gray-900'
            }`}
            title={isCollapsed ? item.label : undefined}
          >
            {activeTab === item.id && (
              <div className="absolute top-0 bottom-0 left-0 w-1 bg-blue-800 rounded-r"></div>
            )}
            <div className={`w-2 h-2 rounded-full mr-3 ${
              activeTab === item.id ? 'bg-white' : 'bg-gray-400'
            }`}></div>
            {!isCollapsed && (
              <span className="text-left">{item.label}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Filters and Export */}
      {!isCollapsed && (
        <div className="p-4 space-y-4 border-t border-blue-200">
          {/* Filter Dropdowns */}
          <div className="space-y-3">
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700">大カテゴリー</label>
              <select className="w-full px-2 py-1 text-xs bg-white border border-gray-300 rounded">
                <option>(すべて)</option>
                <option>外科</option>
                <option>皮膚科</option>
                <option>脱毛</option>
                <option>その他</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700">同日または未来の大カテ...</label>
              <select className="w-full px-2 py-1 text-xs bg-white border border-gray-300 rounded">
                <option>(すべて)</option>
                <option>外科</option>
                <option>皮膚科</option>
                <option>脱毛</option>
                <option>その他</option>
              </select>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex space-x-2">
            <button className="flex items-center justify-center flex-1 px-3 py-2 space-x-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">
              <Download className="w-3 h-3" />
              <span>CSV</span>
            </button>
            <button className="flex items-center justify-center flex-1 px-3 py-2 space-x-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">
              <Download className="w-3 h-3" />
              <span>JPG</span>
            </button>
            <button className="flex items-center justify-center flex-1 px-3 py-2 space-x-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">
              <Download className="w-3 h-3" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
