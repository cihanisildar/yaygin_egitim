import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User, { UserRole } from '@/models/User';
import { getUserFromRequest, isAuthenticated, isAdmin, isTutor } from '@/lib/server-auth';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');
    const searchQuery = searchParams.get('q');
    const tutorId = searchParams.get('tutorId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    await connectToDatabase();

    let query: any = {};
    
    // Filter by role if provided
    if (role && Object.values(UserRole).includes(role as UserRole)) {
      query.role = role;
    }
    
    // Filter by tutorId if provided
    if (tutorId) {
      if (!mongoose.Types.ObjectId.isValid(tutorId)) {
        return NextResponse.json(
          { error: 'Invalid tutorId format' },
          { status: 400 }
        );
      }
      query.tutorId = tutorId;
    }
    
    // If user is a tutor and requesting students, restrict to only their students
    if (isTutor(currentUser) && role === UserRole.STUDENT && !isAdmin(currentUser)) {
      query.tutorId = currentUser.id;
    }
    
    // Admin can see all users, but non-admins have restrictions
    if (!isAdmin(currentUser)) {
      // Non-admins can only query specific roles
      if (role !== UserRole.STUDENT) {
        return NextResponse.json(
          { error: 'Unauthorized: Insufficient permissions' },
          { status: 403 }
        );
      }
    }
    
    // Search by username, email, firstName, lastName if provided
    if (searchQuery) {
      query = {
        ...query,
        $or: [
          { username: { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } },
          { firstName: { $regex: searchQuery, $options: 'i' } },
          { lastName: { $regex: searchQuery, $options: 'i' } },
        ],
      };
    }

    // Count total matching records for pagination
    const totalCount = await User.countDocuments(query);
    
    // Apply pagination
    const users = await User.find(query)
      .select('-password')
      .sort({ points: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        points: user.points,
        tutorId: user.tutorId,
        createdAt: user.createdAt,
      })),
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }, { status: 200 });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 