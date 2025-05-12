/**
 * HTTP Client Utilities
 * 
 * This file provides utilities for making HTTP requests to the API.
 * It handles common concerns like authentication, error handling,
 * and response parsing.
 */

// Import from core-common package
import { ApiErrorResponse, ApiSuccessResponse } from '@blueearth/core-common';

/**
 * Default fetch options
 */
const defaultOptions: RequestInit = {
  credentials: 'same-origin',
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Enhanced fetch function with auth token and error handling
 */
export async function fetchWithAuth<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Merge default options with provided options
  const fetchOptions: RequestInit = {
    ...defaultOptions,
    ...options,
    headers,
  };
  
  try {
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw createApiError(response.status, errorData);
    }
    
    // If the response is 204 No Content, return null
    if (response.status === 204) {
      return null as T;
    }
    
    const data = await response.json();
    
    // Handle API responses that follow our standard format
    if (data && typeof data === 'object') {
      if ('success' in data) {
        if (data.success === true) {
          // For auth endpoints, return the full response
          if (url.includes('/api/auth/')) {
            return data as T;
          }
          
          // For standard endpoints, return just the data property
          return data.data as T;
        } else if (data.success === false && data.error) {
          throw createApiError(response.status, data as ApiErrorResponse);
        }
      }
    }
    
    // If the response doesn't follow our standard format, return it as is
    return data as T;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    
    // Handle network errors or other unexpected errors
    throw new ApiClientError(
      'Network error occurred',
      0,
      { message: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Get auth token from storage
 */
function getAuthToken(): string | null {
  // For client-side only
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
}

/**
 * Custom API Error class
 */
export class ApiClientError extends Error {
  status: number;
  code?: string;
  details?: any;
  
  constructor(message: string, status: number, errorData?: any) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    
    if (errorData) {
      this.code = errorData.code || errorData.error?.code;
      this.details = errorData.details || errorData.error?.details;
    }
  }
}

/**
 * Create an ApiClientError from response data
 */
function createApiError(status: number, errorData: any): ApiClientError {
  let message = 'An error occurred';
  
  if (errorData && typeof errorData === 'object') {
    if (errorData.error && errorData.error.message) {
      message = errorData.error.message;
    } else if (errorData.message) {
      message = errorData.message;
    }
  }
  
  return new ApiClientError(message, status, errorData);
}

/**
 * API request helpers for different HTTP methods
 */
export const apiRequest = {
  get: <T>(url: string, options?: RequestInit) => 
    fetchWithAuth<T>(url, { method: 'GET', ...options }),
    
  post: <T>(url: string, data?: any, options?: RequestInit) => 
    fetchWithAuth<T>(url, { 
      method: 'POST', 
      body: data ? JSON.stringify(data) : undefined,
      ...options 
    }),
    
  put: <T>(url: string, data?: any, options?: RequestInit) => 
    fetchWithAuth<T>(url, { 
      method: 'PUT', 
      body: data ? JSON.stringify(data) : undefined, 
      ...options 
    }),
    
  patch: <T>(url: string, data?: any, options?: RequestInit) => 
    fetchWithAuth<T>(url, { 
      method: 'PATCH', 
      body: data ? JSON.stringify(data) : undefined, 
      ...options 
    }),
    
  delete: <T>(url: string, options?: RequestInit) => 
    fetchWithAuth<T>(url, { method: 'DELETE', ...options }),
};