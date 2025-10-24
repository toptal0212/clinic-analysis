'use client'

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { useDashboard } from '@/contexts/DashboardContext'
import { useMemo, useState, useEffect, useCallback } from 'react'
import { Building2 } from 'lucide-react'

ChartJS.register(ArcElement, Tooltip, Legend)

interface DemographicsChartProps {
  title: string
  data: {
    labels: string[]
    datasets: {
      data: number[]
      backgroundColor: string[]
      borderWidth: number
    }[]
  }
}

function DemographicsChart({ title, data, hospitalId }: DemographicsChartProps & { hospitalId: string }) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || ''
            const value = context.parsed
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: ${percentage}%`
          }
        }
      }
    }
  }

  // Force re-render by creating a new chart instance
  const chartKey = `${title}-${hospitalId}-${Date.now()}`
  const timestamp = new Date().toLocaleTimeString()

  return (
    <div className="mb-4 card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <div className="text-xs text-gray-500">
            {timestamp}
          </div>
        </div>
        <div className="mt-1 text-xs text-gray-500">Hospital: {hospitalId}</div>
      </div>
      <div className="card-content">
        <div className="h-60">
          <Doughnut key={chartKey} data={data} options={options} />
        </div>
      </div>
    </div>
  )
}

export default function DemographicsCharts() {
  const { state } = useDashboard()
  const [selectedHospital, setSelectedHospital] = useState<string>('all')
  const [chartVersion, setChartVersion] = useState<number>(0)

  const hospitalOptions = [
    { id: 'all', name: '全院' },
    { id: 'yokohama', name: '横浜院' },
    { id: 'koriyama', name: '郡山院' },
    { id: 'mito', name: '水戸院' },
    { id: 'omiya', name: '大宮院' }
  ]

  // Force chart update when hospital changes
  const handleHospitalChange = useCallback((hospitalId: string) => {
    const hospitalName = (['all','yokohama','koriyama','mito','omiya'] as const)
      .map(id => hospitalOptions.find(h => h.id === id))
      .find(h => h?.id === hospitalId)?.name || hospitalId

    // Determine target data count at click time
    let dailyCount = 0
    if (hospitalId === 'all') {
      dailyCount = state.data.dailyAccounts?.length || 0
    } else {
      const clinic = state.data.clinicData?.[hospitalId as keyof typeof state.data.clinicData]
      dailyCount = clinic?.dailyAccounts?.length || 0
    }

    console.log('🖱️ [DemographicsCharts] 院選択 クリック:', { id: hospitalId, name: hospitalName, dailyAccountsCount: dailyCount })
    setSelectedHospital(hospitalId)
    setChartVersion(prev => prev + 1)
  }, [hospitalOptions, state.data.clinicData, state.data.dailyAccounts])

  // Create simple test data that changes based on hospital selection
  const createTestData = useCallback((hospitalId: string) => {
    console.log('📊 [DemographicsCharts] Creating test data for hospital:', hospitalId)
    
    // Different data for each hospital
    const hospitalData = {
      'all': {
        ageGroups: { labels: ['20代', '30代', '40代', '50代'], data: [30, 40, 20, 10] },
        gender: { labels: ['女性', '男性'], data: [70, 30] },
        mediaSource: { labels: ['ホームページ', 'Instagram', '口コミ', 'その他'], data: [40, 30, 20, 10] },
        visitType: { labels: ['初診', '再診'], data: [30, 70] }
      },
      'yokohama': {
        ageGroups: { labels: ['20代', '30代', '40代', '50代'], data: [40, 30, 20, 10] },
        gender: { labels: ['女性', '男性'], data: [80, 20] },
        mediaSource: { labels: ['ホームページ', 'Instagram', '口コミ', 'その他'], data: [50, 20, 20, 10] },
        visitType: { labels: ['初診', '再診'], data: [40, 60] }
      },
      'koriyama': {
        ageGroups: { labels: ['20代', '30代', '40代', '50代'], data: [20, 50, 20, 10] },
        gender: { labels: ['女性', '男性'], data: [60, 40] },
        mediaSource: { labels: ['ホームページ', 'Instagram', '口コミ', 'その他'], data: [30, 40, 20, 10] },
        visitType: { labels: ['初診', '再診'], data: [20, 80] }
      },
      'mito': {
        ageGroups: { labels: ['20代', '30代', '40代', '50代'], data: [30, 30, 30, 10] },
        gender: { labels: ['女性', '男性'], data: [75, 25] },
        mediaSource: { labels: ['ホームページ', 'Instagram', '口コミ', 'その他'], data: [40, 30, 30, 0] },
        visitType: { labels: ['初診', '再診'], data: [35, 65] }
      },
      'omiya': {
        ageGroups: { labels: ['20代', '30代', '40代', '50代'], data: [20, 30, 30, 20] },
        gender: { labels: ['女性', '男性'], data: [65, 35] },
        mediaSource: { labels: ['ホームページ', 'Instagram', '口コミ', 'その他'], data: [30, 30, 20, 20] },
        visitType: { labels: ['初診', '再診'], data: [25, 75] }
      }
    }

    return hospitalData[hospitalId as keyof typeof hospitalData] || hospitalData['all']
  }, [])

  const chartsData = useMemo(() => {
    const testData = createTestData(selectedHospital)
    
    // Color palettes for different chart types
    const colorPalettes = {
      ageGroups: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
      gender: ['#EC4899', '#3B82F6'],
      mediaSource: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
      visitType: ['#10B981', '#3B82F6']
    }

    // Helper function to create chart data
    const createChartData = (demographicData: { labels: string[], data: number[] }, palette: string[]) => {
      return {
        labels: demographicData.labels,
        datasets: [{
          data: demographicData.data,
          backgroundColor: palette.slice(0, demographicData.labels.length),
          borderWidth: 0
        }]
      }
    }

    console.log('📊 [DemographicsCharts] Using test data for hospital:', selectedHospital)
    console.log('📊 [DemographicsCharts] Test data:', testData)
    // 年代別 debug
    console.log('🧭 [DemographicsCharts] 年代別 labels:', testData.ageGroups.labels)
    console.log('🧭 [DemographicsCharts] 年代別 values:', testData.ageGroups.data)

    return [
      {
        title: '年代別',
        data: createChartData(testData.ageGroups, colorPalettes.ageGroups)
      },
      {
        title: '性別',
        data: createChartData(testData.gender, colorPalettes.gender)
      },
      {
        title: '媒体別',
        data: createChartData(testData.mediaSource, colorPalettes.mediaSource)
      },
      {
        title: '初診・再診別',
        data: createChartData(testData.visitType, colorPalettes.visitType)
      },
    ]
  }, [selectedHospital, chartVersion, createTestData])

  // Show empty state if no API connection
  if (!state.apiConnected) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500">データ接続が必要です</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hospital Selection */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">院選択:</span>
          </div>
        <div className="flex space-x-2">
          {hospitalOptions.map((hospital) => (
            <button
              key={hospital.id}
              onClick={() => handleHospitalChange(hospital.id)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                selectedHospital === hospital.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {hospital.name}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-500">
          選択中: {hospitalOptions.find(h => h.id === selectedHospital)?.name}
        </div>
        </div>
        <div className="text-xs text-gray-500">
          最終更新: {new Date().toLocaleTimeString()}
        </div>
      </div>


      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {chartsData.map((chart, index) => (
          <DemographicsChart 
            key={`${selectedHospital}-${chartVersion}-${index}`} 
            {...chart} 
            hospitalId={selectedHospital}
          />
        ))}
      </div>
    </div>
  )
}