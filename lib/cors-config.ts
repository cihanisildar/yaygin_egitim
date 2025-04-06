import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED_ORIGINS = [
  'https://yayginegitimv7.vercel.app',
  'https://yayginegitimv8.vercel.app'
];

export function corsHeaders(request: NextRequest, response: NextResponse) {
  // Get origin from request headers
  const origin = request.headers.get('origin') || '';
  
  // Only allow requests from our allowed origins
  if (ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
  
  return response;
}

export function handleCors(request: NextRequest) {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    return corsHeaders(request, response);
  }
  return null;
} 