import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, isAdmin, isAuthenticated, isStudent, isTutor } from '@/lib/server-auth';
import { RequestStatus, TransactionType } from '@prisma/client';

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

    const { id } = params;

    const itemRequest = await prisma.itemRequest.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            points: true,
            tutor: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        tutor: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        item: {
          select: {
            id: true,
            name: true,
            description: true,
            pointsRequired: true,
            availableQuantity: true,
            imageUrl: true
          }
        }
      }
    });

    if (!itemRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to view this request
    const canView = 
      isAdmin(currentUser) ||
      (isTutor(currentUser) && itemRequest.tutorId === currentUser.id) ||
      (isStudent(currentUser) && itemRequest.studentId === currentUser.id);

    if (!canView) {
      return NextResponse.json(
        { error: 'You do not have permission to view this request' },
        { status: 403 }
      );
    }

    return NextResponse.json({ request: itemRequest });
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
    
    if (!isAuthenticated(currentUser) || !isTutor(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors can process requests' },
        { status: 403 }
      );
    }

    const { id } = params;
    const { status, rejectionReason } = await request.json();

    if (!status || !Object.values(RequestStatus).includes(status as RequestStatus)) {
      return NextResponse.json(
        { error: 'Invalid status provided' },
        { status: 400 }
      );
    }

    if (status === RequestStatus.REJECTED && !rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Use transaction to handle the request update and related operations
    const result = await prisma.$transaction(async (tx) => {
      // Get the current request with item and student info
      const currentRequest = await tx.itemRequest.findUnique({
        where: { id },
        include: {
          student: true,
          item: true
        }
      });

      if (!currentRequest) {
        throw new Error('Request not found');
      }

      // Verify tutor permission
      if (currentRequest.tutorId !== currentUser.id) {
        throw new Error('You can only process requests from your students');
      }

      // Check if request is already processed
      if (currentRequest.status !== RequestStatus.PENDING) {
        throw new Error('This request has already been processed');
      }

      // If approving, check if item is still available
      if (status === RequestStatus.APPROVED) {
        if (currentRequest.item.availableQuantity <= 0) {
          throw new Error('Item is no longer available');
        }

        // Check if student still has enough points
        if (currentRequest.student.points < currentRequest.pointsSpent) {
          throw new Error('Student no longer has enough points');
        }

        // Update item quantity
        await tx.storeItem.update({
          where: { id: currentRequest.itemId },
          data: {
            availableQuantity: {
              decrement: 1
            }
          }
        });

        // Deduct points from student
        await tx.user.update({
          where: { id: currentRequest.studentId },
          data: {
            points: {
              decrement: currentRequest.pointsSpent
            }
          }
        });

        // Create points transaction record
        await tx.pointsTransaction.create({
          data: {
            studentId: currentRequest.studentId,
            tutorId: currentUser.id,
            points: -currentRequest.pointsSpent,
            type: TransactionType.PURCHASE,
            reason: `Purchase of ${currentRequest.item.name}`
          }
        });
      }

      // Update request status
      const updatedRequest = await tx.itemRequest.update({
        where: { id },
        data: {
          status: status as RequestStatus,
          ...(status === RequestStatus.REJECTED && { rejectionReason })
        },
        include: {
          student: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              points: true
            }
          },
          tutor: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          },
          item: {
            select: {
              id: true,
              name: true,
              description: true,
              pointsRequired: true,
              availableQuantity: true,
              imageUrl: true
            }
          }
        }
      });

      return updatedRequest;
    });

    return NextResponse.json({
      message: `Request ${status.toLowerCase()} successfully`,
      request: result
    });
  } catch (error) {
    console.error('Update request error:', error);
    if (error instanceof Error) {
      if (error.message.includes('not found') ||
          error.message.includes('already been processed') ||
          error.message.includes('no longer available') ||
          error.message.includes('enough points') ||
          error.message.includes('your students')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !isStudent(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only students can cancel their requests' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Use transaction to safely cancel the request
    const result = await prisma.$transaction(async (tx) => {
      const itemRequest = await tx.itemRequest.findUnique({
        where: { id },
        include: {
          student: true
        }
      });

      if (!itemRequest) {
        throw new Error('Request not found');
      }

      // Verify ownership
      if (itemRequest.studentId !== currentUser.id) {
        throw new Error('You can only cancel your own requests');
      }

      // Check if request can be cancelled
      if (itemRequest.status !== RequestStatus.PENDING) {
        throw new Error('Only pending requests can be cancelled');
      }

      // Delete the request
      await tx.itemRequest.delete({
        where: { id }
      });

      return itemRequest;
    });

    return NextResponse.json({
      message: 'Request cancelled successfully',
      request: {
        id: result.id,
        status: result.status
      }
    });
  } catch (error) {
    console.error('Delete request error:', error);
    if (error instanceof Error) {
      if (error.message.includes('not found') ||
          error.message.includes('your own requests') ||
          error.message.includes('pending requests')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 