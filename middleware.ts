import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get credentials from environment variables
  const basicAuthUser = process.env.BASIC_AUTH_USER;
  const basicAuthPassword = process.env.BASIC_AUTH_PASSWORD;

  // Skip authentication if credentials are not configured
  if (!basicAuthUser || !basicAuthPassword) {
    console.warn('Basic auth credentials not configured');
    return NextResponse.next();
  }

  // Get the authorization header
  const authHeader = request.headers.get('authorization');

  // If no authorization header is present, request authentication
  if (!authHeader) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    });
  }

  // Parse the authorization header
  const auth = authHeader.split(' ')[1];
  const [user, password] = Buffer.from(auth, 'base64').toString().split(':');

  // Verify credentials
  if (user === basicAuthUser && password === basicAuthPassword) {
    // Authentication successful, continue to the requested page
    return NextResponse.next();
  }

  // Authentication failed
  return new NextResponse('Invalid credentials', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

// Configure which routes to protect
// This will protect all routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

