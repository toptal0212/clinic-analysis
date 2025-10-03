'use client'

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { useDashboard } from '@/contexts/DashboardContext'
import { useMemo } from 'react'

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

function DemographicsChart({ title, data }: DemographicsChartProps) {
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

  return (
    <div className="mb-4 card">
      <div className="card-header">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="card-content">
        <div className="h-48">
          <Doughnut data={data} options={options} />
        </div>
      </div>
    </div>
  )
}

export default function DemographicsCharts() {
  const { state } = useDashboard()

  const chartsData = useMemo(() => {
    // Color palettes for different chart types
    const colorPalettes = {
      ageGroups: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'],
      gender: ['#EC4899', '#3B82F6', '#6B7280'],
      mediaSource: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'],
      visitType: ['#10B981', '#3B82F6'],
      prefecture: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'],
      clinic: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']
    }

    // Helper function to create chart data
    const createChartData = (demographicData: { labels: string[], data: number[] }, palette: string[]) => {
      if (!demographicData.labels.length) {
        return {
          labels: ['データなし'],
          datasets: [{
            data: [1],
            backgroundColor: ['#E5E7EB'],
            borderWidth: 0
          }]
        }
      }

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
        data: createChartData(state.demographics.ageGroups, colorPalettes.ageGroups)
      },
      {
        title: '性別',
        data: createChartData(state.demographics.gender, colorPalettes.gender)
      },
      {
        title: '媒体別',
        data: createChartData(state.demographics.mediaSource, colorPalettes.mediaSource)
      },
      {
        title: '初診・再診別',
        data: createChartData(state.demographics.visitType, colorPalettes.visitType)
      },
    ]
  }, [state.demographics, state.apiConnected])

  // Show empty state if no API connection
  if (!state.apiConnected) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500">データ接続が必要です</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {chartsData.map((chart, index) => (
        <DemographicsChart key={index} {...chart} />
      ))}
    </div>
  )
}