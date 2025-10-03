# Auth0 Integration for Medical Force API

## Overview

This application integrates with Medical Force's Auth0 authentication system to securely access their API using OAuth2 client credentials flow.

## Auth0 Configuration

### Authentication Endpoint
- **URL**: `https://api.medical-force.com/token`
- **Method**: POST
- **Content-Type**: application/json

### Request Format
```json
{
  "client_id": "74kgoefn8h2pbslk8qo50j99to",
  "client_secret": "1r19ivhqj4tsmqbs75m03vm6fk9iedk63n52b0n7og77lt9d56g0",
  "grant_type": "client_credentials",
  "audience": "mf-developer-api/api.edit"
}
```

### Response Format
```json
{
  "access_token": "eyJraWQiOiI3Y1JrR0V5cjVqZW9PeTlEOEMrVEVcL0RBWDRlVlFOUjgwSDBpU1k2VElKcz0iLCJhbGciOiJSUzI1NiJ9...",
  "expires_in": 86400,
  "token_type": "Bearer"
}
```

## Implementation Details

### 1. Token Acquisition
The system automatically:
- Sends credentials to Auth0 token endpoint
- Receives JWT access token
- Removes all whitespace from token (Auth0 tokens can have line breaks)
- Stores token with expiration time

### 2. Token Management
- **Automatic Refresh**: Tokens are refreshed automatically when expired
- **Space Removal**: All spaces and line breaks are removed from tokens
- **Expiration Handling**: 5-minute safety buffer before expiration
- **Error Handling**: Comprehensive error logging and user feedback

### 3. API Requests
All API requests include:
```http
Authorization: Bearer {cleaned_token}
```

## Security Features

### Auth0 Benefits
- **Industry Standard**: OAuth2 client credentials flow
- **Secure Token Exchange**: JWT tokens with expiration
- **Audience Validation**: Specific API audience validation
- **Token Scope**: Limited to Medical Force API access

### Implementation Security
- **No Token Storage**: Tokens are not persisted, only cached in memory
- **Automatic Cleanup**: Tokens are cleared on expiration
- **Error Handling**: Secure error messages without exposing credentials
- **HTTPS Only**: All communication over secure channels

## Usage

### 1. API Connection Setup
1. Open the dashboard
2. Click "API Connection" button
3. Select "Auth0 OAuth2" method
4. Credentials are pre-filled
5. Click "Connect"

### 2. Automatic Authentication
The system automatically:
- Authenticates with Auth0
- Gets bearer token
- Uses token for all API calls
- Refreshes token when needed

### 3. API Endpoints
All Medical Force API endpoints are accessible:
- `/developer/clinics` - Get clinic information
- `/revenue` - Get revenue data
- `/staff` - Get staff information
- And more...

## Error Handling

### Common Auth0 Errors
- **401 Unauthorized**: Invalid credentials
- **403 Forbidden**: Insufficient permissions
- **429 Too Many Requests**: Rate limiting
- **500 Internal Server Error**: Auth0 service issues

### Token Issues
- **Invalid Token**: Automatic refresh attempt
- **Expired Token**: Automatic re-authentication
- **Malformed Token**: Space removal and retry

## Configuration

### Environment Variables
```env
MEDICAL_FORCE_API_URL=https://api.medical-force.com/
MEDICAL_FORCE_CLIENT_ID=74kgoefn8h2pbslk8qo50j99to
MEDICAL_FORCE_CLIENT_SECRET=1r19ivhqj4tsmqbs75m03vm6fk9iedk63n52b0n7og77lt9d56g0
```

### API Class Configuration
```typescript
const api = new MedicalForceAPI()
api.setClientCredentials(clientId, clientSecret)
// Automatic Auth0 authentication
```

## Monitoring and Logging

### Console Logs
- Authentication success/failure
- Token expiration warnings
- API request/response details
- Error debugging information

### User Feedback
- Connection status indicators
- Error messages in UI
- Loading states during authentication
- Success confirmations

## Troubleshooting

### Authentication Issues
1. **Check Credentials**: Verify client_id and client_secret
2. **Check Network**: Ensure API endpoint is accessible
3. **Check Auth0 Status**: Verify Auth0 service is operational
4. **Check Logs**: Review console for detailed error messages

### Token Issues
1. **Space Removal**: Tokens are automatically cleaned
2. **Expiration**: Tokens refresh automatically
3. **Format**: JWT tokens are properly formatted
4. **Scope**: Ensure correct audience is specified

### API Issues
1. **CORS**: Fallback methods handle CORS issues
2. **Rate Limiting**: Implemented with retry logic
3. **Network**: Automatic retry on network errors
4. **Validation**: Input validation and error handling

## Best Practices

### Security
- Never log sensitive credentials
- Use HTTPS for all communications
- Implement proper error handling
- Regular token refresh

### Performance
- Cache tokens appropriately
- Implement retry logic
- Handle rate limiting
- Monitor API usage

### User Experience
- Clear error messages
- Loading indicators
- Automatic retry
- Graceful degradation

## Support

For Auth0-specific issues:
1. Check Auth0 dashboard for service status
2. Verify application configuration
3. Review API permissions and scopes
4. Contact Medical Force support for API issues

The integration is designed to be robust, secure, and user-friendly while following Auth0 best practices.
