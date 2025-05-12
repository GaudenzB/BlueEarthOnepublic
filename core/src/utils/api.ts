/**
 * Common API utilities and types
 */

/**
 * Standard API response format
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

/**
 * API error type
 */
export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * Standard pagination parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Standard pagination response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Helper function to create a paginated response
 */
export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResponse<T> {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Helper function to create success response
 */
export function createSuccessResponse<T>(data: T, message = 'Operation completed successfully'): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}

/**
 * Helper function to create error response
 */
export function createErrorResponse(message = 'Operation failed', errors?: Record<string, string[]>): ApiResponse<never> {
  return {
    success: false,
    message,
    errors,
  };
}