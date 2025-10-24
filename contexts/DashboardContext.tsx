'use client'

import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { MedicalForceAPI, DataProcessor } from '@/lib/api'

// Types
export interface DashboardState {
  selectedPeriod: string
  selectedClinic: string
  dateRange: {
    start: string
    end: string
  }
  filters: {
    dateLevel: string
    conversionThreshold: number
  }
  data: {
    patients: any[]
    accounting: any[]
    appointments: any[]
    services: any[]
    brandCourses: any[]
    dailyAccounts: any[]
    clinicData: {
      yokohama: { dailyAccounts: any[], patients: any[], accounting: any[] }
      koriyama: { dailyAccounts: any[], patients: any[], accounting: any[] }
      mito: { dailyAccounts: any[], patients: any[], accounting: any[] }
      omiya: { dailyAccounts: any[], patients: any[], accounting: any[] }
    }
  }
  currentMonthMetrics: {
    visitCount: number
    accountingUnitPrice: number
    revenue: number
  }
  trendData: {
    monthly: {
      labels: string[]
      visitCounts: number[]
      revenues: number[]
    }
    daily: {
      labels: string[]
      visitCounts: number[]
      revenues: number[]
    }
    yearOverYear: {
      currentYear: { visits: number, revenue: number, months: number }
      previousYear: { visits: number, revenue: number, months: number }
      growth: { visits: number, revenue: number }
    }
  }
  demographics: {
    ageGroups: { labels: string[], data: number[] }
    gender: { labels: string[], data: number[] }
    mediaSource: { labels: string[], data: number[] }
    visitType: { labels: string[], data: number[] }
    prefecture: { labels: string[], data: number[] }
    clinic: { labels: string[], data: number[] }
  }
  loading: boolean
  error: string | null
  apiConnected: boolean
  apiKey: string | null
  dataSource: 'api' | null
  currentClinic: {
    id: string
    name: string
  } | null
  tokenStatus?: {
    hasToken: boolean
    message: string
    expiresAt?: string
  }
  progress: {
    isActive: boolean
    currentStep: string
    totalSteps: number
    currentStepNumber: number
    percentage: number
  }
}

export interface DashboardAction {
  type: 'SET_PERIOD' | 'SET_CLINIC' | 'SET_DATE_RANGE' | 'SET_FILTERS' | 'SET_DATA' | 'SET_LOADING' | 'SET_ERROR' | 'SET_API_CONNECTION' | 'SET_TOKEN_STATUS' | 'SET_CURRENT_MONTH_METRICS' | 'SET_TREND_DATA' | 'SET_DEMOGRAPHICS' | 'SET_PROGRESS' | 'RESET'
  payload?: any
}

export interface ApiConfig {
  clientId: string
  clientSecret: string
  clinicId: string
  clinicName: string
}

// Initial state
const initialState: DashboardState = {
  selectedPeriod: 'month',
  selectedClinic: 'all',
  dateRange: {
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  },
  filters: {
    dateLevel: 'month',
    conversionThreshold: 5000
  },
  data: {
    patients: [],
    accounting: [],
    appointments: [],
    services: [],
    brandCourses: [],
    dailyAccounts: [],
    clinicData: {
      yokohama: { dailyAccounts: [], patients: [], accounting: [] },
      koriyama: { dailyAccounts: [], patients: [], accounting: [] },
      mito: { dailyAccounts: [], patients: [], accounting: [] },
      omiya: { dailyAccounts: [], patients: [], accounting: [] }
    }
  },
  currentMonthMetrics: {
    visitCount: 0,
    accountingUnitPrice: 0,
    revenue: 0
  },
  trendData: {
    monthly: {
      labels: [],
      visitCounts: [],
      revenues: []
    },
    daily: {
      labels: [],
      visitCounts: [],
      revenues: []
    },
    yearOverYear: {
      currentYear: { visits: 0, revenue: 0, months: 0 },
      previousYear: { visits: 0, revenue: 0, months: 0 },
      growth: { visits: 0, revenue: 0 }
    }
  },
  demographics: {
    ageGroups: { labels: [], data: [] },
    gender: { labels: [], data: [] },
    mediaSource: { labels: [], data: [] },
    visitType: { labels: [], data: [] },
    prefecture: { labels: [], data: [] },
    clinic: { labels: [], data: [] }
  },
  loading: false,
  error: null,
  apiConnected: false,
  apiKey: null,
  dataSource: null,
  currentClinic: null,
  progress: {
    isActive: false,
    currentStep: '',
    totalSteps: 0,
    currentStepNumber: 0,
    percentage: 0
  }
}

