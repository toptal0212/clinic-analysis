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
    serviceSearchResults: any[]
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
  type: 'SET_PERIOD' | 'SET_CLINIC' | 'SET_DATE_RANGE' | 'SET_FILTERS' | 'SET_DATA' | 'SET_LOADING' | 'SET_ERROR' | 'SET_API_CONNECTION' | 'SET_TOKEN_STATUS' | 'SET_CURRENT_MONTH_METRICS' | 'SET_TREND_DATA' | 'SET_DEMOGRAPHICS' | 'SET_PROGRESS' | 'SET_SERVICE_SEARCH_RESULTS' | 'RESET'
  payload?: any
}

export interface ApiConfig {
  clientId: string
  clientSecret: string
  // Service search parameters
  clinicId?: string
  serviceSearchDate?: string
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
    serviceSearchResults: []
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
        dateRange: action.payload.dateRange || state.dateRange
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
    case 'SET_SERVICE_SEARCH_RESULTS':
      return { ...state, data: { ...state.data, serviceSearchResults: action.payload } }
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
  searchServices: (clinicId: string, date: string) => Promise<any[]>
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
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      // Handle API connection - Bearer Token only
      api.setClientCredentials(config.clientId, config.clientSecret)
      
      // Test API connection
      await api.getClinics()
      
      // Update token status
      const tokenStatus = api.getTokenStatus()
      dispatch({ type: 'SET_TOKEN_STATUS', payload: tokenStatus })
      
      dispatch({
        type: 'SET_API_CONNECTION',
        payload: {
          connected: true,
          apiKey: config.clientId,
          dataSource: 'api',
          dateRange: state.dateRange
        }
      })

      // Load initial data with 2-year range for comprehensive analysis
      await loadDataFromApi(state.dateRange.start, state.dateRange.end)
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : '接続に失敗しました'
      })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const loadDataFromApi = async (startDate: string, endDate: string) => {
    try {
      console.log('📊 [Context] Loading data from API with 2-year caching...')
      console.log('📅 [Context] Original date range:', { startDate, endDate })
      
      // Get clinic ID from the API connection
      const clinicId = state.apiKey || 'default'
      
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
      
      // Use 2-year cached data system
      let dailyAccountsData
      try {
        console.log('🔄 [Context] Attempting 2-year cached data request...')
        console.log('⏳ [Context] Loading 2 years of data with monthly caching...')
        
        // Create progress callback
        const onProgress = (progress: { currentStep: string, currentStepNumber: number, totalSteps: number, percentage: number }) => {
          dispatch({
            type: 'SET_PROGRESS',
            payload: {
              isActive: true,
              currentStep: progress.currentStep,
              totalSteps: progress.totalSteps,
              currentStepNumber: progress.currentStepNumber,
              percentage: progress.percentage
            }
          })
        }
        
        dailyAccountsData = await api.getTwoYearData(clinicId, onProgress)
        console.log('✅ [Context] 2-year cached data request successful')
      } catch (error) {
        console.warn('⚠️ [Context] 2-year cached request failed, trying 6-month fallback:', error)
        
        // Update progress for fallback
        dispatch({
          type: 'SET_PROGRESS',
          payload: {
            isActive: true,
            currentStep: '2年データ取得に失敗、6ヶ月データに切り替え中...',
            totalSteps: 1,
            currentStepNumber: 1,
            percentage: 50
          }
        })
        
        // Fallback to 6 months if 2-year request fails
        const endDateObj = new Date(endDate)
        const sixMonthsAgo = new Date(endDateObj)
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
        
        const sixMonthStartDate = sixMonthsAgo.toISOString().split('T')[0]
        const sixMonthEndDate = endDateObj.toISOString().split('T')[0]
        
        console.log('📅 [Context] Fallback 6-month date range:', { 
          sixMonthStartDate, 
          sixMonthEndDate 
        })
        console.log('⏳ [Context] Attempting 6-month data request...')
        
        dailyAccountsData = await api.getDailyAccounts(sixMonthStartDate, sixMonthEndDate)
        console.log('✅ [Context] 6-month fallback successful')
      }
      
      console.log('✅ [Context] Daily accounts data loaded:', {
        clinicId: dailyAccountsData.clinicId,
        total: dailyAccountsData.total,
        netTotal: dailyAccountsData.netTotal,
        valuesCount: dailyAccountsData.values.length
      })

      // Process daily accounts data into patient and accounting data for compatibility
      const processedPatients = dataProcessor.processDailyAccountsToPatients(dailyAccountsData)
      const processedAccounting = dataProcessor.processDailyAccountsToAccounting(dailyAccountsData)

      // Calculate current month metrics directly from daily accounts data
      const currentMonthVisitCount = dataProcessor.calculateCurrentMonthVisitCount(dailyAccountsData)
      const currentMonthAccountingUnitPrice = dataProcessor.calculateCurrentMonthAccountingUnitPrice(dailyAccountsData)
      const currentMonthRevenue = dataProcessor.calculateCurrentMonthRevenue(dailyAccountsData)

      // Calculate trend data from daily accounts data
      const monthlyTrends = dataProcessor.calculateMonthlyTrends(dailyAccountsData)
      const dailyTrends = dataProcessor.calculateDailyTrends(dailyAccountsData, 30)
      const yearOverYearComparison = dataProcessor.calculateYearOverYearComparison(dailyAccountsData)

      dispatch({
        type: 'SET_DATA',
        payload: {
          patients: processedPatients,
          accounting: processedAccounting,
          appointments: [], // Not available in daily accounts
          services: [], // Not available in daily accounts
          brandCourses: [], // Not available in daily accounts
          dailyAccounts: dailyAccountsData.values
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
      const demographics = dataProcessor.calculateDemographics(dailyAccountsData)
      dispatch({
        type: 'SET_DEMOGRAPHICS',
        payload: demographics
      })
      
      console.log('✅ [Context] Data processing completed:', {
        patientsCount: processedPatients.length,
        accountingCount: processedAccounting.length,
        dailyAccountsCount: dailyAccountsData.values.length,
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
      console.error('❌ [Context] Data loading failed:', error)
      
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

  const searchServices = async (clinicId: string, date: string) => {
    if (!state.apiConnected || state.dataSource !== 'api') {
      throw new Error('APIが接続されていません')
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      const results = await api.getUpdatedBrandCourses(clinicId, date)
      
      // Store the results in state for ServicesAnalysis component
      dispatch({ type: 'SET_SERVICE_SEARCH_RESULTS', payload: results })
      
      return results
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : '役務検索に失敗しました'
      })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  return (
    <DashboardContext.Provider value={{ 
      state, 
      dispatch, 
      connectToApi, 
      loadData, 
      refreshData,
      searchServices
    }}>
      {children}
    </DashboardContext.Provider>
  )
}

// Hook
export function useDashboard() {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}