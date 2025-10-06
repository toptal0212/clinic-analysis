'use client'

import { useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import KPICards from './KPICards'
import RevenueChart from './RevenueChart'
import DataTable from './DataTable'
import DemographicsCharts from './DemographicsCharts'
import SummaryAnalysis from './SummaryAnalysis'
import DailyAnalysis from './DailyAnalysis'
import ClinicComparison from './ClinicComparison'
import PatientDetails from './PatientDetails'
import GoalTracking from './GoalTracking'
import RepeatAnalysis from './RepeatAnalysis'
import ErrorDisplay from './ErrorDisplay'
import ServicesAnalysis from './ServicesAnalysis'

interface DashboardProps {
  activeTab: string
  tabLoading: boolean
}

export default function Dashboard({ activeTab, tabLoading }: DashboardProps) {
  const { state } = useDashboard()
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)
    return {
      start: thirtyDaysAgo,
      end: today
    }
  })

  const LoadingScreen = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-12 h-12 mb-4 border-b-2 border-blue-500 rounded-full animate-spin"></div>
      <p className="text-lg text-gray-600">データを計算中...</p>
      <p className="mt-2 text-sm text-gray-500">しばらくお待ちください</p>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* KPI Cards */}
            <KPICards />
            
            {/* Charts and Data Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Revenue Chart - Takes 2 columns */}
              <div className="lg:col-span-2">
                <RevenueChart />
              </div>
              
              {/* Demographics Charts - Takes 2 columns */}
              <div className="lg:col-span-2">
                <DemographicsCharts />
              </div>
            </div>
            
            {/* Data Table */}
            <DataTable />
          </div>
        )
      case 'summary':
        return <SummaryAnalysis />
      case 'daily':
        return <DailyAnalysis dateRange={dateRange} />
      case 'comparison':
        return <ClinicComparison dateRange={dateRange} />
      case 'patients':
        return <PatientDetails />
      case 'services':
        return <ServicesAnalysis />
      case 'goals':
        return <GoalTracking />
      case 'repeat':
        return <RepeatAnalysis />
      case 'errors':
        return <ErrorDisplay errors={[]} />
      default:
        return null
    }
  }

  return (
    <div className="p-6">
      {/* Content */}
      {tabLoading ? <LoadingScreen /> : renderContent()}
    </div>
  )
}