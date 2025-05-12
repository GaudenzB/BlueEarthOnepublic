/**
 * Query Client Configuration
 * 
 * This module provides:
 * 1. A configured QueryClient for React Query
 * 2. API request methods for use in mutations
 * 3. Custom query functions with error handling
 */

import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { httpClient, ApiError, type ApiResponse } from "./httpClient";
import config from "./config";

// Type for handling 401 (Unauthorized) responses
type UnauthorizedBehavior = "returnNull" | "throw";

/**
 * Standardized API request method using the HTTP client
 * For use in mutation functions
 */
export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    // Determine HTTP method
    const method = options.method?.toUpperCase() || 'GET';
    
    // Extract request body
    const body = options.body ? 
      (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : 
      undefined;
    
    // Make the request using the appropriate HTTP client method
    let response: ApiResponse<T>;
    
    switch (method) {
      case 'GET':
        response = await httpClient.get<T>(url, options);
        break;
      case 'POST':
        response = await httpClient.post<T>(url, body, options);
        break;
      case 'PUT':
        response = await httpClient.put<T>(url, body, options);
        break;
      case 'PATCH':
        response = await httpClient.patch<T>(url, body, options);
        break;
      case 'DELETE':
        response = await httpClient.delete<T>(url, options);
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
    
    // Return data property of ApiResponse if it exists, otherwise return entire response
    return response.data !== undefined ? response.data : (response as unknown as T);
  } catch (error) {
    // Log error in development
    if (config.debug.logApiCalls) {
      console.error(`API Request Error: ${url}`, error);
    }
    
    // Re-throw API errors or convert generic errors to ApiError
    if (error instanceof ApiError) {
      throw error;
    } else {
      throw new ApiError(
        500,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
}

/**
 * Create a query function that handles unauthorized responses
 */
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      // Build the URL from the queryKey
      // If queryKey has multiple segments, construct the URL with path parameters
      let url = queryKey[0] as string;
      if (queryKey.length > 1) {
        const params = queryKey.slice(1);
        
        // If only one additional parameter and it's a simple type, append it directly
        if (params.length === 1 && (typeof params[0] === 'string' || typeof params[0] === 'number')) {
          url = url.endsWith('/') ? url : `${url}/`;
          url = `${url}${params[0]}`;
        } 
        // If one or more parameters and first is an object, treat as query params
        else if (params.length >= 1 && typeof params[0] === 'object' && params[0] !== null) {
          const queryParams = new URLSearchParams();
          Object.entries(params[0]).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              queryParams.append(key, String(value));
            }
          });
          
          const queryString = queryParams.toString();
          if (queryString) {
            url = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
          }
        }
      }
      
      // Use HTTP client to fetch data
      const response = await httpClient.get<T>(url);
      return response.data as T;
    } catch (error) {
      // Handle 401 (Unauthorized) as requested
      if (error instanceof ApiError && error.status === 401) {
        if (unauthorizedBehavior === "returnNull") {
          return null as T;
        }
      }
      
      // Re-throw all other errors
      throw error;
    }
  };

/**
 * Configured QueryClient with default options
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 401 (Unauthorized) or 404 (Not Found)
        if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
          return false;
        }
        // Retry network errors and server errors
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
