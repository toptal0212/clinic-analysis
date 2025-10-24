// Medical Force API Integration
import { MedicalForceClinic, MedicalForceService, MedicalForceUpdatedBrandCourse, DailyAccountsResponse } from './dataTypes'

export class MedicalForceAPI {
  private baseURL: string
  private cacheVersion: string = 'v5' // store raw origin records in cache
  private clientId: string | null = null
  private clientSecret: string | null = null
  private accessToken: string | null = null
  private tokenExpiry: number | null = null
  private timeout: number = 30000

  constructor() {
    this.baseURL = 'https://api.medical-force.com/'
    // Set default credentials for Medical Force API
    this.clientId = '74kgoefn8h2pbslk8qo50j99to'
    this.clientSecret = '1r19ivhqj4tsmqbs75m03vm6fk9iedk63n52b0n7og77lt9d56g0'
  }

  setClientCredentials(clientId: string, clientSecret: string) {
    this.clientId = clientId
    this.clientSecret = clientSecret
    this.accessToken = null
    this.tokenExpiry = null
  }

  // Set clinic-specific credentials
  setClinicCredentials(clinicId: string) {
    const clinicConfigs = {
      'yokohama': { clientId: '56ensn75gfosp2d40jp9vk6h8j', clientSecret: '1npprack1mkd80ilvi1rcjsdqjvcv10qbr2qgeq463cv6rdqkh78' },
      'koriyama': { clientId: '5akls28bqmv28e2buaujbaaa4t', clientSecret: '18b6qdklg7gktn9rd31ru5q4gb4svhitkvfi714k81ai3ksip0vl' },
      'mito': { clientId: '5t4crevvhpl55ko383c0jumnpb', clientSecret: '1ubu2qqujd4eqakat85iu4h97k8ogu6orut6s08kgr98f9cuk4gb' },
      'omiya': { clientId: '74kgoefn8h2pbslk8qo50j99to', clientSecret: '1r19ivhqj4tsmqbs75m03vm6fk9iedk63n52b0n7og77lt9d56g0' }
    }

    const clinicConfig = clinicConfigs[clinicId as keyof typeof clinicConfigs]
    if (clinicConfig) {
      this.setClientCredentials(clinicConfig.clientId, clinicConfig.clientSecret)
      console.log(`🏥 [API] Switched to ${clinicId} credentials:`, {
        clientId: clinicConfig.clientId.substring(0, 8) + '...',
        clientSecret: clinicConfig.clientSecret.substring(0, 8) + '...'
      })
    } else {
      console.warn(`⚠️ [API] Unknown clinic ID: ${clinicId}`)
      throw new Error(`Unknown clinic ID: ${clinicId}`)
    }
  }

  // Get token status for debugging
  getTokenStatus() {
    if (!this.accessToken) {
      return { hasToken: false, message: 'No token available' }
    }
    
    if (!this.tokenExpiry) {
      return { hasToken: true, message: 'Token available but no expiry info' }
    }
    
    const now = Date.now()
    const remainingTime = this.tokenExpiry - now
    
    if (remainingTime <= 0) {
      return { hasToken: true, message: 'Token expired' }
    }
    
    const remainingMinutes = Math.floor(remainingTime / 1000 / 60)
    const remainingHours = Math.floor(remainingMinutes / 60)
    
    return {
      hasToken: true,
      message: `Token valid for ${remainingHours}h ${remainingMinutes % 60}m`,
      expiresAt: new Date(this.tokenExpiry).toISOString()
    }
  }

  private async getAccessToken(): Promise<string> {
    // If we have a valid token, return it
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      const remainingTime = Math.floor((this.tokenExpiry - Date.now()) / 1000 / 60) // minutes
      console.log(`Using existing token, expires in ${remainingTime} minutes`)
      return this.accessToken
    }

    // Token expired or not available, get a new one
    console.log('Token expired or not available, requesting new token...')
    
    if (this.clientId && this.clientSecret) {
      return await this.authenticateWithClientCredentials()
    }

