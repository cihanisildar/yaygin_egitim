import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    
    // Get all students with their points
    const students = await db.collection('users')
      .find({ role: 'student' })
      .project({
        _id: 1,
        username: 1,
        firstName: 1,
        lastName: 1,
        points: 1
      })
      .toArray();

    // Sort students by points and assign ranks
    const leaderboard = students
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .map((student, index) => ({
        id: student._id.toString(),
        username: student.username,
        firstName: student.firstName || null,
        lastName: student.lastName || null,
        points: student.points || 0,
        rank: index + 1
      }));

    // Find current user's rank
    const userRank = leaderboard.find(student => 
      student.id === session.user.id
    );

    return NextResponse.json({
      leaderboard: leaderboard.slice(0, 25), // Return top 25 students
      userRank: userRank ? {
        rank: userRank.rank,
        points: userRank.points
      } : null
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
} 