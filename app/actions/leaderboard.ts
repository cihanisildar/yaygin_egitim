'use server';

import { prisma } from '@/lib/prisma';
import { UserRole, Prisma } from '@prisma/client';

interface LeaderboardQuery {
  tutorId?: string;
  timeRange?: string;
  limit?: number;
}

interface PrismaQuery {
  tutorId?: string;
  createdAt?: { gte: Date };
  role?: UserRole;
}

export async function getLeaderboardData(params: LeaderboardQuery = {}) {
  const query: PrismaQuery = {};
  
  if (params.tutorId) {
    query.tutorId = params.tutorId;
  }

  if (params.timeRange) {
    const now = new Date();
    const startDate = new Date();

    switch (params.timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        break;
    }

    query.createdAt = { gte: startDate };
  }

  const limit = params.limit || 10;

  return { query, limit };
}

export async function getLeaderboard(tutorId?: string, limit: number = 100) {
  try {
    const where: Prisma.UserWhereInput = { role: UserRole.STUDENT };
    
    // If tutorId is provided, filter students by tutor
    if (tutorId) {
      where.tutorId = tutorId;
    }

    const students = await prisma.user.findMany({
      where,
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
      },
      orderBy: { points: 'desc' },
      take: limit
    });

    return students.map((student, index) => ({
      rank: index + 1,
      ...student
    }));
  } catch (error) {
    console.error('Get leaderboard error:', error);
    throw new Error('Failed to fetch leaderboard data');
  }
}

export async function getUserRank(userId: string) {
  try {
    // Get total number of students
    const totalStudents = await prisma.user.count({
      where: { role: UserRole.STUDENT }
    });
    
    // Get all students ordered by points to calculate rank
    const students = await prisma.user.findMany({
      where: { role: UserRole.STUDENT },
      orderBy: { points: 'desc' },
      select: { id: true }
    });
    
    // Find user's position in the ordered list
    const userIndex = students.findIndex(student => student.id === userId);
    const rank = userIndex !== -1 ? userIndex + 1 : null;
    
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      rank,
      totalStudents,
      user
    };
  } catch (error) {
    console.error('Get user rank error:', error);
    throw new Error('Failed to fetch user rank data');
  }
} 