    throw new Error('Client credentials not configured. Please set clientId and clientSecret.')
  }

  private async authenticateWithClientCredentials(): Promise<string> {
    console.log('🔐 Starting Bearer token authentication...')
    console.log('📡 Client ID:', this.clientId)
    console.log('🔑 Client Secret:', this.clientSecret ? '***' + this.clientSecret.slice(-4) : 'undefined')
    
    try {
      console.log('🌐 Making request to /api/token...')
      const requestBody = {
        client_id: this.clientId,
        client_secret: this.clientSecret
      }
      console.log('📤 Request body:', requestBody)

      const response = await fetch('/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      console.log('📥 Response status:', response.status)
      console.log('📥 Response ok:', response.ok)
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Bearer token authentication failed:', response.status, errorData)
        throw new Error(errorData.error || `Bearer token authentication failed: ${response.status} ${response.statusText}`)
      }

      const tokenData = await response.json()
      console.log('✅ Token response received:', {
        hasAccessToken: !!tokenData.access_token,
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope
      })
      
      if (!tokenData.access_token) {
        console.error('❌ No access token in response:', tokenData)
        throw new Error('No Bearer token received from Medical Force API')
      }

      // Remove all spaces from the bearer token
      this.accessToken = tokenData.access_token.replace(/\s/g, '')
      console.log('🔑 Processed access token length:', this.accessToken?.length || 0)
      
      // Set expiry time (subtract 5 minutes for safety)
      // If expires_in is not provided, assume 24 hours (86400 seconds)
      const expiresIn = tokenData.expires_in || 86400
      this.tokenExpiry = Date.now() + (expiresIn * 1000) - (5 * 60 * 1000)
      
      console.log('✅ Medical Force API Bearer token authentication successful!')
      console.log('⏰ Token expires in:', expiresIn, 'seconds')
      console.log('⏰ Token expires at:', new Date(this.tokenExpiry).toISOString())
      
      return this.accessToken!
    } catch (error) {
      console.error('❌ Medical Force API Bearer token authentication failed:')
      console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
      console.error('Error message:', error instanceof Error ? error.message : String(error))
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      throw new Error(`Bearer token authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    console.log('🌐 [API] Generic request to endpoint:', endpoint)
    
    // Get the access token
    const token = await this.getAccessToken()
    console.log('✅ [API] Access token obtained for generic request')
    
    // For now, we'll create specific API routes for each endpoint
    // This is a fallback method that should be replaced with specific API routes
    console.warn('⚠️ [API] Using generic request method - consider creating specific API route for:', endpoint)
    
    const url = `${this.baseURL}${endpoint}`
    
    const defaultOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    }

    const requestOptions = { ...defaultOptions, ...options }

    try {
      console.log('🌐 [API] Making direct request to Medical Force API:', url)
      const response = await fetch(url, requestOptions)
      
      console.log('📥 [API] Response status:', response.status)
      console.log('📥 [API] Response ok:', response.ok)
      
      if (!response.ok) {
        if (response.status === 401) {
          const errorData = await response.json().catch(() => ({}))
          console.warn('⚠️ [API] Token expired in request, attempting to refresh...')
          
          // Clear current token and try to get a new one
          this.accessToken = null
          this.tokenExpiry = null
          
          try {
            const newToken = await this.getAccessToken()
            // Retry the request with new token
            const retryOptions = {
              ...requestOptions,
              headers: {
                ...requestOptions.headers,
                'Authorization': `Bearer ${newToken}`
              }
            }
            
            const retryResponse = await fetch(url, retryOptions)
            
            if (!retryResponse.ok) {
              throw new Error(`認証エラー: ${errorData.message || 'Your token is invalid'}`)
            }
            
            return await retryResponse.json()
          } catch (refreshError) {
            throw new Error(`認証エラー: ${errorData.message || 'Your token is invalid'}`)
          }
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('✅ [API] Generic request successful')
      return data
    } catch (error) {
      console.error('❌ [API] Generic request failed:', error)
      throw error
    }
  }

  // Get patient data (来院者情報)
  async getPatientData(startDate: string, endDate: string) {
    const endpoint = `patients?start_date=${startDate}&end_date=${endDate}`
    return await this.request(endpoint)
  }

  // Get accounting data (会計情報)
  async getAccountingData(startDate: string, endDate: string) {
    const endpoint = `accounting?start_date=${startDate}&end_date=${endDate}`
    return await this.request(endpoint)
  }

  // Get appointment data (予約情報)
  async getAppointmentData(startDate: string, endDate: string) {
    const endpoint = `appointments?start_date=${startDate}&end_date=${endDate}`
    return await this.request(endpoint)
  }

  // Get revenue data with complex calculations
  async getRevenueData(startDate: string, endDate: string) {
    const endpoint = `revenue?start_date=${startDate}&end_date=${endDate}`
    return await this.request(endpoint)
  }

  // Get services (役務) by update date
  async getServicesByUpdateDate(startDate: string, endDate: string): Promise<MedicalForceService[]> {
    const endpoint = `services?updated_from=${startDate}&updated_to=${endDate}`
    return await this.request(endpoint)
  }

  // Get all active services
  async getAllServices(): Promise<MedicalForceService[]> {
    const endpoint = `services`
    return await this.request(endpoint)
  }

  // Get service categories
  async getServiceCategories(): Promise<string[]> {
    const endpoint = `services/categories`
    return await this.request(endpoint)
  }

  // Get daily accounts data (日計表データ)
  async getDailyAccounts(epochFrom: string, epochTo: string, clinicId?: string): Promise<DailyAccountsResponse> {
    console.log('📊 [API] Getting daily accounts...')
    console.log('📅 [API] Date range:', { epochFrom, epochTo })
    console.log('🏥 [API] Clinic ID:', clinicId || 'default')
    
    // If clinicId is provided, temporarily switch credentials
    let originalCredentials = null
    if (clinicId) {
      originalCredentials = { clientId: this.clientId, clientSecret: this.clientSecret }
      this.setClinicCredentials(clinicId)
    }
    
    try {
      // Get the access token
      const token = await this.getAccessToken()
      console.log('✅ [API] Access token obtained for daily accounts request')
      const url = `/api/daily-accounts?epoch_from=${epochFrom}&epoch_to=${epochTo}`
      console.log('🌐 [API] Making request to:', url)
      
      // Use Next.js API route to avoid CORS issues
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('📥 [API] Daily accounts response status:', response.status)
      console.log('📥 [API] Daily accounts response ok:', response.ok)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ [API] Daily accounts API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          clinicId: clinicId || 'default',
          url
        })
        
        if (response.status === 401) {
          console.warn('⚠️ [API] Authentication failed, attempting to refresh...')
          
          // Clear current token and try to get a new one
          this.accessToken = null
          this.tokenExpiry = null
          
          try {
            console.log('🔄 [API] Getting new token for daily accounts...')
            const newToken = await this.getAccessToken()
            console.log('✅ [API] New token obtained for daily accounts')
            
            // Retry the request with new token
            console.log('🔄 [API] Retrying daily accounts request with new token...')
            const retryResponse = await fetch(url, {
              method: 'GET',
              headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${newToken}`
              }
            })
            
            console.log('📥 [API] Retry response status:', retryResponse.status)
            console.log('📥 [API] Retry response ok:', retryResponse.ok)
            
            if (!retryResponse.ok) {
              const retryErrorData = await retryResponse.json().catch(() => ({}))
              console.error('❌ [API] Daily accounts retry failed:', retryErrorData)
              throw new Error(`認証エラー (${clinicId || 'default'}): ${retryErrorData.error || 'Authentication failed'}`)
            }
            
            const retryData = await retryResponse.json()
            console.log('✅ [API] Daily accounts retry successful')
            return retryData
          } catch (refreshError) {
            console.error('❌ [API] Token refresh failed for daily accounts:', refreshError)
            throw new Error(`認証エラー (${clinicId || 'default'}): ${errorData.error || 'Authentication failed'}`)
          }
        } else if (response.status === 502) {
          throw new Error(`サーバーエラー (${clinicId || 'default'}): 502 Bad Gateway - サーバーが一時的に利用できません`)
        } else {
          throw new Error(`API Error (${clinicId || 'default'}): ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`)
        }
      }

      const data = await response.json()
      console.log('✅ [API] Daily accounts data received successfully!')
      console.log('📊 [API] Data summary:', {
        clinicId: data.clinicId,
        total: data.total,
        netTotal: data.netTotal,
        valuesCount: Array.isArray(data.values) ? data.values.length : 'not array',
        startAt: data.startAt,
        endAt: data.endAt
      })
      
      // DEBUG: Detailed API response logging
      console.log('🔍 [API DEBUG] Full API response structure:', {
        responseKeys: Object.keys(data),
        dataType: typeof data,
        valuesType: typeof data.values,
        isValuesArray: Array.isArray(data.values),
        valuesLength: data.values?.length || 0,
        sampleValue: data.values?.[0],
        sampleValueKeys: data.values?.[0] ? Object.keys(data.values[0]) : 'no values'
      })
      
      // DEBUG: Log first few records in detail
      if (data.values && data.values.length > 0) {
        console.log('🔍 [API DEBUG] First 3 records:', data.values.slice(0, 3))
        console.log('🔍 [API DEBUG] Record field analysis:', {
          recordDate: data.values[0]?.recordDate,
          visitorName: data.values[0]?.visitorName,
          treatmentName: data.values[0]?.treatmentName,
          totalWithTax: data.values[0]?.totalWithTax,
          netTotal: data.values[0]?.netTotal,
          allFields: Object.keys(data.values[0] || {})
        })
      } else {
        console.warn('⚠️ [API DEBUG] No values in API response')
      }
      
      return data
    } catch (error) {
      console.error('❌ [API] Daily accounts API request failed:')
      console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
      console.error('Error message:', error instanceof Error ? error.message : String(error))
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      throw error
    } finally {
      // Restore original credentials if they were changed
      if (originalCredentials && originalCredentials.clientId && originalCredentials.clientSecret) {
        this.setClientCredentials(originalCredentials.clientId, originalCredentials.clientSecret)
        console.log('🔄 [API] Restored original credentials')
      }
    }
  }

  // Get updated brand courses by clinic_id and date
  async getUpdatedBrandCourses(clinicId: string, date: string): Promise<MedicalForceUpdatedBrandCourse[]> {
    console.log('🔍 Starting service search...')
    console.log('🏥 Clinic ID:', clinicId)
    console.log('📅 Date:', date)
    
    // Get the access token
    console.log('🔑 Getting access token...')
    const token = await this.getAccessToken()
    console.log('✅ Access token obtained, length:', token.length)
    
    try {
      const url = `/api/updated-brand-courses?clinic_id=${clinicId}&date=${date}`
      console.log('🌐 Making request to:', url)
      
      // Use Next.js API route to avoid CORS issues
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('📥 Response status:', response.status)
      console.log('📥 Response ok:', response.ok)
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        if (response.status === 401) {
          const errorData = await response.json().catch(() => ({}))
          console.warn('⚠️ Token expired, attempting to refresh...')
          console.log('Error data:', errorData)
          
          // Clear current token and try to get a new one
          this.accessToken = null
          this.tokenExpiry = null
          
          try {
            console.log('🔄 Getting new token...')
            const newToken = await this.getAccessToken()
            console.log('✅ New token obtained, length:', newToken.length)
            
            // Retry the request with new token
            console.log('🔄 Retrying request with new token...')
            const retryResponse = await fetch(url, {
              method: 'GET',
              headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${newToken}`
              }
            })
            
            console.log('📥 Retry response status:', retryResponse.status)
            console.log('📥 Retry response ok:', retryResponse.ok)
            
            if (!retryResponse.ok) {
              const retryErrorData = await retryResponse.json().catch(() => ({}))
              console.error('❌ Retry failed:', retryErrorData)
              throw new Error(`認証エラー: ${retryErrorData.error || 'Your token is invalid'}`)
            }
            
            const retryData = await retryResponse.json()
            console.log('✅ Retry successful, data length:', Array.isArray(retryData) ? retryData.length : 'not array')
            return retryData
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError)
            throw new Error(`認証エラー: ${errorData.error || 'Your token is invalid'}`)
          }
        }
        
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ API Error:', errorData)
        throw new Error(`API Error: ${errorData.error || response.statusText}`)
      }

      const data = await response.json()
      console.log('✅ Service search successful!')
      console.log('📊 Results count:', Array.isArray(data) ? data.length : 'not array')
      console.log('📊 Data type:', typeof data)
      console.log('📊 Sample data:', Array.isArray(data) && data.length > 0 ? data[0] : data)
      
      return data
    } catch (error) {
      console.error('❌ Service search API request failed:')
      console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
      console.error('Error message:', error instanceof Error ? error.message : String(error))
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      throw error
    }
  }

  // Get clinic list
  async getClinics(): Promise<MedicalForceClinic> {
    console.log('🏥 [API] Getting clinics...')
    
    // Get the access token
    const token = await this.getAccessToken()
    console.log('✅ [API] Access token obtained for clinics request')
    
    try {
      // Use Next.js API route to avoid CORS issues
      const url = `/api/clinics?clinic_id=${this.clientId || '74kgoefn8h2pbslk8qo50j99to'}`
      console.log('🌐 [API] Making request to:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('📥 [API] Clinics response status:', response.status)
      console.log('📥 [API] Clinics response ok:', response.ok)

      if (!response.ok) {
        if (response.status === 401) {
          const errorData = await response.json().catch(() => ({}))
          console.warn('⚠️ [API] Token expired, attempting to refresh...')
          console.log('Error data:', errorData)
          
          // Clear current token and try to get a new one
          this.accessToken = null
          this.tokenExpiry = null
          
          try {
            console.log('🔄 [API] Getting new token for clinics...')
            const newToken = await this.getAccessToken()
            console.log('✅ [API] New token obtained for clinics')
            
            // Retry the request with new token
            console.log('🔄 [API] Retrying clinics request with new token...')
            const retryResponse = await fetch(url, {
              method: 'GET',
              headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${newToken}`
              }
            })
            
            console.log('📥 [API] Retry response status:', retryResponse.status)
            console.log('📥 [API] Retry response ok:', retryResponse.ok)
            
            if (!retryResponse.ok) {
              const retryErrorData = await retryResponse.json().catch(() => ({}))
              console.error('❌ [API] Clinics retry failed:', retryErrorData)
              throw new Error(`認証エラー: ${retryErrorData.error || 'Your token is invalid'}`)
            }
            
            const retryData = await retryResponse.json()
            console.log('✅ [API] Clinics retry successful')
            return retryData
          } catch (refreshError) {
            console.error('❌ [API] Token refresh failed for clinics:', refreshError)
            throw new Error(`認証エラー: ${errorData.error || 'Your token is invalid'}`)
          }
        }
        
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ [API] Clinics API Error:', errorData)
        throw new Error(`API Error: ${errorData.error || response.statusText}`)
      }

      const data = await response.json()
      console.log('✅ [API] Clinics data received:', {
        dataType: typeof data,
        hasClinicId: !!data.clinic_id,
        hasName: !!data.name
      })
      
      return data
    } catch (error) {
      console.error('❌ [API] Clinics API request failed:')
      console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
      console.error('Error message:', error instanceof Error ? error.message : String(error))
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      throw error
    }
  }

  // Get staff list
  async getStaff() {
    const endpoint = 'staff'
    return await this.request(endpoint)
  }

  // Get treatment categories
  async getTreatmentCategories() {
    const endpoint = 'treatment-categories'
    return await this.request(endpoint)
  }

  // Get referral sources (流入元)
  async getReferralSources() {
    const endpoint = 'referral-sources'
    return await this.request(endpoint)
  }

  // Get appointment routes (来院区分)
  async getAppointmentRoutes() {
    const endpoint = 'appointment-routes'
    return await this.request(endpoint)
  }

  // Validate data integrity
  async validateData(startDate: string, endDate: string) {
    const endpoint = `validate?start_date=${startDate}&end_date=${endDate}`
    return await this.request(endpoint)
  }

  // Cache management for 2-year data storage
  private getCacheKey(clinicId: string, year: number, month: number): string {
    return `daily_accounts_${this.cacheVersion}_${clinicId}_${year}_${String(month).padStart(2, '0')}`
  }

  private getCachedData(clinicId: string, year: number, month: number): any | null {
    try {
      const key = this.getCacheKey(clinicId, year, month)
      const cached = localStorage.getItem(key)
      if (cached) {
        const data = JSON.parse(cached)
        // Check if cache is still valid (not older than 1 day)
        const cacheTime = new Date(data.cachedAt)
        const now = new Date()
        const hoursDiff = (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60)
        
        if (hoursDiff < 24) {
          console.log('📦 [Cache] Using cached data for:', key)
          return data.data
        } else {
          console.log('⏰ [Cache] Cache expired for:', key)
          localStorage.removeItem(key)
        }
      }
    } catch (error) {
      console.error('❌ [Cache] Error reading cached data:', error)
    }
    return null
  }

  private setCachedData(clinicId: string, year: number, month: number, data: any): void {
    try {
      const key = this.getCacheKey(clinicId, year, month)
      
      // Compress data to reduce size
      const compressedData = this.compressData(data)
      
      const cacheData = {
        data: compressedData,
        cachedAt: new Date().toISOString()
      }
      
      const dataString = JSON.stringify(cacheData)
      
      // Check storage space before saving
      const storageInfo = this.getStorageInfo()
      const requiredSpace = dataString.length
      
      if (requiredSpace > storageInfo.available) {
        console.warn('⚠️ [Cache] Not enough storage space, cleaning old cache...')
        this.cleanOldCache(clinicId)
      }
      
      // Check if data is still too large (limit to 500KB per entry)
      const maxSize = 512 * 1024 // 500KB
      if (dataString.length > maxSize) {
        console.warn('⚠️ [Cache] Data too large, skipping cache for:', key, `(${Math.round(dataString.length / 1024)}KB)`)
        return
      }
      
      localStorage.setItem(key, dataString)
      console.log('💾 [Cache] Saved data for:', key, `(${Math.round(dataString.length / 1024)}KB)`)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('⚠️ [Cache] Storage quota exceeded, cleaning old cache...')
        this.cleanOldCache(clinicId)
        
        // Try again after cleaning with compressed data
        try {
          const key = this.getCacheKey(clinicId, year, month)
          const compressedData = this.compressData(data)
          const cacheData = {
            data: compressedData,
            cachedAt: new Date().toISOString()
          }
          localStorage.setItem(key, JSON.stringify(cacheData))
          console.log('💾 [Cache] Saved compressed data after cleanup for:', key)
        } catch (retryError) {
          console.error('❌ [Cache] Still failed after cleanup, skipping cache for:', this.getCacheKey(clinicId, year, month))
        }
      } else {
        console.error('❌ [Cache] Error saving data:', error)
      }
    }
  }

  // Check available storage space
  private getStorageInfo(): { used: number, available: number, total: number } {
    try {
      let used = 0
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length
        }
      }
      
      // Estimate available space (most browsers have 5-10MB limit)
      const estimatedTotal = 5 * 1024 * 1024 // 5MB
      const available = Math.max(0, estimatedTotal - used)
      
      return {
        used: used,
        available: available,
        total: estimatedTotal
      }
    } catch (error) {
      console.error('❌ [Cache] Error checking storage:', error)
      return { used: 0, available: 0, total: 0 }
    }
  }

  // Store origin API format in cache (no compression/mapping)
  private compressData(data: any): any {
    try {
      return data
    } catch (error) {
      console.error('❌ [Cache] Error preparing data for cache:', error)
      return data
    }
  }

  // Get 2-year data by fetching monthly data and caching it
  async getTwoYearData(clinicId: string, onProgress?: (progress: { currentStep: string, currentStepNumber: number, totalSteps: number, percentage: number }) => void): Promise<any> {
    console.log('📊 [API] Getting 2-year data with monthly caching...')
    
    const currentDate = new Date()
    const twoYearsAgo = new Date(currentDate)
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
    twoYearsAgo.setMonth(0, 1) // January 1st
    
    const allData: any[] = []
    const monthsToFetch: { year: number, month: number }[] = []
    
    // Check what data we need to fetch
    for (let date = new Date(twoYearsAgo); date <= currentDate; date.setMonth(date.getMonth() + 1)) {
      const year = date.getFullYear()
      const month = date.getMonth()
      
      const cachedData = this.getCachedData(clinicId, year, month)
      if (cachedData) {
        allData.push(...cachedData)
      } else {
        monthsToFetch.push({ year, month })
      }
    }

    // Always refresh the most recent ~30 days even if cached (may span 2 months)
    const refreshStart = new Date(currentDate)
    refreshStart.setDate(refreshStart.getDate() - 30)
    const refreshMonthsSet = new Set<string>()
    for (let d = new Date(refreshStart.getFullYear(), refreshStart.getMonth(), 1);
         d <= currentDate; d.setMonth(d.getMonth() + 1)) {
      const y = d.getFullYear()
      const m = d.getMonth()
      refreshMonthsSet.add(`${y}-${m}`)
    }
    const existingKeys = new Set(monthsToFetch.map(x => `${x.year}-${x.month}`))
    refreshMonthsSet.forEach(key => {
      if (!existingKeys.has(key)) {
        const [yStr, mStr] = key.split('-')
        monthsToFetch.push({ year: parseInt(yStr, 10), month: parseInt(mStr, 10) })
      }
    })
    
    const totalMonths = Math.ceil((currentDate.getTime() - twoYearsAgo.getTime()) / (1000 * 60 * 60 * 24 * 30))
    const cachedMonths = totalMonths - monthsToFetch.length
    
    console.log('📅 [API] Cache status:', {
      totalMonths,
      cachedMonths,
      monthsToFetch: monthsToFetch.length
    })
    
    // Report initial progress
    if (onProgress) {
      onProgress({
        currentStep: `キャッシュ確認完了 (${cachedMonths}/${totalMonths} ヶ月)`,
        currentStepNumber: 1,
        totalSteps: monthsToFetch.length + 2, // +2 for cache check and final processing
        percentage: Math.round((1 / (monthsToFetch.length + 2)) * 100)
      })
    }
    
    // Fetch missing months
    for (let i = 0; i < monthsToFetch.length; i++) {
      const { year, month } = monthsToFetch[i]
      const stepNumber = i + 2 // +2 because step 1 was cache check
      
      try {
        const startDate = new Date(year, month, 1)
        const endDate = new Date(year, month + 1, 0) // Last day of the month
        
        const startDateStr = startDate.toISOString().split('T')[0]
        const endDateStr = endDate.toISOString().split('T')[0]
        
        console.log(`🔄 [API] Fetching data for ${year}-${String(month + 1).padStart(2, '0')}... (${i + 1}/${monthsToFetch.length})`)
        
        // Report progress before fetching
        if (onProgress) {
          onProgress({
            currentStep: `${year}年${month + 1}月のデータを取得中... (${i + 1}/${monthsToFetch.length})`,
            currentStepNumber: stepNumber,
            totalSteps: monthsToFetch.length + 2,
            percentage: Math.round((stepNumber / (monthsToFetch.length + 2)) * 100)
          })
        }
        
        const monthlyData = await this.getDailyAccounts(startDateStr, endDateStr)
        
        if (monthlyData && monthlyData.values) {
          allData.push(...monthlyData.values)
          this.setCachedData(clinicId, year, month, monthlyData.values)
        }
        
        // Add small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`❌ [API] Failed to fetch data for ${year}-${String(month + 1).padStart(2, '0')}:`, error)
      }
    }
    
    // Report final processing step
    if (onProgress) {
      onProgress({
        currentStep: 'データを処理中...',
        currentStepNumber: monthsToFetch.length + 2,
        totalSteps: monthsToFetch.length + 2,
        percentage: 100
      })
    }
    
    // Return combined data in the same format as the original API
    const combinedData = {
      clinicId: clinicId,
      total: allData.reduce((sum, item) => sum + (item.totalWithTax || 0), 0),
      netTotal: allData.reduce((sum, item) => sum + (item.netTotal || 0), 0),
      values: allData,
      startAt: twoYearsAgo.toISOString().split('T')[0],
      endAt: currentDate.toISOString().split('T')[0]
    }
    
    console.log('✅ [API] 2-year data assembled:', {
      totalRecords: allData.length,
      totalRevenue: combinedData.total,
      dateRange: `${combinedData.startAt} to ${combinedData.endAt}`
    })
    
    return combinedData
  }

  // Clean old cache entries to free up space
  private cleanOldCache(clinicId: string): void {
    try {
      const keys = Object.keys(localStorage)
      const cacheKeys = keys.filter(key => key.startsWith(`daily_accounts_${clinicId}_`))
      
      if (cacheKeys.length === 0) return
      
      // Sort by date (oldest first)
      const sortedKeys = cacheKeys.sort((a, b) => {
        const aMatch = a.match(/_(\d{4})_(\d{2})$/)
        const bMatch = b.match(/_(\d{4})_(\d{2})$/)
        
        if (!aMatch || !bMatch) return 0
        
        const aDate = new Date(parseInt(aMatch[1]), parseInt(aMatch[2]) - 1)
        const bDate = new Date(parseInt(bMatch[1]), parseInt(bMatch[2]) - 1)
        
        return aDate.getTime() - bDate.getTime()
      })
      
      // Remove oldest 25% of cache entries
      const entriesToRemove = Math.ceil(sortedKeys.length * 0.25)
      const keysToRemove = sortedKeys.slice(0, entriesToRemove)
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        console.log('🗑️ [Cache] Removed old entry:', key)
      })
      
      console.log(`🧹 [Cache] Cleaned ${keysToRemove.length} old cache entries`)
    } catch (error) {
      console.error('❌ [Cache] Error cleaning old cache:', error)
    }
  }

  // Cache management utilities
  clearCache(clinicId?: string): void {
    try {
      if (clinicId) {
        // Clear cache for specific clinic
        const keys = Object.keys(localStorage)
        const clinicKeys = keys.filter(key => key.startsWith(`daily_accounts_${clinicId}_`))
        clinicKeys.forEach(key => localStorage.removeItem(key))
        console.log(`🗑️ [Cache] Cleared cache for clinic: ${clinicId}`)
      } else {
        // Clear all daily accounts cache
        const keys = Object.keys(localStorage)
        const cacheKeys = keys.filter(key => key.startsWith('daily_accounts_'))
        cacheKeys.forEach(key => localStorage.removeItem(key))
        console.log('🗑️ [Cache] Cleared all daily accounts cache')
      }
    } catch (error) {
      console.error('❌ [Cache] Error clearing cache:', error)
    }
  }

  getCacheInfo(clinicId?: string): { totalKeys: number, totalSize: string, keys: string[], storageInfo: { used: number, available: number, total: number } } {
    try {
      const keys = Object.keys(localStorage)
      const cacheKeys = clinicId 
        ? keys.filter(key => key.startsWith(`daily_accounts_${clinicId}_`))
        : keys.filter(key => key.startsWith('daily_accounts_'))
      
      let totalSize = 0
      cacheKeys.forEach(key => {
        const item = localStorage.getItem(key)
        if (item) totalSize += item.length
      })
      
      const storageInfo = this.getStorageInfo()
      
      return {
        totalKeys: cacheKeys.length,
        totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
        keys: cacheKeys,
        storageInfo: {
          used: Math.round(storageInfo.used / 1024),
          available: Math.round(storageInfo.available / 1024),
          total: Math.round(storageInfo.total / 1024)
        }
      }
    } catch (error) {
      console.error('❌ [Cache] Error getting cache info:', error)
      return { 
        totalKeys: 0, 
        totalSize: '0 KB', 
        keys: [],
        storageInfo: { used: 0, available: 0, total: 0 }
      }
    }
  }
}

