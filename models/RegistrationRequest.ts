import mongoose, { Schema, Document, Model } from 'mongoose';
import { UserRole } from './User';

export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface IRegistrationRequest extends Document {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  requestedRole: UserRole;
  status: RequestStatus;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RegistrationRequestSchema = new Schema<IRegistrationRequest>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    requestedRole: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.STUDENT,
    },
    status: {
      type: String,
      enum: Object.values(RequestStatus),
      default: RequestStatus.PENDING,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Eliminate duplicate model compilation errors in development
const RegistrationRequest: Model<IRegistrationRequest> = (mongoose.models && mongoose.models.RegistrationRequest) 
  ? mongoose.models.RegistrationRequest as Model<IRegistrationRequest>
  : mongoose.model<IRegistrationRequest>('RegistrationRequest', RegistrationRequestSchema);

export default RegistrationRequest; 