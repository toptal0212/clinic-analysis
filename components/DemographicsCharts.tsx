'use client'

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { useDashboard } from '@/contexts/DashboardContext'
import { useMemo, useState, useEffect, useCallback } from 'react'

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
  const hasData = data?.labels?.length > 0 && data?.datasets?.[0]?.data?.some((val: number) => val > 0)

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
            if (total === 0) return `${label}: 0%`
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: ${percentage}%`
          }
        }
      }
    }
  }

  // Use stable key instead of Date.now() to avoid hydration mismatch
  const chartKey = `${title}-${hospitalId}`

  return (
    <div className="mb-4 card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="mt-1 text-xs text-gray-500">Hospital: {hospitalId}</div>
      </div>
      <div className="card-content">
        <div className="h-60">
          {hasData ? (
            <Doughnut key={chartKey} data={data} options={options} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <p className="text-sm">データがありません</p>
                <p className="text-xs mt-1">APIに接続するかCSVファイルをインポートしてください</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DemographicsCharts() {
  const { state } = useDashboard()
  const [clientTimestamp, setClientTimestamp] = useState<string>('')
  const selectedHospital = state.selectedClinic || 'all'

  // Build demographics from real data
  const buildDemographicsFromData = useCallback((hospitalId: string) => {
    const all = [] as any[]
    
    // Collect all data from various sources
    if (hospitalId === 'all') {
      // Add main dailyAccounts
      if (state.data?.dailyAccounts && Array.isArray(state.data.dailyAccounts)) {
        all.push(...state.data.dailyAccounts)
      }
      
      // Add clinic-specific dailyAccounts
      if (state.data?.clinicData) {
        Object.values(state.data.clinicData).forEach((c: any) => {
          if (c?.dailyAccounts && Array.isArray(c.dailyAccounts)) {
            all.push(...c.dailyAccounts)
          }
        })
      }
    } else {
      // For specific clinic, check both clinicData and filter by clinicName
      const clinic = state.data?.clinicData?.[hospitalId as keyof typeof state.data.clinicData]
      if (clinic?.dailyAccounts && Array.isArray(clinic.dailyAccounts)) {
        all.push(...clinic.dailyAccounts)
      }
      
      // Also check main dailyAccounts filtered by clinicName
      if (state.data?.dailyAccounts && Array.isArray(state.data.dailyAccounts)) {
        const clinicName = hospitalId === 'yokohama' ? '横浜院' :
                          hospitalId === 'koriyama' ? '郡山院' :
                          hospitalId === 'mito' ? '水戸院' :
                          hospitalId === 'omiya' ? '大宮院' : hospitalId
        all.push(...state.data.dailyAccounts.filter((r: any) => 
          (r.clinicName || '') === clinicName || (r.clinic || '') === clinicName
        ))
      }
    }

    // Log sample record structure for debugging
    if (all.length > 0) {
      console.log('📊 [DemographicsCharts] Sample record structure:', {
        firstRecord: all[0],
        sampleFields: {
          visitorAge: all[0]?.visitorAge,
          visitorGender: all[0]?.visitorGender,
          visitorInflowSourceName: all[0]?.visitorInflowSourceName,
          isFirst: all[0]?.isFirst,
          age: all[0]?.age,
          gender: all[0]?.gender,
          patientAge: all[0]?.patientAge,
          patientGender: all[0]?.patientGender
        }
      })
    }

    console.log('📊 [DemographicsCharts] Data collection:', {
      hospitalId,
      totalRecords: all.length,
      dailyAccountsCount: state.data?.dailyAccounts?.length || 0,
      clinicDataKeys: state.data?.clinicData ? Object.keys(state.data.clinicData) : [],
      clinicDataCounts: state.data?.clinicData ? Object.entries(state.data.clinicData).map(([key, value]: [string, any]) => ({
        key,
        dailyAccountsCount: value?.dailyAccounts?.length || 0
      })) : []
    })

    // Helpers
    const inc = (map: Map<string, number>, key: string) => map.set(key, (map.get(key) || 0) + 1)

    const ageMap = new Map<string, number>()
    const genderMap = new Map<string, number>()
    const sourceMap = new Map<string, number>()
    const visitTypeMap = new Map<string, number>()

    all.forEach((r: any) => {
      // Age groups - check actual API field names first (visitorAge), then fallback to other field names
      const ageNum = Number(r.visitorAge ?? r.age ?? r.patientAge ?? r.ageGroup ?? null)
      if (Number.isFinite(ageNum) && ageNum > 0 && ageNum < 150) {
        const decade = `${Math.floor(ageNum / 10) * 10}代`
        inc(ageMap, decade)
      } else {
        inc(ageMap, '不明')
      }

      // Gender - check actual API field names first (visitorGender), then fallback
      const gender = (r.visitorGender ?? r.gender ?? r.patientGender ?? r.sex ?? 'その他').toString().trim()
      inc(genderMap, gender || 'その他')

      // Media source - check actual API field names first (visitorInflowSourceName), then fallback
      const source = (r.visitorInflowSourceName ?? r.referralSource ?? r.leadSource ?? r.mediaSource ?? r.appointmentRoute ?? 'その他').toString().trim()
      inc(sourceMap, source || 'その他')

      // Visit type - check isFirst field (direct from API)
      const isFirst = r.isFirst === true || r.isFirstVisit === true || r.isNewPatient === true || r.visitType === 'first' || r.visitType === '初診'
      const visitType = isFirst ? '初診' : '再診'
      inc(visitTypeMap, visitType)
    })

    const toChart = (map: Map<string, number>) => {
      const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1])
      const labels = entries.map(([label]) => label)
      const data = entries.map(([, value]) => value)
      return { labels, data }
    }

    const result = {
      ageGroups: toChart(ageMap),
      gender: toChart(genderMap),
      mediaSource: toChart(sourceMap),
      visitType: toChart(visitTypeMap)
    }

    console.log('📊 [DemographicsCharts] Demographics calculated:', {
      hospitalId,
      totalRecordsProcessed: all.length,
      ageGroups: {
        labels: result.ageGroups.labels,
        counts: result.ageGroups.data,
        total: result.ageGroups.data.reduce((a, b) => a + b, 0)
      },
      gender: {
        labels: result.gender.labels,
        counts: result.gender.data,
        total: result.gender.data.reduce((a, b) => a + b, 0)
      },
      mediaSource: {
        labels: result.mediaSource.labels,
        counts: result.mediaSource.data,
        total: result.mediaSource.data.reduce((a, b) => a + b, 0)
      },
      visitType: {
        labels: result.visitType.labels,
        counts: result.visitType.data,
        total: result.visitType.data.reduce((a, b) => a + b, 0)
      }
    })

    return result
  }, [state.data?.dailyAccounts, state.data?.clinicData])

  const chartsData = useMemo(() => {
    const d = buildDemographicsFromData(selectedHospital)
    
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

    return [
      {
        title: '年代別',
        data: createChartData(d.ageGroups, colorPalettes.ageGroups)
      },
      {
        title: '性別',
        data: createChartData(d.gender, colorPalettes.gender)
      },
      {
        title: '媒体別',
        data: createChartData(d.mediaSource, colorPalettes.mediaSource)
      },
      {
        title: '初診・再診別',
        data: createChartData(d.visitType, colorPalettes.visitType)
      },
    ]
  }, [selectedHospital, buildDemographicsFromData])

  // Set timestamp only on client side to avoid hydration mismatch
  useEffect(() => {
    setClientTimestamp(new Date().toLocaleTimeString('ja-JP', { hour12: false }))
  }, [])

  // Show sample data even without API connection
  // if (!state.apiConnected) {
  //   return (
  //     <div className="py-8 text-center">
  //       <p className="text-gray-500">データ接続が必要です</p>
  //     </div>
  //   )
  // }

  return (
    <div className="space-y-6">
      {clientTimestamp && (
        <div className="text-right text-xs text-gray-500">
          最終更新: {clientTimestamp}
        </div>
      )}


      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {chartsData.length > 0 ? (
          chartsData.map((chart, index) => (
            <DemographicsChart 
              key={`${selectedHospital}-${index}`} 
              {...chart} 
              hospitalId={selectedHospital}
            />
          ))
        ) : (
          <div className="col-span-2 p-8 text-center text-gray-500">
            <p className="text-lg">データがありません</p>
            <p className="text-sm mt-2">APIに接続するかCSVファイルをインポートしてください</p>
          </div>
        )}
      </div>
    </div>
  )
}