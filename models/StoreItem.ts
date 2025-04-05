import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStoreItem extends Document {
  name: string;
  description: string;
  pointsRequired: number;
  availableQuantity: number;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StoreItemSchema = new Schema<IStoreItem>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters']
    },
    pointsRequired: {
      type: Number,
      required: [true, 'Points required value is required'],
      min: [1, 'Points required must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Points required must be an integer'
      }
    },
    availableQuantity: {
      type: Number,
      required: [true, 'Available quantity is required'],
      min: [0, 'Available quantity cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Available quantity must be an integer'
      }
    },
    imageUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function(url: string) {
          // Allow null/undefined or a valid URL
          return !url || /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(url);
        },
        message: 'Invalid URL format'
      }
    },
  },
  { 
    timestamps: true,
    // Return proper validation errors
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add error handling for the StoreItem model
StoreItemSchema.post('save', function(error: any, doc: any, next: Function) {
  if (error.name === 'ValidationError') {
    // Format validation errors
    const formattedError = new Error(`Validation Error: ${Object.values(error.errors).map((e: any) => e.message).join(', ')}`);
    next(formattedError);
  } else {
    next(error);
  }
});

// Eliminate duplicate model compilation errors in development
const StoreItem: Model<IStoreItem> = 
  mongoose.models.StoreItem || 
  mongoose.model<IStoreItem>('StoreItem', StoreItemSchema);

export default StoreItem; 