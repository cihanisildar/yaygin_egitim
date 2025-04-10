import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { isAdmin, isAuthenticated, isTutor } from '@/lib/auth';
import { getUserFromRequest } from '@/lib/server-auth';

// Update user points
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !(isAdmin(currentUser) || isTutor(currentUser))) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin or tutor can modify points' },
        { status: 403 }
      );
    }
    
    const { id } = await params;
    const body = await request.json();
    const { points, action } = body;
    
    // Validate points
    const pointsValue = parseInt(points);
    if (isNaN(pointsValue) || pointsValue < 0) {
      return NextResponse.json(
        { error: 'Points must be a valid non-negative number' },
        { status: 400 }
      );
    }
    
    // Validate action
    if (!action || !['add', 'subtract', 'set'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be one of: add, subtract, set' },
        { status: 400 }
      );
    }

    // Get user with current points
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        points: true,
        role: true,
        tutorId: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // If tutor, can only modify points of their students
    if (isTutor(currentUser) && !isAdmin(currentUser)) {
      if (user.role !== UserRole.STUDENT || user.tutorId !== currentUser.id) {
        return NextResponse.json(
          { error: 'You can only modify points for your own students' },
          { status: 403 }
        );
      }
    }
    
    // Calculate new points based on action
    let newPoints = user.points || 0;
    
    switch (action) {
      case 'add':
        newPoints += pointsValue;
        break;
      case 'subtract':
        newPoints = Math.max(0, newPoints - pointsValue); // Prevent negative points
        break;
      case 'set':
        newPoints = pointsValue;
        break;
    }
    
    // Update user points
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { points: newPoints },
      select: {
        id: true,
        username: true,
        points: true
      }
    });

    return NextResponse.json({
      message: 'Points updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update points error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 