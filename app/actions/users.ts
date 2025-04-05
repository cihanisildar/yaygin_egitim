'use server';

import { prisma } from '@/lib/prisma';
import { UserRole, Prisma } from '@prisma/client';

/**
 * Gets all students assigned to a tutor
 */
export async function getTutorStudents(tutorId: string) {
  try {
    const students = await prisma.user.findMany({
      where: {
        role: UserRole.STUDENT,
        tutorId: tutorId
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        points: true
      }
    });
    
    return students;
  } catch (error) {
    console.error('Get tutor students error:', error);
    throw new Error('Failed to fetch tutor students');
  }
}

/**
 * Gets all students with pagination and filtering options
 */
export async function getStudents(options: { 
  page?: number, 
  limit?: number, 
  search?: string,
  tutorId?: string
}) {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '',
      tutorId
    } = options;
    
    // Build where clause
    const where: Prisma.UserWhereInput = {
      role: UserRole.STUDENT
    };
    
    // Add search filter if provided
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Add tutorId filter if provided
    if (tutorId) {
      where.tutorId = tutorId;
    }
    
    const [students, total] = await Promise.all([
      prisma.user.findMany({
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
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { points: 'desc' }
      }),
      prisma.user.count({ where })
    ]);
    
    return {
      students,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Get students error:', error);
    throw new Error('Failed to fetch students');
  }
} 