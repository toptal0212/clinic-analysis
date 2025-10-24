'use client'

import { Users, DollarSign, Target, Building2 } from 'lucide-react'
import { useDashboard } from '@/contexts/DashboardContext'
import { useMemo, useState } from 'react'

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
  const [selectedHospital, setSelectedHospital] = useState<string>('all')

  const hospitalOptions = [
    { id: 'all', name: '全院' },
    { id: 'yokohama', name: '横浜院' },
    { id: 'koriyama', name: '郡山院' },
    { id: 'mito', name: '水戸院' },
    { id: 'omiya', name: '大宮院' }
  ]

  const kpiData = useMemo(() => {
    if (!state.apiConnected || !state.data.clinicData) {
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

    // Calculate metrics based on selected hospital
    let dailyAccounts = []
    if (selectedHospital === 'all') {
      // Use combined data
      dailyAccounts = state.data.dailyAccounts || []
    } else {
      // Use specific hospital data
      const clinicData = state.data.clinicData[selectedHospital as keyof typeof state.data.clinicData]
      dailyAccounts = clinicData?.dailyAccounts || []
    }

    // Calculate current month metrics
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()

    const currentMonthData = dailyAccounts.filter(record => {
      const recordDate = new Date(record.recordDate)
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear
    })

    const visitCount = currentMonthData.length
    const revenue = currentMonthData.reduce((sum, record) => sum + (record.totalWithTax || 0), 0)
    const accountingUnitPrice = visitCount > 0 ? revenue / visitCount : 0

    return [
      {
        title: '今月来院数',
        value: `${visitCount.toLocaleString()}件`,
        icon: Users
      },
      {
        title: '今月会計単価',
        value: `¥${Math.round(accountingUnitPrice).toLocaleString()}`,
        icon: DollarSign
      },
      {
        title: '今月売上',
        value: `¥${revenue.toLocaleString()}`,
        icon: Target
      }
    ]
  }, [state.apiConnected, state.data.clinicData, state.data.dailyAccounts, selectedHospital])

  return (
    <div className="space-y-6">
      {/* Hospital Selection */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Building2 className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">院選択:</span>
        </div>
        <div className="flex space-x-2">
          {hospitalOptions.map((hospital) => (
            <button
              key={hospital.id}
              onClick={() => setSelectedHospital(hospital.id)}
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
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>
    </div>
  )
}