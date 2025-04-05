import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User, { UserRole } from '@/models/User';
import { UserJwtPayload } from '@/lib/auth';
import { signJWT, setJWTCookie } from '@/lib/server-auth';
import { Document } from 'mongoose';

interface UserDocument extends Document {
  _id: any;
  username: string;
  email: string;
  role: UserRole;
  comparePassword: (password: string) => Promise<boolean>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Cast to custom interface with required properties
    const user = await User.findOne({ username }) as UserDocument;

    if (!user || !(await user.comparePassword(password))) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }
    
    const payload: UserJwtPayload = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const { token, refreshToken } = await signJWT(payload);
    
    const response = NextResponse.json(
      { 
        message: 'Login successful',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        }
      },
      { status: 200 }
    );

    return setJWTCookie(response, token, refreshToken);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 