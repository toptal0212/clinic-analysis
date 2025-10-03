'use client'

import { Users, DollarSign, Target } from 'lucide-react'
import { useDashboard } from '@/contexts/DashboardContext'
import { useMemo } from 'react'

interface KPICardProps {
  title: string
  value: string
  forecast?: string
  icon: React.ComponentType<{ className?: string }>
}

function KPICard({ title, value, forecast, icon: Icon }: KPICardProps) {
  return (
    <div className="card">
      <div className="card-content">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="mb-1 text-sm font-medium text-gray-500">{title}</h3>
            <p className="mb-2 text-2xl font-bold text-gray-900">{value}</p>
            
            {forecast && (
              <p className="mb-1 text-sm text-gray-600">
                今月見込: {forecast}
              </p>
            )}
          </div>
          
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary-100">
              <Icon className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function KPICards() {
  const { state } = useDashboard()

  const kpiData = useMemo(() => {
    if (!state.apiConnected || !state.data.dailyAccounts.length) {
      // Return default data when no API connection
      return [
        {
          title: '今月来院数',
          value: 'データ未接続',
          icon: Users
        },
        {
          title: '今月会計単価',
          value: 'データ未接続',
          icon: DollarSign
        },
        {
          title: '今月売上',
          value: 'データ未接続',
          icon: Target
        }
      ]
    }

    // Use pre-calculated current month metrics from daily accounts data
    const { visitCount, accountingUnitPrice, revenue } = state.currentMonthMetrics

    return [
      {
        title: '今月来院数',
        value: `${visitCount.toLocaleString()}件`,
        icon: Users
      },
      {
        title: '今月会計単価',
        value: `¥${accountingUnitPrice.toLocaleString()}`,
        icon: DollarSign
      },
      {
        title: '今月売上',
        value: `¥${revenue.toLocaleString()}`,
        icon: Target
      }
    ]
  }, [state.apiConnected, state.data.dailyAccounts.length, state.currentMonthMetrics])

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {kpiData.map((kpi, index) => (
        <KPICard key={index} {...kpi} />
      ))}
    </div>
  )
}