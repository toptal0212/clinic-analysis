import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  let decoded = null;
  if (authHeader) {
    try {
      const [scheme, encoded] = authHeader.split(' ');
      if (scheme === 'Basic' && encoded) {
        const buffer = Buffer.from(encoded, 'base64');
        decoded = buffer.toString('utf-8');
        // Hide password for security
        const [username] = decoded.split(':');
        decoded = `${username}:***`;
      }
    } catch (e) {
      decoded = 'Error decoding';
    }
  }
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    authHeaderPresent: !!authHeader,
    authHeaderPreview: authHeader ? authHeader.substring(0, 15) + '...' : null,
    decodedUsername: decoded,
    envUserConfigured: !!process.env.BASIC_AUTH_USER,
    envUserValue: process.env.BASIC_AUTH_USER || 'NOT SET',
    envPasswordConfigured: !!process.env.BASIC_AUTH_PASSWORD,
    envPasswordLength: process.env.BASIC_AUTH_PASSWORD?.length || 0,
    message: 'This endpoint helps debug Basic Auth issues',
  }, {
    headers: {
      'Cache-Control': 'no-store',
    }
  });
}

