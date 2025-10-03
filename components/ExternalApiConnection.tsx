'use client'

import { useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { ExternalAPIManager } from '@/lib/externalApis'
import { 
  BarChart3,
  Target,
  Users,
  X,
  Wifi,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

export default function ExternalApiConnection() {
  const { state, dispatch } = useDashboard()
  const [showModal, setShowModal] = useState(false)
  const [externalApis, setExternalApis] = useState({
    googleAnalytics: {
      propertyId: '',
      accessToken: '',
      refreshToken: '',
      clientId: '',
      clientSecret: ''
    },
    googleAds: {
      customerId: '',
      developerToken: '',
      accessToken: '',
      refreshToken: '',
      clientId: '',
      clientSecret: ''
    },
    metaAds: {
      adAccountId: '',
      accessToken: '',
      appId: '',
      appSecret: ''
    }
  })
  const [formData, setFormData] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<{
    googleAnalytics: boolean
    googleAds: boolean
    metaAds: boolean
  }>({
    googleAnalytics: false,
    googleAds: false,
    metaAds: false
  })

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      const externalApiManager = new ExternalAPIManager()
      
      // Google Analytics設定
      if (externalApis.googleAnalytics.propertyId && externalApis.googleAnalytics.accessToken) {
        externalApiManager.setGoogleAnalytics(externalApis.googleAnalytics)
        setConnectionStatus(prev => ({ ...prev, googleAnalytics: true }))
      }
      
      // Google Ads設定
      if (externalApis.googleAds.customerId && externalApis.googleAds.developerToken) {
        externalApiManager.setGoogleAds(externalApis.googleAds)
        setConnectionStatus(prev => ({ ...prev, googleAds: true }))
      }
      
      // Meta Ads設定
      if (externalApis.metaAds.adAccountId && externalApis.metaAds.accessToken) {
        externalApiManager.setMetaAds(externalApis.metaAds)
        setConnectionStatus(prev => ({ ...prev, metaAds: true }))
      }

      // 外部APIからデータを取得
      const externalData = await externalApiManager.getAllData(formData.startDate, formData.endDate)
      
      // データをコンテキストに保存
      dispatch({
        type: 'SET_DATA',
        payload: {
          ...state.data,
          analytics: externalData.analytics,
          adData: [...externalData.googleAds, ...externalData.metaAds]
        }
      })

      dispatch({
        type: 'SET_API_CONNECTION',
        payload: {
          connected: true,
          apiKey: 'external-apis',
          dataSource: 'api',
          dateRange: { start: formData.startDate, end: formData.endDate }
        }
      })

      setShowModal(false)
    } catch (error) {
      console.error('External API connection failed:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const hasAnyConnection = Object.values(connectionStatus).some(status => status)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
          hasAnyConnection
            ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
        }`}
      >
        <BarChart3 className="h-4 w-4" />
        <span>{hasAnyConnection ? '外部API接続済み' : '外部API連携'}</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">外部API連携設定</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* 接続状況 */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">接続状況</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-lg border ${
                    connectionStatus.googleAnalytics 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center space-x-3">
                      {connectionStatus.googleAnalytics ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-gray-400" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900">Google Analytics</div>
                        <div className="text-sm text-gray-600">
                          {connectionStatus.googleAnalytics ? '接続済み' : '未接続'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border ${
                    connectionStatus.googleAds 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center space-x-3">
                      {connectionStatus.googleAds ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-gray-400" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900">Google Ads</div>
                        <div className="text-sm text-gray-600">
                          {connectionStatus.googleAds ? '接続済み' : '未接続'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border ${
                    connectionStatus.metaAds 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center space-x-3">
                      {connectionStatus.metaAds ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-gray-400" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900">Meta Ads</div>
                        <div className="text-sm text-gray-600">
                          {connectionStatus.metaAds ? '接続済み' : '未接続'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Google Analytics設定 */}
              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
                  Google Analytics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Property ID
                    </label>
                    <input
                      type="text"
                      value={externalApis.googleAnalytics.propertyId}
                      onChange={(e) => setExternalApis(prev => ({
                        ...prev,
                        googleAnalytics: { ...prev.googleAnalytics, propertyId: e.target.value }
                      }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="GA4 Property ID (例: 123456789)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Access Token
                    </label>
                    <input
                      type="text"
                      value={externalApis.googleAnalytics.accessToken}
                      onChange={(e) => setExternalApis(prev => ({
                        ...prev,
                        googleAnalytics: { ...prev.googleAnalytics, accessToken: e.target.value }
                      }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="OAuth2 Access Token"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client ID
                    </label>
                    <input
                      type="text"
                      value={externalApis.googleAnalytics.clientId}
                      onChange={(e) => setExternalApis(prev => ({
                        ...prev,
                        googleAnalytics: { ...prev.googleAnalytics, clientId: e.target.value }
                      }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="OAuth2 Client ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client Secret
                    </label>
                    <input
                      type="password"
                      value={externalApis.googleAnalytics.clientSecret}
                      onChange={(e) => setExternalApis(prev => ({
                        ...prev,
                        googleAnalytics: { ...prev.googleAnalytics, clientSecret: e.target.value }
                      }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="OAuth2 Client Secret"
                    />
                  </div>
                </div>
              </div>

              {/* Google Ads設定 */}
              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Target className="h-5 w-5 text-green-600 mr-2" />
                  Google Ads
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer ID
                    </label>
                    <input
                      type="text"
                      value={externalApis.googleAds.customerId}
                      onChange={(e) => setExternalApis(prev => ({
                        ...prev,
                        googleAds: { ...prev.googleAds, customerId: e.target.value }
                      }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Google Ads Customer ID (例: 123-456-7890)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Developer Token
                    </label>
                    <input
                      type="text"
                      value={externalApis.googleAds.developerToken}
                      onChange={(e) => setExternalApis(prev => ({
                        ...prev,
                        googleAds: { ...prev.googleAds, developerToken: e.target.value }
                      }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Google Ads Developer Token"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Access Token
                    </label>
                    <input
                      type="text"
                      value={externalApis.googleAds.accessToken}
                      onChange={(e) => setExternalApis(prev => ({
                        ...prev,
                        googleAds: { ...prev.googleAds, accessToken: e.target.value }
                      }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="OAuth2 Access Token"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client ID
                    </label>
                    <input
                      type="text"
                      value={externalApis.googleAds.clientId}
                      onChange={(e) => setExternalApis(prev => ({
                        ...prev,
                        googleAds: { ...prev.googleAds, clientId: e.target.value }
                      }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="OAuth2 Client ID"
                    />
                  </div>
                </div>
              </div>

              {/* Meta Ads設定 */}
              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="h-5 w-5 text-purple-600 mr-2" />
                  Meta Ads
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ad Account ID
                    </label>
                    <input
                      type="text"
                      value={externalApis.metaAds.adAccountId}
                      onChange={(e) => setExternalApis(prev => ({
                        ...prev,
                        metaAds: { ...prev.metaAds, adAccountId: e.target.value }
                      }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Meta Ads Account ID (例: act_123456789)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Access Token
                    </label>
                    <input
                      type="text"
                      value={externalApis.metaAds.accessToken}
                      onChange={(e) => setExternalApis(prev => ({
                        ...prev,
                        metaAds: { ...prev.metaAds, accessToken: e.target.value }
                      }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Meta Ads Access Token"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      App ID
                    </label>
                    <input
                      type="text"
                      value={externalApis.metaAds.appId}
                      onChange={(e) => setExternalApis(prev => ({
                        ...prev,
                        metaAds: { ...prev.metaAds, appId: e.target.value }
                      }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Meta App ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      App Secret
                    </label>
                    <input
                      type="password"
                      value={externalApis.metaAds.appSecret}
                      onChange={(e) => setExternalApis(prev => ({
                        ...prev,
                        metaAds: { ...prev.metaAds, appSecret: e.target.value }
                      }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Meta App Secret"
                    />
                  </div>
                </div>
              </div>

              {/* データ取得期間 */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">データ取得期間</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      開始日
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      終了日
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* 接続ボタン */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>接続中...</span>
                    </>
                  ) : (
                    <>
                      <Wifi className="h-4 w-4" />
                      <span>外部API接続</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
