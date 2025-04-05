import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest, isAuthenticated, isTutor } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !isTutor(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors can access this endpoint' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    // Get all students assigned to this tutor
    const students = await User.find({ 
      role: 'student',
      tutorId: currentUser.id 
    }).select('username firstName lastName');

    return NextResponse.json({ 
      students: students.map(student => ({
        id: student._id,
        username: student.username,
        firstName: student.firstName,
        lastName: student.lastName
      }))
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching tutor students:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 