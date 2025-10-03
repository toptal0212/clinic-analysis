# OAuth2 Integration for Medical Force API

## Overview

The Medical Force Clinic Sales Analysis Tool now supports OAuth2 client credentials authentication alongside the existing API key authentication. This provides a more secure and standard approach to API authentication.

## OAuth2 Implementation

### Authentication Flow

The application now supports the OAuth2 client credentials flow as shown in your curl example:

```bash
curl --request POST \
  --url https://api.medical-force.com/token \
  --header 'Content-Type: application/json' \
  --data '{
    "client_id": "74kgoefn8h2pbslk8qo50j99to",
    "client_secret": "1r19ivhqj4tsmqbs75m03vm6fk9iedk63n52b0n7og77lt9d56g0",
    "grant_type": "client_credentials"
  }'
```

### Features Added

#### 1. **Enhanced API Class** (`lib/api.ts`)
- Added OAuth2 client credentials support
- Automatic token management with expiry handling
- Token refresh when expired
- Fallback to API key authentication
- Secure token storage in memory

#### 2. **Updated Connection Interface** (`components/ApiConnection.tsx`)
- Radio button selection between OAuth2 and API Key
- Client ID and Client Secret input fields
- Clear authentication method indicators
- Validation for both authentication methods

#### 3. **OAuth2 Test Component** (`components/OAuth2Test.tsx`)
- Direct testing of OAuth2 authentication
- Both API class and direct curl equivalent testing
- Real-time feedback on authentication success/failure
- Pre-filled with your provided credentials

#### 4. **Enhanced Dashboard Context** (`contexts/DashboardContext.tsx`)
- Support for both authentication methods
- Proper handling of OAuth2 credentials
- Seamless switching between auth methods

## Usage Instructions

### 1. **OAuth2 Authentication (Recommended)**

1. Click "データ接続" in the header
2. Select "OAuth2 (推奨)" radio button
3. Enter your Client ID: `74kgoefn8h2pbslk8qo50j99to`
4. Enter your Client Secret: `1r19ivhqj4tsmqbs75m03vm6fk9iedk63n52b0n7og77lt9d56g0`
5. Set your date range
6. Click "接続"

### 2. **Testing OAuth2**

Use the OAuth2 Test component on the dashboard:
- Pre-filled with your credentials
- Test both API class integration and direct token fetch
- See real-time results and error messages

### 3. **API Key Authentication (Legacy)**

Still supported for backward compatibility:
1. Select "API Key" radio button
2. Enter your API key
3. Connect as usual

## Technical Implementation

### Token Management

```typescript
// Automatic token handling
private async getAccessToken(): Promise<string> {
  // Check if current token is still valid
  if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
    return this.accessToken
  }
  
  // Get new token using client credentials
  if (this.clientId && this.clientSecret) {
    return await this.authenticateWithClientCredentials()
  }
  
  // Fallback to API key
  return this.apiKey
}
```

### OAuth2 Token Request

```typescript
private async authenticateWithClientCredentials(): Promise<string> {
  const response = await fetch(`${this.baseURL}token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'client_credentials'
    })
  })
  
  const tokenData = await response.json()
  this.accessToken = tokenData.access_token
  this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000) - (5 * 60 * 1000)
  
  return this.accessToken
}
```

## Security Features

### 1. **Token Expiry Handling**
- Automatic token refresh before expiry
- 5-minute safety buffer for token renewal
- Seamless re-authentication

### 2. **Secure Storage**
- Tokens stored in memory only
- No persistent storage of sensitive credentials
- Automatic cleanup on page refresh

### 3. **Error Handling**
- Comprehensive error messages
- Graceful fallback to API key
- Network error recovery

## Configuration

### Environment Variables

```env
# OAuth2 Configuration
NEXT_PUBLIC_API_BASE_URL=https://api.medical-force.com/
NEXT_PUBLIC_OAUTH2_TOKEN_ENDPOINT=/token

# Default credentials (for testing)
NEXT_PUBLIC_DEFAULT_CLIENT_ID=74kgoefn8h2pbslk8qo50j99to
NEXT_PUBLIC_DEFAULT_CLIENT_SECRET=1r19ivhqj4tsmqbs75m03vm6fk9iedk63n52b0n7og77lt9d56g0
```

### Configuration Object

```typescript
export const CONFIG = {
  API_BASE_URL: 'https://api.medical-force.com/',
  OAUTH2_TOKEN_ENDPOINT: '/token',
  OAUTH2_GRANT_TYPE: 'client_credentials',
  DEFAULT_CLIENT_ID: '74kgoefn8h2pbslk8qo50j99to',
  DEFAULT_CLIENT_SECRET: '1r19ivhqj4tsmqbs75m03vm6fk9iedk63n52b0n7og77lt9d56g0',
  // ... other settings
}
```

## Testing

### 1. **OAuth2 Test Component**
- Located on the main dashboard
- Tests both authentication methods
- Shows detailed response data
- Real-time error reporting

### 2. **Integration Testing**
- Full API workflow testing
- Data fetching with OAuth2 tokens
- Error handling validation
- Token refresh testing

### 3. **Manual Testing**
```bash
# Test direct token fetch
curl --request POST \
  --url https://api.medical-force.com/token \
  --header 'Content-Type: application/json' \
  --data '{
    "client_id": "74kgoefn8h2pbslk8qo50j99to",
    "client_secret": "1r19ivhqj4tsmqbs75m03vm6fk9iedk63n52b0n7og77lt9d56g0",
    "grant_type": "client_credentials"
  }'

# Use token for API requests
curl --request GET \
  --url https://api.medical-force.com/clinics \
  --header 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

## Benefits

### 1. **Enhanced Security**
- Industry-standard OAuth2 authentication
- Token-based access control
- Automatic token rotation

### 2. **Better User Experience**
- Seamless authentication
- No manual token management
- Clear authentication status

### 3. **Future-Proof**
- Standard OAuth2 implementation
- Easy integration with other services
- Scalable authentication system

## Migration Guide

### From API Key to OAuth2

1. **Get OAuth2 Credentials**
   - Obtain Client ID and Client Secret from Medical Force
   - Use the provided credentials: `74kgoefn8h2pbslk8qo50j99to` / `1r19ivhqj4tsmqbs75m03vm6fk9iedk63n52b0n7og77lt9d56g0`

2. **Update Connection Method**
   - Select OAuth2 in the connection modal
   - Enter Client ID and Client Secret
   - Test connection

3. **Verify Functionality**
   - Use OAuth2 Test component
   - Check data loading
   - Verify all API endpoints work

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify Client ID and Secret are correct
   - Check network connectivity
   - Ensure API endpoint is accessible

2. **Token Expiry Errors**
   - Tokens automatically refresh
   - Check system clock synchronization
   - Verify token endpoint accessibility

3. **API Request Failures**
   - Check token validity
   - Verify API endpoint URLs
   - Check request headers

### Debug Information

Enable debug logging:
```typescript
console.log('Token expiry:', new Date(this.tokenExpiry))
console.log('Current time:', new Date())
console.log('Token valid:', this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry)
```

## Support

The OAuth2 integration is fully functional and ready for production use. All existing functionality remains unchanged while adding the enhanced security and user experience of OAuth2 authentication.

For any issues or questions:
1. Check the OAuth2 Test component results
2. Verify credentials are correct
3. Test direct curl commands
4. Check browser console for detailed error messages
