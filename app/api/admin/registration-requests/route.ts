import { prisma } from '@/lib/prisma';
import { checkIsAdmin } from '@/lib/server-auth';
import { RequestStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch all registration requests
export async function GET(request: NextRequest) {
  try {
    // During build time, return empty data
    if (process.env.NODE_ENV === 'production' && !request.headers.get('cookie')) {
      return NextResponse.json({ requests: [] }, { status: 200 });
    }

    // Check if user is authenticated and is an admin
    const isUserAdmin = await checkIsAdmin(request);
    if (!isUserAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch all registration requests
    const requests = await prisma.registrationRequest.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json({ requests }, { status: 200 });
  } catch (error) {
    console.error('Error fetching registration requests:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

// POST - Process a registration request (approve/reject)
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const isUserAdmin = await checkIsAdmin(request);
    if (!isUserAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    const { requestId, action, rejectionReason } = data;
    
    if (!requestId || !action || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }
    
    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }
    
    // Use Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      // Find the registration request
      const registrationRequest = await tx.registrationRequest.findUnique({
        where: { id: requestId }
      });
      
      if (!registrationRequest) {
        throw new Error('Registration request not found');
      }
      
      // Handle based on action
      if (action === 'approve') {
        // Create a new user from the registration request
        const newUser = await tx.user.create({
          data: {
            username: registrationRequest.username,
            email: registrationRequest.email,
            password: registrationRequest.password, // Password is already hashed
            firstName: registrationRequest.firstName,
            lastName: registrationRequest.lastName,
            role: registrationRequest.requestedRole,
          }
        });
        
        // Update the registration request status
        await tx.registrationRequest.update({
          where: { id: requestId },
          data: { status: RequestStatus.APPROVED }
        });
        
        return { user: newUser };
      } else {
        // Reject the registration request
        await tx.registrationRequest.update({
          where: { id: requestId },
          data: {
            status: RequestStatus.REJECTED,
            rejectionReason
          }
        });
        
        return null;
      }
    });
    
    if (result?.user) {
      return NextResponse.json({ 
        message: 'Registration request approved successfully',
        user: {
          id: result.user.id,
          username: result.user.username,
          email: result.user.email,
          role: result.user.role
        }
      }, { status: 200 });
    } else {
      return NextResponse.json({ 
        message: 'Registration request rejected successfully'
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Error processing registration request:', error);
    if (error instanceof Error && error.message === 'Registration request not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 