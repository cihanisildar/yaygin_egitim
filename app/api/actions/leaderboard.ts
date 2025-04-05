'use server';

import { connectToDatabase } from '@/lib/mongodb';
import User, { UserRole } from '@/models/User';
import mongoose from 'mongoose';

export async function getLeaderboard(tutorId?: string, limit: number = 100) {
  try {
    await connectToDatabase();

    let query: any = { role: UserRole.STUDENT };
    
    // If tutorId is provided, filter students by tutor
    if (tutorId) {
      query.tutorId = tutorId;
    }

    const students = await User.find(query)
      .select('username firstName lastName points tutorId')
      .sort({ points: -1 })
      .limit(limit)
      .populate('tutorId', 'username firstName lastName');

    return students.map((student, index) => ({
      rank: index + 1,
      id: student._id,
      username: student.username,
      firstName: student.firstName,
      lastName: student.lastName,
      points: student.points,
      tutor: student.tutorId,
    }));
  } catch (error) {
    console.error('Get leaderboard error:', error);
    throw new Error('Failed to fetch leaderboard data');
  }
}

export async function getUserRank(userId: string) {
  try {
    await connectToDatabase();
    
    const totalStudents = await User.countDocuments({ role: UserRole.STUDENT });
    
    const userRank = await User.aggregate([
      { $match: { role: UserRole.STUDENT } },
      { $sort: { points: -1 } },
      { 
        $group: { 
          _id: null, 
          students: { $push: "$$ROOT" } 
        } 
      },
      { 
        $project: { 
          userRank: { 
            $add: [
              { $indexOfArray: ["$students._id", mongoose.Types.ObjectId.createFromHexString(userId)] },
              1
            ] 
          },
          totalStudents: { $size: "$students" }
        } 
      }
    ]);
    
    const user = await User.findById(userId)
      .select('username firstName lastName points tutorId')
      .populate('tutorId', 'username firstName lastName');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const rank = userRank.length > 0 ? userRank[0].userRank : null;
    
    return {
      rank: rank,
      totalStudents,
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        points: user.points,
        tutor: user.tutorId
      }
    };
  } catch (error) {
    console.error('Get user rank error:', error);
    throw new Error('Failed to fetch user rank data');
  }
} 