import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import RegistrationRequest from '@/models/RegistrationRequest';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, firstName, lastName, requestedRole } = body;

    // Validate required fields
    if (!username || !email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if username or email already exists in Users collection
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with similar information already exists' },
        { status: 409 }
      );
    }

    // Check if username or email already exists in RegistrationRequest collection
    const existingRequest = await RegistrationRequest.findOne({
      $or: [{ username }, { email }],
      status: 'pending',
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'A registration request with similar information is already pending' },
        { status: 409 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create registration request
    const registrationRequest = new RegistrationRequest({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      requestedRole,
      status: 'pending',
    });

    await registrationRequest.save();

    // TODO: Send email notification to admin (implement later)

    return NextResponse.json(
      { 
        message: 'Registration request submitted successfully. An administrator will review your request.',
        requestId: registrationRequest._id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 