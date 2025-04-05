import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import ItemRequest, { RequestStatus } from '@/models/ItemRequest';
import StoreItem from '@/models/StoreItem';
import User from '@/models/User';
import PointsTransaction, { TransactionType } from '@/models/PointsTransaction';
import { isAdmin, isAuthenticated, isTutor } from '@/lib/auth';
import { getUserFromRequest } from '@/lib/server-auth';
import mongoose from 'mongoose';

// Get a specific request by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const requestId = params.id;
    
    await connectToDatabase();
    
    const itemRequest = await ItemRequest.findById(requestId)
      .populate('studentId', 'username firstName lastName points')
      .populate('tutorId', 'username firstName lastName')
      .populate('itemId');
    
    if (!itemRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }
    
    // Check permissions: admin can see all, tutor only their students, student only their own
    if (
      !isAdmin(currentUser) && 
      !(isTutor(currentUser) && itemRequest.tutorId._id.toString() === currentUser.id) &&
      !(itemRequest.studentId._id.toString() === currentUser.id)
    ) {
      return NextResponse.json(
        { error: 'Unauthorized to view this request' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { 
        request: {
          id: itemRequest._id,
          student: itemRequest.studentId,
          tutor: itemRequest.tutorId,
          item: itemRequest.itemId,
          status: itemRequest.status,
          pointsSpent: itemRequest.pointsSpent,
          note: itemRequest.note,
          createdAt: itemRequest.createdAt,
        } 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a request (approve or reject)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !(isAdmin(currentUser) || isTutor(currentUser))) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin or tutor can update requests' },
        { status: 403 }
      );
    }
    
    const requestId = params.id;
    const body = await request.json();
    const { status, note } = body;
    
    if (!status || !Object.values(RequestStatus).includes(status as RequestStatus)) {
      return NextResponse.json(
        { error: 'Valid status is required' },
        { status: 400 }
      );
    }
    
    // Only allow APPROVED or REJECTED status
    if (status === RequestStatus.PENDING) {
      return NextResponse.json(
        { error: 'Cannot set status back to pending' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Get the request with its related data
      const itemRequest = await ItemRequest.findById(requestId).session(session);
      
      if (!itemRequest) {
        await session.abortTransaction();
        session.endSession();
        
        return NextResponse.json(
          { error: 'Request not found' },
          { status: 404 }
        );
      }
      
      // Check if request is already processed
      if (itemRequest.status !== RequestStatus.PENDING) {
        await session.abortTransaction();
        session.endSession();
        
        return NextResponse.json(
          { error: 'Request has already been processed' },
          { status: 400 }
        );
      }
      
      // Tutor can only process their own students' requests
      if (isTutor(currentUser) && itemRequest.tutorId.toString() !== currentUser.id) {
        await session.abortTransaction();
        session.endSession();
        
        return NextResponse.json(
          { error: 'Unauthorized: This request belongs to another tutor' },
          { status: 403 }
        );
      }
      
      // Get the student and item
      const student = await User.findById(itemRequest.studentId).session(session);
      const item = await StoreItem.findById(itemRequest.itemId).session(session);
      
      if (!student || !item) {
        await session.abortTransaction();
        session.endSession();
        
        return NextResponse.json(
          { error: 'Student or item not found' },
          { status: 404 }
        );
      }
      
      // Process based on approval status
      if (status === RequestStatus.APPROVED) {
        // Check if item is still available
        if (item.availableQuantity <= 0) {
          await session.abortTransaction();
          session.endSession();
          
          return NextResponse.json(
            { error: 'Item is out of stock' },
            { status: 400 }
          );
        }
        
        // Check if student still has enough points
        if (student.points < itemRequest.pointsSpent) {
          await session.abortTransaction();
          session.endSession();
          
          return NextResponse.json(
            { error: 'Student no longer has enough points' },
            { status: 400 }
          );
        }
        
        // Create points transaction
        const transaction = new PointsTransaction({
          studentId: student._id,
          tutorId: itemRequest.tutorId,
          points: itemRequest.pointsSpent,
          type: TransactionType.REDEEM,
          reason: `Redeemed for item: ${item.name}`,
        });
        
        await transaction.save({ session });
        
        // Update item quantity
        item.availableQuantity -= 1;
        await item.save({ session });
        
        // Update student points
        student.points -= itemRequest.pointsSpent;
        await student.save({ session });
      }
      
      // Update request status
      itemRequest.status = status as RequestStatus;
      if (note) {
        itemRequest.note = note;
      }
      
      await itemRequest.save({ session });
      
      await session.commitTransaction();
      session.endSession();
      
      return NextResponse.json(
        {
          message: `Request ${status.toLowerCase()} successfully`,
          request: {
            id: itemRequest._id,
            status: itemRequest.status,
            note: itemRequest.note,
          }
        },
        { status: 200 }
      );
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Update request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 