// Data Processing Class
export class DataProcessor {
  // Process raw API data into structured format
  processPatientData(rawData: any[]) {
    return rawData.map(patient => ({
      id: patient.patient_id || patient.患者コード,
      name: patient.name || patient.氏名,
      age: parseInt(patient.age || patient.年齢) || 0,
      appointmentId: patient.appointment_id || patient.予約ID,
      treatmentCategory: patient.treatment_category || patient.施術カテゴリー,
      treatmentName: patient.treatment_name || patient.施術名,
      roomName: patient.room_name || patient.部屋名,
      isCancelled: patient.is_cancelled || patient.キャンセル有無,
      referralSource: patient.referral_source || patient.流入元,
      appointmentRoute: patient.appointment_route || patient.予約経路,
      staff: patient.staff || patient.担当者,
      visitDate: new Date(patient.visit_date || patient.来院日),
      treatmentDate: new Date(patient.treatment_date || patient.施術日)
    })).filter(patient => patient.age > 0) // Remove patients with age 0
  }

  // Process accounting data
  processAccountingData(rawData: any[]) {
    return rawData.map(account => ({
      id: account.accounting_id,
      patientId: account.patient_id || account.患者ID,
      amount: parseFloat(account.amount || account.金額) || 0,
      paymentDate: new Date(account.payment_date || account.支払い日),
      visitDate: new Date(account.visit_date || account.来院日),
      treatmentType: account.treatment_type || account.処置内容,
      isAdvancePayment: account.is_advance_payment || account.前受金,
      advancePaymentDate: account.advance_payment_date ? new Date(account.advance_payment_date) : null,
      remainingAmount: parseFloat(account.remaining_amount || account.残金) || 0
    }))
  }

