// External APIs Integration (Google Analytics, Google Ads, Meta Ads)

export interface GoogleAnalyticsConfig {
  propertyId: string
  accessToken: string
  refreshToken?: string
  clientId: string
  clientSecret: string
}

export interface GoogleAdsConfig {
  customerId: string
  developerToken: string
  accessToken: string
  refreshToken?: string
  clientId: string
  clientSecret: string
}

export interface MetaAdsConfig {
  adAccountId: string
  accessToken: string
  appId: string
  appSecret: string
}

export interface AnalyticsData {
  date: string
  sessions: number
  users: number
  pageViews: number
  bounceRate: number
  avgSessionDuration: number
  conversions: number
  conversionValue: number
  source: string
  medium: string
  campaign: string
  keyword?: string
}

export interface AdData {
  date: string
  campaignId: string
  campaignName: string
  adGroupId?: string
  adGroupName?: string
  adId?: string
  adName?: string
  impressions: number
  clicks: number
  cost: number
  conversions: number
  conversionValue: number
  ctr: number
  cpc: number
  cpm: number
  roas: number
  platform: 'google' | 'meta'
}

export class GoogleAnalyticsAPI {
  private config: GoogleAnalyticsConfig
  private baseURL = 'https://analyticsdata.googleapis.com/v1beta'

  constructor(config: GoogleAnalyticsConfig) {
    this.config = config
  }

  private async getAccessToken(): Promise<string> {
    // If we have a valid token, return it
    if (this.config.accessToken) {
      return this.config.accessToken
    }

    // If we have refresh token, get new access token
    if (this.config.refreshToken) {
      return await this.refreshAccessToken()
    }

    throw new Error('No valid access token available')
  }

  private async refreshAccessToken(): Promise<string> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.config.refreshToken!,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to refresh Google Analytics access token')
    }

    const data = await response.json()
    this.config.accessToken = data.access_token
    return data.access_token
  }

  async getAnalyticsData(startDate: string, endDate: string): Promise<AnalyticsData[]> {
    const accessToken = await this.getAccessToken()
    
    const requestBody = {
      requests: [
        {
          property: `properties/${this.config.propertyId}`,
          dateRanges: [
            {
              startDate,
              endDate,
            },
          ],
          dimensions: [
            { name: 'date' },
            { name: 'source' },
            { name: 'medium' },
            { name: 'campaignName' },
            { name: 'keyword' },
          ],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'screenPageViews' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' },
            { name: 'conversions' },
            { name: 'totalRevenue' },
          ],
        },
      ],
    }

    const response = await fetch(`${this.baseURL}/properties/${this.config.propertyId}:runReport`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`Google Analytics API Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return this.processAnalyticsData(data)
  }

  private processAnalyticsData(data: any): AnalyticsData[] {
    const rows = data.reports?.[0]?.rows || []
    
    return rows.map((row: any) => {
      const dimensions = row.dimensionValues || []
      const metrics = row.metricValues || []
      
      return {
        date: dimensions[0]?.value || '',
        sessions: parseInt(metrics[0]?.value || '0'),
        users: parseInt(metrics[1]?.value || '0'),
        pageViews: parseInt(metrics[2]?.value || '0'),
        bounceRate: parseFloat(metrics[3]?.value || '0'),
        avgSessionDuration: parseFloat(metrics[4]?.value || '0'),
        conversions: parseInt(metrics[5]?.value || '0'),
        conversionValue: parseFloat(metrics[6]?.value || '0'),
        source: dimensions[1]?.value || '',
        medium: dimensions[2]?.value || '',
        campaign: dimensions[3]?.value || '',
        keyword: dimensions[4]?.value || '',
      }
    })
  }
}

export class GoogleAdsAPI {
  private config: GoogleAdsConfig
  private baseURL = 'https://googleads.googleapis.com/v14'

  constructor(config: GoogleAdsConfig) {
    this.config = config
  }

  private async getAccessToken(): Promise<string> {
    if (this.config.accessToken) {
      return this.config.accessToken
    }

    if (this.config.refreshToken) {
      return await this.refreshAccessToken()
    }

    throw new Error('No valid access token available')
  }

  private async refreshAccessToken(): Promise<string> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.config.refreshToken!,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to refresh Google Ads access token')
    }

    const data = await response.json()
    this.config.accessToken = data.access_token
    return data.access_token
  }

  async getAdData(startDate: string, endDate: string): Promise<AdData[]> {
    const accessToken = await this.getAccessToken()
    
    const query = `
      SELECT 
        segments.date,
        campaign.id,
        campaign.name,
        ad_group.id,
        ad_group.name,
        ad_group_ad.ad.id,
        ad_group_ad.ad.name,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc,
        metrics.cost_micros_per_impression,
        metrics.value_per_conversion
      FROM campaign
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
      ORDER BY segments.date DESC
    `

    const response = await fetch(`${this.baseURL}/customers/${this.config.customerId}/googleAds:search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'developer-token': this.config.developerToken,
      },
      body: JSON.stringify({ query }),
    })

    if (!response.ok) {
      throw new Error(`Google Ads API Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return this.processAdData(data)
  }

  private processAdData(data: any): AdData[] {
    const results = data.results || []
    
    return results.map((result: any) => {
      const campaign = result.campaign || {}
      const adGroup = result.adGroup || {}
      const adGroupAd = result.adGroupAd || {}
      const ad = adGroupAd.ad || {}
      const metrics = result.metrics || {}
      
      const cost = parseFloat(metrics.costMicros || '0') / 1000000 // Convert from micros
      const cpc = parseFloat(metrics.averageCpc || '0') / 1000000
      const cpm = parseFloat(metrics.costMicrosPerImpression || '0') / 1000000
      const conversionValue = parseFloat(metrics.conversionsValue || '0')
      const conversions = parseFloat(metrics.conversions || '0')
      const roas = conversions > 0 ? conversionValue / cost : 0

      return {
        date: result.segments?.date || '',
        campaignId: campaign.id || '',
        campaignName: campaign.name || '',
        adGroupId: adGroup.id || '',
        adGroupName: adGroup.name || '',
        adId: ad.id || '',
        adName: ad.name || '',
        impressions: parseInt(metrics.impressions || '0'),
        clicks: parseInt(metrics.clicks || '0'),
        cost,
        conversions,
        conversionValue,
        ctr: parseFloat(metrics.ctr || '0'),
        cpc,
        cpm,
        roas,
        platform: 'google' as const,
      }
    })
  }
}

export class MetaAdsAPI {
  private config: MetaAdsConfig
  private baseURL = 'https://graph.facebook.com/v18.0'

  constructor(config: MetaAdsConfig) {
    this.config = config
  }

  async getAdData(startDate: string, endDate: string): Promise<AdData[]> {
    const fields = [
      'campaign_id',
      'campaign_name',
      'adset_id',
      'adset_name',
      'ad_id',
      'ad_name',
      'impressions',
      'clicks',
      'spend',
      'conversions',
      'conversion_values',
      'ctr',
      'cpc',
      'cpm',
      'roas',
    ].join(',')

    const params = new URLSearchParams({
      fields,
      time_range: JSON.stringify({
        since: startDate,
        until: endDate,
      }),
      level: 'ad',
      time_increment: '1',
    })

    const response = await fetch(
      `${this.baseURL}/act_${this.config.adAccountId}/insights?${params}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Meta Ads API Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return this.processAdData(data)
  }

  private processAdData(data: any): AdData[] {
    const insights = data.data || []
    
    return insights.map((insight: any) => {
      const conversions = parseFloat(insight.conversions || '0')
      const conversionValue = parseFloat(insight.conversion_values || '0')
      const spend = parseFloat(insight.spend || '0')
      const roas = spend > 0 ? conversionValue / spend : 0

      return {
        date: insight.date_start || '',
        campaignId: insight.campaign_id || '',
        campaignName: insight.campaign_name || '',
        adGroupId: insight.adset_id || '',
        adGroupName: insight.adset_name || '',
        adId: insight.ad_id || '',
        adName: insight.ad_name || '',
        impressions: parseInt(insight.impressions || '0'),
        clicks: parseInt(insight.clicks || '0'),
        cost: spend,
        conversions,
        conversionValue,
        ctr: parseFloat(insight.ctr || '0'),
        cpc: parseFloat(insight.cpc || '0'),
        cpm: parseFloat(insight.cpm || '0'),
        roas,
        platform: 'meta' as const,
      }
    })
  }
}

