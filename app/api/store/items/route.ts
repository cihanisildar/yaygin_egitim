import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getUserFromRequest, isAuthenticated, isTutor } from '@/lib/server-auth';
import StoreItem from '@/models/StoreItem';

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

    // Fetch all store items from the database
    const items = await StoreItem.find()
      .sort({ pointsRequired: 1 })
      .select('-__v');

    return NextResponse.json({ items }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching store items:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 