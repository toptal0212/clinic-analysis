// Advertising API Integration Service
// This service handles integration with Google Ads, Meta Ads, and Google Analytics APIs

export interface GoogleAdsCampaign {
  id: string
  name: string
  status: 'ENABLED' | 'PAUSED' | 'REMOVED'
  budget: number
  spent: number
  impressions: number
  clicks: number
  conversions: number
  ctr: number
  cpc: number
  roas: number
  startDate: string
  endDate?: string
}

export interface MetaAdsCampaign {
  id: string
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'DELETED'
  budget: number
  spent: number
  impressions: number
  clicks: number
  conversions: number
  ctr: number
  cpc: number
  roas: number
  startDate: string
  endDate?: string
}

export interface GoogleAnalyticsData {
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

export class AdvertisingAPI {
  private googleAdsApiKey: string
  private metaAdsApiKey: string
  private googleAnalyticsApiKey: string

  constructor() {
    // These would be loaded from environment variables in production
    this.googleAdsApiKey = process.env.NEXT_PUBLIC_GOOGLE_ADS_API_KEY || ''
    this.metaAdsApiKey = process.env.NEXT_PUBLIC_META_ADS_API_KEY || ''
    this.googleAnalyticsApiKey = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_API_KEY || ''
  }

  // Google Ads API Integration
  async getGoogleAdsCampaigns(startDate: string, endDate: string): Promise<GoogleAdsCampaign[]> {
    if (!this.googleAdsApiKey) {
      console.warn('Google Ads API key not configured')
      return []
    }

    try {
      // This would be the actual Google Ads API call
      const response = await fetch('/api/google-ads/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.googleAdsApiKey}`
        },
        body: JSON.stringify({
          startDate,
          endDate,
          fields: [
            'campaign.id',
            'campaign.name',
            'campaign.status',
            'campaign_budget.amount_micros',
            'metrics.cost_micros',
            'metrics.impressions',
            'metrics.clicks',
            'metrics.conversions',
            'metrics.ctr',
            'metrics.average_cpc',
            'metrics.value_per_conversion'
          ]
        })
      })

      if (!response.ok) {
        throw new Error(`Google Ads API error: ${response.statusText}`)
      }

      const data = await response.json()
      return this.transformGoogleAdsData(data)
    } catch (error) {
      console.error('Error fetching Google Ads data:', error)
      return []
    }
  }

  // Meta Ads API Integration
  async getMetaAdsCampaigns(startDate: string, endDate: string): Promise<MetaAdsCampaign[]> {
    if (!this.metaAdsApiKey) {
      console.warn('Meta Ads API key not configured')
      return []
    }

    try {
      const response = await fetch('/api/meta-ads/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.metaAdsApiKey}`
        },
        body: JSON.stringify({
          startDate,
          endDate,
          fields: [
            'id',
            'name',
            'status',
            'daily_budget',
            'spend',
            'impressions',
            'clicks',
            'conversions',
            'ctr',
            'cpc',
            'roas'
          ]
        })
      })

      if (!response.ok) {
        throw new Error(`Meta Ads API error: ${response.statusText}`)
      }

      const data = await response.json()
      return this.transformMetaAdsData(data)
    } catch (error) {
      console.error('Error fetching Meta Ads data:', error)
      return []
    }
  }

  // Google Analytics API Integration
  async getGoogleAnalyticsData(startDate: string, endDate: string): Promise<GoogleAnalyticsData[]> {
    if (!this.googleAnalyticsApiKey) {
      console.warn('Google Analytics API key not configured')
      return []
    }

    try {
      const response = await fetch('/api/google-analytics/traffic-sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.googleAnalyticsApiKey}`
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions: ['source', 'medium'],
          metrics: [
            'sessions',
            'users',
            'pageviews',
            'bounceRate',
            'avgSessionDuration',
            'goalCompletions',
            'goalValue'
          ]
        })
      })

      if (!response.ok) {
        throw new Error(`Google Analytics API error: ${response.statusText}`)
      }

      const data = await response.json()
      return this.transformGoogleAnalyticsData(data)
    } catch (error) {
      console.error('Error fetching Google Analytics data:', error)
      return []
    }
  }

  // Data transformation methods
  private transformGoogleAdsData(data: any): GoogleAdsCampaign[] {
    // Transform Google Ads API response to our interface
    return data.results?.map((campaign: any) => ({
      id: campaign.campaign?.id || '',
      name: campaign.campaign?.name || '',
      status: campaign.campaign?.status || 'PAUSED',
      budget: (campaign.campaignBudget?.amountMicros || 0) / 1000000, // Convert from micros
      spent: (campaign.metrics?.costMicros || 0) / 1000000,
      impressions: campaign.metrics?.impressions || 0,
      clicks: campaign.metrics?.clicks || 0,
      conversions: campaign.metrics?.conversions || 0,
      ctr: campaign.metrics?.ctr || 0,
      cpc: (campaign.metrics?.averageCpc || 0) / 1000000,
      roas: campaign.metrics?.valuePerConversion || 0,
      startDate: campaign.campaign?.startDate || '',
      endDate: campaign.campaign?.endDate
    })) || []
  }

  private transformMetaAdsData(data: any): MetaAdsCampaign[] {
    // Transform Meta Ads API response to our interface
    return data.data?.map((campaign: any) => ({
      id: campaign.id || '',
      name: campaign.name || '',
      status: campaign.status || 'PAUSED',
      budget: campaign.daily_budget || 0,
      spent: campaign.spend || 0,
      impressions: campaign.impressions || 0,
      clicks: campaign.clicks || 0,
      conversions: campaign.conversions || 0,
      ctr: campaign.ctr || 0,
      cpc: campaign.cpc || 0,
      roas: campaign.roas || 0,
      startDate: campaign.start_time || '',
      endDate: campaign.stop_time
    })) || []
  }

  private transformGoogleAnalyticsData(data: any): GoogleAnalyticsData[] {
    // Transform Google Analytics API response to our interface
    return data.rows?.map((row: any) => ({
      source: row.dimensions?.[0] || 'unknown',
      medium: row.dimensions?.[1] || 'unknown',
      sessions: parseInt(row.metrics?.[0] || '0'),
      users: parseInt(row.metrics?.[1] || '0'),
      pageViews: parseInt(row.metrics?.[2] || '0'),
      bounceRate: parseFloat(row.metrics?.[3] || '0'),
      avgSessionDuration: parseFloat(row.metrics?.[4] || '0'),
      revenue: parseFloat(row.metrics?.[6] || '0'),
      conversionRate: parseFloat(row.metrics?.[5] || '0')
    })) || []
  }

  // Combined method to get all advertising data
  async getAllAdvertisingData(startDate: string, endDate: string) {
    const [googleAds, metaAds, analytics] = await Promise.all([
      this.getGoogleAdsCampaigns(startDate, endDate),
      this.getMetaAdsCampaigns(startDate, endDate),
      this.getGoogleAnalyticsData(startDate, endDate)
    ])

    return {
      googleAds,
      metaAds,
      analytics,
      totalSpent: [...googleAds, ...metaAds].reduce((sum, campaign) => sum + campaign.spent, 0),
      totalRevenue: [...googleAds, ...metaAds].reduce((sum, campaign) => sum + (campaign.spent * campaign.roas), 0),
      totalConversions: [...googleAds, ...metaAds].reduce((sum, campaign) => sum + campaign.conversions, 0)
    }
  }
}

// Export singleton instance
export const advertisingAPI = new AdvertisingAPI()
