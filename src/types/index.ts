import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PostFilters {
  module?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