// Unified API Manager
export class ExternalAPIManager {
  private googleAnalytics?: GoogleAnalyticsAPI
  private googleAds?: GoogleAdsAPI
  private metaAds?: MetaAdsAPI

  setGoogleAnalytics(config: GoogleAnalyticsConfig) {
    this.googleAnalytics = new GoogleAnalyticsAPI(config)
  }

  setGoogleAds(config: GoogleAdsConfig) {
    this.googleAds = new GoogleAdsAPI(config)
  }

  setMetaAds(config: MetaAdsConfig) {
    this.metaAds = new MetaAdsAPI(config)
  }

  async getAllData(startDate: string, endDate: string) {
    const results = {
      analytics: [] as AnalyticsData[],
      googleAds: [] as AdData[],
      metaAds: [] as AdData[],
    }

    try {
      if (this.googleAnalytics) {
        results.analytics = await this.googleAnalytics.getAnalyticsData(startDate, endDate)
      }
    } catch (error) {
      console.error('Google Analytics API Error:', error)
    }

    try {
      if (this.googleAds) {
        results.googleAds = await this.googleAds.getAdData(startDate, endDate)
      }
    } catch (error) {
      console.error('Google Ads API Error:', error)
    }

    try {
      if (this.metaAds) {
        results.metaAds = await this.metaAds.getAdData(startDate, endDate)
      }
    } catch (error) {
      console.error('Meta Ads API Error:', error)
    }

    return results
  }

  // Get combined ad data from all platforms
  async getCombinedAdData(startDate: string, endDate: string): Promise<AdData[]> {
    const results = await this.getAllData(startDate, endDate)
    return [...results.googleAds, ...results.metaAds]
  }

  // Get analytics data with ad attribution
  async getAttributionData(startDate: string, endDate: string) {
    const [analyticsData, adData] = await Promise.all([
      this.googleAnalytics?.getAnalyticsData(startDate, endDate) || Promise.resolve([]),
      this.getCombinedAdData(startDate, endDate)
    ])

    // Match analytics data with ad data by campaign name
    return analyticsData.map(analytics => {
      const matchingAd = adData.find(ad => 
        ad.campaignName === analytics.campaign ||
        ad.adName === analytics.campaign
      )

      return {
        ...analytics,
        adData: matchingAd || null,
      }
    })
  }
}