  // Categorize treatment into hierarchical structure
  categorizeTreatment(treatmentCategory: string, treatmentName: string) {
    const name = treatmentName.toLowerCase()
    
    // Surgery category mappings
    if (name.includes('二重') || name.includes('double') || name.includes('eyelid')) {
      return {
        main: '外科',
        sub: '二重',
        procedure: treatmentName,
        specialty: 'surgery'
      }
    }
    if (name.includes('くま') || name.includes('dark') || name.includes('circle')) {
      return {
        main: '外科',
        sub: 'くま治療',
        procedure: treatmentName,
        specialty: 'surgery'
      }
    }
    if (name.includes('糸') || name.includes('thread') || name.includes('lift')) {
      return {
        main: '外科',
        sub: '糸リフト',
        procedure: treatmentName,
        specialty: 'surgery'
      }
    }
    if (name.includes('小顔') || name.includes('face') || name.includes('slimming')) {
      return {
        main: '外科',
        sub: '小顔（S,BF)',
        procedure: treatmentName,
        specialty: 'surgery'
      }
    }
    if (name.includes('鼻') || name.includes('人中') || name.includes('nose') || name.includes('philtrum')) {
      return {
        main: '外科',
        sub: '鼻・人中手術',
        procedure: treatmentName,
        specialty: 'surgery'
      }
    }
    if (name.includes('脂肪吸引') || name.includes('liposuction') || name.includes('body')) {
      return {
        main: '外科',
        sub: 'ボディー脂肪吸引',
        procedure: treatmentName,
        specialty: 'surgery'
      }
    }
    if (name.includes('豊胸') || name.includes('breast') || name.includes('augmentation')) {
      return {
        main: '外科',
        sub: '豊胸',
        procedure: treatmentName,
        specialty: 'surgery'
      }
    }
    
    // Dermatology category mappings
    if (name.includes('注入') || name.includes('injection') || name.includes('ボトックス') || name.includes('ヒアルロン')) {
      return {
        main: '皮膚科',
        sub: '注入',
        procedure: treatmentName,
        specialty: 'dermatology'
      }
    }
    if (name.includes('スキン') || name.includes('skin') || name.includes('レーザー') || name.includes('laser')) {
      return {
        main: '皮膚科',
        sub: 'スキン',
        procedure: treatmentName,
        specialty: 'dermatology'
      }
    }
    
    // Hair removal category
    if (name.includes('脱毛') || name.includes('hair') || name.includes('removal')) {
      return {
        main: '脱毛',
        sub: '脱毛',
        procedure: treatmentName,
        specialty: 'hair_removal'
      }
    }
    
    // Other category mappings
    if (name.includes('ピアス') || name.includes('piercing')) {
      return {
        main: 'その他',
        sub: 'ピアス',
        procedure: treatmentName,
        specialty: 'other'
      }
    }
    if (name.includes('物販') || name.includes('product') || name.includes('商品')) {
      return {
        main: 'その他',
        sub: '物販',
        procedure: treatmentName,
        specialty: 'other'
      }
    }
    if (name.includes('麻酔') || name.includes('針') || name.includes('パック') || name.includes('anesthesia') || name.includes('needle') || name.includes('pack')) {
      return {
        main: 'その他',
        sub: '麻酔・針・パック',
        procedure: treatmentName,
        specialty: 'other'
      }
    }
    
    // Default to surgery other if it contains surgical keywords
    if (name.includes('手術') || name.includes('surgery') || name.includes('外科')) {
      return {
        main: '外科',
        sub: 'その他外科',
        procedure: treatmentName,
        specialty: 'surgery'
      }
    }
    
    // Default to other products for unrecognized items
    return {
      main: 'その他',
      sub: '物販',
      procedure: treatmentName,
      specialty: 'other'
    }
  }

