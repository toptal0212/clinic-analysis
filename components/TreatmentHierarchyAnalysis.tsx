'use client'

import React, { useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { 
  Stethoscope, 
  Activity, 
  Scissors, 
  Package,
  TrendingUp,
  Users,
  DollarSign,
  Building2
} from 'lucide-react'

interface TreatmentHierarchyAnalysisProps {
  dateRange: { start: Date, end: Date }
}

export default function TreatmentHierarchyAnalysis({ dateRange }: TreatmentHierarchyAnalysisProps) {
  const { state } = useDashboard()
  const [selectedHospital, setSelectedHospital] = useState<string>('all')

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

  // Calculate hierarchical treatment data
  const calculateTreatmentHierarchy = () => {
    // Generate sample data if no real data is available
    if (!state.apiConnected || !state.data.dailyAccounts.length) {
      console.log('🔍 [DEBUG] TreatmentHierarchyAnalysis - Using sample data')
      return {
        surgery: {
          name: '外科',
          icon: Scissors,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          totalRevenue: 15000000,
          totalCount: 120,
          average: 125000,
          subcategories: {
            '二重': { revenue: 6000000, count: 50, average: 120000 },
            'くま治療': { revenue: 4000000, count: 35, average: 114000 },
            '糸リフト': { revenue: 3000000, count: 25, average: 120000 },
            '小顔': { revenue: 2000000, count: 10, average: 200000 }
          }
        },
        dermatology: {
          name: '皮膚科',
          icon: Activity,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          totalRevenue: 8000000,
          totalCount: 200,
          average: 40000,
          subcategories: {
            '注入': { revenue: 5000000, count: 150, average: 33333 },
            'スキン': { revenue: 3000000, count: 50, average: 60000 }
          }
        },
        hairRemoval: {
          name: '脱毛',
          icon: Package,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          totalRevenue: 3000000,
          totalCount: 100,
          average: 30000,
          subcategories: {
            '全身脱毛': { revenue: 2000000, count: 60, average: 33333 },
            '部分脱毛': { revenue: 1000000, count: 40, average: 25000 }
          }
        },
        other: {
          name: 'その他',
          icon: Package,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          totalRevenue: 2000000,
          totalCount: 50,
          average: 40000,
          subcategories: {
            'ピアス': { revenue: 500000, count: 20, average: 25000 },
            '物販': { revenue: 1000000, count: 20, average: 50000 },
            '麻酔・針・パック': { revenue: 500000, count: 10, average: 50000 }
          }
        }
      }
    }

    // Get data based on hospital selection
    let dailyAccounts = state.data.dailyAccounts
    if (selectedHospital !== 'all' && state.data.clinicData) {
      const clinicKey = selectedHospital as keyof typeof state.data.clinicData
      dailyAccounts = state.data.clinicData[clinicKey]?.dailyAccounts || []
    }

    const hierarchy = {
      surgery: {
        name: '外科',
        icon: Stethoscope,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        totalRevenue: 0,
        totalCount: 0,
        averageUnitPrice: 0,
        subcategories: {
          '二重': { revenue: 0, count: 0 },
          'くま治療': { revenue: 0, count: 0 },
          '糸リフト': { revenue: 0, count: 0 },
          '小顔（S,BF)': { revenue: 0, count: 0 },
          '鼻・人中手術': { revenue: 0, count: 0 },
          'ボディー脂肪吸引': { revenue: 0, count: 0 },
          '豊胸': { revenue: 0, count: 0 },
          'その他外科': { revenue: 0, count: 0 }
        }
      },
      dermatology: {
        name: '皮膚科',
        icon: Activity,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        totalRevenue: 0,
        totalCount: 0,
        averageUnitPrice: 0,
        subcategories: {
          '注入': { revenue: 0, count: 0 },
          'スキン': { revenue: 0, count: 0 }
        }
      },
      hair_removal: {
        name: '脱毛',
        icon: Scissors,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        totalRevenue: 0,
        totalCount: 0,
        averageUnitPrice: 0,
        subcategories: {
          '脱毛': { revenue: 0, count: 0 }
        }
      },
      other: {
        name: 'その他',
        icon: Package,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        totalRevenue: 0,
        totalCount: 0,
        averageUnitPrice: 0,
        subcategories: {
          'ピアス': { revenue: 0, count: 0 },
          '物販': { revenue: 0, count: 0 },
          '麻酔・針・パック': { revenue: 0, count: 0 }
        }
      }
    }

    // Process daily accounts data
    dailyAccounts.forEach(record => {
      const treatmentName = record.treatmentName || ''
      const name = treatmentName.toLowerCase()
      
      // Categorize treatment
      let specialty: keyof typeof hierarchy = 'other'
      let subcategory = '物販'
      
      // Surgery category mappings
      if (name.includes('二重') || name.includes('double') || name.includes('eyelid')) {
        specialty = 'surgery'
        subcategory = '二重'
      } else if (name.includes('くま') || name.includes('dark') || name.includes('circle')) {
        specialty = 'surgery'
        subcategory = 'くま治療'
      } else if (name.includes('糸') || name.includes('thread') || name.includes('lift')) {
        specialty = 'surgery'
        subcategory = '糸リフト'
      } else if (name.includes('小顔') || name.includes('face') || name.includes('slimming')) {
        specialty = 'surgery'
        subcategory = '小顔（S,BF)'
      } else if (name.includes('鼻') || name.includes('人中') || name.includes('nose') || name.includes('philtrum')) {
        specialty = 'surgery'
        subcategory = '鼻・人中手術'
      } else if (name.includes('脂肪吸引') || name.includes('liposuction') || name.includes('body')) {
        specialty = 'surgery'
        subcategory = 'ボディー脂肪吸引'
      } else if (name.includes('豊胸') || name.includes('breast') || name.includes('augmentation')) {
        specialty = 'surgery'
        subcategory = '豊胸'
      } else if (name.includes('注入') || name.includes('injection') || name.includes('ボトックス') || name.includes('ヒアルロン')) {
        specialty = 'dermatology'
        subcategory = '注入'
      } else if (name.includes('スキン') || name.includes('skin') || name.includes('レーザー') || name.includes('laser')) {
        specialty = 'dermatology'
        subcategory = 'スキン'
      } else if (name.includes('脱毛') || name.includes('hair') || name.includes('removal')) {
        specialty = 'hair_removal'
        subcategory = '脱毛'
      } else if (name.includes('ピアス') || name.includes('piercing')) {
        specialty = 'other'
        subcategory = 'ピアス'
      } else if (name.includes('物販') || name.includes('product') || name.includes('商品')) {
        specialty = 'other'
        subcategory = '物販'
      } else if (name.includes('麻酔') || name.includes('針') || name.includes('パック') || name.includes('anesthesia') || name.includes('needle') || name.includes('pack')) {
        specialty = 'other'
        subcategory = '麻酔・針・パック'
      } else if (name.includes('手術') || name.includes('surgery') || name.includes('外科')) {
        specialty = 'surgery'
        subcategory = 'その他外科'
      }

      const revenue = record.totalWithTax || 0
      hierarchy[specialty].totalRevenue += revenue
      hierarchy[specialty].totalCount += 1
      
      if (hierarchy[specialty].subcategories[subcategory as keyof typeof hierarchy[typeof specialty]['subcategories']]) {
        const subcategoryData = hierarchy[specialty].subcategories[subcategory as keyof typeof hierarchy[typeof specialty]['subcategories']] as { revenue: number, count: number }
        subcategoryData.revenue += revenue
        subcategoryData.count += 1
      }
    })

    // Calculate average unit prices
    Object.keys(hierarchy).forEach(key => {
      const specialty = hierarchy[key as keyof typeof hierarchy]
      specialty.averageUnitPrice = specialty.totalCount > 0 ? specialty.totalRevenue / specialty.totalCount : 0
    })

    return hierarchy
  }

  const hierarchyData = calculateTreatmentHierarchy()

  if (!hierarchyData) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 mb-4 border-b-2 border-blue-500 rounded-full animate-spin mx-auto"></div>
            <p className="text-lg text-gray-600">データを読み込み中...</p>
          </div>
        </div>
      </div>
    )
  }

  const hospitalOptions = [
    { id: 'all', name: '全院' },
    { id: 'yokohama', name: '横浜院' },
    { id: 'koriyama', name: '郡山院' },
    { id: 'mito', name: '水戸院' },
    { id: 'omiya', name: '大宮院' }
  ]

  return (
    <div className="space-y-6">
      {/* Sample Data Notice */}
      {(!state.apiConnected || !state.data.dailyAccounts.length) && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            📊 サンプルデータを表示中 - 実際のデータを表示するにはAPIに接続してください
          </p>
        </div>
      )}

      {/* Header with Hospital Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">施術階層分析</h2>
            <p className="text-gray-600">治療カテゴリー別の売上・件数分析</p>
          </div>
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">院選択:</label>
            <div className="flex space-x-2">
              {hospitalOptions.map(hospital => (
                <button
                  key={hospital.id}
                  onClick={() => setSelectedHospital(hospital.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedHospital === hospital.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Building2 className="w-4 h-4 inline mr-1" />
                  {hospital.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Specialty Overview Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(hierarchyData).map(([key, specialty]) => {
          const Icon = specialty.icon
          return (
            <div key={key} className={`p-4 rounded-lg border ${specialty.bgColor} ${specialty.borderColor}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Icon className={`w-5 h-5 ${specialty.color}`} />
                  <h3 className={`font-semibold ${specialty.color}`}>{specialty.name}</h3>
                </div>
                <TrendingUp className="w-4 h-4 text-gray-400" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">売上:</span>
                  <span className="font-semibold">{formatCurrency(specialty.totalRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">件数:</span>
                  <span className="font-semibold">{formatNumber(specialty.totalCount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">単価:</span>
                  <span className="font-semibold">{formatCurrency(specialty.averageUnitPrice)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Detailed Hierarchy Breakdown */}
      <div className="space-y-6">
        {Object.entries(hierarchyData).map(([key, specialty]) => {
          const Icon = specialty.icon
          const hasData = specialty.totalCount > 0
          
          if (!hasData) return null

          return (
            <div key={key} className="p-6 bg-white rounded-lg shadow">
              <div className="flex items-center space-x-3 mb-4">
                <Icon className={`w-6 h-6 ${specialty.color}`} />
                <h3 className={`text-lg font-semibold ${specialty.color}`}>{specialty.name}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>売上: {formatCurrency(specialty.totalRevenue)}</span>
                  <span>件数: {formatNumber(specialty.totalCount)}</span>
                  <span>単価: {formatCurrency(specialty.averageUnitPrice)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(specialty.subcategories).map(([subKey, subcategory]) => {
                  const sub = subcategory as any
                  if (sub.count === 0) return null
                  
                  const averageUnitPrice = sub.count > 0 ? sub.revenue / sub.count : 0
                  
                  return (
                    <div key={subKey} className="p-3 border rounded-lg bg-gray-50">
                      <div className="font-medium text-gray-900">{subKey}</div>
                      <div className="mt-2 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">売上:</span>
                          <span className="font-medium">{formatCurrency(sub.revenue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">件数:</span>
                          <span className="font-medium">{formatNumber(sub.count)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">単価:</span>
                          <span className="font-medium">{formatCurrency(averageUnitPrice)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
