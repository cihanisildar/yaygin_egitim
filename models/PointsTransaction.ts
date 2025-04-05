import mongoose, { Schema, Document, Model } from 'mongoose';

export enum TransactionType {
  AWARD = 'award',
  REDEEM = 'redeem'
}

export interface IPointsTransaction extends Document {
  studentId: mongoose.Types.ObjectId;
  tutorId: mongoose.Types.ObjectId;
  points: number;
  type: TransactionType;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PointsTransactionSchema = new Schema<IPointsTransaction>(
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
    points: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: true,
    },
    reason: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Eliminate duplicate model compilation errors in development
const PointsTransaction: Model<IPointsTransaction> = 
  mongoose.models.PointsTransaction || 
  mongoose.model<IPointsTransaction>('PointsTransaction', PointsTransactionSchema);

export default PointsTransaction; 