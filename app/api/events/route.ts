import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Event from '@/models/Event';
import { getUserFromRequest, isAuthenticated, isAdmin, isTutor } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const events = await Event.find({})
      .sort({ startDateTime: 1 })
      .populate('createdBy', 'username firstName lastName');

    return NextResponse.json(
      { 
        events: events.map(event => ({
          id: event._id,
          title: event.title,
          description: event.description,
          startDateTime: event.startDateTime,
          endDateTime: event.endDateTime,
          location: event.location,
          type: event.type,
          capacity: event.capacity,
          points: event.points,
          tags: event.tags,
          status: event.status,
          createdBy: event.createdBy,
          createdAt: event.createdAt,
        }))
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get events error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !(isAdmin(currentUser) || isTutor(currentUser))) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin or tutor can create events' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, startDateTime, endDateTime, location, type, capacity, points, tags } = body;

    if (!title || !description || !startDateTime || !endDateTime) {
      return NextResponse.json(
        { error: 'Title, description, start date, and end date are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const newEvent = new Event({
      title,
      description,
      startDateTime: new Date(startDateTime),
      endDateTime: new Date(endDateTime),
      location: location || 'Online',
      type: type || 'in-person',
      capacity: capacity || 20,
      points: points || 0,
      tags: tags || [],
      createdBy: currentUser.id,
      status: 'upcoming'
    });

    await newEvent.save();

    return NextResponse.json(
      {
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
          status: newEvent.status,
          createdBy: currentUser.id,
          createdAt: newEvent.createdAt,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 