  // Determine patient type (新規/既存/その他)
  determinePatientType(patient: any, accountingData: any[]) {
    const treatment = this.categorizeTreatment(patient.treatmentCategory, patient.treatmentName)
    
    // If it's an "other" treatment, don't count in new/existing
    if (treatment.main === 'その他') {
      return 'その他'
    }
    
    // Check if patient has previous visits
    const previousVisits = accountingData.filter(account => 
      account.patientId === patient.id && 
      account.paymentDate < patient.visitDate
    )
    
    return previousVisits.length > 0 ? '既存' : '新規'
  }

  // Calculate revenue metrics
  calculateRevenueMetrics(patientData: any[], accountingData: any[], date: Date) {
    const dayData = {
      date: date,
      totalRevenue: 0,
      newPatients: [] as any[],
      existingPatients: [] as any[],
      otherPatients: [] as any[],
      sameDayNewAverage: 0,
      newAverage: 0,
      existingAverage: 0
    }

    // Filter data for the specific date
    const dayPatients = patientData.filter(patient => 
      this.isSameDay(patient.visitDate, date)
    )

    const dayAccounting = accountingData.filter(account => 
      this.isSameDay(account.paymentDate, date)
    )

    // Process each patient
    dayPatients.forEach(patient => {
      const patientType = this.determinePatientType(patient, accountingData)
      const patientAccounting = dayAccounting.filter(account => 
        account.patientId === patient.id
      )

      if (patientType === '新規') {
        dayData.newPatients.push({
          patient: patient,
          accounting: patientAccounting,
          sameDayAmount: patientAccounting.reduce((sum, acc) => sum + acc.amount, 0),
          totalAmount: this.calculateTotalAmount(patient.id, accountingData)
        })
      } else if (patientType === '既存') {
        dayData.existingPatients.push({
          patient: patient,
          accounting: patientAccounting,
          sameDayAmount: patientAccounting.reduce((sum, acc) => sum + acc.amount, 0),
          totalAmount: this.calculateTotalAmount(patient.id, accountingData)
        })
      } else {
        dayData.otherPatients.push({
          patient: patient,
          accounting: patientAccounting,
          sameDayAmount: patientAccounting.reduce((sum, acc) => sum + acc.amount, 0)
        })
      }
    })

    // Calculate totals
    dayData.totalRevenue = dayAccounting.reduce((sum, account) => sum + account.amount, 0)

    // Calculate averages
    if (dayData.newPatients.length > 0) {
      dayData.sameDayNewAverage = dayData.newPatients.reduce((sum, p) => sum + p.sameDayAmount, 0) / dayData.newPatients.length
      dayData.newAverage = dayData.newPatients.reduce((sum, p) => sum + p.totalAmount, 0) / dayData.newPatients.length
    }

    if (dayData.existingPatients.length > 0) {
      dayData.existingAverage = dayData.existingPatients.reduce((sum, p) => sum + p.totalAmount, 0) / dayData.existingPatients.length
    }

    return dayData
  }

  // Helper methods
  isSameDay(date1: Date, date2: Date) {
    return date1.toDateString() === date2.toDateString()
  }

  calculateTotalAmount(patientId: string, accountingData: any[]) {
    return accountingData
      .filter(account => account.patientId === patientId)
      .reduce((sum, account) => sum + account.amount, 0)
  }

  // Process daily accounts data to patient data format
  processDailyAccountsToPatients(dailyAccountsData: any): any[] {
    console.log('🔄 [DataProcessor] Processing daily accounts to patients...')
    
    return dailyAccountsData.values.map((value: any, index: number) => ({
      id: value.visitorId,
      name: value.visitorName,
      age: value.visitorAge,
      gender: value.visitorGender,
      appointmentId: value.reservationId,
      treatmentCategory: value.paymentItems?.[0]?.category || 'その他',
      treatmentName: value.paymentItems?.[0]?.name || '未分類',
      roomName: '診察室', // Not available in daily accounts
      isCancelled: value.cancelPriceWithTax > 0,
      referralSource: value.visitorInflowSourceName || 'その他',
      appointmentRoute: '来院', // Not available in daily accounts
      staff: value.paymentItems?.[0]?.mainStaffName || value.reservationStaffName || '担当者不明',
      visitDate: new Date(value.recordDate),
      treatmentDate: new Date(value.confirmedAt),
      isNewPatient: value.isFirst,
      patientType: value.isFirst ? '新規' : '既存',
      firstVisitDate: value.isFirst ? new Date(value.confirmedAt) : undefined,
      totalAmount: value.totalWithTax,
      paymentMethod: Object.keys(value.methodPrice || {}).join(', '),
      discountAmount: Object.values(value.discountPrice || {}).reduce((sum: number, item: any) => sum + item.price, 0)
    }))
  }

  // Process daily accounts data to accounting data format
  processDailyAccountsToAccounting(dailyAccountsData: any): any[] {
    console.log('🔄 [DataProcessor] Processing daily accounts to accounting...')
    
    const accountingData: any[] = []
    
    dailyAccountsData.values.forEach((value: any) => {
      value.paymentItems?.forEach((item: any) => {
        accountingData.push({
          id: item.id,
          patientId: value.visitorId,
          amount: item.priceWithTax,
          paymentDate: new Date(value.confirmedAt),
          visitDate: new Date(value.recordDate),
          treatmentType: item.name,
          isAdvancePayment: item.advancePaymentPriceWithTax > 0,
          advancePaymentDate: item.advancePaymentPriceWithTax > 0 ? new Date(value.confirmedAt) : null,
          remainingAmount: item.priceWithTax - item.advancePaymentPriceWithTax,
          isConsultation: false, // Not available in daily accounts
          paymentMethod: Object.keys(item.methods || {}).join(', '),
          discountAmount: Object.values(item.discounts || {}).reduce((sum: number, discount: any) => sum + discount, 0),
          staff: item.mainStaffName
        })
      })
    })
    
    return accountingData
  }

  // Calculate current month accounting unit price from daily accounts data
  calculateCurrentMonthAccountingUnitPrice(dailyAccountsData: any): number {
    console.log('💰 [DataProcessor] Calculating current month accounting unit price...')
    
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    // Filter data for current month
    const currentMonthData = dailyAccountsData.values.filter((value: any) => {
      const recordDate = new Date(value.recordDate)
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear
    })
    
    console.log('📊 [DataProcessor] Current month data count:', currentMonthData.length)
    
    if (currentMonthData.length === 0) {
      console.log('⚠️ [DataProcessor] No data for current month')
      return 0
    }
    
    // Calculate total revenue and total visits for current month
    const totalRevenue = currentMonthData.reduce((sum: number, value: any) => {
      return sum + (value.totalWithTax || 0)
    }, 0)
    
    const totalVisits = currentMonthData.length
    
    const averagePrice = totalVisits > 0 ? totalRevenue / totalVisits : 0
    
    console.log('💰 [DataProcessor] Current month metrics:', {
      totalRevenue,
      totalVisits,
      averagePrice: Math.round(averagePrice)
    })
    
    return Math.round(averagePrice)
  }

