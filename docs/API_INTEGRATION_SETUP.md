# API Integration Setup Guide

## Overview

The advertising analysis feature integrates with three major advertising platforms:
- Google Ads API
- Meta Ads API (Facebook/Instagram)
- Google Analytics API

## Current Implementation Status

### ✅ **Implemented**
- API service structure (`lib/advertisingAPI.ts`)
- API route handlers (`app/api/`)
- Real-time data fetching
- Error handling and loading states
- Fallback to mock data when APIs are not configured

### 🔄 **Mock Data Mode**
Currently, the system uses mock data that simulates real API responses. This allows you to:
- Test the UI and functionality
- See how the system will work with real data
- Develop and debug without API credentials

### 🚀 **To Enable Real API Integration**

#### 1. Google Ads API Setup

1. **Create Google Cloud Project**
   ```bash
   # Enable Google Ads API
   gcloud services enable googleads.googleapis.com
   ```

2. **Get API Credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Get Developer Token from Google Ads Manager

3. **Environment Variables**
   ```env
   NEXT_PUBLIC_GOOGLE_ADS_API_KEY=your_api_key
   GOOGLE_ADS_CUSTOMER_ID=your_customer_id
   GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
   ```

#### 2. Meta Ads API Setup

1. **Create Meta App**
   - Go to [Meta for Developers](https://developers.facebook.com/)
   - Create a new app
   - Add Marketing API permissions

2. **Get Access Token**
   - Generate long-lived access token
   - Add required permissions: ads_read, ads_management

3. **Environment Variables**
   ```env
   NEXT_PUBLIC_META_ADS_API_KEY=your_access_token
   META_ADS_APP_ID=your_app_id
   META_ADS_APP_SECRET=your_app_secret
   ```

#### 3. Google Analytics API Setup

1. **Enable Analytics API**
   ```bash
   gcloud services enable analyticsreporting.googleapis.com
   ```

2. **Create Service Account**
   - Go to Google Cloud Console
   - Create service account
   - Download JSON key file

3. **Environment Variables**
   ```env
   NEXT_PUBLIC_GOOGLE_ANALYTICS_API_KEY=path_to_service_account_key.json
   GOOGLE_ANALYTICS_PROPERTY_ID=your_property_id
   GOOGLE_ANALYTICS_VIEW_ID=your_view_id
   ```

## API Endpoints

### Google Ads
- **Endpoint**: `/api/google-ads/campaigns`
- **Method**: POST
- **Body**: `{ startDate, endDate, fields }`
- **Response**: Campaign data with metrics

### Meta Ads
- **Endpoint**: `/api/meta-ads/campaigns`
- **Method**: POST
- **Body**: `{ startDate, endDate, fields }`
- **Response**: Campaign data with metrics

### Google Analytics
- **Endpoint**: `/api/google-analytics/traffic-sources`
- **Method**: POST
- **Body**: `{ startDate, endDate, dimensions, metrics }`
- **Response**: Traffic source data

## Data Flow

```
1. User selects time period
2. Component calls advertisingAPI.getAllAdvertisingData()
3. API service calls all three platform APIs in parallel
4. Data is transformed to unified format
5. Component displays real-time metrics and charts
```

## Error Handling

- **API Key Missing**: Shows configuration message
- **API Error**: Shows error message with retry button
- **Network Error**: Falls back to mock data
- **Rate Limiting**: Implements exponential backoff

## Testing

### Mock Data Testing
```typescript
// The system automatically uses mock data when APIs are not configured
// This allows full UI testing without API credentials
```

### Real API Testing
```typescript
// Set environment variables
// Restart the application
// The system will automatically switch to real API calls
```

## Security Considerations

1. **API Keys**: Store in environment variables, never in code
2. **Rate Limiting**: Implement proper rate limiting for API calls
3. **Data Privacy**: Ensure compliance with GDPR and other regulations
4. **Access Control**: Implement proper user authentication

## Performance Optimization

1. **Caching**: Implement Redis caching for API responses
2. **Batch Requests**: Combine multiple API calls when possible
3. **Background Sync**: Update data in background
4. **Lazy Loading**: Load data only when needed

## Monitoring

1. **API Health**: Monitor API response times and error rates
2. **Data Quality**: Validate data consistency across platforms
3. **Usage Tracking**: Track API usage and costs
4. **Alerting**: Set up alerts for API failures

## Troubleshooting

### Common Issues

1. **"APIに接続されていません"**
   - Check if environment variables are set
   - Verify API keys are valid
   - Check network connectivity

2. **"広告データの取得に失敗しました"**
   - Check API credentials
   - Verify API permissions
   - Check rate limiting

3. **Empty Data**
   - Verify date range is correct
   - Check if campaigns exist in the selected period
   - Verify API permissions

### Debug Mode

Enable debug logging:
```typescript
// In advertisingAPI.ts
console.log('API Response:', data)
console.log('Transformed Data:', transformedData)
```

## Next Steps

1. **Set up API credentials** for your advertising accounts
2. **Configure environment variables** in your deployment
3. **Test with real data** to ensure accuracy
4. **Monitor performance** and optimize as needed
5. **Set up monitoring** and alerting systems
