'use client'

import { useState } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Users, 
  Target,
  RefreshCw,
  AlertTriangle,
  Home,
  Package,
  X,
  Download,
  MousePointer,
  Stethoscope,
  Building2,
  Table,
  Database
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  activeTab: string
  onTabChange: (tabId: string) => void
}

  const menuItems = [
    { id: 'overview', label: '概要', icon: Home },
    { id: 'summary', label: 'サマリー分析', icon: BarChart3 },
    { id: 'daily', label: '日別分析', icon: Calendar },
    { id: 'comparison', label: '全院比較', icon: TrendingUp },
    { id: 'patients', label: '来院者情報', icon: Users },
    { id: 'services', label: '役務分析', icon: Package },
    { id: 'treatment-hierarchy', label: '施術階層分析', icon: Stethoscope },
    { id: 'clinic-data', label: 'クリニック別データ', icon: Building2 },
    { id: 'hospital-trends', label: '売上・来院数推移', icon: TrendingUp },
    { id: 'sales-table', label: '売上表分析', icon: Table },
    { id: 'treatment-category-debug', label: '治療カテゴリーデバッグ', icon: Database },
    { id: 'debug', label: 'デバッグ情報', icon: AlertTriangle },
    { id: 'goals', label: '目標達成率', icon: Target },
    { id: 'repeat', label: 'リピート率', icon: RefreshCw },
    { id: 'advertising', label: '広告分析', icon: MousePointer },
    { id: 'errors', label: 'エラー表示', icon: AlertTriangle }
  ]

export default function Sidebar({ isOpen, onClose, activeTab, onTabChange }: SidebarProps) {
  const [filters, setFilters] = useState({
    dateLevel: 'month',
    period: 'past1',
    clinic: 'all',
    conversionThreshold: 5000
  })

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-600">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">CliniCheck</h1>
                <p className="text-xs text-gray-500">MARKETING DASHBOARD</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-md lg:hidden hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onTabChange(item.id)}
                      className={`
                        w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors
                        ${isActive 
                          ? 'bg-primary-600 text-white' 
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Filters */}
          <div className="hidden p-4 space-y-4 border-t border-gray-200">
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700">
                DateLevel
              </label>
              <select
                value={filters.dateLevel}
                onChange={(e) => setFilters({...filters, dateLevel: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="month">Month</option>
                <option value="week">Week</option>
                <option value="day">Day</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700">
                期間選択
              </label>
              <select
                value={filters.period}
                onChange={(e) => setFilters({...filters, period: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="past1">過去1...</option>
                <option value="past3">過去3ヶ月</option>
                <option value="past6">過去6ヶ月</option>
                <option value="past12">過去12ヶ月</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700">
                院選択
              </label>
              <select
                value={filters.clinic}
                onChange={(e) => setFilters({...filters, clinic: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">(すべて)</option>
                <option value="omiya">大宮院</option>
                <option value="yokohama">横浜院</option>
                <option value="mito">水戸院</option>
                <option value="koriyama">郡山院</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700">
                成約閾値
              </label>
              <input
                type="number"
                value={filters.conversionThreshold}
                onChange={(e) => setFilters({...filters, conversionThreshold: parseInt(e.target.value)})}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Export Buttons */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <button className="flex-1 py-2 text-xs btn btn-outline">
                <Download className="w-4 h-4 mr-1" />
                CSV
              </button>
              <button className="flex-1 py-2 text-xs btn btn-outline">
                <Download className="w-4 h-4 mr-1" />
                JPG
              </button>
              <button className="flex-1 py-2 text-xs btn btn-outline">
                <Download className="w-4 h-4 mr-1" />
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}