import { Employee } from "@shared/schema";

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ApiError {
  success: boolean;
  message: string;
  errors?: any;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface EmployeeDetailResponse {
  success: boolean;
  data: Employee;
}