import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description: string;
  startDateTime: Date;
  endDateTime: Date;
  location: string;
  type: 'online' | 'in-person';
  capacity: number;
  points: number;
  tags: string[];
  createdBy: mongoose.Types.ObjectId;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    startDateTime: {
      type: Date,
      required: true,
    },
    endDateTime: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
      default: 'Online',
    },
    type: {
      type: String,
      enum: ['online', 'in-person'],
      default: 'in-person',
    },
    capacity: {
      type: Number,
      required: true,
      default: 20,
      min: 1,
    },
    points: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
  },
  { timestamps: true }
);

// Eliminate duplicate model compilation errors in development
const Event: Model<IEvent> = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);

export default Event; 