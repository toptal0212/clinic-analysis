# Medical Force API Integration Guide

## Overview

This guide explains how to use the API functionality in the Medical Force Clinic Sales Analysis Tool. The application supports both Medical Force API integration and CSV import as data sources.

## Features

### ✅ Implemented Features

1. **API Connection Component** (`components/ApiConnection.tsx`)
   - Modal interface for API configuration
   - Support for both API and CSV data sources
   - Date range selection
   - File upload for CSV imports

2. **Dashboard Context Integration** (`contexts/DashboardContext.tsx`)
   - API connection state management
   - Data loading and error handling
   - CSV parsing and validation

3. **CSV Parser** (`lib/csvParser.ts`)
   - Patient data CSV parsing
   - Accounting data CSV parsing
   - Data validation and error reporting
   - Support for Japanese field names

4. **Real-time Data Display**
   - KPI cards with live data calculations
   - Data table with multiple view modes (Summary, Patients, Accounting)
   - Monthly revenue and visit statistics
   - Trend calculations


## Usage

### 1. API Connection

Click the "データ接続" button in the header to open the connection modal:

#### For Medical Force API:
1. Select "Medical Force API" radio button
2. Enter your API Key
3. Set start and end dates
4. Click "接続"

#### For CSV Import:
1. Select "CSVインポート" radio button
2. Upload patient data CSV file
3. Upload accounting data CSV file
4. Set date range
5. Click "接続"

### 2. Data Views

Once connected, you can view data in three modes:

- **月次サマリー**: Monthly summary with revenue, visits, and metrics
- **患者データ**: Detailed patient records
- **会計データ**: Detailed accounting records

### 3. Data Refresh

Click the "更新" button in the header to refresh data from the API.

## CSV Format Requirements

### Patient Data CSV Fields

Required fields (supports both Japanese and English field names):

```csv
患者コード,氏名,年齢,来院日,施術カテゴリー,施術名,流入元,予約経路,担当者
P0001,田中太郎,25,2024-01-15,美容,二重,Instagram,初回相談,田中先生
```

Alternative field names supported:
- `patient_code`, `name`, `age`, `visit_date`, `treatment_category`, `treatment_name`, `referral_source`, `appointment_route`, `staff`

### Accounting Data CSV Fields

```csv
患者ID,金額,支払い日,来院日,処置内容,前受金
P0001,150000,2024-01-15,2024-01-15,二重,0
```

Alternative field names supported:
- `patient_id`, `amount`, `payment_date`, `visit_date`, `treatment_type`, `is_advance_payment`

## API Endpoints

The application uses the following Medical Force API endpoints:

- `GET /patients` - Patient data
- `GET /accounting` - Accounting data
- `GET /appointments` - Appointment data
- `GET /clinics` - Clinic information
- `GET /staff` - Staff information
- `GET /treatment-categories` - Treatment categories
- `GET /referral-sources` - Referral sources
- `GET /appointment-routes` - Appointment routes

## Configuration

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.medical-force.com/
NEXT_PUBLIC_API_KEY=your_api_key_here
NEXT_PUBLIC_MAX_CSV_SIZE=10485760
NEXT_PUBLIC_SUPPORTED_CSV_ENCODING=UTF-8
```

### API Configuration

The API configuration is managed in `lib/config.ts`:

```typescript
export const CONFIG = {
  API_BASE_URL: 'https://api.medical-force.com/',
  API_TIMEOUT: 30000,
  // ... other settings
}
```

## Error Handling

The application provides comprehensive error handling:

1. **API Connection Errors**: Invalid API keys, network issues
2. **CSV Validation Errors**: Missing fields, invalid data formats
3. **Data Processing Errors**: Invalid dates, missing required data
4. **UI Error Display**: User-friendly error messages

## Data Processing

### Revenue Calculations

The application calculates several key metrics:

- **今月来院数**: Total visits for current month
- **今月会計単価**: Average price per visit
- **今月売上**: Total revenue for current month

### Treatment Categorization

Treatments are automatically categorized into:

- **美容** (Beauty)
  - 外科 (Surgery)
  - 皮膚科 (Dermatology)  
  - 脱毛 (Hair Removal)
- **その他** (Other)
  - ピアス (Piercing)
  - 物販 (Products)
  - 麻酔・針・パック (Anesthesia/Needles/Packs)

## Testing

### Development Mode

For development, you can:

1. Test CSV import with sample CSV files
2. Mock API responses for testing
3. Use the Medical Force API with test credentials

## Troubleshooting

### Common Issues

1. **"データ未接続" in KPI Cards**
   - Connect to Medical Force API
   - Check that data is loaded in the dashboard context

2. **CSV Import Errors**
   - Verify CSV format matches requirements
   - Check for required fields
   - Ensure proper date format (YYYY-MM-DD)

3. **API Connection Failed**
   - Verify API key is correct
   - Check network connectivity
   - Confirm API endpoint is accessible

### Debug Mode

Enable debug logging by adding to your environment:

```env
NEXT_PUBLIC_DEBUG=true
```

This will show detailed API requests and responses in the browser console.

## Security Considerations

1. **API Keys**: Never commit API keys to version control
2. **CSV Data**: Patient data is processed client-side only
3. **HTTPS**: Always use HTTPS in production
4. **Data Validation**: All input data is validated before processing

## Performance

### Optimization Features

1. **Lazy Loading**: Data is loaded only when needed
2. **Pagination**: Large datasets are paginated
3. **Caching**: API responses can be cached
4. **Debouncing**: Search inputs are debounced

### Large Dataset Handling

- CSV files are processed in chunks
- API responses are paginated
- UI updates are batched for performance

## Future Enhancements

Planned features for future releases:

1. **Real-time Data Sync**: WebSocket integration for live updates
2. **Advanced Analytics**: More sophisticated revenue calculations
3. **Export Functionality**: Export processed data to Excel/PDF
4. **Multi-clinic Support**: Support for multiple clinic locations
5. **Automated Reports**: Scheduled report generation
6. **Data Backup**: Automatic data backup functionality

## Support

For technical support or questions:

1. Check the browser console for error messages
2. Verify your CSV format matches the requirements
3. Test with sample data first
4. Check network connectivity for API issues

The application is designed to be robust and user-friendly, with comprehensive error handling and helpful error messages to guide users through any issues.
