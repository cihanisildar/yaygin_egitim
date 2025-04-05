import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch all tutors
    const tutors = await prisma.user.findMany({
      where: {
        role: UserRole.TUTOR
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
      },
      orderBy: {
        firstName: 'asc'
      }
    });

    return NextResponse.json({ tutors });
  } catch (error) {
    console.error('Error fetching tutors:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 