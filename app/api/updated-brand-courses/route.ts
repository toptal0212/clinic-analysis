import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🔍 [API Route] Updated brand courses endpoint called')
  
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')
    const date = searchParams.get('date')
    const authHeader = request.headers.get('authorization')

    console.log('📤 [API Route] Request parameters:', {
      clinicId,
      date,
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

    if (!clinicId || !date) {
      console.error('❌ [API Route] Missing required parameters:', { clinicId, date })
      return NextResponse.json(
        { error: 'clinic_id and date parameters are required' },
        { status: 400 }
      )
    }

    console.log('🌐 [API Route] Making request to Medical Force API (header method)...')
    // Try header method first
    let response = await fetch('https://api.medical-force.com/developer/updated-brand-courses', {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'clinic_id': clinicId,
        'Authorization': authHeader
      }
    })

    console.log('📥 [API Route] Header method response status:', response.status)
    console.log('📥 [API Route] Header method response ok:', response.ok)

    // If header method fails, try query parameter method
    if (!response.ok) {
      console.warn('⚠️ [API Route] Header method failed, trying query parameter method')
      const queryUrl = `https://api.medical-force.com/developer/updated-brand-courses?clinic_id=${clinicId}&date=${date}`
      console.log('🌐 [API Route] Making request to Medical Force API (query method):', queryUrl)
      
      response = await fetch(queryUrl, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': authHeader
        }
      })
      
      console.log('📥 [API Route] Query method response status:', response.status)
      console.log('📥 [API Route] Query method response ok:', response.ok)
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [API Route] Medical Force API request failed:', response.status, errorText)
      return NextResponse.json(
        { error: `API Error: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('✅ [API Route] Data received from Medical Force API:', {
      dataType: typeof data,
      isArray: Array.isArray(data),
      length: Array.isArray(data) ? data.length : 'not array',
      sampleData: Array.isArray(data) && data.length > 0 ? data[0] : data
    })
    
    console.log('✅ [API Route] Returning data to client')
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ [API Route] Updated brand courses API proxy error:')
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
