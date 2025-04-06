import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { corsHeaders, handleCors } from './lib/cors-config';

interface JWTPayload {
  id: string;
  username: string;
  email: string;
  role: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const AUTH_COOKIE_NAME = 'ogrtakip-session';

// Middleware configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ],
};

async function verifyAuth(token: string) {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  // Handle CORS preflight requests first
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  const pathname = request.nextUrl.pathname;

  // Skip middleware for public assets
  if (pathname.startsWith('/_next/') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  // Allow public paths
  if (pathname === '/' || 
      pathname === '/login' || 
      pathname === '/register' || 
      pathname.startsWith('/api/auth/')) {
    const response = NextResponse.next();
    return corsHeaders(request, response);
  }

  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const payload = token ? await verifyAuth(token) : null;

    if (!payload) {
      const redirectUrl = new URL('/login', request.url);
      return NextResponse.redirect(redirectUrl);
    }

    const response = NextResponse.next();
    response.headers.set('x-user-role', payload.role as string);
    return corsHeaders(request, response);
  } catch {
    const redirectUrl = new URL('/login', request.url);
    return NextResponse.redirect(redirectUrl);
  }
} 