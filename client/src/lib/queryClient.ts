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
    
    // For auth endpoints, return the full response object with success, message, and data
    if (url.includes('/api/auth/')) {
      return response as unknown as T;
    }
    
    // For other endpoints, return the data property of ApiResponse if it exists
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
export const getQueryFn = <T>({ on401: unauthorizedBehavior }: { on401: UnauthorizedBehavior }): QueryFunction<T> => {
  return async ({ queryKey }) => {
    try {
      // Build the URL from the queryKey
      // If queryKey has multiple segments, construct the URL with path parameters
      let url = queryKey[0] as string;
      console.log("Building URL from queryKey:", queryKey);
      
      if (queryKey.length > 1) {
        const params = queryKey.slice(1);
        console.log("Query params:", params);
        
        // If only one additional parameter and it's a simple type, append it directly
        if (params.length === 1 && (typeof params[0] === 'string' || typeof params[0] === 'number')) {
          url = url.endsWith('/') ? url : `${url}/`;
          url = `${url}${params[0]}`;
          console.log("Appending ID parameter to URL:", url);
        } 
        // If one or more parameters and first is an object, treat as query params
        else if (params.length >= 1 && typeof params[0] === 'object' && params[0] !== null) {
          // Let's handle special case where first param is ID and second is query params
          if (params.length >= 2 && (typeof params[0] === 'string' || typeof params[0] === 'number') && 
              typeof params[1] === 'object' && params[1] !== null) {
            url = url.endsWith('/') ? url : `${url}/`;
            url = `${url}${params[0]}`;
            console.log("Special case: ID + query params. URL with ID:", url);
            
            const queryParams = new URLSearchParams();
            Object.entries(params[1]).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                queryParams.append(key, String(value));
              }
            });
            
            const queryString = queryParams.toString();
            if (queryString) {
              url = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
              console.log("Final URL with query params:", url);
            }
          } else {
            // Handle standard query params case
            const queryParams = new URLSearchParams();
            Object.entries(params[0]).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                queryParams.append(key, String(value));
              }
            });
            
            const queryString = queryParams.toString();
            if (queryString) {
              url = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
              console.log("Final URL with query params (standard case):", url);
            }
          }
        }
      }
      
      // Get the auth token from localStorage
      const token = localStorage.getItem('token');
      console.log("Query for URL:", url, "token available:", !!token);
      
      // Prepare request options with auth header if token exists
      const options: RequestInit = {};
      if (token) {
        options.headers = {
          'Authorization': `Bearer ${token}`
        };
      }
      
      // Use HTTP client to fetch data with auth token
      const response = await httpClient.get<T>(url, options);
      
      // For specific API patterns that return standardized responses like employees/:id
      // Return the full response object
      if (url.match(/\/api\/employees\/\d+/) || url.includes('/api/auth/')) {
        return response as unknown as T;
      }
      
      // For other endpoints, return data property of ApiResponse if it exists
      return response.data as T;
    } catch (error) {
      // Handle 401 (Unauthorized) as requested
      if (error instanceof ApiError && error.status === 401) {
        if (unauthorizedBehavior === "returnNull") {
          return null as unknown as T;
        }
      }
      
      // Re-throw all other errors
      throw error;
    }
  };
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
