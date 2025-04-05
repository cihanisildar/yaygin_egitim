import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User, { UserRole } from '@/models/User';
import { isAdmin, isAuthenticated, isTutor, getUserFromRequest } from '@/lib/server-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    
    await connectToDatabase();

    const user = await User.findById(id).select('-password');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Only allow access if:
    // 1. User is looking at their own profile
    // 2. User is an admin
    // 3. User is a tutor looking at their own student
    const isSelf = currentUser?.id === id;
    const isAdminUser = isAdmin(currentUser);
    const isTutorViewingStudent = 
      isTutor(currentUser) && 
      user.role === UserRole.STUDENT && 
      user.tutorId && 
      user.tutorId.toString() === currentUser?.id;
    
    if (!isSelf && !isAdminUser && !isTutorViewingStudent) {
      return NextResponse.json(
        { error: 'Unauthorized: Cannot access this user' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          points: user.points,
          tutorId: user.tutorId,
          createdAt: user.createdAt,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !isAdmin(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }
    
    const { id } = await params;
    const body = await request.json();
    const { username, email, role, tutorId, firstName, lastName, points } = body;

    await connectToDatabase();

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check for duplicate username or email if changing
    if ((username && username !== user.username) || (email && email !== user.email)) {
      const existingUser = await User.findOne({
        _id: { $ne: id },
        $or: [
          ...(username ? [{ username }] : []),
          ...(email ? [{ email }] : []),
        ],
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username or email already exists' },
          { status: 409 }
        );
      }
    }

    // Update user fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (role && Object.values(UserRole).includes(role as UserRole)) {
      user.role = role as UserRole;
    }
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    
    // Update points if provided
    if (points !== undefined) {
      user.points = parseInt(points) || 0;
    }
    
    // Update tutorId if provided and user is a student
    if (role === UserRole.STUDENT || user.role === UserRole.STUDENT) {
      if (tutorId) {
        // Verify tutor exists and is a tutor
        const tutor = await User.findOne({ 
          _id: tutorId, 
          role: UserRole.TUTOR 
        });
        
        if (!tutor) {
          return NextResponse.json(
            { error: 'Invalid tutor ID provided' },
            { status: 400 }
          );
        }
        
        user.tutorId = tutorId;
      } else if (role === UserRole.STUDENT && !tutorId && !user.tutorId) {
        return NextResponse.json(
          { error: 'Tutor ID is required for students' },
          { status: 400 }
        );
      }
    }

    await user.save();

    return NextResponse.json(
      {
        message: 'User updated successfully',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          points: user.points,
          tutorId: user.tutorId,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !isAdmin(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }
    
    const { id } = await params;
    
    // Prevent deleting yourself
    if (currentUser?.id === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 