import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export enum UserRole {
  ADMIN = 'admin',
  TUTOR = 'tutor',
  STUDENT = 'student'
}

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  points: number;
  tutorId?: mongoose.Types.ObjectId;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword: (password: string) => Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.STUDENT,
    },
    points: {
      type: Number,
      default: 0,
    },
    tutorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: function (this: IUser) {
        return this.role === UserRole.STUDENT;
      },
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Password hashing middleware
UserSchema.pre('save', async function (next) {
  const user = this;
  if (!user.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error: any) {
    return next(error);
  }
});

// Password comparison method
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

// Eliminate duplicate model compilation errors in development
const User: Model<IUser> = (mongoose.models && mongoose.models.User) 
  ? mongoose.models.User as Model<IUser>
  : mongoose.model<IUser>('User', UserSchema);

export default User; 