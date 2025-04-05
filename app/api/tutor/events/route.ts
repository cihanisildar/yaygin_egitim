import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getUserFromRequest, isAuthenticated, isTutor } from '@/lib/server-auth';
import Event from '@/models/Event';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !isTutor(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors can create events' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const data = await request.json();
    
    // Validate required fields
    if (!data.title || !data.description || !data.startDateTime || !data.endDateTime) {
      return NextResponse.json(
        { error: 'Title, description, start date, and end date are required' },
        { status: 400 }
      );
    }

    // Create new event
    const newEvent = new Event({
      title: data.title,
      description: data.description,
      startDateTime: new Date(data.startDateTime),
      endDateTime: new Date(data.endDateTime),
      location: data.location || 'Online',
      type: data.type || 'in-person',
      capacity: data.capacity || 20,
      points: data.points || 0,
      tags: data.tags || [],
      createdBy: currentUser.id,
      status: 'upcoming'
    });

    await newEvent.save();

    return NextResponse.json({ 
      message: 'Event created successfully',
      event: {
        id: newEvent._id,
        title: newEvent.title,
        description: newEvent.description,
        startDateTime: newEvent.startDateTime,
        endDateTime: newEvent.endDateTime,
        location: newEvent.location,
        type: newEvent.type,
        capacity: newEvent.capacity,
        points: newEvent.points,
        tags: newEvent.tags,
        createdBy: newEvent.createdBy,
        status: newEvent.status
      }
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

    await connectToDatabase();

    // Get all events created by this tutor
    const events = await Event.find({ createdBy: currentUser.id })
      .sort({ startDateTime: -1 });

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