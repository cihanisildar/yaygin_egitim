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

    // Get all students and sort them by points
    const students = await User.find({ role: 'student' })
      .select('username firstName lastName points')
      .sort({ points: -1 });

    // Add rank to each student
    const leaderboard = students.map((student, index) => ({
      id: student._id,
      username: student.username,
      firstName: student.firstName,
      lastName: student.lastName,
      points: student.points,
      rank: index + 1
    }));

    return NextResponse.json({ leaderboard }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 