  // Calculate current month visit count from daily accounts data
  calculateCurrentMonthVisitCount(dailyAccountsData: any): number {
    console.log('👥 [DataProcessor] Calculating current month visit count...')
    
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    // Filter data for current month
    const currentMonthData = dailyAccountsData.values.filter((value: any) => {
      const recordDate = new Date(value.recordDate)
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear
    })
    
    console.log('👥 [DataProcessor] Current month visit count:', currentMonthData.length)
    
    return currentMonthData.length
  }

  // Calculate current month revenue from daily accounts data
  calculateCurrentMonthRevenue(dailyAccountsData: any): number {
    console.log('💵 [DataProcessor] Calculating current month revenue...')
    
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    // Filter data for current month
    const currentMonthData = dailyAccountsData.values.filter((value: any) => {
      const recordDate = new Date(value.recordDate)
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear
    })
    
    const totalRevenue = currentMonthData.reduce((sum: number, value: any) => {
      return sum + (value.totalWithTax || 0)
    }, 0)
    
    console.log('💵 [DataProcessor] Current month revenue:', Math.round(totalRevenue))
    
    return Math.round(totalRevenue)
  }


  // Calculate demographic data from daily accounts for current month
  calculateDemographics(dailyAccountsData: any): {
    ageGroups: { labels: string[], data: number[] }
    gender: { labels: string[], data: number[] }
    mediaSource: { labels: string[], data: number[] }
    visitType: { labels: string[], data: number[] }
    prefecture: { labels: string[], data: number[] }
    clinic: { labels: string[], data: number[] }
  } {
    console.log('📊 [DataProcessor] Calculating demographics from daily accounts data...')
    
    if (!dailyAccountsData || !dailyAccountsData.values) {
      return {
        ageGroups: { labels: [], data: [] },
        gender: { labels: [], data: [] },
        mediaSource: { labels: [], data: [] },
        visitType: { labels: [], data: [] },
        prefecture: { labels: [], data: [] },
        clinic: { labels: [], data: [] }
      }
    }

    // Get current month data
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    
    const currentMonthData = dailyAccountsData.values.filter((item: any) => {
      const recordDate = new Date(item.recordDate)
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear
    })

    console.log('📅 [DataProcessor] Current month data points:', currentMonthData.length)

    // Age groups (年代別)
    const ageGroups: { [key: string]: number } = {}
    currentMonthData.forEach((item: any) => {
      const age = item.visitorAge
      let ageGroup = ''
      if (age < 20) ageGroup = '10代'
      else if (age < 30) ageGroup = '20代'
      else if (age < 40) ageGroup = '30代'
      else if (age < 50) ageGroup = '40代'
      else if (age < 60) ageGroup = '50代'
      else if (age < 70) ageGroup = '60代'
      else ageGroup = '70代以上'
      
      ageGroups[ageGroup] = (ageGroups[ageGroup] || 0) + 1
    })

    // Gender (性別)
    const gender: { [key: string]: number } = {}
    currentMonthData.forEach((item: any) => {
      const genderValue = item.visitorGender
      let genderLabel = ''
      if (genderValue === 'male' || genderValue === '男性') genderLabel = '男性'
      else if (genderValue === 'female' || genderValue === '女性') genderLabel = '女性'
      else genderLabel = 'その他'
      
      gender[genderLabel] = (gender[genderLabel] || 0) + 1
    })

    // Media source (媒体別)
    const mediaSource: { [key: string]: number } = {}
    currentMonthData.forEach((item: any) => {
      const source = item.visitorInflowSourceName || item.visitorInflowSourceLabel || '不明'
      mediaSource[source] = (mediaSource[source] || 0) + 1
    })

    // Visit type (初診・再診別)
    const visitType: { [key: string]: number } = {}
    currentMonthData.forEach((item: any) => {
      const isFirst = item.isFirst
      const visitTypeLabel = isFirst ? '初診' : '再診'
      visitType[visitTypeLabel] = (visitType[visitTypeLabel] || 0) + 1
    })

    // Prefecture (都道府県別) - Extract from visitor name or use default
    const prefecture: { [key: string]: number } = {}
    currentMonthData.forEach((item: any) => {
      // For now, use a default distribution since prefecture data might not be directly available
      // This could be enhanced with actual prefecture data if available
      const prefectureLabel = '東京都' // Default for now
      prefecture[prefectureLabel] = (prefecture[prefectureLabel] || 0) + 1
    })

    // Clinic (院別) - Use clinic ID or default
    const clinic: { [key: string]: number } = {}
    currentMonthData.forEach((item: any) => {
      // Map clinic IDs to actual clinic names
      let clinicLabel = '本院' // Default
      if (item.clinicId) {
        switch (item.clinicId) {
          case 'omiya':
            clinicLabel = '大宮院'
            break
          case 'yokohama':
            clinicLabel = '横浜院'
            break
          case 'mito':
            clinicLabel = '水戸院'
            break
          case 'koriyama':
            clinicLabel = '郡山院'
            break
          default:
            clinicLabel = '本院'
        }
      }
      clinic[clinicLabel] = (clinic[clinicLabel] || 0) + 1
    })

    // Convert to arrays for chart data
    const convertToChartData = (data: { [key: string]: number }) => {
      const entries = Object.entries(data).sort((a, b) => b[1] - a[1])
      return {
        labels: entries.map(([label]) => label),
        data: entries.map(([, count]) => count)
      }
    }

    const result = {
      ageGroups: convertToChartData(ageGroups),
      gender: convertToChartData(gender),
      mediaSource: convertToChartData(mediaSource),
      visitType: convertToChartData(visitType),
      prefecture: convertToChartData(prefecture),
      clinic: convertToChartData(clinic)
    }

    console.log('✅ [DataProcessor] Demographics calculated:', {
      ageGroups: result.ageGroups.labels.length,
      gender: result.gender.labels.length,
      mediaSource: result.mediaSource.labels.length,
      visitType: result.visitType.labels.length,
      prefecture: result.prefecture.labels.length,
      clinic: result.clinic.labels.length
    })

    return result
  }

  // Calculate monthly trends from daily accounts data (using all available data)
  calculateMonthlyTrends(dailyAccountsData: any): { labels: string[], visitCounts: number[], revenues: number[] } {
    console.log('📈 [DataProcessor] Calculating monthly trends from all available daily accounts data...')
    
    // Group data by month using ALL data from the API response
    const monthlyData: { [key: string]: { visits: number, revenue: number } } = {}
    
    dailyAccountsData.values.forEach((value: any) => {
      const recordDate = new Date(value.recordDate)
      const monthKey = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { visits: 0, revenue: 0 }
      }
      
      monthlyData[monthKey].visits += 1
      monthlyData[monthKey].revenue += (value.totalWithTax || 0)
    })
    
    // Get the actual date range from the data
    const allDates = dailyAccountsData.values.map((value: any) => new Date(value.recordDate))
    const minDate = new Date(Math.min(...allDates.map((d: Date) => d.getTime())))
    const maxDate = new Date(Math.max(...allDates.map((d: Date) => d.getTime())))
    
    console.log('📅 [DataProcessor] Actual data date range:', {
      minDate: minDate.toISOString().split('T')[0],
      maxDate: maxDate.toISOString().split('T')[0],
      totalRecords: dailyAccountsData.values.length
    })
    
