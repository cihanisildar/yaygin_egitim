import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, setJWTCookie, signJWT } from '@/lib/server-auth';

const REFRESH_TOKEN_COOKIE_NAME = 'ogrtakip-refresh';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token provided' },
        { status: 401 }
      );
    }

    const user = await verifyRefreshToken(refreshToken);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Generate new access token
    const { token } = await signJWT({
      id: user.user.id,
      username: user.user.username,
      email: user.user.email,
      role: user.user.role
    });

    const response = NextResponse.json(
      {
        message: 'Token refreshed successfully',
        user: {
          id: user.user.id,
          username: user.user.username,
          email: user.user.email,
          role: user.user.role,
        }
      },
      { status: 200 }
    );

    return setJWTCookie(response, token, refreshToken);
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 