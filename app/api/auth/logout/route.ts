import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from '@/lib/server-auth';

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Clear auth cookies
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    expires: new Date(0),
    path: '/',
  });

  response.cookies.set({
    name: REFRESH_TOKEN_COOKIE_NAME,
    value: '',
    expires: new Date(0),
    path: '/',
  });

  return response;
} 