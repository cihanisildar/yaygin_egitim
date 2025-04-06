import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession, getUserFromRequest, isAuthenticated, isStudent, isTutor } from '@/lib/server-auth';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build where clause based on user role
    const where: Prisma.EventWhereInput = {};

    if (isStudent(currentUser)) {
      // Students can only see events created by their tutor
      if (!currentUser.tutorId) {
        return NextResponse.json({
          success: true,
          data: { events: [] }
        });
      }
      where.createdById = currentUser.tutorId;
    } else if (isTutor(currentUser)) {
      // Tutors can only see their own events
      where.createdById = currentUser.id;
    }
    // Admins can see all events (no filter)

    const events = await prisma.event.findMany({
      where,
      orderBy: { startDate: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        location: true,
        type: true,
        capacity: true,
        points: true,
        tags: true,
        status: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      data: { events }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    if (!data.title || !data.startDate || !data.endDate) {
      return NextResponse.json(
        { error: 'Title, start date and end date are required' },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (endDate < startDate) {
      return NextResponse.json(
        { error: 'End date cannot be before start date' },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description || '',
        startDate,
        endDate,
        location: data.location || 'Online',
        type: data.type || 'in-person',
        capacity: data.capacity || 20,
        points: data.points || 0,
        tags: data.tags || [],
        status: data.status || 'upcoming',
        createdById: session.user.id
      },
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        location: true,
        type: true,
        capacity: true,
        points: true,
        tags: true,
        status: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      data: { event }
    });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id || !updateData.title || !updateData.startDate || !updateData.endDate) {
      return NextResponse.json(
        { error: 'ID, title, start date and end date are required' },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(updateData.startDate);
    const endDate = new Date(updateData.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (endDate < startDate) {
      return NextResponse.json(
        { error: 'End date cannot be before start date' },
        { status: 400 }
      );
    }

    // Check if event exists and user has permission
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      select: { createdById: true }
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (existingEvent.createdById !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only update your own events' },
        { status: 403 }
      );
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        ...updateData,
        startDate,
        endDate,
        updatedById: session.user.id
      },
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        location: true,
        type: true,
        capacity: true,
        points: true,
        tags: true,
        status: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      data: { event }
    });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Check if event exists and user has permission
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      select: { createdById: true }
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (existingEvent.createdById !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own events' },
        { status: 403 }
      );
    }

    const event = await prisma.event.delete({
      where: { id },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true
      }
    });

    return NextResponse.json({
      success: true,
      data: { event }
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 