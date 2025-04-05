import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User, { UserRole } from '@/models/User';
import { isAuthenticated, getUserFromRequest } from '@/lib/server-auth';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Get all students sorted by points
    const students = (await User.find({ role: UserRole.STUDENT })
      .select('username firstName lastName points')
      .sort({ points: -1 })
      .lean()) as unknown as Array<{
        _id: ObjectId;
        username: string;
        firstName?: string;
        lastName?: string;
        points?: number;
      }>;

    // Map students to leaderboard entries with ranks
    const leaderboard = students.map((student, index) => ({
      id: student._id.toString(),
      username: student.username,
      firstName: student.firstName,
      lastName: student.lastName,
      points: student.points || 0,
      rank: index + 1
    }));

    // Find current user's rank if they are a student
    const userRank = currentUser.role === UserRole.STUDENT
      ? leaderboard.find(entry => entry.id === currentUser.id)
      : null;

    return NextResponse.json({
      leaderboard: leaderboard.slice(0, 25), // Return top 25 students
      userRank: userRank ? {
        rank: userRank.rank,
        points: userRank.points
      } : null,
      total: students.length
    }, { status: 200 });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 