import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Event from '@/models/Event';
import { getUserFromRequest } from '@/lib/server-auth';

// Get a specific event by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const event = await Event.findById(id).populate('createdBy', 'username firstName lastName');

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get the populated user data
    const createdByUser = event.createdBy as unknown as { 
      _id: string;
      username: string;
      firstName?: string;
      lastName?: string;
    };

    return NextResponse.json(
      { 
        event: {
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
          createdBy: {
            id: createdByUser._id,
            username: createdByUser.username,
            firstName: createdByUser.firstName,
            lastName: createdByUser.lastName
          },
          createdAt: event.createdAt,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get event error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update an event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const event = await Event.findById(id);

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if the user is the creator of the event
    if (event.createdBy.toString() !== currentUser.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only update your own events' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, startDateTime, endDateTime, location, type, capacity, points, tags, status } = body;

    // Update event fields
    if (title) event.title = title;
    if (description) event.description = description;
    if (startDateTime) event.startDateTime = new Date(startDateTime);
    if (endDateTime) event.endDateTime = new Date(endDateTime);
    if (location) event.location = location;
    if (type) event.type = type;
    if (capacity) event.capacity = capacity;
    if (points !== undefined) event.points = points;
    if (tags) event.tags = tags;
    if (status) event.status = status;

    await event.save();

    return NextResponse.json(
      {
        message: 'Event updated successfully',
        event: {
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
          createdBy: {
            id: currentUser.id,
            username: currentUser.username
          },
          createdAt: event.createdAt,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete an event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const event = await Event.findById(id);

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if the user is the creator of the event
    if (event.createdBy.toString() !== currentUser.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only delete your own events' },
        { status: 403 }
      );
    }

    await event.deleteOne();

    return NextResponse.json(
      { message: 'Event deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 