// Reducer
function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_PERIOD':
      return { ...state, selectedPeriod: action.payload }
    case 'SET_CLINIC':
      return { ...state, selectedClinic: action.payload }
    case 'SET_DATE_RANGE':
      return { ...state, dateRange: action.payload }
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } }
    case 'SET_DATA':
      return { ...state, data: { ...state.data, ...action.payload } }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_API_CONNECTION':
      return { 
        ...state, 
        apiConnected: action.payload.connected,
        apiKey: action.payload.apiKey,
        dataSource: action.payload.dataSource,
        dateRange: action.payload.dateRange || state.dateRange,
        currentClinic: action.payload.clinicId && action.payload.clinicName ? {
          id: action.payload.clinicId,
          name: action.payload.clinicName
        } : null
      }
    case 'SET_TOKEN_STATUS':
      return { ...state, tokenStatus: action.payload }
    case 'SET_CURRENT_MONTH_METRICS':
      return { ...state, currentMonthMetrics: action.payload }
    case 'SET_TREND_DATA':
      return { ...state, trendData: action.payload }
    case 'SET_DEMOGRAPHICS':
      return { ...state, demographics: action.payload }
    case 'SET_PROGRESS':
      return { ...state, progress: action.payload }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

// Context
const DashboardContext = createContext<{
  state: DashboardState
  dispatch: React.Dispatch<DashboardAction>
  connectToApi: (config: ApiConfig) => Promise<void>
  loadData: () => Promise<void>
  refreshData: () => Promise<void>
} | null>(null)

