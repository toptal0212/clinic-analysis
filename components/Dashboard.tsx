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
import { 
  BarChart3,
  Calendar,
  Users,
  Target,
  RefreshCw,
  TrendingUp,
  Home,
  AlertTriangle,
  Package
} from 'lucide-react'

export default function Dashboard() {
  const { state } = useDashboard()
  const [activeTab, setActiveTab] = useState('overview')
  const [tabLoading, setTabLoading] = useState(false)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date()
  })

  const tabs = [
    { id: 'overview', name: '概要', icon: Home },
    { id: 'summary', name: 'サマリー分析', icon: BarChart3 },
    { id: 'daily', name: '日別分析', icon: Calendar },
    { id: 'comparison', name: '全院比較', icon: TrendingUp },
    { id: 'patients', name: '来院者情報', icon: Users },
    { id: 'services', name: '役務分析', icon: Package },
    { id: 'goals', name: '目標達成率', icon: Target },
    { id: 'repeat', name: 'リピート率', icon: RefreshCw },
    { id: 'errors', name: 'エラー表示', icon: AlertTriangle }
  ]

  const handleTabClick = async (tabId: string) => {
    if (tabId === activeTab) return
    
    setTabLoading(true)
    setActiveTab(tabId)
    
    // Simulate calculation time for data processing
    if (state.apiConnected) {
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
    
    setTabLoading(false)
  }

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
      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  disabled={tabLoading}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } ${tabLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      {tabLoading ? <LoadingScreen /> : renderContent()}
    </div>
  )
}