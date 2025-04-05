import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ogrtakip';

let cached = (global as any).mongoose || { conn: null, promise: null };

export async function connectToDatabase(retryAttempts = 3) {
  // If we already have a connection, use it
  if (cached.conn) {
    return cached.conn;
  }

  // If a connection attempt is in progress, wait for it
  if (cached.promise) {
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (error) {
      // If the existing promise failed, clear it and try again
      cached.promise = null;
      console.error('Previous connection attempt failed:', error);
    }
  }

  // Configure connection options
  const opts = {
    bufferCommands: false,
    connectTimeoutMS: 10000, // 10 seconds
    socketTimeoutMS: 45000,  // 45 seconds
    serverSelectionTimeoutMS: 10000, // 10 seconds
    maxPoolSize: 10, // Maintain up to 10 socket connections
  };

  // Function to attempt connection with retries
  const attemptConnection = async (attempts: number): Promise<mongoose.Mongoose> => {
    try {
      console.log(`MongoDB connection attempt ${retryAttempts - attempts + 1}/${retryAttempts}`);
      return await mongoose.connect(MONGODB_URI, opts);
    } catch (error: any) {
      if (attempts <= 1) {
        console.error('All MongoDB connection attempts failed:', error);
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const backoffTime = Math.min(Math.pow(2, retryAttempts - attempts + 1) * 100, 3000);
      console.log(`Retrying MongoDB connection in ${backoffTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      
      // Recursive retry with one fewer attempt
      return attemptConnection(attempts - 1);
    }
  };

  // Set the promise for connection attempt
  cached.promise = attemptConnection(retryAttempts)
    .then(mongoose => {
      console.log('MongoDB connected successfully');
      return mongoose;
    });

  // Await the connection
  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error('MongoDB connection failed:', error);
    throw error;
  }

  return cached.conn;
}

export default connectToDatabase; 