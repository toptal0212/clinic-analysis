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
import GoalManagement from './GoalManagement'
import RepeatAnalysis from './RepeatAnalysis'
import ErrorDisplay from './ErrorDisplay'
import ServicesAnalysis from './ServicesAnalysis'
import AdvertisingAnalysis from './AdvertisingAnalysis'
import TreatmentHierarchyAnalysis from './TreatmentHierarchyAnalysis'
import ClinicDataView from './ClinicDataView'
import HospitalTrendGraphs from './HospitalTrendGraphs'
import AnnualSales from './AnnualSales'
import DebugDisplay from './DebugDisplay'
import SalesTableAnalysis from './SalesTableAnalysis'
import Cancellation from './Cancellation'
import TreatmentCategoryDebug from './TreatmentCategoryDebug'
import SalesAnalysis from './SalesAnalysis'
import TreatmentTrendAnalysis from './TreatmentTrendAnalysis'
import CrossSell from './CrossSell'
import TreatmentSalesTrend from './TreatmentSalesTrend'
import StaffSales from './StaffSales'
import SalesComparison from './SalesComparison'
import CustomerAttributesAnalysis from './CustomerAttributesAnalysis'
import ClinicSales from './ClinicSales'
import MonthlyProgress from './MonthlyProgress'

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
      case 'sales-analysis':
        return <SalesAnalysis />
      case 'treatment-trend':
        return <TreatmentTrendAnalysis />
      case 'treatment-sales':
        return <TreatmentSalesTrend />
      case 'annual-sales':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">年間売上推移</h2>
            <AnnualSales />
          </div>
        )
      case 'cancellation':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">予約キャンセル</h2>
            <Cancellation />
          </div>
        )
      case 'repeat-analysis':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">リ ピー 卜分析</h2>
            <RepeatAnalysis />
          </div>
        )
      case 'cross-sell':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">クロスセル</h2>
            <CrossSell />
          </div>
        )
      case 'staff-sales':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">ス夕ッフ別売上</h2>
            <StaffSales />
          </div>
        )
      case 'sales-comparison':
        return <SalesComparison />
      case 'customer-attributes':
        return <CustomerAttributesAnalysis />
      case 'clinic-comparison':
        return <ClinicComparison />
      case 'clinic-sales':
        return <ClinicSales />
      case 'monthly-progress':
        return <MonthlyProgress />
      case 'summary':
        return <SummaryAnalysis />
      case 'daily':
        return <DailyAnalysis dateRange={dateRange} />
      case 'comparison':
        return <ClinicComparison />
      case 'patients':
        return <PatientDetails />
      case 'services':
        return <ServicesAnalysis />
      case 'goals':
        return <GoalManagement />
      case 'repeat':
        return <RepeatAnalysis />
      case 'advertising':
        return <AdvertisingAnalysis />
      case 'treatment-hierarchy':
        return <TreatmentHierarchyAnalysis dateRange={dateRange} />
      case 'clinic-data':
        return <ClinicDataView dateRange={dateRange} />
      case 'hospital-trends':
        return <HospitalTrendGraphs dateRange={dateRange} />
      case 'debug':
        return <DebugDisplay />
      case 'sales-table':
        return <SalesTableAnalysis dateRange={dateRange} />
      case 'treatment-category-debug':
        return <TreatmentCategoryDebug />
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