import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Get auth credentials from environment
  const authUser = process.env.BASIC_AUTH_USER;
  const authPassword = process.env.BASIC_AUTH_PASSWORD;

  // Skip if auth not configured
  if (!authUser || !authPassword) {
    return NextResponse.next();
  }

  // Check for authorization header
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    // No auth provided - challenge
    return new NextResponse('Auth required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    });
  }

  // Validate credentials
  const [scheme, encoded] = authHeader.split(' ');
  
  if (scheme !== 'Basic' || !encoded) {
    return new NextResponse('Invalid auth', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    });
  }

  const buffer = Buffer.from(encoded, 'base64');
  const decoded = buffer.toString('utf-8');
  const [username, password] = decoded.split(':');

  if (username === authUser && password === authPassword) {
    // Auth successful
    return NextResponse.next();
  }

  // Auth failed
  return new NextResponse('Invalid credentials', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
