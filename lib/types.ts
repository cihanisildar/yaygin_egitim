import { UserRole } from '@/models/User';
import { JWTPayload } from 'jose';

export interface UserJwtPayload extends JWTPayload {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  type?: 'refresh';
  [key: string]: unknown;
} 