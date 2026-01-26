import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get credentials from environment variables
  const basicAuthUser = process.env.BASIC_AUTH_USER;
  const basicAuthPassword = process.env.BASIC_AUTH_PASSWORD;

  // Skip authentication if credentials are not configured
  if (!basicAuthUser || !basicAuthPassword) {
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
  try {
    const auth = authHeader.split(' ')[1];
    const [user, password] = Buffer.from(auth, 'base64').toString().split(':');

    // Verify credentials
    if (user === basicAuthUser && password === basicAuthPassword) {
      // Authentication successful - create response and allow it to pass through
      const response = NextResponse.next();
      
      // Add cache headers to prevent re-authentication on every request
      response.headers.set('Cache-Control', 'no-store');
      
      return response;
    }
  } catch (error) {
    // Invalid authorization header format
    console.error('Basic auth error:', error);
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
// This will protect all routes except static assets
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    '/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

