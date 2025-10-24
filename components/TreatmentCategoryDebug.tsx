'use client'

import React, { useMemo, useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { Database, AlertTriangle, X, BarChart3 } from 'lucide-react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

export default function TreatmentCategoryDebug() {
  const { state } = useDashboard()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const treatmentCategories = useMemo(() => {
    if (!state.data.dailyAccounts?.length) return []

    const categories = new Map<string, { 
      count: number, 
      examples: string[],
      yokohama: number,
      koriyama: number,
      mito: number,
      omiya: number
    }>()
    
    state.data.dailyAccounts.forEach(record => {
      const treatmentCategory = record.paymentItems?.[0]?.category || '未分類'
      const treatmentName = record.paymentItems?.[0]?.name || record.treatmentName || '未分類'
      
      if (!categories.has(treatmentCategory)) {
        categories.set(treatmentCategory, { 
          count: 0, 
          examples: [],
          yokohama: 0,
          koriyama: 0,
          mito: 0,
          omiya: 0
        })
      }
      
      const categoryData = categories.get(treatmentCategory)!
      categoryData.count++
      
      if (categoryData.examples.length < 3 && !categoryData.examples.includes(treatmentName)) {
        categoryData.examples.push(treatmentName)
      }

      // Count by hospital based on clinic data
      if (state.data.clinicData) {
        if (state.data.clinicData.yokohama?.dailyAccounts?.some((r: any) => r === record)) {
          categoryData.yokohama++
        }
        if (state.data.clinicData.koriyama?.dailyAccounts?.some((r: any) => r === record)) {
          categoryData.koriyama++
        }
        if (state.data.clinicData.mito?.dailyAccounts?.some((r: any) => r === record)) {
          categoryData.mito++
        }
        if (state.data.clinicData.omiya?.dailyAccounts?.some((r: any) => r === record)) {
          categoryData.omiya++
        }
      }
    })

    return Array.from(categories.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.count - a.count)
  }, [state.data.dailyAccounts, state.data.clinicData])

  // Chart data for treatment categories
  const chartData = useMemo(() => {
    if (!treatmentCategories.length) return null

    const categories = treatmentCategories.map(item => item.category)
    const yokohamaData = treatmentCategories.map(item => item.yokohama)
    const koriyamaData = treatmentCategories.map(item => item.koriyama)
    const mitoData = treatmentCategories.map(item => item.mito)
    const omiyaData = treatmentCategories.map(item => item.omiya)

    return {
      labels: categories,
      datasets: [
        {
          label: '横浜院',
          data: yokohamaData,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
        {
          label: '郡山院',
          data: koriyamaData,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 1,
        },
        {
          label: '水戸院',
          data: mitoData,
          backgroundColor: 'rgba(245, 158, 11, 0.8)',
          borderColor: 'rgba(245, 158, 11, 1)',
          borderWidth: 1,
        },
        {
          label: '大宮院',
          data: omiyaData,
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1,
        },
      ],
    }
  }, [treatmentCategories])

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '治療カテゴリー別件数 (各院比較)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  if (!state.apiConnected) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          <Database className="mx-auto h-12 w-12 mb-4" />
          <p>APIに接続してデータを取得してください</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">治療カテゴリーデバッグ</h2>
        <p className="text-gray-600">データベースから取得した治療カテゴリーと名前の一覧</p>
      </div>

      {/* Summary */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">データサマリー</h3>
        <div className="text-xs text-blue-800 space-y-1">
          <p>• 総レコード数: {state.data.dailyAccounts?.length || 0}</p>
          <p>• 治療カテゴリー数: {treatmentCategories.length}</p>
        </div>
      </div>

      {/* Chart */}
      {chartData && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            治療カテゴリー別件数グラフ
          </h3>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Treatment Categories */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Database className="w-5 h-5 mr-2" />
          治療カテゴリー一覧 (横浜院・郡山院・水戸院・大宮院)
        </h3>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    カテゴリー名
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    件数
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    横浜院
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    郡山院
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    水戸院
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    大宮院
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {treatmentCategories.map((item, index) => (
                  <tr 
                    key={index}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      setSelectedCategory(item.category)
                      setShowModal(true)
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {item.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {item.yokohama}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {item.koriyama}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {item.mito}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {item.omiya}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>


      {/* Instructions */}
      <div className="p-4 bg-yellow-50 rounded-lg">
        <h3 className="text-sm font-medium text-yellow-900 mb-2 flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2" />
          カテゴリー設定方法
        </h3>
        <div className="text-xs text-yellow-800 space-y-1">
          <p>• 上記のカテゴリー名と治療名を確認してください</p>
          <p>• カテゴリー分類は <code>lib/treatmentCategories.ts</code> で設定できます</p>
          <p>• 新しいカテゴリーを追加する場合は、キーワードマッチングを更新してください</p>
          <p>• データベースフィールド: <code>paymentItems[0].category</code> と <code>paymentItems[0].name</code></p>
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                カテゴリー詳細: {selectedCategory}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">治療名例:</h4>
                  <div className="text-sm text-gray-600">
                    {treatmentCategories.find(item => item.category === selectedCategory)?.examples.join(', ') || 'なし'}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">各院の件数:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span>横浜院:</span>
                      <span className="font-medium">{treatmentCategories.find(item => item.category === selectedCategory)?.yokohama || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>郡山院:</span>
                      <span className="font-medium">{treatmentCategories.find(item => item.category === selectedCategory)?.koriyama || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>水戸院:</span>
                      <span className="font-medium">{treatmentCategories.find(item => item.category === selectedCategory)?.mito || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>大宮院:</span>
                      <span className="font-medium">{treatmentCategories.find(item => item.category === selectedCategory)?.omiya || 0}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">総件数:</h4>
                  <div className="text-lg font-semibold text-blue-600">
                    {treatmentCategories.find(item => item.category === selectedCategory)?.count || 0} 件
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
