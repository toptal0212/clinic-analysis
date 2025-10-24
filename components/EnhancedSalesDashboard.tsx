'use client'

import React, { useState, useMemo } from 'react'
import { 
  TrendingUp, 
  Users, 
  Building2, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3,
  PieChart,
  Target,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react'

interface SalesData {
  clinic: string
  totalSales: number
  totalVisits: number
  averageUnitPrice: number
  categories: {
    surgery: {
      total: number
      visits: number
      procedures: {
        doubleEyelid: number
        darkCircle: number
        threadLift: number
        faceSlimming: number
        noseSurgery: number
        bodyLiposuction: number
        breastAugmentation: number
        otherSurgery: number
      }
    }
    dermatology: {
      total: number
      visits: number
      procedures: {
        injection: number
        skin: number
      }
    }
    hairRemoval: {
      total: number
      visits: number
    }
    other: {
      total: number
      visits: number
      procedures: {
        piercing: number
        products: number
        anesthesia: number
      }
    }
  }
}

interface AlertData {
  type: 'missing_referral' | 'missing_staff' | 'invalid_treatment' | 'data_mismatch'
  message: string
  severity: 'error' | 'warning'
  count: number
  details: string[]
}

interface GoalData {
  clinic: string
  targetSales: number
  targetVisits: number
  targetUnitPrice: number
  currentSales: number
  currentVisits: number
  currentUnitPrice: number
  achievementRate: number
}

export default function EnhancedSalesDashboard() {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'clinic-breakdown' | 'category-drilldown'>('overview')
  const [selectedClinic, setSelectedClinic] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showAlerts, setShowAlerts] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Mock data - replace with real data from your API
  const salesData: SalesData[] = [
    {
      clinic: '横浜院',
      totalSales: 15000000,
      totalVisits: 120,
      averageUnitPrice: 125000,
      categories: {
        surgery: {
          total: 8000000,
          visits: 60,
          procedures: {
            doubleEyelid: 3000000,
            darkCircle: 2000000,
            threadLift: 1500000,
            faceSlimming: 1000000,
            noseSurgery: 500000,
            bodyLiposuction: 0,
            breastAugmentation: 0,
            otherSurgery: 0
          }
        },
        dermatology: {
          total: 5000000,
          visits: 40,
          procedures: {
            injection: 3000000,
            skin: 2000000
          }
        },
        hairRemoval: {
          total: 1500000,
          visits: 20
        },
        other: {
          total: 500000,
          visits: 20,
          procedures: {
            piercing: 200000,
            products: 200000,
            anesthesia: 100000
          }
        }
      }
    }
  ]

  const alerts: AlertData[] = [
    {
      type: 'missing_referral',
      message: '流入経路が未入力の患者がいます',
      severity: 'error',
      count: 15,
      details: ['田中太郎', '佐藤花子', '鈴木一郎']
    },
    {
      type: 'missing_staff',
      message: '担当者が未入力の患者がいます',
      severity: 'warning',
      count: 8,
      details: ['山田次郎', '高橋美咲']
    },
    {
      type: 'invalid_treatment',
      message: '分類できない施術内容があります',
      severity: 'error',
      count: 3,
      details: ['新施術A', '新施術B', '新施術C']
    }
  ]

  const goals: GoalData[] = [
    {
      clinic: '横浜院',
      targetSales: 20000000,
      targetVisits: 150,
      targetUnitPrice: 130000,
      currentSales: 15000000,
      currentVisits: 120,
      currentUnitPrice: 125000,
      achievementRate: 75
    }
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ja-JP').format(num)
  }

  const getAlertIcon = (type: AlertData['type']) => {
    switch (type) {
      case 'missing_referral':
      case 'invalid_treatment':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'missing_staff':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'data_mismatch':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />
    }
  }

  const getAlertColor = (severity: AlertData['severity']) => {
    switch (severity) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const toggleCategoryExpansion = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const filteredData = useMemo(() => {
    if (selectedClinic === 'all') return salesData
    return salesData.filter(data => data.clinic === selectedClinic)
  }, [selectedClinic, salesData])

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">売上分析ダッシュボード</h1>
        <p className="text-gray-600">詳細な売上分析とデータ品質管理</p>
      </div>

      {/* Alerts Section */}
      {showAlerts && alerts.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">データ品質アラート</h2>
            <button
              onClick={() => setShowAlerts(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <EyeOff className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getAlertColor(alert.severity)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getAlertIcon(alert.type)}
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm opacity-75">{alert.count}件のデータに問題があります</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{alert.count}件</p>
                    <p className="text-xs opacity-75">MFで修正が必要</p>
                  </div>
                </div>
                {alert.details.length > 0 && (
                  <div className="mt-3 pl-8">
                    <p className="text-sm font-medium mb-1">該当患者:</p>
                    <div className="flex flex-wrap gap-2">
                      {alert.details.map((detail, idx) => (
                        <span key={idx} className="px-2 py-1 bg-white bg-opacity-50 rounded text-xs">
                          {detail}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setSelectedTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="inline w-4 h-4 mr-1" />
              売上総覧
            </button>
            <button
              onClick={() => setSelectedTab('clinic-breakdown')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'clinic-breakdown'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Building2 className="inline w-4 h-4 mr-1" />
              院別売上
            </button>
            <button
              onClick={() => setSelectedTab('category-drilldown')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'category-drilldown'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <PieChart className="inline w-4 h-4 mr-1" />
              カテゴリー詳細
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-lg shadow-sm border">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-blue-600">総売上</p>
                  <p className="text-xl font-semibold text-blue-900">
                    {formatCurrency(filteredData.reduce((sum, data) => sum + data.totalSales, 0))}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-green-600">総来院数</p>
                  <p className="text-xl font-semibold text-green-900">
                    {formatNumber(filteredData.reduce((sum, data) => sum + data.totalVisits, 0))}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow-sm border">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-purple-600">平均単価</p>
                  <p className="text-xl font-semibold text-purple-900">
                    {formatCurrency(
                      filteredData.reduce((sum, data) => sum + data.averageUnitPrice, 0) / filteredData.length
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Target className="w-8 h-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm text-orange-600">目標達成率</p>
                  <p className="text-xl font-semibold text-orange-900">
                    {goals.reduce((sum, goal) => sum + goal.achievementRate, 0) / goals.length}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">売上構成比</h3>
              <div className="space-y-4">
                {['surgery', 'dermatology', 'hairRemoval', 'other'].map((category) => {
                  const categoryData = filteredData.reduce((sum, data) => {
                    const cat = data.categories[category as keyof typeof data.categories]
                    return sum + (cat?.total || 0)
                  }, 0)
                  const totalSales = filteredData.reduce((sum, data) => sum + data.totalSales, 0)
                  const percentage = totalSales > 0 ? (categoryData / totalSales) * 100 : 0

                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {category === 'surgery' ? '外科' : 
                           category === 'dermatology' ? '皮膚科' :
                           category === 'hairRemoval' ? '脱毛' : 'その他'}
                        </span>
                        <span className="text-sm text-gray-600">
                          {formatCurrency(categoryData)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${
                            category === 'surgery' ? 'bg-red-500' :
                            category === 'dermatology' ? 'bg-blue-500' :
                            category === 'hairRemoval' ? 'bg-green-500' : 'bg-purple-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">院別目標達成状況</h3>
              <div className="space-y-4">
                {goals.map((goal, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{goal.clinic}</span>
                      <span className={`text-sm font-medium ${
                        goal.achievementRate >= 100 ? 'text-green-600' :
                        goal.achievementRate >= 80 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {goal.achievementRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          goal.achievementRate >= 100 ? 'bg-green-500' :
                          goal.achievementRate >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(goal.achievementRate, 100)}%` }}
                      ></div>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      目標: {formatCurrency(goal.targetSales)} / 実績: {formatCurrency(goal.currentSales)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'clinic-breakdown' && (
        <div className="space-y-6">
          {/* Clinic Filter */}
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">院選択:</label>
            <select
              value={selectedClinic}
              onChange={(e) => setSelectedClinic(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全院</option>
              <option value="横浜院">横浜院</option>
              <option value="郡山院">郡山院</option>
              <option value="水戸院">水戸院</option>
              <option value="大宮院">大宮院</option>
            </select>
          </div>

          {/* Clinic Data Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">院名</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">売上</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">来院数</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">平均単価</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">目標達成率</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((data, index) => {
                  const goal = goals.find(g => g.clinic === data.clinic)
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{data.clinic}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-900">
                        {formatCurrency(data.totalSales)}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-gray-900">
                        {formatNumber(data.totalVisits)}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-gray-900">
                        {formatCurrency(data.averageUnitPrice)}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        {goal ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            goal.achievementRate >= 100 ? 'bg-green-100 text-green-800' :
                            goal.achievementRate >= 80 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {goal.achievementRate.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTab === 'category-drilldown' && (
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">カテゴリー選択:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全カテゴリー</option>
              <option value="surgery">外科</option>
              <option value="dermatology">皮膚科</option>
              <option value="hairRemoval">脱毛</option>
              <option value="other">その他</option>
            </select>
          </div>

          {/* Drill-down Categories */}
          <div className="space-y-4">
            {/* Surgery Category */}
            <div className="bg-white rounded-lg shadow-sm border">
              <button
                onClick={() => toggleCategoryExpansion('surgery')}
                className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="font-medium text-gray-900">外科</span>
                  <span className="text-sm text-gray-500">
                    {formatCurrency(filteredData.reduce((sum, data) => sum + data.categories.surgery.total, 0))}
                  </span>
                </div>
                {expandedCategories.has('surgery') ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {expandedCategories.has('surgery') && (
                <div className="border-t border-gray-200 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { key: 'doubleEyelid', label: '二重', value: 'doubleEyelid' },
                      { key: 'darkCircle', label: 'くま治療', value: 'darkCircle' },
                      { key: 'threadLift', label: '糸リフト', value: 'threadLift' },
                      { key: 'faceSlimming', label: '小顔（S,BF)', value: 'faceSlimming' },
                      { key: 'noseSurgery', label: '鼻・人中手術', value: 'noseSurgery' },
                      { key: 'bodyLiposuction', label: 'ボディー脂肪吸引', value: 'bodyLiposuction' },
                      { key: 'breastAugmentation', label: '豊胸', value: 'breastAugmentation' },
                      { key: 'otherSurgery', label: 'その他外科', value: 'otherSurgery' }
                    ].map((procedure) => {
                      const total = filteredData.reduce((sum, data) => 
                        sum + data.categories.surgery.procedures[procedure.value as keyof typeof data.categories.surgery.procedures], 0
                      )
                      return (
                        <div key={procedure.key} className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-900">{procedure.label}</div>
                          <div className="text-lg font-semibold text-gray-900">{formatCurrency(total)}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Dermatology Category */}
            <div className="bg-white rounded-lg shadow-sm border">
              <button
                onClick={() => toggleCategoryExpansion('dermatology')}
                className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="font-medium text-gray-900">皮膚科</span>
                  <span className="text-sm text-gray-500">
                    {formatCurrency(filteredData.reduce((sum, data) => sum + data.categories.dermatology.total, 0))}
                  </span>
                </div>
                {expandedCategories.has('dermatology') ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {expandedCategories.has('dermatology') && (
                <div className="border-t border-gray-200 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'injection', label: '注入', value: 'injection' },
                      { key: 'skin', label: 'スキン', value: 'skin' }
                    ].map((procedure) => {
                      const total = filteredData.reduce((sum, data) => 
                        sum + data.categories.dermatology.procedures[procedure.value as keyof typeof data.categories.dermatology.procedures], 0
                      )
                      return (
                        <div key={procedure.key} className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-900">{procedure.label}</div>
                          <div className="text-lg font-semibold text-gray-900">{formatCurrency(total)}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Hair Removal Category */}
            <div className="bg-white rounded-lg shadow-sm border">
              <button
                onClick={() => toggleCategoryExpansion('hairRemoval')}
                className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="font-medium text-gray-900">脱毛</span>
                  <span className="text-sm text-gray-500">
                    {formatCurrency(filteredData.reduce((sum, data) => sum + data.categories.hairRemoval.total, 0))}
                  </span>
                </div>
                {expandedCategories.has('hairRemoval') ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>

            {/* Other Category */}
            <div className="bg-white rounded-lg shadow-sm border">
              <button
                onClick={() => toggleCategoryExpansion('other')}
                className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-purple-500 rounded"></div>
                  <span className="font-medium text-gray-900">その他</span>
                  <span className="text-sm text-gray-500">
                    {formatCurrency(filteredData.reduce((sum, data) => sum + data.categories.other.total, 0))}
                  </span>
                </div>
                {expandedCategories.has('other') ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {expandedCategories.has('other') && (
                <div className="border-t border-gray-200 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { key: 'piercing', label: 'ピアス', value: 'piercing' },
                      { key: 'products', label: '物販', value: 'products' },
                      { key: 'anesthesia', label: '麻酔・針・パック', value: 'anesthesia' }
                    ].map((procedure) => {
                      const total = filteredData.reduce((sum, data) => 
                        sum + data.categories.other.procedures[procedure.value as keyof typeof data.categories.other.procedures], 0
                      )
                      return (
                        <div key={procedure.key} className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-900">{procedure.label}</div>
                          <div className="text-lg font-semibold text-gray-900">{formatCurrency(total)}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
