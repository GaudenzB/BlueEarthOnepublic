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
      // Exhaustive type check
      const _exhaustiveCheck: never = 1063;
      return _exhaustiveCheck;
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
export const getQueryFn = <T>(options?: { on401?: UnauthorizedBehavior }): QueryFunction<T> => {
  const unauthorizedBehavior = options?.on401 || "throw";
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
      
      // No need to get token from localStorage anymore since we're using cookies
      console.log("Query for URL:", url);
      
      // Prepare request options with credentials included for cookies
      const options: RequestInit = {
        credentials: 'include' // Include cookies in the request
      };
      
      // Use HTTP client to fetch data
      const response = await httpClient.get<T>(url, options);
      
      // Special handling for employee detail endpoints
      if (url.match(/\/api\/employees\/\d+/)) {
        // Always return the full response object for employee details
        console.log("Employee detail endpoint detected, returning full response");
        return response as unknown as T;
      }
      
      // Special handling for document detail endpoints
      if (url.match(/\/api\/documents\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/) && 
          !url.includes('/preview') && !url.includes('/download')) {
        console.log("Document detail endpoint detected:", {
          url,
          response: response,
          responseType: typeof response,
          hasSuccessFlag: 'success' in response,
          hasDataProperty: 'data' in response,
          hasMessage: 'message' in response,
          dataType: 'data' in response ? typeof response.data : 'none'
        });
        
        // Check if the data contains the document - handle nested data structure
        if ('success' in response && response.success && 'data' in response) {
          // Check if we have a double-nested data structure like {success: true, data: {success: true, data: {...}}}
          if (response.data && typeof response.data === 'object' && 'data' in response.data && 'success' in response.data) {
            console.log("Document found in double-nested response:", {
              nestedDataExists: !!response.data.data,
              nestedDataType: typeof response.data.data,
              docId: response.data.data && typeof response.data.data === 'object' ? 
                (response.data.data as Record<string, any>)['id'] : undefined
            });
            return response.data.data as T;
          }
          
          console.log("Document found in response wrapper:", {
            docId: response.data && typeof response.data === 'object' ? (response.data as Record<string, any>)['id'] : undefined,
            docTitle: response.data && typeof response.data === 'object' ? 
              ((response.data as Record<string, any>)['title'] || (response.data as Record<string, any>)['originalFilename']) : undefined,
            docStatus: response.data && typeof response.data === 'object' ? 
              (response.data as Record<string, any>)['processingStatus'] : undefined
          });
          return response.data as T;
        }
        
        // If the response has 'id', it might be a direct document object
        if ('id' in response) {
          console.log("Document appears to be direct object in response");
          return response as unknown as T;
        }
        
        // Log warning about unexpected response format
        console.warn("Unexpected document detail response format:", response);
      }
      
      // Special handling for auth endpoints
      if (url.includes('/api/auth/')) {
        // Return the full response for auth endpoints
        console.log("Auth endpoint detected, returning full response");
        return response as unknown as T;
      }
      
      // For other endpoints, return data property of ApiResponse if it exists
      console.log("Standard endpoint, returning data property from response");
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
