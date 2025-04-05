import { connectToDatabase } from '@/lib/mongodb';
import { getUserFromRequest, isAdmin, isAuthenticated, isStudent, isTutor } from '@/lib/server-auth';
import ItemRequest, { RequestStatus } from '@/models/ItemRequest';
import StoreItem from '@/models/StoreItem';
import User from '@/models/User';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

// Get requests based on user role
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    
    await connectToDatabase();
    
    const query: { status?: RequestStatus; tutorId?: string; studentId?: string } = {};
    
    // Add status filter if provided
    if (status && Object.values(RequestStatus).includes(status as RequestStatus)) {
      query.status = status as RequestStatus;
    }
    
    // Filter based on user role
    if (isAdmin(currentUser)) {
      // Admin can see all requests
    } else if (isTutor(currentUser)) {
      // Tutor can only see requests from their students
      query.tutorId = currentUser.id;
    } else if (isStudent(currentUser)) {
      // Student can only see their own requests
      query.studentId = currentUser.id;
    }

    const requests = await ItemRequest.find(query)
      .sort({ createdAt: -1 })
      .populate('studentId', 'username firstName lastName')
      .populate('tutorId', 'username firstName lastName')
      .populate('itemId');

    return NextResponse.json(
      { 
        requests: requests.map(req => ({
          id: req._id,
          student: req.studentId,
          tutor: req.tutorId,
          item: req.itemId,
          status: req.status,
          pointsSpent: req.pointsSpent,
          note: req.note,
          createdAt: req.createdAt,
        }))
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get requests error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new request (student only)
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !isStudent(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only students can request items' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { itemId, note } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get the student with their tutor information
      const student = await User.findById(currentUser.id).session(session);

      if (!student) {
        await session.abortTransaction();
        session.endSession();
        
        return NextResponse.json(
          { error: 'Student not found' },
          { status: 404 }
        );
      }

      if (!student.tutorId) {
        await session.abortTransaction();
        session.endSession();
        
        return NextResponse.json(
          { error: 'Student does not have an assigned tutor' },
          { status: 400 }
        );
      }

      // Get the store item
      const item = await StoreItem.findById(itemId).session(session);

      if (!item) {
        await session.abortTransaction();
        session.endSession();
        
        return NextResponse.json(
          { error: 'Item not found' },
          { status: 404 }
        );
      }

      // Check if item is available
      if (item.availableQuantity <= 0) {
        await session.abortTransaction();
        session.endSession();
        
        return NextResponse.json(
          { error: 'Item is out of stock' },
          { status: 400 }
        );
      }

      // Check if student has enough points
      if (student.points < item.pointsRequired) {
        await session.abortTransaction();
        session.endSession();
        
        return NextResponse.json(
          { error: 'Not enough points to request this item' },
          { status: 400 }
        );
      }

      // Create the request
      const newRequest = new ItemRequest({
        studentId: student._id,
        tutorId: student.tutorId,
        itemId: item._id,
        status: RequestStatus.PENDING,
        pointsSpent: item.pointsRequired,
        note: note || '',
      });

      await newRequest.save({ session });

      await session.commitTransaction();
      session.endSession();

      return NextResponse.json(
        {
          message: 'Item request submitted successfully',
          request: {
            id: newRequest._id,
            studentId: newRequest.studentId,
            tutorId: newRequest.tutorId,
            itemId: newRequest.itemId,
            status: newRequest.status,
            pointsSpent: newRequest.pointsSpent,
            note: newRequest.note,
            createdAt: newRequest.createdAt,
          }
        },
        { status: 201 }
      );
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Create request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 