'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { advertisingAPI } from '@/lib/advertisingAPI'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  MousePointer,
  Eye,
  Target,
  Calendar,
  AlertCircle,
  ExternalLink
} from 'lucide-react'

interface AdCampaign {
  id: string
  name: string
  platform: 'google' | 'meta' | 'other'
  status: 'active' | 'paused' | 'ended'
  budget: number
  spent: number
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  ctr: number
  cpc: number
  roas: number
  startDate: Date
  endDate?: Date
}

interface TrafficSource {
  source: string
  medium: string
  sessions: number
  users: number
  pageViews: number
  bounceRate: number
  avgSessionDuration: number
  revenue: number
  conversionRate: number
}

export default function AdvertisingAnalysis() {
  const { state } = useDashboard()
  const [selectedPeriod, setSelectedPeriod] = useState<'7days' | '30days' | '90days'>('30days')
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'google' | 'meta' | 'other'>('all')
  const [advertisingData, setAdvertisingData] = useState<{
    googleAds: any[]
    metaAds: any[]
    analytics: any[]
    totalSpent: number
    totalRevenue: number
    totalConversions: number
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 期間に基づく日付計算
  const getDateRange = (period: string) => {
    const endDate = new Date()
    const startDate = new Date()
    
    switch (period) {
      case '7days':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30days':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90days':
        startDate.setDate(endDate.getDate() - 90)
        break
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }
  }

  // 広告データの取得
  const fetchAdvertisingData = async () => {
    if (!state.apiConnected) return
    
    setLoading(true)
    setError(null)
    
    try {
      const { startDate, endDate } = getDateRange(selectedPeriod)
      const data = await advertisingAPI.getAllAdvertisingData(startDate, endDate)
      setAdvertisingData(data)
    } catch (err) {
      setError('広告データの取得に失敗しました')
      console.error('Advertising data fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  // 期間変更時にデータを再取得
  useEffect(() => {
    fetchAdvertisingData()
  }, [selectedPeriod, state.apiConnected])

  // キャンペーンデータの統合
  const allCampaigns: AdCampaign[] = useMemo(() => {
    if (!advertisingData) return []
    
    const campaigns: AdCampaign[] = []
    
    // Google Ads キャンペーン
    advertisingData.googleAds.forEach(campaign => {
      campaigns.push({
        id: campaign.id,
        name: campaign.name,
        platform: 'google',
        status: campaign.status === 'ENABLED' ? 'active' : 'paused',
        budget: campaign.budget,
        spent: campaign.spent,
        impressions: campaign.impressions,
        clicks: campaign.clicks,
        conversions: campaign.conversions,
        revenue: campaign.revenue || 0,
        ctr: campaign.ctr,
        cpc: campaign.cpc,
        roas: campaign.roas,
        startDate: new Date(campaign.startDate),
        endDate: campaign.endDate ? new Date(campaign.endDate) : undefined
      })
    })
    
    // Meta Ads キャンペーン
    advertisingData.metaAds.forEach(campaign => {
      campaigns.push({
        id: campaign.id,
        name: campaign.name,
        platform: 'meta',
        status: campaign.status === 'ACTIVE' ? 'active' : 'paused',
        budget: campaign.budget,
        spent: campaign.spent,
        impressions: campaign.impressions,
        clicks: campaign.clicks,
        conversions: campaign.conversions,
        revenue: campaign.revenue || 0,
        ctr: campaign.ctr,
        cpc: campaign.cpc,
        roas: campaign.roas,
        startDate: new Date(campaign.startDate),
        endDate: campaign.endDate ? new Date(campaign.endDate) : undefined
      })
    })
    
    return campaigns
  }, [advertisingData])

  // トラフィックソースデータ
  const trafficSources: TrafficSource[] = useMemo(() => {
    if (!advertisingData) return []
    
    return advertisingData.analytics.map(source => ({
      source: source.source,
      medium: source.medium,
      sessions: source.sessions,
      users: source.users,
      pageViews: source.pageViews,
      bounceRate: source.bounceRate,
      avgSessionDuration: source.avgSessionDuration,
      revenue: source.revenue,
      conversionRate: source.conversionRate
    }))
  }, [advertisingData])


  // フィルタリングされたキャンペーンデータ
  const filteredCampaigns = useMemo(() => {
    if (!advertisingData) return []
    return allCampaigns.filter(campaign => 
      selectedPlatform === 'all' || campaign.platform === selectedPlatform
    )
  }, [allCampaigns, selectedPlatform, advertisingData])

  // 総合メトリクス
  const totalMetrics = useMemo(() => {
    const totalSpent = filteredCampaigns.reduce((sum, campaign) => sum + campaign.spent, 0)
    const totalRevenue = filteredCampaigns.reduce((sum, campaign) => sum + campaign.revenue, 0)
    const totalConversions = filteredCampaigns.reduce((sum, campaign) => sum + campaign.conversions, 0)
    const totalClicks = filteredCampaigns.reduce((sum, campaign) => sum + campaign.clicks, 0)
    const totalImpressions = filteredCampaigns.reduce((sum, campaign) => sum + campaign.impressions, 0)

    return {
      totalSpent,
      totalRevenue,
      totalConversions,
      totalClicks,
      totalImpressions,
      roas: totalSpent > 0 ? totalRevenue / totalSpent : 0,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      cpc: totalClicks > 0 ? totalSpent / totalClicks : 0,
      conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0
    }
  }, [filteredCampaigns])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ja-JP').format(num)
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'google': return 'text-blue-600'
      case 'meta': return 'text-purple-600'
      case 'facebook': return 'text-blue-500'
      case 'instagram': return 'text-pink-500'
      default: return 'text-gray-600'
    }
  }

  const getPlatformBgColor = (platform: string) => {
    switch (platform) {
      case 'google': return 'bg-blue-100'
      case 'meta': return 'bg-purple-100'
      case 'facebook': return 'bg-blue-50'
      case 'instagram': return 'bg-pink-50'
      default: return 'bg-gray-100'
    }
  }

  const getROASColor = (roas: number) => {
    if (roas >= 4) return 'text-green-600'
    if (roas >= 2) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (!state.apiConnected) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="text-center text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>APIに接続されていません</p>
          <p className="mt-2 text-sm">広告分析にはGoogle Ads、Meta Ads、Google Analyticsの連携が必要です</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="text-center text-gray-500">
          <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-blue-500 rounded-full animate-spin"></div>
          <p>広告データを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="text-center text-red-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <p>{error}</p>
          <button 
            onClick={fetchAdvertisingData}
            className="px-4 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  if (!advertisingData || (advertisingData.googleAds.length === 0 && advertisingData.metaAds.length === 0 && advertisingData.analytics.length === 0)) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="text-center text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900">広告データがありません</h3>
          <p className="mb-4">広告分析には以下のAPI連携が必要です：</p>
          <div className="max-w-md mx-auto space-y-2 text-left">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">Google Ads API</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm">Meta Ads API</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Google Analytics API</span>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            API設定については管理者にお問い合わせください
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">広告分析</h2>
          <p className="text-gray-600">広告効果とROAS（広告投資対効果）を分析します</p>
        </div>
        
        {/* フィルター */}
        <div className="flex space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7days">過去7日</option>
            <option value="30days">過去30日</option>
            <option value="90days">過去90日</option>
          </select>
          
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全プラットフォーム</option>
            <option value="google">Google Ads</option>
            <option value="meta">Meta Ads</option>
            <option value="other">その他</option>
          </select>
        </div>
      </div>

      {/* 総合メトリクス */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">総広告費</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalMetrics.totalSpent)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">総売上</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalMetrics.totalRevenue)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ROAS</p>
              <p className={`text-2xl font-bold ${getROASColor(totalMetrics.roas)}`}>
                {totalMetrics.roas.toFixed(1)}倍
              </p>
            </div>
            <Target className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">コンバージョン率</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalMetrics.conversionRate.toFixed(2)}%
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* キャンペーン一覧 */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">キャンペーン別パフォーマンス</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  キャンペーン名
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  プラットフォーム
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  広告費
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  売上
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  ROAS
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  CTR
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  CPC
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  コンバージョン
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCampaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                    <div className="text-sm text-gray-500">
                      {campaign.status === 'active' ? 'アクティブ' : 
                       campaign.status === 'paused' ? '一時停止' : '終了'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlatformBgColor(campaign.platform)} ${getPlatformColor(campaign.platform)}`}>
                      {campaign.platform === 'google' ? 'Google Ads' : 
                       campaign.platform === 'meta' ? 'Meta Ads' : 'その他'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                    {formatCurrency(campaign.spent)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                    {formatCurrency(campaign.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getROASColor(campaign.roas)}`}>
                      {campaign.roas.toFixed(1)}倍
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                    {campaign.ctr.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                    {formatCurrency(campaign.cpc)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                    {formatNumber(campaign.conversions)}件
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

        {/* トラフィックソース分析 */}
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">トラフィックソース分析</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trafficSources.map((source, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getPlatformBgColor(source.source)}`}></div>
                  <span className="font-medium text-gray-900 capitalize">{source.source}</span>
                </div>
                <span className="text-sm text-gray-500">{source.medium}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">セッション数:</span>
                  <span className="font-medium">{formatNumber(source.sessions)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ユーザー数:</span>
                  <span className="font-medium">{formatNumber(source.users)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">売上:</span>
                  <span className="font-medium">{formatCurrency(source.revenue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">コンバージョン率:</span>
                  <span className="font-medium">{source.conversionRate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">直帰率:</span>
                  <span className="font-medium">{source.bounceRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 改善提案 */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">改善提案</h3>
        <div className="space-y-4">
          {totalMetrics.roas < 2 && (
            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <div className="font-medium text-red-800">ROASが低いです</div>
                  <div className="mt-1 text-sm text-red-600">
                    現在のROASは{totalMetrics.roas.toFixed(1)}倍です。広告のターゲティングやクリエイティブの見直しを検討してください。
                  </div>
                </div>
              </div>
            </div>
          )}

          {totalMetrics.ctr < 1.5 && (
            <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
              <div className="flex items-start space-x-3">
                <MousePointer className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <div className="font-medium text-yellow-800">CTRが低いです</div>
                  <div className="mt-1 text-sm text-yellow-600">
                    現在のCTRは{totalMetrics.ctr.toFixed(2)}%です。広告のクリエイティブやキーワードの見直しを検討してください。
                  </div>
                </div>
              </div>
            </div>
          )}

          {totalMetrics.conversionRate < 3 && (
            <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
              <div className="flex items-start space-x-3">
                <Target className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <div className="font-medium text-orange-800">コンバージョン率が低いです</div>
                  <div className="mt-1 text-sm text-orange-600">
                    現在のコンバージョン率は{totalMetrics.conversionRate.toFixed(2)}%です。ランディングページの最適化を検討してください。
                  </div>
                </div>
              </div>
            </div>
          )}

          {totalMetrics.roas >= 4 && (
            <div className="p-4 border border-green-200 rounded-lg bg-green-50">
              <div className="flex items-start space-x-3">
                <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium text-green-800">優秀なROASです</div>
                  <div className="mt-1 text-sm text-green-600">
                    現在のROASは{totalMetrics.roas.toFixed(1)}倍です。この調子で広告運用を継続してください。
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
