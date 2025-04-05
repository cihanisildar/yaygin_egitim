import mongoose, { Schema, Document, Model } from 'mongoose';

export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface IItemRequest extends Document {
  studentId: mongoose.Types.ObjectId;
  tutorId: mongoose.Types.ObjectId;
  itemId: mongoose.Types.ObjectId;
  status: RequestStatus;
  pointsSpent: number;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ItemRequestSchema = new Schema<IItemRequest>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tutorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    itemId: {
      type: Schema.Types.ObjectId,
      ref: 'StoreItem',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(RequestStatus),
      default: RequestStatus.PENDING,
    },
    pointsSpent: {
      type: Number,
      required: true,
      min: 1,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Eliminate duplicate model compilation errors in development
const ItemRequest: Model<IItemRequest> = 
  mongoose.models.ItemRequest || 
  mongoose.model<IItemRequest>('ItemRequest', ItemRequestSchema);

export default ItemRequest; 