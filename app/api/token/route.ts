import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('🔐 [API Route] Token endpoint called')
  
  try {
    const body = await request.json()
    console.log('📤 [API Route] Request body received:', {
      hasClientId: !!body.client_id,
      hasClientSecret: !!body.client_secret,
      clientId: body.client_id,
      clientSecret: body.client_secret ? '***' + body.client_secret.slice(-4) : 'undefined'
    })
    
    const { client_id, client_secret } = body

    if (!client_id || !client_secret) {
      console.error('❌ [API Route] Missing credentials')
      return NextResponse.json(
        { error: 'client_id and client_secret are required' },
        { status: 400 }
      )
    }

    console.log('🌐 [API Route] Making request to Medical Force API...')
    const requestBody = {
      client_id,
      client_secret,
      grant_type: 'client_credentials',
      audience: 'mf-developer-api/api.edit'
    }
    console.log('📤 [API Route] Medical Force API request body:', requestBody)

    // Get Bearer token from Medical Force API
    const response = await fetch('https://api.medical-force.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    console.log('📥 [API Route] Medical Force API response status:', response.status)
    console.log('📥 [API Route] Medical Force API response ok:', response.ok)
    console.log('📥 [API Route] Medical Force API response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [API Route] Medical Force API token request failed:', response.status, errorText)
      return NextResponse.json(
        { error: `Bearer token authentication failed: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    const tokenData = await response.json()
    console.log('✅ [API Route] Token data received:', {
      hasAccessToken: !!tokenData.access_token,
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in,
      scope: tokenData.scope
    })
    
    if (!tokenData.access_token) {
      console.error('❌ [API Route] No access token in response:', tokenData)
      return NextResponse.json(
        { error: 'No Bearer token received from Medical Force API' },
        { status: 500 }
      )
    }

    console.log('✅ [API Route] Returning token data to client')
    return NextResponse.json(tokenData)
  } catch (error) {
    console.error('❌ [API Route] Token API error:')
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