// Provider
export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState)
  const api = new MedicalForceAPI()
  const dataProcessor = new DataProcessor()


  // Check token status every 5 minutes when API is connected
  React.useEffect(() => {
    if (!state.apiConnected || state.dataSource !== 'api') return

    const checkTokenStatus = () => {
      const tokenStatus = api.getTokenStatus()
      dispatch({ type: 'SET_TOKEN_STATUS', payload: tokenStatus })
    }

    // Check immediately
    checkTokenStatus()

    // Check every 5 minutes
    const interval = setInterval(checkTokenStatus, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [state.apiConnected, state.dataSource])


  const connectToApi = async (config: ApiConfig) => {
    console.log('🔌 [Context] connectToApi start - Loading all clinic data')
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      // Set up API connection for all clinics
      console.log('🛠️ [Context] Setting up multi-clinic data loading...')
      
      dispatch({
        type: 'SET_API_CONNECTION',
        payload: {
          connected: true,
          apiKey: 'all-clinics',
          dataSource: 'api',
          dateRange: state.dateRange,
          clinicId: 'all',
          clinicName: '全院'
        }
      })

      // Load initial data with 14-month range from all clinics
      console.log('📥 [Context] Loading initial data from all clinics...', state.dateRange)
      await loadDataFromApi(state.dateRange.start, state.dateRange.end)
      console.log('✅ [Context] Initial data load complete')
    } catch (error) {
      console.error('❌ [Context] connectToApi error:', error)
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : '接続に失敗しました'
      })
      throw error
    } finally {
      console.log('⏹️ [Context] connectToApi finished')
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  // Load data monthly to handle large datasets
  const loadMonthlyData = async (api: MedicalForceAPI, startDate: string, endDate: string, clinicName: string) => {
    console.log(`📅 [Monthly Load] Starting monthly data load for ${clinicName}`)
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    const allValues: any[] = []
    let totalRevenue = 0
    let totalNetRevenue = 0
    
    // Generate monthly date ranges
    const monthlyRanges = []
    const current = new Date(start.getFullYear(), start.getMonth(), 1)
    
    while (current <= end) {
      const monthStart = new Date(current)
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0)
      
      // Don't go beyond the end date
      if (monthEnd > end) {
        monthEnd.setTime(end.getTime())
      }
      
      monthlyRanges.push({
        start: monthStart.toISOString().split('T')[0],
        end: monthEnd.toISOString().split('T')[0],
        month: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
      })
      
      current.setMonth(current.getMonth() + 1)
    }
    
    console.log(`📅 [Monthly Load] Generated ${monthlyRanges.length} monthly ranges for ${clinicName}`)
    
    // Load data for each month
    for (let i = 0; i < monthlyRanges.length; i++) {
      const range = monthlyRanges[i]
      
      try {
        console.log(`📅 [Monthly Load] Loading ${range.month} for ${clinicName}: ${range.start} to ${range.end}`)
        
        const monthData = await api.getDailyAccounts(range.start, range.end)
        
        if (monthData.values && monthData.values.length > 0) {
          allValues.push(...monthData.values)
          totalRevenue += monthData.total || 0
          totalNetRevenue += monthData.netTotal || 0
          
          console.log(`✅ [Monthly Load] ${range.month} loaded: ${monthData.values.length} records`)
        } else {
          console.log(`⚠️ [Monthly Load] No data for ${range.month}`)
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 200))
        
      } catch (error) {
        console.error(`❌ [Monthly Load] Failed to load ${range.month} for ${clinicName}:`, error)
        // Continue with next month even if one fails
      }
    }
    
    console.log(`✅ [Monthly Load] Completed for ${clinicName}: ${allValues.length} total records`)
    
    return {
      clinicId: clinicName,
      total: totalRevenue,
      netTotal: totalNetRevenue,
      values: allValues,
      startAt: startDate,
      endAt: endDate
    }
  }

  const loadDataFromApi = async (startDate: string, endDate: string) => {
    try {
      console.log('📊 [Context] loadDataFromApi start')
      console.log('📅 [Context] date range:', { startDate, endDate })
      
      // Get clinic ID from the current clinic
      const clinicId = state.currentClinic?.id || state.apiKey || 'default'
      
      // Start progress tracking
      dispatch({
        type: 'SET_PROGRESS',
        payload: {
          isActive: true,
          currentStep: 'データ取得を開始しています...',
          totalSteps: 1,
          currentStepNumber: 0,
          percentage: 0
        }
      })
      
      // Load 14 months of data from all 4 clinics
      let allClinicData = []
      const clinicConfigs = [
        { id: 'yokohama', name: '横浜院' },
        { id: 'koriyama', name: '郡山院' },
        { id: 'mito', name: '水戸院' },
        { id: 'omiya', name: '大宮院' }
      ]

      // Calculate 14 months date range
      const endDateObj = new Date(endDate)
      const fourteenMonthsAgo = new Date(endDateObj)
      fourteenMonthsAgo.setMonth(fourteenMonthsAgo.getMonth() - 14)
      
      const fourteenMonthStartDate = fourteenMonthsAgo.toISOString().split('T')[0]
      const fourteenMonthEndDate = endDateObj.toISOString().split('T')[0]
      
      console.log('📅 [Context] 14-month date range:', { 
        fourteenMonthStartDate, 
        fourteenMonthEndDate 
      })

      // Load data from all clinics with proper authentication - MONTHLY LOADING
      for (let i = 0; i < clinicConfigs.length; i++) {
        const clinic = clinicConfigs[i]
        
        dispatch({
          type: 'SET_PROGRESS',
          payload: {
            isActive: true,
            currentStep: `${clinic.name}のデータを月別で取得中... (${i + 1}/4)`,
            totalSteps: 4,
            currentStepNumber: i + 1,
            percentage: ((i + 1) / 4) * 100
          }
        })

        try {
          console.log(`🔄 [Context] Authenticating and loading data for ${clinic.name}...`)
          
          // Create a new API instance for this clinic with its specific credentials
          const clinicApi = new MedicalForceAPI()
          clinicApi.setClinicCredentials(clinic.id)
          
          // Wait a moment for credentials to be set
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // Load data monthly to avoid large data issues
          const clinicData = await loadMonthlyData(clinicApi, fourteenMonthStartDate, fourteenMonthEndDate, clinic.name)
          
          // DEBUG: Log raw API response
          console.log(`🔍 [DEBUG] Raw API response for ${clinic.name}:`, {
            clinicId: clinic.id,
            rawResponse: clinicData,
            responseType: typeof clinicData,
            hasValues: Array.isArray(clinicData.values),
            valuesLength: clinicData.values?.length || 0,
            total: clinicData.total,
            netTotal: clinicData.netTotal,
            startAt: clinicData.startAt,
            endAt: clinicData.endAt
          })
          
          // DEBUG: Log sample records
          if (clinicData.values && clinicData.values.length > 0) {
            console.log(`🔍 [DEBUG] Sample records for ${clinic.name}:`, {
              firstRecord: clinicData.values[0],
              lastRecord: clinicData.values[clinicData.values.length - 1],
              recordKeys: Object.keys(clinicData.values[0] || {}),
              sampleDates: clinicData.values.slice(0, 5).map(r => r.recordDate),
              sampleRevenue: clinicData.values.slice(0, 5).map(r => r.totalWithTax)
            })
          } else {
            console.warn(`⚠️ [DEBUG] No data values found for ${clinic.name}`)
          }
          
          // Add clinic information to each record
          const clinicDataWithInfo = {
            ...clinicData,
            values: clinicData.values.map(record => ({
              ...record,
              clinicId: clinic.id,
              clinicName: clinic.name
            }))
          }
          
          allClinicData.push(clinicDataWithInfo)
          console.log(`✅ [Context] ${clinic.name} data loaded successfully:`, {
            clinicId: clinic.id,
            total: clinicData.total,
            valuesCount: clinicData.values.length,
            processedValuesCount: clinicDataWithInfo.values.length
          })
        } catch (error) {
          console.error(`❌ [Context] Failed to load data for ${clinic.name}:`, error)
          console.error(`Error details:`, {
            clinicId: clinic.id,
            clinicName: clinic.name,
            error: error instanceof Error ? error.message : String(error)
          })
          
          // Add empty data for failed clinic to maintain structure
          allClinicData.push({
            clinicId: clinic.id,
            clinicName: clinic.name,
            total: 0,
            netTotal: 0,
            values: []
          })
        }
      }

      // Store data separately for each clinic
      const clinicData = {
        yokohama: { dailyAccounts: [] as any[], patients: [] as any[], accounting: [] as any[] },
        koriyama: { dailyAccounts: [] as any[], patients: [] as any[], accounting: [] as any[] },
        mito: { dailyAccounts: [] as any[], patients: [] as any[], accounting: [] as any[] },
        omiya: { dailyAccounts: [] as any[], patients: [] as any[], accounting: [] as any[] }
      }

      // Process each clinic's data separately
      allClinicData.forEach((clinicDataItem, index) => {
        const clinic = clinicConfigs[index]
        if (clinic && clinicDataItem.values) {
          console.log(`🔍 [DEBUG] Processing data for ${clinic.name}:`, {
            clinicId: clinic.id,
            originalValuesCount: clinicDataItem.values.length,
            sampleRecord: clinicDataItem.values[0],
            dateRange: {
              first: clinicDataItem.values[0]?.recordDate,
              last: clinicDataItem.values[clinicDataItem.values.length - 1]?.recordDate
            }
          })
          
          const processedPatients = dataProcessor.processDailyAccountsToPatients(clinicDataItem)
          const processedAccounting = dataProcessor.processDailyAccountsToAccounting(clinicDataItem)
          
          console.log(`🔍 [DEBUG] Processed data for ${clinic.name}:`, {
            dailyAccountsCount: clinicDataItem.values.length,
            patientsCount: processedPatients.length,
            accountingCount: processedAccounting.length,
            samplePatient: processedPatients[0],
            sampleAccounting: processedAccounting[0]
          })
          
          clinicData[clinic.id as keyof typeof clinicData] = {
            dailyAccounts: clinicDataItem.values,
            patients: processedPatients,
            accounting: processedAccounting
          }
        } else {
          console.warn(`⚠️ [DEBUG] No data to process for ${clinic?.name || 'unknown clinic'}`)
        }
      })

      // Create combined data for analysis only
      const combinedData = {
        clinicId: 'all',
        clinicName: '全院',
        total: allClinicData.reduce((sum, data) => sum + (data.total || 0), 0),
        netTotal: allClinicData.reduce((sum, data) => sum + (data.netTotal || 0), 0),
        values: allClinicData.flatMap(data => data.values || [])
      }

      console.log('✅ [Context] Clinic data stored separately:', {
        totalClinics: allClinicData.length,
        yokohamaRecords: clinicData.yokohama.dailyAccounts.length,
        koriyamaRecords: clinicData.koriyama.dailyAccounts.length,
        mitoRecords: clinicData.mito.dailyAccounts.length,
        omiyaRecords: clinicData.omiya.dailyAccounts.length,
        totalCombinedRecords: combinedData.values.length
      })
      
      console.log('✅ [Context] Combined daily accounts data loaded:', {
        clinicId: combinedData.clinicId,
        total: combinedData.total,
        netTotal: combinedData.netTotal,
        valuesCount: combinedData.values.length
      })

      // Process combined daily accounts data into patient and accounting data for compatibility
      const processedPatients = dataProcessor.processDailyAccountsToPatients(combinedData)
      const processedAccounting = dataProcessor.processDailyAccountsToAccounting(combinedData)

      // Calculate current month metrics directly from combined daily accounts data
      const currentMonthVisitCount = dataProcessor.calculateCurrentMonthVisitCount(combinedData)
      const currentMonthAccountingUnitPrice = dataProcessor.calculateCurrentMonthAccountingUnitPrice(combinedData)
      const currentMonthRevenue = dataProcessor.calculateCurrentMonthRevenue(combinedData)

      // Calculate trend data from combined daily accounts data
      const monthlyTrends = dataProcessor.calculateMonthlyTrends(combinedData)
      const dailyTrends = dataProcessor.calculateDailyTrends(combinedData, 30)
      const yearOverYearComparison = dataProcessor.calculateYearOverYearComparison(combinedData)

      // DEBUG: Log final data structure before dispatch
      console.log(`🔍 [DEBUG] Final data structure before dispatch:`, {
        combinedData: {
          totalRecords: combinedData.values.length,
          totalRevenue: combinedData.total,
          sampleRecord: combinedData.values[0]
        },
        clinicData: {
          yokohama: { dailyAccounts: clinicData.yokohama.dailyAccounts.length, patients: clinicData.yokohama.patients.length, accounting: clinicData.yokohama.accounting.length },
          koriyama: { dailyAccounts: clinicData.koriyama.dailyAccounts.length, patients: clinicData.koriyama.patients.length, accounting: clinicData.koriyama.accounting.length },
          mito: { dailyAccounts: clinicData.mito.dailyAccounts.length, patients: clinicData.mito.patients.length, accounting: clinicData.mito.accounting.length },
          omiya: { dailyAccounts: clinicData.omiya.dailyAccounts.length, patients: clinicData.omiya.patients.length, accounting: clinicData.omiya.accounting.length }
        },
        processedData: {
          patientsCount: processedPatients.length,
          accountingCount: processedAccounting.length
        }
      })

      dispatch({
        type: 'SET_DATA',
        payload: {
          patients: processedPatients,
          accounting: processedAccounting,
          appointments: [], // Not available in daily accounts
          services: [], // Not available in daily accounts
          brandCourses: [], // Not available in daily accounts
          dailyAccounts: combinedData.values,
          clinicData: clinicData
        }
      })

      // Store current month metrics for KPI cards
      dispatch({
        type: 'SET_CURRENT_MONTH_METRICS',
        payload: {
          visitCount: currentMonthVisitCount,
          accountingUnitPrice: currentMonthAccountingUnitPrice,
          revenue: currentMonthRevenue
        }
      })

      // Store trend data for charts
      dispatch({
        type: 'SET_TREND_DATA',
        payload: {
          monthly: monthlyTrends,
          daily: dailyTrends,
          yearOverYear: yearOverYearComparison
        }
      })

      // Calculate and store demographics data
      const demographics = dataProcessor.calculateDemographics(combinedData)
      dispatch({
        type: 'SET_DEMOGRAPHICS',
        payload: demographics
      })
      
      console.log('✅ [Context] Data processing completed:', {
        patientsCount: processedPatients.length,
        accountingCount: processedAccounting.length,
        dailyAccountsCount: combinedData.values.length,
        currentMonthVisitCount,
        currentMonthAccountingUnitPrice,
        currentMonthRevenue
      })
      
      // Complete progress tracking
      dispatch({
        type: 'SET_PROGRESS',
        payload: {
          isActive: false,
          currentStep: 'データ取得完了',
          totalSteps: 1,
          currentStepNumber: 1,
          percentage: 100
        }
      })
    } catch (error) {
      console.error('❌ [Context] loadDataFromApi error:', error)
      
      // Handle specific error types with user-friendly messages
      let errorMessage = 'データの読み込みに失敗しました'
      if (error instanceof Error) {
        if (error.message.includes('504') || error.message.includes('Timeout')) {
          errorMessage = 'APIタイムアウト: データが大きすぎます。しばらく待ってから再試行してください。'
        } else if (error.message.includes('API Error')) {
          errorMessage = `APIエラー: ${error.message}`
        } else {
          errorMessage = error.message
        }
      }
      
      dispatch({
        type: 'SET_ERROR',
        payload: errorMessage
      })
      
      // Hide progress on error
      dispatch({
        type: 'SET_PROGRESS',
        payload: {
          isActive: false,
          currentStep: '',
          totalSteps: 0,
          currentStepNumber: 0,
          percentage: 0
        }
      })
      
      throw error
    }
  }

  const loadData = async () => {
    if (!state.apiConnected) {
      throw new Error('APIが接続されていません')
    }

    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      if (state.dataSource === 'api') {
        // loadDataFromApi uses 2-year cached data system with monthly API calls
        await loadDataFromApi(state.dateRange.start, state.dateRange.end)
      }
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'データの読み込みに失敗しました'
      })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const refreshData = async () => {
    await loadData()
  }


  return (
    <DashboardContext.Provider value={{ 
      state, 
      dispatch, 
      connectToApi, 
      loadData, 
      refreshData
    }}>
      {children}
    </DashboardContext.Provider>
  )
}

// Hook - Dashboard context hook
export function useDashboard() {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}