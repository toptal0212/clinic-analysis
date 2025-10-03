'use client'

import { useState } from 'react'
import { X, Database, Key, Search } from 'lucide-react'
import ServiceSearchResults from './ServiceSearchResults'
import { useDashboard } from '../contexts/DashboardContext'

interface ApiConnectionProps {
  isOpen: boolean
  onClose: () => void
  onConnect: (config: ApiConfig) => Promise<void>
}

interface ApiConfig {
  clientId: string
  clientSecret: string
  // Service search parameters
  clinicId?: string
  serviceSearchDate?: string,
  grant_type: string
}

export default function ApiConnection({ isOpen, onClose, onConnect }: ApiConnectionProps) {
  const { searchServices } = useDashboard()
  const [config, setConfig] = useState<ApiConfig>({
    clientId: '74kgoefn8h2pbslk8qo50j99to',
    clientSecret: '1r19ivhqj4tsmqbs75m03vm6fk9iedk63n52b0n7og77lt9d56g0',
    grant_type: "client_credentials"
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quickConnect, setQuickConnect] = useState(false)
  const [serviceSearchResults, setServiceSearchResults] = useState<any[]>([])
  const [showServiceResults, setShowServiceResults] = useState(false)
  const [serviceSearchLoading, setServiceSearchLoading] = useState(false)
  const [serviceSearchError, setServiceSearchError] = useState<string | null>(null)

  const handleQuickConnect = async () => {
    setError(null)
    setLoading(true)
    setQuickConnect(true)

    try {
      // Use pre-filled credentials
      await onConnect(config)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '接続に失敗しました')
    } finally {
      setLoading(false)
      setQuickConnect(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validate inputs
      if (!config.clientId.trim() || !config.clientSecret.trim()) {
        throw new Error('Client IDとClient Secretを入力してください')
      }

      await onConnect(config)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '接続に失敗しました')
    } finally {
      setLoading(false)
    }
  }


  const handleServiceSearch = async () => {
    console.log('🔍 [Component] Service search initiated')
    console.log('📤 [Component] Search parameters:', {
      clinicId: config.clinicId,
      serviceSearchDate: config.serviceSearchDate
    })

    if (!config.clinicId || !config.serviceSearchDate) {
      console.error('❌ [Component] Missing required parameters')
      setServiceSearchError('クリニックIDと更新日を入力してください')
      return
    }

    console.log('⏳ [Component] Setting loading state...')
    setServiceSearchLoading(true)
    setServiceSearchError(null)

    try {
      console.log('🌐 [Component] Calling searchServices...')
      const results = await searchServices(config.clinicId, config.serviceSearchDate)
      console.log('✅ [Component] Search results received:', {
        resultsType: typeof results,
        isArray: Array.isArray(results),
        length: Array.isArray(results) ? results.length : 'not array',
        sampleResult: Array.isArray(results) && results.length > 0 ? results[0] : results
      })
      
      setServiceSearchResults(results)
      setShowServiceResults(true)
      console.log('✅ [Component] Service search completed successfully')
    } catch (err) {
      console.error('❌ [Component] Service search failed:')
      console.error('Error type:', err instanceof Error ? err.constructor.name : typeof err)
      console.error('Error message:', err instanceof Error ? err.message : String(err))
      console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace')
      
      setServiceSearchError(err instanceof Error ? err.message : '役務検索に失敗しました')
    } finally {
      console.log('⏹️ [Component] Setting loading state to false')
      setServiceSearchLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Medical Force API接続設定</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 border border-red-200 rounded-md bg-red-50">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Quick Connect Section */}
          <div className="p-4 border border-green-200 rounded-lg bg-green-50">
            <div className="flex items-center mb-3 space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                <Key className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900">クイック接続</h3>
                <p className="text-sm text-green-700">Medical Force APIにBearer Tokenで自動接続</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                <p><strong>認証:</strong> Bearer Token (Client ID: 74kgoefn8h2pbslk8qo50j99to)</p>
                <p><strong>データソース:</strong> Medical Force API</p>
              </div>
              
              <button
                type="button"
                onClick={handleQuickConnect}
                disabled={loading}
                className="flex items-center justify-center w-full px-4 py-3 space-x-2 font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading && quickConnect ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                    <span>接続中...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    <span>クイック接続</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* API Configuration */}
          <div className="pt-6 border-t border-gray-200">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Medical Force API設定</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* API Credentials */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">API認証情報</h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="clientId" className="block mb-2 text-sm font-medium text-gray-700">
                      Client ID
                    </label>
                    <input
                      id="clientId"
                      type="text"
                      value={config.clientId}
                      onChange={(e) => setConfig(prev => ({ ...prev, clientId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Client IDを入力してください"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="clientSecret" className="block mb-2 text-sm font-medium text-gray-700">
                      Client Secret
                    </label>
                    <input
                      id="clientSecret"
                      type="password"
                      value={config.clientSecret}
                      onChange={(e) => setConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Client Secretを入力してください"
                    />
                  </div>
                  
                  <div className="p-3 border border-blue-200 rounded-md bg-blue-50">
                    <p className="text-sm text-blue-800">
                      <strong>Bearer Token認証:</strong> Medical Force APIにClient IDとClient SecretでBearer Tokenを自動取得し、API呼び出しに使用します。
                    </p>
                  </div>
                </div>
              </div>


              {/* Service Search */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">
                  <Database className="inline w-5 h-5 mr-2" />
                  役務検索（更新日で検索）
                </h3>
                
                <div className="p-3 border border-blue-200 rounded-md bg-blue-50">
                  <p className="text-sm text-blue-800">
                    <strong>役務検索:</strong> Medical Force APIのBearer Tokenを使用して、クリニックIDと更新日を指定して役務（コース）情報を検索します。
                  </p>
                </div>
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="clinicId" className="block mb-2 text-sm font-medium text-gray-700">
                      クリニックID
                    </label>
                    <input
                      id="clinicId"
                      type="text"
                      value={config.clinicId || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, clinicId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="クリニックIDを入力してください"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="serviceSearchDate" className="block mb-2 text-sm font-medium text-gray-700">
                      更新日
                    </label>
                    <input
                      id="serviceSearchDate"
                      type="date"
                      value={config.serviceSearchDate || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, serviceSearchDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                {serviceSearchError && (
                  <div className="p-3 border border-red-200 rounded-md bg-red-50">
                    <p className="text-sm text-red-800">{serviceSearchError}</p>
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={handleServiceSearch}
                  disabled={serviceSearchLoading || !config.clinicId || !config.serviceSearchDate}
                  className="flex items-center justify-center w-full px-4 py-3 space-x-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {serviceSearchLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                      <span>検索中...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>役務を検索</span>
                    </>
                  )}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end pt-6 space-x-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '接続中...' : '接続'}
                </button>
              </div>
            </form>
            
          </div>
        </div>
      </div>
      
      {/* Service Search Results Modal */}
      <ServiceSearchResults
        isOpen={showServiceResults}
        onClose={() => setShowServiceResults(false)}
        results={serviceSearchResults}
        loading={serviceSearchLoading}
        error={serviceSearchError}
      />
    </div>
  )
}