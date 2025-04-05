import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, isAuthenticated, isTutor } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !isTutor(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors can create events' },
        { status: 403 }
      );
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.title || !data.description || !data.startDateTime || !data.endDateTime) {
      return NextResponse.json(
        { error: 'Title, description, start date, and end date are required' },
        { status: 400 }
      );
    }

    // Create new event
    const newEvent = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        startDate: new Date(data.startDateTime),
        endDate: new Date(data.endDateTime),
        location: data.location || 'Online',
        type: data.type || 'in-person',
        capacity: data.capacity || 20,
        points: data.points || 0,
        tags: data.tags || [],
        status: 'upcoming',
        createdById: currentUser.id
      }
    });

    return NextResponse.json({ 
      message: 'Event created successfully',
      event: newEvent
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating event:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !isTutor(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors can view events' },
        { status: 403 }
      );
    }

    // Get all events created by this tutor
    const events = await prisma.event.findMany({
      where: { 
        createdById: currentUser.id 
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    return NextResponse.json({ events }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching events:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 