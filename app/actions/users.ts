'use server';

import { connectToDatabase } from '@/lib/mongodb';
import User, { UserRole } from '@/models/User';

/**
 * Gets all students assigned to a tutor
 */
export async function getTutorStudents(tutorId: string) {
  try {
    await connectToDatabase();
    
    const students = await User.find({
      role: UserRole.STUDENT,
      tutorId: tutorId
    })
    .select('username firstName lastName points');
    
    return students.map(student => ({
      id: student._id,
      username: student.username,
      firstName: student.firstName,
      lastName: student.lastName,
      points: student.points
    }));
  } catch (error) {
    console.error('Get tutor students error:', error);
    throw new Error('Failed to fetch tutor students');
  }
}

interface StudentQuery {
  role: UserRole;
  $or?: Array<{
    [key: string]: { $regex: string, $options: string }
  }>;
  tutorId?: string;
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
    
    await connectToDatabase();
    
    const query: StudentQuery = { role: UserRole.STUDENT };
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add tutorId filter if provided
    if (tutorId) {
      query.tutorId = tutorId;
    }
    
    const total = await User.countDocuments(query);
    
    const students = await User.find(query)
      .select('username firstName lastName points tutorId')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ points: -1 })
      .populate('tutorId', 'username firstName lastName');
    
    return {
      students: students.map(student => ({
        id: student._id,
        username: student.username,
        firstName: student.firstName,
        lastName: student.lastName,
        points: student.points,
        tutor: student.tutorId
      })),
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