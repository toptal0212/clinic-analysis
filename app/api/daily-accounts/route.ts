import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('📊 [API Route] Daily accounts endpoint called')
  
  try {
    const { searchParams } = new URL(request.url)
    const epochFrom = searchParams.get('epoch_from')
    const epochTo = searchParams.get('epoch_to')
    const authHeader = request.headers.get('authorization')

    console.log('📤 [API Route] Request parameters:', {
      epochFrom,
      epochTo,
      hasAuthHeader: !!authHeader,
      authHeaderPrefix: authHeader ? authHeader.substring(0, 20) + '...' : 'undefined'
    })

    if (!authHeader) {
      console.error('❌ [API Route] Missing authorization header')
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      )
    }

    if (!epochFrom || !epochTo) {
      console.error('❌ [API Route] Missing required parameters:', { epochFrom, epochTo })
      return NextResponse.json(
        { error: 'epoch_from and epoch_to parameters are required' },
        { status: 400 }
      )
    }

    console.log('🌐 [API Route] Making request to Medical Force API...')
    const url = `https://api.medical-force.com/developer/daily-accounts?epoch_from=${epochFrom}&epoch_to=${epochTo}`
    console.log('📤 [API Route] Medical Force API URL:', url)
    
    // Calculate date range for logging
    const startDate = new Date(epochFrom)
    const endDate = new Date(epochTo)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    console.log('📅 [API Route] Date range details:', {
      startDate: epochFrom,
      endDate: epochTo,
      daysRequested: daysDiff,
      yearsRequested: (daysDiff / 365).toFixed(1)
    })
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Authorization': authHeader
      },
      // Increase timeout for large data requests
      signal: AbortSignal.timeout(120000) // 2 minutes timeout
    })

    console.log('📥 [API Route] Medical Force API response status:', response.status)
    console.log('📥 [API Route] Medical Force API response ok:', response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [API Route] Medical Force API request failed:', response.status, errorText)
      
      // Handle specific error cases
      if (response.status === 504) {
        return NextResponse.json(
          { 
            error: 'API Timeout: データが大きすぎます。期間を短くして再試行してください。',
            code: 'TIMEOUT',
            suggestion: 'Try requesting a shorter date range'
          },
          { status: 504 }
        )
      }
      
      return NextResponse.json(
        { error: `API Error: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('✅ [API Route] Daily accounts data received from Medical Force API:', {
      dataType: typeof data,
      hasClinicId: !!data.clinicId,
      hasDailyAccountId: !!data.dailyAccountId,
      hasValues: !!data.values,
      valuesLength: Array.isArray(data.values) ? data.values.length : 'not array',
      total: data.total,
      netTotal: data.netTotal,
      startAt: data.startAt,
      endAt: data.endAt
    })
    
    console.log('✅ [API Route] Returning daily accounts data to client')
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ [API Route] Daily accounts API proxy error:')
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
