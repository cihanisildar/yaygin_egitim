export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ErrorResponse {
  error: string;
  status?: number;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface FilterQuery {
  [key: string]: string | number | boolean | Date | undefined | { [key: string]: Date | string | number | boolean };
}

export interface SortQuery {
  [key: string]: 'asc' | 'desc';
}

export interface QueryOptions {
  filter?: FilterQuery;
  sort?: SortQuery;
  page?: number;
  limit?: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  points?: number;
  firstName?: string;
  lastName?: string;
  tutorId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date | string;
  location?: string;
  status: string;
  createdBy: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  participants?: User[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  quantity?: number;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
} 