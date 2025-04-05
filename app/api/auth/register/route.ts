import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User, { UserRole } from '@/models/User';
import { getUserFromRequest, checkIsAdmin } from '@/lib/server-auth';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    // Only admin can create users
    const isUserAdmin = await checkIsAdmin(request);
    if (!isUserAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin can create users' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, email, password, role, tutorId, firstName, lastName } = body;

    // Log the received data for debugging (excluding password)
    console.log('Registration attempt:', {
      username,
      email,
      role,
      tutorId,
      firstName,
      lastName
    });

    if (!username || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Username, email, password, and role are required' },
        { status: 400 }
      );
    }

    // Validate role is one of the allowed values
    if (!Object.values(UserRole).includes(role as UserRole)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    // If student, validate tutorId
    if (role === UserRole.STUDENT) {
      if (!tutorId) {
        return NextResponse.json(
          { error: 'Tutor ID is required for students' },
          { status: 400 }
        );
      }
      
      if (!mongoose.Types.ObjectId.isValid(tutorId)) {
        return NextResponse.json(
          { error: 'Invalid tutor ID format' },
          { status: 400 }
        );
      }
    }

    await connectToDatabase();

    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() }
      ],
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 409 }
      );
    }

    // Create new user with normalized data
    const newUser = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      ...(role === UserRole.STUDENT && { tutorId }),
      ...(firstName && { firstName: firstName.trim() }),
      ...(lastName && { lastName: lastName.trim() }),
    });

    try {
      await newUser.save();
    } catch (saveError: any) {
      console.error('User save error:', saveError);
      if (saveError.code === 11000) {
        return NextResponse.json(
          { error: 'Username or email already exists' },
          { status: 409 }
        );
      }
      throw saveError;
    }

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 