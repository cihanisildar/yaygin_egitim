import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import StoreItem from '@/models/StoreItem';
import { isAdmin, isAuthenticated, isTutor } from '@/lib/server-auth';
import { getUserFromRequest } from '@/lib/server-auth';

// Default empty response
const EMPTY_RESPONSE = { items: [] };

// Helper to handle connection retries
async function withConnectionRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`Database operation failed (attempt ${attempt + 1}/${maxRetries}):`, error);
      lastError = error;
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 300 * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastError;
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication first - fail fast if not authenticated
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Add more debug info about the user
    console.log('User accessing store API:', {
      id: currentUser.id,
      username: currentUser.username,
      role: currentUser.role,
      isAdmin: isAdmin(currentUser),
      isTutor: isTutor(currentUser)
    });

    // Try database operations with retry mechanism
    try {
      await withConnectionRetry(async () => {
        await connectToDatabase();
      });
      
      const items = await withConnectionRetry(async () => {
        return StoreItem.find({}).sort({ pointsRequired: 1 });
      });

      return NextResponse.json(
        { 
          items: items.map(item => ({
            id: item._id,
            name: item.name,
            description: item.description,
            pointsRequired: item.pointsRequired,
            availableQuantity: item.availableQuantity,
            imageUrl: item.imageUrl,
          }))
        },
        { status: 200 }
      );
    } catch (dbError: any) {
      // Log database specific error
      console.error('Database error in store items:', dbError);
      
      // More detailed error logging for diagnosis
      console.error('DB Error details:', {
        message: dbError.message,
        stack: dbError.stack,
        name: dbError.name,
        code: dbError.code
      });
      
      // Return a more specific error message
      return NextResponse.json(
        { 
          error: 'Database connection error',
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined,
          items: [] // Return empty array to allow client to handle gracefully
        },
        { status: 503 } // Service Unavailable is better than 500 for DB connection issues
      );
    }
  } catch (error: any) {
    // General error handling with more details
    console.error('Get store items error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        items: [] // Return empty array
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !isAdmin(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin can create store items' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, pointsRequired, availableQuantity, imageUrl } = body;

    if (!name || !description || !pointsRequired || availableQuantity === undefined) {
      return NextResponse.json(
        { error: 'Name, description, pointsRequired, and availableQuantity are required' },
        { status: 400 }
      );
    }

    if (pointsRequired <= 0) {
      return NextResponse.json(
        { error: 'Points required must be greater than 0' },
        { status: 400 }
      );
    }

    if (availableQuantity < 0) {
      return NextResponse.json(
        { error: 'Available quantity cannot be negative' },
        { status: 400 }
      );
    }

    try {
      await withConnectionRetry(async () => {
        await connectToDatabase();
      });

      const newItem = new StoreItem({
        name,
        description,
        pointsRequired,
        availableQuantity,
        ...(imageUrl && { imageUrl }),
      });

      await withConnectionRetry(async () => {
        await newItem.save();
      });

      return NextResponse.json(
        {
          message: 'Store item created successfully',
          item: {
            id: newItem._id,
            name: newItem.name,
            description: newItem.description,
            pointsRequired: newItem.pointsRequired,
            availableQuantity: newItem.availableQuantity,
            imageUrl: newItem.imageUrl,
          }
        },
        { status: 201 }
      );
    } catch (dbError: any) {
      console.error('Database error creating store item:', dbError);
      console.error('DB Error details:', {
        message: dbError.message,
        stack: dbError.stack,
        name: dbError.name,
        code: dbError.code
      });
      
      return NextResponse.json(
        { 
          error: 'Database connection error',
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        },
        { status: 503 }
      );
    }
  } catch (error: any) {
    console.error('Create store item error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
} 