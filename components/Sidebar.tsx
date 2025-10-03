'use client'

import { useState } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  X, 
  Users, 
  Repeat, 
  ShoppingCart, 
  UserCheck, 
  Building2, 
  Target,
  History,
  Download,
  Settings
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const menuItems = [
  { id: 'sales-analysis', label: '売上分析', icon: BarChart3, active: false },
  { id: 'treatment-trends', label: '治療別傾向分析', icon: TrendingUp, active: false },
  { id: 'treatment-sales', label: '治療売上推移', icon: Calendar, active: true },
  { id: 'annual-sales', label: '年間売上推移', icon: Calendar, active: false },
  { id: 'cancellations', label: '予約キャンセル', icon: X, active: false },
  { id: 'repeat-analysis', label: 'リピート分析', icon: Repeat, active: false },
  { id: 'cross-sell', label: 'クロスセル', icon: ShoppingCart, active: false },
  { id: 'staff-sales', label: 'スタッフ別売上', icon: UserCheck, active: false },
  { id: 'sales-comparison', label: '売上比較', icon: BarChart3, active: false },
  { id: 'customer-attributes', label: '顧客属性分析', icon: Users, active: false },
  { id: 'clinic-comparison', label: '院比較', icon: Building2, active: false },
  { id: 'clinic-sales', label: '院別売上', icon: Building2, active: false },
  { id: 'monthly-progress', label: '今月進捗', icon: Target, active: false },
  { id: 'policy-history', label: '施策履歴', icon: History, active: false },
]

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
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
                return (
                  <li key={item.id}>
                    <button
                      className={`
                        w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors
                        ${item.active 
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
          <div className="p-4 space-y-4 border-t border-gray-200">
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
                <option value="shinjuku">新宿院</option>
                <option value="ikebukuro">池袋院</option>
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