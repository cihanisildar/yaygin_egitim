import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, isAuthenticated, isTutor } from '@/lib/server-auth';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !isTutor(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors can access this endpoint' },
        { status: 403 }
      );
    }

    // Get all students assigned to this tutor
    const students = await prisma.user.findMany({ 
      where: {
        role: UserRole.STUDENT,
        tutorId: currentUser.id 
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true
      }
    });

    return NextResponse.json({ students }, { status: 200 });
  } catch (error: Error | unknown) {
    console.error('Error fetching tutor students:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 