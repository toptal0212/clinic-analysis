'use client'

import React, { useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend } from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend)

interface PersonalGoal {
  staffName: string
  targetAmount: number
  targetUnitPrice: number
}

interface PersonalGoalProgressProps {
  goals: PersonalGoal[]
}

export default function PersonalGoalProgress({ goals }: PersonalGoalProgressProps) {
  const { state } = useDashboard()

  // Calculate progress for each goal
  const progressData = useMemo(() => {
    if (!state.data.dailyAccounts || goals.length === 0) return []

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    return goals.map(goal => {
      // Filter records for this staff member in current month
      const staffRecords = state.data.dailyAccounts.filter((record: any) => {
        const recordDate = new Date(record.recordDate || record.visitDate || record.accountingDate)
        if (isNaN(recordDate.getTime())) return false
        
        const isCurrentMonth = recordDate.getFullYear() === currentYear && 
                              recordDate.getMonth() === currentMonth
        
        const isStaffMember = record.reservationStaffName === goal.staffName ||
                             (Array.isArray(record.paymentItems) && 
                              record.paymentItems.some((item: any) => item.mainStaffName === goal.staffName))
        
        return isCurrentMonth && isStaffMember
      })

      // Calculate actual sales and unit price
      const actualSales = staffRecords.reduce((sum: number, record: any) => {
        if (Array.isArray(record.paymentItems) && record.paymentItems.length > 0) {
          return sum + record.paymentItems.reduce((s: number, item: any) => s + (item.priceWithTax || 0), 0)
        }
        return sum + (record.totalWithTax || 0)
      }, 0)

      const actualCount = staffRecords.length
      const actualUnitPrice = actualCount > 0 ? actualSales / actualCount : 0

      // Calculate progress rate
      const salesProgressRate = goal.targetAmount > 0 ? (actualSales / goal.targetAmount) * 100 : 0
      const unitPriceProgressRate = goal.targetUnitPrice > 0 ? (actualUnitPrice / goal.targetUnitPrice) * 100 : 0

      return {
        staffName: goal.staffName,
        targetAmount: goal.targetAmount,
        targetUnitPrice: goal.targetUnitPrice,
        actualSales,
        actualUnitPrice,
        actualCount,
        salesProgressRate,
        unitPriceProgressRate
      }
    })
  }, [state.data.dailyAccounts, goals])

  // Chart data for sales progress
  const salesChartData = {
    labels: progressData.map(d => d.staffName),
    datasets: [
      {
        label: '目標金額',
        data: progressData.map(d => d.targetAmount),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      },
      {
        label: '実績金額',
        data: progressData.map(d => d.actualSales),
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1
      },
      {
        type: 'line' as const,
        label: '進捗率',
        data: progressData.map(d => d.targetAmount * (d.salesProgressRate / 100)),
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: false,
        yAxisID: 'y1'
      }
    ]
  }

  // Chart data for unit price progress
  const unitPriceChartData = {
    labels: progressData.map(d => d.staffName),
    datasets: [
      {
        label: '目標単価',
        data: progressData.map(d => d.targetUnitPrice),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      },
      {
        label: '実績単価',
        data: progressData.map(d => d.actualUnitPrice),
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1
      },
      {
        type: 'line' as const,
        label: '進捗率',
        data: progressData.map(d => d.targetUnitPrice * (d.unitPriceProgressRate / 100)),
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: false,
        yAxisID: 'y1'
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => `¥${(value / 1000).toFixed(0)}K`
        }
      },
      y1: {
        type: 'linear' as const,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: (value: any) => `${value.toFixed(0)}%`
        }
      }
    }
  } as any

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">個人目標進捗率</h2>

      {/* Progress Table */}
      <div className="p-6 bg-white border rounded-lg shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">進捗状況</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 font-semibold text-left text-gray-700">スタッフ名</th>
                <th className="px-4 py-2 font-semibold text-right text-gray-700">目標金額</th>
                <th className="px-4 py-2 font-semibold text-right text-gray-700">実績金額</th>
                <th className="px-4 py-2 font-semibold text-right text-gray-700">進捗率</th>
                <th className="px-4 py-2 font-semibold text-right text-gray-700">目標単価</th>
                <th className="px-4 py-2 font-semibold text-right text-gray-700">実績単価</th>
                <th className="px-4 py-2 font-semibold text-right text-gray-700">進捗率</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {progressData.map((data, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">{data.staffName}</td>
                  <td className="px-4 py-2 text-right text-gray-900">{formatCurrency(data.targetAmount)}</td>
                  <td className="px-4 py-2 text-right text-gray-900">{formatCurrency(data.actualSales)}</td>
                  <td className="px-4 py-2 text-right">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      data.salesProgressRate >= 100 
                        ? 'text-green-700 bg-green-100' 
                        : data.salesProgressRate >= 80
                        ? 'text-yellow-700 bg-yellow-100'
                        : 'text-red-700 bg-red-100'
                    }`}>
                      {data.salesProgressRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-gray-900">{formatCurrency(data.targetUnitPrice)}</td>
                  <td className="px-4 py-2 text-right text-gray-900">{formatCurrency(data.actualUnitPrice)}</td>
                  <td className="px-4 py-2 text-right">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      data.unitPriceProgressRate >= 100 
                        ? 'text-green-700 bg-green-100' 
                        : data.unitPriceProgressRate >= 80
                        ? 'text-yellow-700 bg-yellow-100'
                        : 'text-red-700 bg-red-100'
                    }`}>
                      {data.unitPriceProgressRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sales Progress Chart */}
      <div className="p-6 bg-white border rounded-lg shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">売上進捗率グラフ</h3>
        <div className="h-80">
          <Bar data={salesChartData as any} options={chartOptions} />
        </div>
      </div>

      {/* Unit Price Progress Chart */}
      <div className="p-6 bg-white border rounded-lg shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">単価進捗率グラフ</h3>
        <div className="h-80">
          <Bar data={unitPriceChartData as any} options={chartOptions} />
        </div>
      </div>
    </div>
  )
}

