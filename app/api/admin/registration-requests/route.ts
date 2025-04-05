import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import RegistrationRequest, { RequestStatus } from '@/models/RegistrationRequest';
import User from '@/models/User';
import { checkIsAdmin } from '@/lib/server-auth';

// GET - Fetch all registration requests
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const isUserAdmin = await checkIsAdmin(request);
    if (!isUserAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    // Fetch all registration requests
    const requests = await RegistrationRequest.find({}).sort({ createdAt: -1 });
    
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
    
    await connectToDatabase();
    
    // Find the registration request
    const registrationRequest = await RegistrationRequest.findById(requestId);
    
    if (!registrationRequest) {
      return NextResponse.json({ error: 'Registration request not found' }, { status: 404 });
    }
    
    // Handle based on action
    if (action === 'approve') {
      // Create a new user from the registration request
      const newUser = new User({
        username: registrationRequest.username,
        email: registrationRequest.email,
        password: registrationRequest.password, // Password is already hashed
        firstName: registrationRequest.firstName,
        lastName: registrationRequest.lastName,
        role: registrationRequest.requestedRole,
      });
      
      await newUser.save();
      
      // Update the registration request status
      registrationRequest.status = RequestStatus.APPROVED;
      await registrationRequest.save();
      
      return NextResponse.json({ 
        message: 'Registration request approved successfully',
        user: { 
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role
        }
      }, { status: 200 });
    } else {
      // Reject the registration request
      registrationRequest.status = RequestStatus.REJECTED;
      registrationRequest.rejectionReason = rejectionReason;
      await registrationRequest.save();
      
      return NextResponse.json({ 
        message: 'Registration request rejected successfully'
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Error processing registration request:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 