import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, isAdmin, isAuthenticated, isStudent, isTutor } from '@/lib/server-auth';
import { RequestStatus, Prisma } from '@prisma/client';

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
    const status = searchParams.get('status') as RequestStatus | null;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const skip = (page - 1) * limit;
    const search = searchParams.get('search') || '';
    
    const where: Prisma.ItemRequestWhereInput = {};
    
    // Add status filter if provided
    if (status && Object.values(RequestStatus).includes(status)) {
      where.status = status;
    }
    
    // Add search filter if provided
    if (search) {
      where.OR = [
        {
          student: {
            OR: [
              { username: { contains: search, mode: 'insensitive' } },
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } }
            ]
          }
        },
        {
          item: {
            name: { contains: search, mode: 'insensitive' }
          }
        }
      ];
    }
    
    // Filter based on user role
    if (isAdmin(currentUser)) {
      // Admin can see all requests
    } else if (isTutor(currentUser)) {
      // Tutor can only see requests from their students
      where.tutorId = currentUser.id;
    } else if (isStudent(currentUser)) {
      // Student can only see their own requests
      where.studentId = currentUser.id;
    } else {
      return NextResponse.json(
        { error: 'Invalid user role' },
        { status: 403 }
      );
    }

    // Get total count and requests with pagination
    const [requests, total] = await prisma.$transaction([
      prisma.itemRequest.findMany({
        where,
        orderBy: [
          { status: 'asc' },
          { createdAt: 'desc' }
        ],
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
        },
        skip,
        take: limit
      }),
      prisma.itemRequest.count({ where })
    ]);

    return NextResponse.json({
      requests,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasMore: skip + requests.length < total
      }
    }, { status: 200 });
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

    // Use Prisma transaction for atomic operations
    const result = await prisma.$transaction(async (tx) => {
      // Get the student with their tutor information
      const student = await tx.user.findUnique({
        where: { id: currentUser.id },
        select: {
          id: true,
          points: true,
          tutorId: true,
          username: true,
          firstName: true,
          lastName: true
        }
      });

      if (!student) {
        throw new Error('Student not found');
      }

      if (!student.tutorId) {
        throw new Error('Student does not have an assigned tutor');
      }

      // Get the store item
      const item = await tx.storeItem.findUnique({
        where: { id: itemId },
        select: {
          id: true,
          name: true,
          pointsRequired: true,
          availableQuantity: true
        }
      });

      if (!item) {
        throw new Error('Item not found');
      }

      // Check if item is available
      if (item.availableQuantity <= 0) {
        throw new Error('Item is out of stock');
      }

      // Check if student has enough points
      if (student.points < item.pointsRequired) {
        throw new Error(`Not enough points. Required: ${item.pointsRequired}, Available: ${student.points}`);
      }

      // Check if student has any pending requests for the same item
      const existingRequest = await tx.itemRequest.findFirst({
        where: {
          studentId: student.id,
          itemId: item.id,
          status: RequestStatus.PENDING
        }
      });

      if (existingRequest) {
        throw new Error('You already have a pending request for this item');
      }

      // Create the request
      const newRequest = await tx.itemRequest.create({
        data: {
          studentId: student.id,
          tutorId: student.tutorId,
          itemId: item.id,
          status: RequestStatus.PENDING,
          pointsSpent: item.pointsRequired,
          note: note || ''
        },
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

      return newRequest;
    });

    return NextResponse.json(
      {
        message: 'Item request submitted successfully',
        request: result
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create request error:', error);
    if (error instanceof Error) {
      if (error.message.includes('not found') || 
          error.message.includes('out of stock') ||
          error.message.includes('not enough points') ||
          error.message.includes('no assigned tutor') ||
          error.message.includes('already have a pending request')) {
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