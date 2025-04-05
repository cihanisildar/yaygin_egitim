import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { UserRole, RequestStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, firstName, lastName, requestedRole, tutorId } = await request.json();

    // Validate required fields
    if (!username || !email || !password || !requestedRole) {
      return NextResponse.json(
        { error: 'Username, email, password, and role are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate username format (alphanumeric and underscores, 3-20 chars)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores' },
        { status: 400 }
      );
    }

    // Validate password strength (min 8 chars, at least one number and one letter)
    if (password.length < 8 || !/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long and contain at least one letter and one number' },
        { status: 400 }
      );
    }

    // Validate role
    if (!Object.values(UserRole).includes(requestedRole as UserRole)) {
      return NextResponse.json(
        { error: 'Invalid role requested' },
        { status: 400 }
      );
    }

    // Validate tutor if student role is requested
    if (requestedRole === UserRole.STUDENT) {
      if (!tutorId) {
        return NextResponse.json(
          { error: 'Tutor selection is required for student registration' },
          { status: 400 }
        );
      }

      // Check if tutor exists and is actually a tutor
      const tutor = await prisma.user.findFirst({
        where: {
          id: tutorId,
          role: UserRole.TUTOR
        }
      });

      if (!tutor) {
        return NextResponse.json(
          { error: 'Invalid tutor selected' },
          { status: 400 }
        );
      }
    }

    // Use transaction to check existing users/requests and create new request
    const result = await prisma.$transaction(async (tx) => {
      // Check if username or email already exists in Users
      const existingUser = await tx.user.findFirst({
        where: {
          OR: [
            { username },
            { email }
          ]
        },
        select: {
          username: true,
          email: true
        }
      });

      if (existingUser) {
        throw new Error(
          existingUser.email === email 
            ? 'Email already registered' 
            : 'Username already taken'
        );
      }

      // Check if there's a pending registration request
      const existingRequest = await tx.registrationRequest.findFirst({
        where: {
          OR: [
            { username },
            { email }
          ],
          status: RequestStatus.PENDING
        }
      });

      if (existingRequest) {
        throw new Error('A registration request with this username or email is already pending');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create registration request
      const registrationRequest = await tx.registrationRequest.create({
        data: {
          username,
          email,
          password: hashedPassword,
          firstName: firstName || null,
          lastName: lastName || null,
          requestedRole: requestedRole as UserRole,
          tutorId: requestedRole === UserRole.STUDENT ? tutorId : null,
          status: RequestStatus.PENDING
        },
        select: {
          id: true,
          username: true,
          email: true,
          requestedRole: true,
          status: true,
          createdAt: true
        }
      });

      return registrationRequest;
    });

    return NextResponse.json({
      message: 'Registration request submitted successfully. An administrator will review your request.',
      request: {
        id: result.id,
        username: result.username,
        email: result.email,
        requestedRole: result.requestedRole,
        status: result.status,
        createdAt: result.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Registration request error:', error);
    if (error instanceof Error) {
      if (error.message.includes('already')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 