    // Generate all months in the actual data range (including months with no data)
    const allMonths: string[] = []
    const currentDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
    const endDate = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)
    
    while (currentDate <= endDate) {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
      allMonths.push(monthKey)
      currentDate.setMonth(currentDate.getMonth() + 1)
    }
    
    // Generate labels and data arrays for all months
    const labels = allMonths.map(monthKey => {
      const [year, month] = monthKey.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1)
      return date.toLocaleDateString('ja-JP', { month: 'short', year: '2-digit' })
    })
    
    const visitCounts = allMonths.map(monthKey => monthlyData[monthKey]?.visits || 0)
    const revenues = allMonths.map(monthKey => Math.round(monthlyData[monthKey]?.revenue || 0))
    
    console.log('📈 [DataProcessor] Monthly trends calculated from all available data:', {
      totalMonths: allMonths.length,
      monthsWithData: Object.keys(monthlyData).length,
      labels: labels, // Show all months
      totalVisits: visitCounts.reduce((sum, count) => sum + count, 0),
      totalRevenue: revenues.reduce((sum, revenue) => sum + revenue, 0),
      dataRange: {
        startMonth: labels[0],
        endMonth: labels[labels.length - 1],
        monthsInRange: labels.length
      }
    })
    
    return { labels, visitCounts, revenues }
  }

  // Calculate period-over-period comparison metrics (6 months vs previous 6 months)
  calculateYearOverYearComparison(dailyAccountsData: any): {
    currentYear: { visits: number, revenue: number, months: number }
    previousYear: { visits: number, revenue: number, months: number }
    growth: { visits: number, revenue: number }
  } {
    console.log('📊 [DataProcessor] Calculating 6-month period comparison...')
    
    const currentDate = new Date()
    const sixMonthsAgo = new Date(currentDate)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const twelveMonthsAgo = new Date(currentDate)
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
    
    // Filter data for current 6 months
    const currentPeriodData = dailyAccountsData.values.filter((value: any) => {
      const recordDate = new Date(value.recordDate)
      return recordDate >= sixMonthsAgo && recordDate <= currentDate
    })
    
    // Filter data for previous 6 months
    const previousPeriodData = dailyAccountsData.values.filter((value: any) => {
      const recordDate = new Date(value.recordDate)
      return recordDate >= twelveMonthsAgo && recordDate < sixMonthsAgo
    })
    
    // Calculate metrics for current 6 months
    const currentPeriodVisits = currentPeriodData.length
    const currentPeriodRevenue = currentPeriodData.reduce((sum: number, value: any) => sum + (value.totalWithTax || 0), 0)
    const currentPeriodMonths = new Set(currentPeriodData.map((value: any) => new Date(value.recordDate).getMonth())).size
    
    // Calculate metrics for previous 6 months
    const previousPeriodVisits = previousPeriodData.length
    const previousPeriodRevenue = previousPeriodData.reduce((sum: number, value: any) => sum + (value.totalWithTax || 0), 0)
    const previousPeriodMonths = new Set(previousPeriodData.map((value: any) => new Date(value.recordDate).getMonth())).size
    
    // Calculate growth percentages
    const visitGrowth = previousPeriodVisits > 0 ? ((currentPeriodVisits - previousPeriodVisits) / previousPeriodVisits) * 100 : 0
    const revenueGrowth = previousPeriodRevenue > 0 ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 : 0
    
    const comparison = {
      currentYear: {
        visits: currentPeriodVisits,
        revenue: Math.round(currentPeriodRevenue),
        months: currentPeriodMonths
      },
      previousYear: {
        visits: previousPeriodVisits,
        revenue: Math.round(previousPeriodRevenue),
        months: previousPeriodMonths
      },
      growth: {
        visits: Math.round(visitGrowth * 100) / 100,
        revenue: Math.round(revenueGrowth * 100) / 100
      }
    }
    
    console.log('📊 [DataProcessor] 6-month period comparison calculated:', comparison)
    
    return comparison
  }

  // Calculate daily trends from daily accounts data
  calculateDailyTrends(dailyAccountsData: any, days: number = 30): { labels: string[], visitCounts: number[], revenues: number[] } {
    console.log('📅 [DataProcessor] Calculating daily trends from daily accounts...')
    
    // Get date range for the last N days
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    // Group data by day
    const dailyData: { [key: string]: { visits: number, revenue: number } } = {}
    
    dailyAccountsData.values.forEach((value: any) => {
      const recordDate = new Date(value.recordDate)
      
      // Only include data within the date range
      if (recordDate >= startDate && recordDate <= endDate) {
        const dayKey = recordDate.toISOString().split('T')[0]
        
        if (!dailyData[dayKey]) {
          dailyData[dayKey] = { visits: 0, revenue: 0 }
        }
        
        dailyData[dayKey].visits += 1
        dailyData[dayKey].revenue += (value.totalWithTax || 0)
      }
    })
    
    // Generate labels for all days in range
    const labels: string[] = []
    const visitCounts: number[] = []
    const revenues: number[] = []
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayKey = date.toISOString().split('T')[0]
      const dayLabel = date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
      
      labels.push(dayLabel)
      visitCounts.push(dailyData[dayKey]?.visits || 0)
      revenues.push(Math.round(dailyData[dayKey]?.revenue || 0))
    }
    
    console.log('📅 [DataProcessor] Daily trends calculated:', {
      daysCount: labels.length,
      totalVisits: visitCounts.reduce((sum, count) => sum + count, 0),
      totalRevenue: revenues.reduce((sum, revenue) => sum + revenue, 0)
    })
    
    return { labels, visitCounts, revenues }
  }

  // Calculate specialty-specific metrics
  calculateSpecialtyMetrics(dailyAccountsData: any[]) {
    const specialties = {
      surgery: { name: '外科', totalRevenue: 0, totalCount: 0, averageUnitPrice: 0 },
      dermatology: { name: '皮膚科', totalRevenue: 0, totalCount: 0, averageUnitPrice: 0 },
      hair_removal: { name: '脱毛', totalRevenue: 0, totalCount: 0, averageUnitPrice: 0 },
      other: { name: 'その他', totalRevenue: 0, totalCount: 0, averageUnitPrice: 0 }
    }

    // Process each daily account record
    dailyAccountsData.forEach(record => {
      const treatment = this.categorizeTreatment(record.treatmentName || '', record.treatmentName || '')
      const specialty = treatment.specialty as keyof typeof specialties
      
      if (specialty && specialties[specialty]) {
        specialties[specialty].totalRevenue += (record.totalWithTax || 0)
        specialties[specialty].totalCount += 1
      }
    })

    // Calculate average unit prices
    Object.keys(specialties).forEach(key => {
      const specialty = specialties[key as keyof typeof specialties]
      specialty.averageUnitPrice = specialty.totalCount > 0 ? specialty.totalRevenue / specialty.totalCount : 0
    })

    console.log('🏥 [DataProcessor] Specialty metrics calculated:', specialties)
    
    return specialties
  }

  // Calculate hierarchical treatment breakdown
  calculateTreatmentHierarchy(dailyAccountsData: any[]) {
    const hierarchy = {
      surgery: {
        name: '外科',
        totalRevenue: 0,
        totalCount: 0,
        subcategories: {
          '二重': { revenue: 0, count: 0 },
          'くま治療': { revenue: 0, count: 0 },
          '糸リフト': { revenue: 0, count: 0 },
          '小顔（S,BF)': { revenue: 0, count: 0 },
          '鼻・人中手術': { revenue: 0, count: 0 },
          'ボディー脂肪吸引': { revenue: 0, count: 0 },
          '豊胸': { revenue: 0, count: 0 },
          'その他外科': { revenue: 0, count: 0 }
        }
      },
      dermatology: {
        name: '皮膚科',
        totalRevenue: 0,
        totalCount: 0,
        subcategories: {
          '注入': { revenue: 0, count: 0 },
          'スキン': { revenue: 0, count: 0 }
        }
      },
      hair_removal: {
        name: '脱毛',
        totalRevenue: 0,
        totalCount: 0,
        subcategories: {
          '脱毛': { revenue: 0, count: 0 }
        }
      },
      other: {
        name: 'その他',
        totalRevenue: 0,
        totalCount: 0,
        subcategories: {
          'ピアス': { revenue: 0, count: 0 },
          '物販': { revenue: 0, count: 0 },
          '麻酔・針・パック': { revenue: 0, count: 0 }
        }
      }
    }

    // Process each daily account record
    dailyAccountsData.forEach(record => {
      // Get treatment category and name from database fields
      const treatmentCategory = record.paymentItems?.[0]?.category || ''
      const treatmentName = record.paymentItems?.[0]?.name || record.treatmentName || ''
      
      console.log('🔍 [DataProcessor] Processing record:', { 
        treatmentCategory, 
        treatmentName, 
        totalWithTax: record.totalWithTax 
      })
      
      // Import the new categorization function
      const { categorizeTreatment } = require('./treatmentCategories')
      const treatment = categorizeTreatment(treatmentCategory, treatmentName)
      const specialty = treatment.specialty as keyof typeof hierarchy
      const subcategory = treatment.subcategory
      
      if (specialty && hierarchy[specialty] && hierarchy[specialty].subcategories[subcategory as keyof typeof hierarchy[typeof specialty]['subcategories']]) {
        const revenue = record.totalWithTax || 0
        hierarchy[specialty].totalRevenue += revenue
        hierarchy[specialty].totalCount += 1
        const subcategoryData = hierarchy[specialty].subcategories[subcategory as keyof typeof hierarchy[typeof specialty]['subcategories']] as { revenue: number, count: number }
        subcategoryData.revenue += revenue
        subcategoryData.count += 1
        
        console.log('🔍 [DataProcessor] Categorized:', { 
          specialty, 
          subcategory, 
          revenue, 
          totalRevenue: hierarchy[specialty].totalRevenue 
        })
      }
    })

    console.log('📊 [DataProcessor] Treatment hierarchy calculated:', hierarchy)
    
    return hierarchy
  }

  // Calculate sales table metrics according to business rules
  calculateSalesTableMetrics(dailyAccountsData: any[], targetMonth: string) {
    console.log('📊 [DataProcessor] Calculating sales table metrics for month:', targetMonth)
    
    // Filter data for target month
    const targetMonthData = dailyAccountsData.filter(record => {
      const recordDate = new Date(record.visitDate || record.accountingDate)
      const recordMonth = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`
      return recordMonth === targetMonth
    })

    console.log('📊 [DataProcessor] Target month data count:', targetMonthData.length)

    // Import the new categorization function
    const { categorizeTreatment } = require('./treatmentCategories')
    
    // Separate patient data from "その他" items
    const patientData = targetMonthData.filter(record => {
      const treatmentCategory = record.paymentItems?.[0]?.category || ''
      const treatmentName = record.paymentItems?.[0]?.name || record.treatmentName || ''
      const treatment = categorizeTreatment(treatmentCategory, treatmentName)
      return treatment.specialty !== 'other'
    })

    const otherData = targetMonthData.filter(record => {
      const treatmentCategory = record.paymentItems?.[0]?.category || ''
      const treatmentName = record.paymentItems?.[0]?.name || record.treatmentName || ''
      const treatment = categorizeTreatment(treatmentCategory, treatmentName)
      return treatment.specialty === 'other'
    })

    console.log('📊 [DataProcessor] Patient data count:', patientData.length)
    console.log('📊 [DataProcessor] Other data count:', otherData.length)

    // Calculate visit-based sales (上段)
    const visitBasedSales = patientData.reduce((sum, record) => sum + (record.totalWithTax || 0), 0)
    
    // Calculate payment-based sales (下段)
    const paymentBasedSales = targetMonthData.reduce((sum, record) => sum + (record.totalWithTax || 0), 0)

    // Calculate patient counts (excluding "その他")
    const newPatientCount = patientData.filter(record => record.isFirstVisit === true).length
    const existingPatientCount = patientData.filter(record => record.isFirstVisit === false).length
    const totalPatientCount = newPatientCount + existingPatientCount

    // Calculate same-day unit prices (当日単価)
    const sameDayNewSales = patientData
      .filter(record => record.isFirstVisit === true)
      .reduce((sum, record) => sum + (record.totalWithTax || 0), 0)
    const sameDayNewUnitPrice = newPatientCount > 0 ? sameDayNewSales / newPatientCount : 0

    const sameDayExistingSales = patientData
      .filter(record => record.isFirstVisit === false)
      .reduce((sum, record) => sum + (record.totalWithTax || 0), 0)
    const sameDayExistingUnitPrice = existingPatientCount > 0 ? sameDayExistingSales / existingPatientCount : 0

    // Calculate cross-month unit prices (新規単価)
    // This requires looking at all payments for patients who visited in target month
    const crossMonthNewSales = this.calculateCrossMonthSales(patientData.filter(record => record.isFirstVisit === true), dailyAccountsData)
    const crossMonthNewUnitPrice = newPatientCount > 0 ? crossMonthNewSales / newPatientCount : 0

    const crossMonthExistingSales = this.calculateCrossMonthSales(patientData.filter(record => record.isFirstVisit === false), dailyAccountsData)
    const crossMonthExistingUnitPrice = existingPatientCount > 0 ? crossMonthExistingSales / existingPatientCount : 0

    // Calculate "その他" metrics
    const otherSales = otherData.reduce((sum, record) => sum + (record.totalWithTax || 0), 0)
    const otherCount = otherData.length
    const otherUnitPrice = otherCount > 0 ? otherSales / otherCount : 0

    const metrics = {
      total: {
        visitBasedSales, // 上段
        paymentBasedSales, // 下段
        patientCount: totalPatientCount,
        unitPrice: totalPatientCount > 0 ? visitBasedSales / totalPatientCount : 0,
        sameDayUnitPrice: totalPatientCount > 0 ? (sameDayNewSales + sameDayExistingSales) / totalPatientCount : 0
      },
      new: {
        sales: sameDayNewSales,
        count: newPatientCount,
        unitPrice: sameDayNewUnitPrice,
        sameDayUnitPrice: sameDayNewUnitPrice,
        crossMonthSales: crossMonthNewSales,
        crossMonthUnitPrice: crossMonthNewUnitPrice
      },
      existing: {
        sales: sameDayExistingSales,
        count: existingPatientCount,
        unitPrice: sameDayExistingUnitPrice,
        sameDayUnitPrice: sameDayExistingUnitPrice,
        crossMonthSales: crossMonthExistingSales,
        crossMonthUnitPrice: crossMonthExistingUnitPrice
      },
      other: {
        sales: otherSales,
        count: otherCount,
        unitPrice: otherUnitPrice,
        sameDayUnitPrice: otherUnitPrice
      }
    }

    console.log('📊 [DataProcessor] Sales table metrics calculated:', metrics)
    return metrics
  }

  // Calculate cross-month sales for patients
  calculateCrossMonthSales(patientRecords: any[], allDailyAccounts: any[]) {
    let totalCrossMonthSales = 0
    
    patientRecords.forEach(patientRecord => {
      // Find all payments for this patient across all months
      const patientId = patientRecord.patientId || patientRecord.customerId
      if (!patientId) return

      const allPatientPayments = allDailyAccounts.filter(record => 
        (record.patientId || record.customerId) === patientId
      )

      // Sum all payments for this patient
      const patientTotalSales = allPatientPayments.reduce((sum, record) => 
        sum + (record.totalWithTax || 0), 0
      )

      totalCrossMonthSales += patientTotalSales
    })

    return totalCrossMonthSales
  }

  // Get combined data from all clinics for analysis
  getCombinedDataForAnalysis(clinicData: any) {
    const allDailyAccounts = [
      ...clinicData.yokohama.dailyAccounts,
      ...clinicData.koriyama.dailyAccounts,
      ...clinicData.mito.dailyAccounts,
      ...clinicData.omiya.dailyAccounts
    ]

    const allPatients = [
      ...clinicData.yokohama.patients,
      ...clinicData.koriyama.patients,
      ...clinicData.mito.patients,
      ...clinicData.omiya.patients
    ]

    const allAccounting = [
      ...clinicData.yokohama.accounting,
      ...clinicData.koriyama.accounting,
      ...clinicData.mito.accounting,
      ...clinicData.omiya.accounting
    ]

    return {
      dailyAccounts: allDailyAccounts,
      patients: allPatients,
      accounting: allAccounting,
      total: allDailyAccounts.reduce((sum, record) => sum + (record.totalWithTax || 0), 0),
      netTotal: allDailyAccounts.reduce((sum, record) => sum + (record.netTotal || 0), 0)
    }
  }

  // Get clinic-specific data
  getClinicData(clinicData: any, clinicId: string) {
    const clinicMap = {
      'yokohama': clinicData.yokohama,
      'koriyama': clinicData.koriyama,
      'mito': clinicData.mito,
      'omiya': clinicData.omiya
    }

    return clinicMap[clinicId as keyof typeof clinicMap] || { dailyAccounts: [], patients: [], accounting: [] }
  }

  // Validate data integrity
  validateData(patientData: any[], accountingData: any[]) {
    const errors: Array<{
      type: string
      message: string
      row: number
      data: any
    }> = []

    patientData.forEach((patient, index) => {
      if (!patient.id) {
        errors.push({
          type: 'MISSING_PATIENT_CODE',
          message: '患者コードが空欄です',
          row: index + 1,
          data: patient
        })
      }

      if (patient.age === 0) {
        errors.push({
          type: 'MISSING_AGE',
          message: '年齢が0または空欄です',
          row: index + 1,
          data: patient
        })
      }

      if (!patient.referralSource) {
        errors.push({
          type: 'MISSING_REFERRAL_SOURCE',
          message: '流入元（知ったきっかけ）が空欄です',
          row: index + 1,
          data: patient
        })
      }

      if (!patient.appointmentRoute) {
        errors.push({
          type: 'MISSING_APPOINTMENT_ROUTE',
          message: '予約経路（来院区分）が空欄です',
          row: index + 1,
          data: patient
        })
      }

      if (!patient.treatmentCategory) {
        errors.push({
          type: 'MISSING_TREATMENT_CATEGORY',
          message: '施術カテゴリーが空欄です',
          row: index + 1,
          data: patient
        })
      }

      if (!patient.staff) {
        errors.push({
          type: 'MISSING_STAFF',
          message: '担当者が空欄です',
          row: index + 1,
          data: patient
        })
      }
    })

    return errors
  }
}