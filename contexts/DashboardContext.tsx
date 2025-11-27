'use client'

import React, { createContext, useContext, useReducer, ReactNode, useMemo, useRef } from 'react'
import { MedicalForceAPI, DataProcessor } from '@/lib/api'
import { saveDashboardChunks, loadAllDashboardChunks } from '@/lib/indexedDb'

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
  // Start with initial state to avoid hydration mismatch
  // We'll restore from localStorage in useEffect (client-side only)
  const [state, dispatch] = useReducer(dashboardReducer, initialState)
  const api = new MedicalForceAPI()
  const dataProcessor = new DataProcessor()
  const dataReloadAttemptedRef = React.useRef(false)

  // Load state from IndexedDB/localStorage after hydration (client-side only)
  React.useEffect(() => {
    if (typeof window === 'undefined') return

    let cancelled = false

    const restoreFromIndexedDb = async () => {
      try {
        const chunks = await loadAllDashboardChunks()
        if (cancelled) return false

        const meta = chunks.meta
        if (meta && meta.apiConnected === true && meta.dataSource === 'api') {
          console.log('📦 [IndexedDB] Restoring dashboard state from IndexedDB')

          dispatch({
            type: 'SET_API_CONNECTION',
            payload: {
              connected: true,
              apiKey: meta.apiKey || 'all-clinics',
              dataSource: 'api',
              dateRange: meta.dateRange || initialState.dateRange,
              clinicId: meta.currentClinic?.id || 'all',
              clinicName: meta.currentClinic?.name || '全院'
            }
          })

          if (meta.selectedPeriod) dispatch({ type: 'SET_PERIOD', payload: meta.selectedPeriod })
          if (meta.selectedClinic) dispatch({ type: 'SET_CLINIC', payload: meta.selectedClinic })
          if (meta.filters) dispatch({ type: 'SET_FILTERS', payload: meta.filters })

          const metrics = chunks.metrics
          if (metrics?.currentMonthMetrics) {
            dispatch({ type: 'SET_CURRENT_MONTH_METRICS', payload: metrics.currentMonthMetrics })
          }
          if (metrics?.trendData) {
            dispatch({ type: 'SET_TREND_DATA', payload: metrics.trendData })
          }
          if (metrics?.demographics) {
            dispatch({ type: 'SET_DEMOGRAPHICS', payload: metrics.demographics })
          }

          const defaultClinicData = initialState.data.clinicData
          const clinicChunk = chunks.clinicData?.clinicData || {}

          const restoredData = {
            dailyAccounts: chunks.dailyAccounts?.dailyAccounts || [],
            patients: chunks.processed?.patients || [],
            accounting: chunks.processed?.accounting || [],
            appointments: chunks.other?.appointments || [],
            services: chunks.other?.services || [],
            brandCourses: chunks.other?.brandCourses || [],
            clinicData: {
              yokohama: clinicChunk.yokohama || defaultClinicData.yokohama,
              koriyama: clinicChunk.koriyama || defaultClinicData.koriyama,
              mito: clinicChunk.mito || defaultClinicData.mito,
              omiya: clinicChunk.omiya || defaultClinicData.omiya
            }
          }

          if (restoredData.dailyAccounts.length > 0) {
            dispatch({ type: 'SET_DATA', payload: restoredData })
            dataReloadAttemptedRef.current = true
            console.log(`✅ [IndexedDB] Restored ${restoredData.dailyAccounts.length} daily accounts`)
          } else {
            console.log('⚠️ [IndexedDB] Connection restored but no data found')
          }

          return true
        }
      } catch (error) {
        console.error('📦 [IndexedDB] Failed to load dashboard state:', error)
      }

      return false
    }

    const restoreFromLegacyLocalStorage = () => {
      try {
        const oldStored = localStorage.getItem('dashboard_state')
        if (!oldStored) return

        const parsed = JSON.parse(oldStored)
        const storedTime = parsed._timestamp || 0
        const now = Date.now()
        const hoursSinceStored = (now - storedTime) / (1000 * 60 * 60)

        const hasData = parsed._dataAvailable === true ||
                        (parsed.data?.dailyAccounts && parsed.data.dailyAccounts.length > 0) ||
                        (parsed.data?.dailyAccountsCount > 0)

        if (hoursSinceStored < 24 && parsed.apiConnected === true && parsed.dataSource === 'api' && hasData) {
          console.log('📦 [Storage] Restoring dashboard state from legacy localStorage')

          dispatch({
            type: 'SET_API_CONNECTION',
            payload: {
              connected: true,
              apiKey: parsed.apiKey || 'all-clinics',
              dataSource: 'api',
              dateRange: parsed.dateRange || initialState.dateRange,
              clinicId: parsed.currentClinic?.id || 'all',
              clinicName: parsed.currentClinic?.name || '全院'
            }
          })

          if (parsed.selectedPeriod) dispatch({ type: 'SET_PERIOD', payload: parsed.selectedPeriod })
          if (parsed.selectedClinic) dispatch({ type: 'SET_CLINIC', payload: parsed.selectedClinic })
          if (parsed.filters) dispatch({ type: 'SET_FILTERS', payload: parsed.filters })
          if (parsed.currentMonthMetrics) dispatch({ type: 'SET_CURRENT_MONTH_METRICS', payload: parsed.currentMonthMetrics })
          if (parsed.trendData) dispatch({ type: 'SET_TREND_DATA', payload: parsed.trendData })
          if (parsed.demographics) dispatch({ type: 'SET_DEMOGRAPHICS', payload: parsed.demographics })

          if (parsed.data && parsed.data.dailyAccounts && Array.isArray(parsed.data.dailyAccounts) && parsed.data.dailyAccounts.length > 0) {
            dispatch({ type: 'SET_DATA', payload: parsed.data })
            dataReloadAttemptedRef.current = true
            console.log(`✅ [Storage] Restored ${parsed.data.dailyAccounts.length} daily accounts from legacy storage`)
          }
        }
      } catch (error) {
        console.error('📦 [Storage] Failed to load legacy localStorage state:', error)
      }
    }

    ;(async () => {
      const restored = await restoreFromIndexedDb()
      if (cancelled) return
      if (!restored) {
        restoreFromLegacyLocalStorage()
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])


  // Save state to IndexedDB whenever it changes
  React.useEffect(() => {
    if (!state.apiConnected || state.dataSource !== 'api') return
    if (state.data.dailyAccounts.length === 0) return

    let cancelled = false

    ;(async () => {
      try {
        const timestamp = Date.now()

        await saveDashboardChunks({
          meta: {
            apiConnected: state.apiConnected,
            apiKey: state.apiKey,
            dataSource: state.dataSource,
            currentClinic: state.currentClinic,
            dateRange: state.dateRange,
            selectedPeriod: state.selectedPeriod,
            selectedClinic: state.selectedClinic,
            filters: state.filters,
            _timestamp: timestamp
          },
          metrics: {
            currentMonthMetrics: state.currentMonthMetrics,
            trendData: state.trendData,
            demographics: state.demographics,
            _timestamp: timestamp
          },
          dailyAccounts: {
            dailyAccounts: state.data.dailyAccounts,
            _timestamp: timestamp
          },
          processed: {
            patients: state.data.patients,
            accounting: state.data.accounting,
            _timestamp: timestamp
          },
          clinicData: {
            clinicData: state.data.clinicData,
            _timestamp: timestamp
          },
          other: {
            appointments: state.data.appointments,
            services: state.data.services,
            brandCourses: state.data.brandCourses,
            _timestamp: timestamp
          }
        })

        if (!cancelled) {
          localStorage.setItem('dashboard_data_timestamp', String(timestamp))
        }

        console.log('💾 [IndexedDB] Dashboard data saved')
      } catch (error) {
        console.error('💾 [IndexedDB] Failed to save dashboard data:', error)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    state.apiConnected,
    state.dataSource,
    state.dateRange.start,
    state.dateRange.end,
    state.selectedPeriod,
    state.selectedClinic,
    state.filters,
    state.currentMonthMetrics,
    state.data.dailyAccounts,
    state.data.patients,
    state.data.accounting,
    state.data.clinicData,
    state.data.appointments,
    state.data.services,
    state.data.brandCourses
  ])

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

  React.useEffect(() => {
    if (!state.apiConnected || state.dataSource !== 'api') return

    let isRunning = false

    const runRefresh = async () => {
      if (isRunning) return
      isRunning = true
      try {
        await loadRecentDataFromApi()
      } catch (error) {
        console.error('❌ [Context] Scheduled recent data refresh failed:', error)
      } finally {
        isRunning = false
      }
    }

    // Trigger initial refresh on mount for the latest data
    runRefresh()

    const interval = setInterval(() => {
      runRefresh()
    }, RECENT_REFRESH_INTERVAL)

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
      for (let i = 0; i < CLINIC_CONFIGS.length; i++) {
        const clinic = CLINIC_CONFIGS[i]
        
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
        const clinic = CLINIC_CONFIGS[index]
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

  const loadRecentDataFromApi = async (days: number = RECENT_REFRESH_DAYS) => {
    try {
      console.log(`📟 [Context] loadRecentDataFromApi start - last ${days} day(s)`)
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - days)

      const startStr = startDate.toISOString().split('T')[0]
      const endStr = endDate.toISOString().split('T')[0]

      let recentRecords: any[] = []
      const recentClinicRecords: Record<string, any[]> = {}

      for (let i = 0; i < CLINIC_CONFIGS.length; i++) {
        const clinic = CLINIC_CONFIGS[i]
        try {
          const clinicApi = new MedicalForceAPI()
          clinicApi.setClinicCredentials(clinic.id)
          await new Promise(resolve => setTimeout(resolve, 100))
          const clinicData = await clinicApi.getDailyAccounts(startStr, endStr)
          const valuesWithClinic = (clinicData.values || []).map(record => ({
            ...record,
            clinicId: clinic.id,
            clinicName: clinic.name
          }))
          recentRecords.push(...valuesWithClinic)
          recentClinicRecords[clinic.id] = valuesWithClinic
          console.log(`✅ [Context] Recent data loaded for ${clinic.name}: ${valuesWithClinic.length} records`)
        } catch (error) {
          console.error(`❌ [Context] Failed to load recent data for ${clinic.name}:`, error)
        }
      }

      if (recentRecords.length === 0) {
        console.log('⚠️ [Context] No recent records fetched')
        return false
      }

      const mergedDailyAccounts = mergeDailyAccountRecords(state.data.dailyAccounts, recentRecords)
      const combinedData = buildCombinedData(mergedDailyAccounts, 'all', state.dateRange)
      const processedPatients = dataProcessor.processDailyAccountsToPatients(combinedData)
      const processedAccounting = dataProcessor.processDailyAccountsToAccounting(combinedData)

      const updatedClinicData = { ...state.data.clinicData }
      Object.keys(updatedClinicData).forEach(clinicId => {
        const incoming = recentClinicRecords[clinicId] || []
        if (!incoming.length) return
        const existingClinic = updatedClinicData[clinicId as keyof typeof updatedClinicData]
        const mergedClinicRecords = mergeDailyAccountRecords(existingClinic.dailyAccounts, incoming)
        const clinicCombined = buildCombinedData(mergedClinicRecords, clinicId, state.dateRange)
        updatedClinicData[clinicId as keyof typeof updatedClinicData] = {
          ...existingClinic,
          dailyAccounts: mergedClinicRecords,
          patients: dataProcessor.processDailyAccountsToPatients(clinicCombined),
          accounting: dataProcessor.processDailyAccountsToAccounting(clinicCombined)
        }
      })

      dispatch({
        type: 'SET_DATA',
        payload: {
          ...state.data,
          dailyAccounts: mergedDailyAccounts,
          patients: processedPatients,
          accounting: processedAccounting,
          clinicData: updatedClinicData
        }
      })

      // Update current month metrics based on merged data
      dispatch({
        type: 'SET_CURRENT_MONTH_METRICS',
        payload: {
          visitCount: dataProcessor.calculateCurrentMonthVisitCount(combinedData),
          accountingUnitPrice: dataProcessor.calculateCurrentMonthAccountingUnitPrice(combinedData),
          revenue: dataProcessor.calculateCurrentMonthRevenue(combinedData)
        }
      })

      // Update trend data to reflect latest records
      dispatch({
        type: 'SET_TREND_DATA',
        payload: {
          monthly: dataProcessor.calculateMonthlyTrends(combinedData),
          daily: dataProcessor.calculateDailyTrends(combinedData, 30),
          yearOverYear: dataProcessor.calculateYearOverYearComparison(combinedData)
        }
      })

      console.log(`✅ [Context] Recent data merged (${recentRecords.length} records)`)
      return true
    } catch (error) {
      console.error('❌ [Context] loadRecentDataFromApi error:', error)
      return false
    }
  }

  const loadData = React.useCallback(async () => {
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
  }, [state.apiConnected, state.dataSource, state.dateRange.start, state.dateRange.end])

  const refreshData = async () => {
    await loadData()
  }

  // Auto-reload data ONLY if connection restored but no data is available locally
  React.useEffect(() => {
    if (dataReloadAttemptedRef.current) return
    if (!state.apiConnected || state.dataSource !== 'api') return
    if (state.data.dailyAccounts.length > 0) {
      dataReloadAttemptedRef.current = true
      return
    }

    console.log('🔄 [Storage] No local data available - reloading from API')
    dataReloadAttemptedRef.current = true

    const reloadTimer = setTimeout(async () => {
      try {
        if (state.data.dailyAccounts.length === 0) {
          await loadData()
          console.log('✅ [Storage] Data reloaded successfully from API')
        }
      } catch (error) {
        console.error('❌ [Storage] Failed to reload data:', error)
      }
    }, 2000)

    return () => clearTimeout(reloadTimer)
  }, [state.apiConnected, state.dataSource, state.data.dailyAccounts.length, loadData])

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
const clinicLabelMap: Record<string, string> = {
  yokohama: '横浜院',
  koriyama: '郡山院',
  mito: '水戸院',
  omiya: '大宮院'
}

const clinicNameToIdMap: Record<string, string> = Object.fromEntries(
  Object.entries(clinicLabelMap).map(([id, name]) => [name, id])
)

const CLINIC_CONFIGS = [
  { id: 'yokohama', name: '横浜院' },
  { id: 'koriyama', name: '郡山院' },
  { id: 'mito', name: '水戸院' },
  { id: 'omiya', name: '大宮院' }
]

const RECENT_REFRESH_INTERVAL = 12 * 60 * 60 * 1000 // 12 hours
const RECENT_REFRESH_DAYS = 1

const buildRecordKey = (record: any) => {
  const visitorId = record.visitorId || record.visitorCode || record.visitorKarteNumber || record.visitorName || 'unknown'
  const date =
    record.recordDate ||
    record.visitDate ||
    record.treatmentDate ||
    record.accountingDate ||
    record.confirmedAt ||
    'unknown'
  const clinic = record.clinicId || record.clinicName || 'unknown'
  return `${clinic}-${visitorId}-${date}`
}

const mergeDailyAccountRecords = (existing: any[] = [], incoming: any[] = []) => {
  if (!incoming.length) return existing
  const recordMap = new Map<string, any>()
  existing.forEach(record => {
    recordMap.set(buildRecordKey(record), record)
  })
  incoming.forEach(record => {
    recordMap.set(buildRecordKey(record), record)
  })
  return Array.from(recordMap.values())
}

const getRecordDate = (record: any): Date | null => {
  const rawDate =
    record?.recordDate ||
    record?.visitDate ||
    record?.treatmentDate ||
    record?.accountingDate

  if (!rawDate) return null
  const date = new Date(rawDate)
  return isNaN(date.getTime()) ? null : date
}

const normalizeDateRange = (dateRange: { start: string; end: string }) => {
  const start = dateRange?.start ? new Date(dateRange.start) : null
  const end = dateRange?.end ? new Date(dateRange.end) : null
  if (start) start.setHours(0, 0, 0, 0)
  if (end) end.setHours(23, 59, 59, 999)
  return { start, end }
}

const isWithinRange = (date: Date | null, start: Date | null, end: Date | null) => {
  if (!date) return false
  if (start && date < start) return false
  if (end && date > end) return false
  return true
}

const filterDailyAccountsBySelection = (
  records: any[] = [],
  selectedClinic: string,
  dateRange: { start: string; end: string }
) => {
  if (!records.length) return []
  const { start, end } = normalizeDateRange(dateRange)

  return records.filter(record => {
    const clinicId = record.clinicId || clinicNameToIdMap[record.clinicName || '']
    if (selectedClinic !== 'all' && clinicId !== selectedClinic) return false
    const recordDate = getRecordDate(record)
    return isWithinRange(recordDate, start, end)
  })
}

const buildCombinedData = (
  records: any[],
  clinicId: string,
  dateRange?: { start: string; end: string }
) => {
  const total = records.reduce((sum, record) => sum + (record.totalWithTax || 0), 0)
  const netTotal = records.reduce((sum, record) => sum + (record.netTotalWithTax || record.totalWithTax || 0), 0)

  return {
    clinicId,
    clinicName: clinicLabelMap[clinicId] || (clinicId === 'all' ? '全院' : clinicId),
    values: records,
    total,
    netTotal,
    startAt: dateRange?.start,
    endAt: dateRange?.end
  }
}

const buildClinicDataFromRecords = (
  template: DashboardState['data']['clinicData'],
  records: any[],
  dataProcessor: DataProcessor,
  dateRange: { start: string; end: string }
) => {
  if (!template) return template

  const grouped: Record<string, any[]> = {}
  Object.keys(template).forEach(key => {
    grouped[key] = []
  })

  records.forEach(record => {
    const clinicId =
      record.clinicId ||
      clinicNameToIdMap[record.clinicName || ''] ||
      record.clinic ||
      record.clinicCode ||
      'unknown'
    if (!grouped[clinicId]) {
      grouped[clinicId] = []
    }
    grouped[clinicId].push(record)
  })

  const result: DashboardState['data']['clinicData'] = {} as any

  Object.entries(template).forEach(([key, clinicData]) => {
    const clinicRecords = grouped[key] || []
    const combined = buildCombinedData(clinicRecords, key, dateRange)
    result[key as keyof DashboardState['data']['clinicData']] = {
      ...clinicData,
      dailyAccounts: clinicRecords,
      patients: clinicRecords.length ? dataProcessor.processDailyAccountsToPatients(combined) : [],
      accounting: clinicRecords.length ? dataProcessor.processDailyAccountsToAccounting(combined) : []
    }
  })

  return result
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }

  const { state, ...rest } = context

  const dataProcessorRef = useRef<DataProcessor>()
  if (!dataProcessorRef.current) {
    dataProcessorRef.current = new DataProcessor()
  }
  const dataProcessor = dataProcessorRef.current

  const filteredState = useMemo(() => {
    const filteredDailyAccounts = filterDailyAccountsBySelection(
      state.data.dailyAccounts,
      state.selectedClinic,
      state.dateRange
    )

    const combinedData = buildCombinedData(filteredDailyAccounts, state.selectedClinic, state.dateRange)

    const patients = filteredDailyAccounts.length
      ? dataProcessor.processDailyAccountsToPatients(combinedData)
      : []
    const accounting = filteredDailyAccounts.length
      ? dataProcessor.processDailyAccountsToAccounting(combinedData)
      : []
    const clinicData = buildClinicDataFromRecords(
      state.data.clinicData,
      filteredDailyAccounts,
      dataProcessor,
      state.dateRange
    )

    const currentMonthMetrics = filteredDailyAccounts.length
      ? {
          visitCount: dataProcessor.calculateCurrentMonthVisitCount(combinedData),
          accountingUnitPrice: dataProcessor.calculateCurrentMonthAccountingUnitPrice(combinedData),
          revenue: dataProcessor.calculateCurrentMonthRevenue(combinedData)
        }
      : state.currentMonthMetrics

    const trendData = filteredDailyAccounts.length
      ? {
          monthly: dataProcessor.calculateMonthlyTrends(combinedData),
          daily: dataProcessor.calculateDailyTrends(combinedData, 30),
          yearOverYear: dataProcessor.calculateYearOverYearComparison(combinedData)
        }
      : state.trendData

    const demographics = filteredDailyAccounts.length
      ? dataProcessor.calculateDemographics(combinedData)
      : state.demographics

    return {
      ...state,
      data: {
        ...state.data,
        dailyAccounts: filteredDailyAccounts,
        patients,
        accounting,
        clinicData
      },
      currentMonthMetrics,
      trendData,
      demographics
    }
  }, [state, dataProcessor])

  return {
    ...rest,
    state: filteredState
  }
}