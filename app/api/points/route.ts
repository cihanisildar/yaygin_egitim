import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User, { UserRole } from '@/models/User';
import PointsTransaction, { TransactionType } from '@/models/PointsTransaction';
import { getUserFromRequest, isAuthenticated, isAdmin, isStudent, isTutor } from '@/lib/server-auth';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !(isAdmin(currentUser) || isTutor(currentUser))) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin or tutor can award points' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { studentId, points, reason } = body;

    if (!studentId || !points) {
      return NextResponse.json(
        { error: 'Student ID and points are required' },
        { status: 400 }
      );
    }

    if (points <= 0) {
      return NextResponse.json(
        { error: 'Points must be greater than 0' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check if student exists and is actually a student
      const student = await User.findOne({ 
        _id: studentId, 
        role: UserRole.STUDENT 
      }).session(session);

      if (!student) {
        await session.abortTransaction();
        session.endSession();
        
        return NextResponse.json(
          { error: 'Student not found' },
          { status: 404 }
        );
      }

      // If tutor, check if the student is assigned to this tutor
      if (isTutor(currentUser) && student.tutorId.toString() !== currentUser.id) {
        await session.abortTransaction();
        session.endSession();
        
        return NextResponse.json(
          { error: 'Unauthorized: Student not assigned to this tutor' },
          { status: 403 }
        );
      }

      // Create transaction record
      const transaction = new PointsTransaction({
        studentId,
        tutorId: currentUser.id,
        points,
        type: TransactionType.AWARD,
        reason: reason || 'Points awarded',
      });

      await transaction.save({ session });

      // Update student's points
      student.points += points;
      await student.save({ session });

      await session.commitTransaction();
      session.endSession();

      return NextResponse.json(
        {
          message: 'Points awarded successfully',
          transaction: {
            id: transaction._id,
            studentId: transaction.studentId,
            tutorId: transaction.tutorId,
            points: transaction.points,
            type: transaction.type,
            reason: transaction.reason,
            createdAt: transaction.createdAt,
          },
          newBalance: student.points,
        },
        { status: 200 }
      );
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Award points error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get transactions for a student or for a tutor's students
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');
    
    await connectToDatabase();
    
    let query: any = {};

    // If admin, can see all transactions (optionally filtered by student)
    if (isAdmin(currentUser)) {
      if (studentId) {
        query.studentId = studentId;
      }
    } 
    // If tutor, can only see transactions for their students
    else if (isTutor(currentUser)) {
      if (studentId) {
        // Check if student belongs to this tutor
        const student = await User.findOne({
          _id: studentId,
          tutorId: currentUser.id
        });
        
        if (!student) {
          return NextResponse.json(
            { error: 'Student not found or not assigned to this tutor' },
            { status: 404 }
          );
        }
        
        query.studentId = studentId;
      } else {
        // Get all transactions for tutor's students
        const students = await User.find({ tutorId: currentUser.id }).select('_id');
        query.studentId = { $in: students.map(s => s._id) };
      }
    }
    // If student, can only see their own transactions
    else {
      query.studentId = currentUser.id;
    }

    const transactions = await PointsTransaction.find(query)
      .sort({ createdAt: -1 })
      .populate('studentId', 'username firstName lastName')
      .populate('tutorId', 'username firstName lastName');

    return NextResponse.json(
      { 
        transactions: transactions.map(t => ({
          id: t._id,
          student: t.studentId,
          tutor: t.tutorId,
          points: t.points,
          type: t.type,
          reason: t.reason,
          createdAt: t.createdAt,
        })) 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 