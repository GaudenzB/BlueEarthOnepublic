import { Employee } from "@shared/schema";

/**
 * Standard API response structure
 * Used for all API responses to ensure consistency
 * @template T The type of data returned in the response
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/**
 * Error response structure for API errors
 * Contains success status, error message, and optional detailed errors
 */
export interface ApiError {
  success: boolean;
  message: string;
  errors?: Record<string, unknown>;
}

/**
 * Response structure for login endpoints
 * Contains auth token and user details
 */
export interface LoginResponse {
  token: string;
  user: UserResponse;
}

/**
 * User data structure
 * Represents the authenticated user
 */
export interface UserResponse {
  id: number;
  username: string;
  email: string;
  role: string;
}

/**
 * Employee detail response
 * Used for employee detail endpoints
 */
export type EmployeeDetailResponse = ApiResponse<Employee>;