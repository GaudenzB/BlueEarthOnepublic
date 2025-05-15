/**
 * HTTP Client Service
 * 
 * A centralized HTTP client that handles:
 * - Authentication token management
 * - Request/response interceptors
 * - Error handling
 * - Standardized response formats
 * - Request timeouts
 * - Automatic retries
 */

// Environment detection
const isDevelopment = import.meta.env.MODE === 'development';

// Standardized API response format
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T | undefined;
  errors?: Record<string, string[]> | undefined;
}

// Error class for API responses
export class ApiError extends Error {
  public status: number;
  public errors?: Record<string, string[]> | undefined;

  constructor(status: number, message: string, errors?: Record<string, string[]> | undefined) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

// HTTP client configuration
export interface HttpClientConfig {
  baseUrl?: string | undefined;
  defaultHeaders?: Record<string, string> | undefined;
  timeout?: number | undefined;
  retries?: number | undefined;
  retryDelay?: number | undefined;
}

// Default configuration values
const DEFAULT_CONFIG: HttpClientConfig = {
  baseUrl: '',
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 seconds
  retries: isDevelopment ? 0 : 2, // No retries in development
  retryDelay: 1000, // 1 second
};

/**
 * Token management functions have been removed as we've migrated to cookie-based auth
 * Authentication is now handled via HttpOnly cookies that are automatically
 * included in requests when using credentials: 'include'
 */

/**
 * Sleep utility for retry delay
 */
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * HTTP client implementation
 */
export class HttpClient {
  private config: HttpClientConfig;
  
  constructor(config: HttpClientConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Build URL from path and base URL
   */
  private buildUrl(path: string): string {
    // If path is already a full URL, return it as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // Remove leading slash from path if present
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    
    // Add trailing slash to baseUrl if needed
    const baseUrl = this.config.baseUrl || '';
    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    
    // Combine base URL and path
    return `${normalizedBaseUrl}${normalizedPath}`;
  }
  
  /**
   * Build headers for request
   */
  private buildHeaders(customHeaders?: HeadersInit): Headers {
    const headers = new Headers(this.config.defaultHeaders);
    
    // Add custom headers
    if (customHeaders) {
      if (customHeaders instanceof Headers) {
        customHeaders.forEach((value, key) => {
          headers.set(key, value);
        });
      } else {
        Object.entries(customHeaders).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            headers.set(key, String(value));
          }
        });
      }
    }
    
    // No token handling here anymore
    // Authentication is now handled through HttpOnly cookies
    // that are automatically included when using credentials: 'include'
    
    return headers;
  }
  
  /**
   * Process response and handle errors
   */
  private async processResponse<T>(response: Response): Promise<ApiResponse<T>> {
    // For empty responses
    if (response.status === 204) {
      return {
        success: true,
        message: 'Operation completed successfully',
      };
    }
    
    // Parse response as JSON
    let data: any;
    try {
      data = await response.json();
    } catch (error) {
      // If response is not JSON, use text
      const text = await response.text();
      
      if (!response.ok) {
        throw new ApiError(
          response.status,
          text || response.statusText || 'Unknown error',
        );
      }
      
      return {
        success: response.ok,
        message: text || 'Operation completed',
      };
    }
    
    // If response is not successful, throw an error
    if (!response.ok) {
      throw new ApiError(
        response.status,
        data.message || response.statusText || 'Unknown error',
        data.errors,
      );
    }
    
    // Return standardized response
    if (typeof data === 'object' && data !== null) {
      // If response already matches our format, return it
      if ('success' in data && 'message' in data) {
        return data as ApiResponse<T>;
      }
      
      // Otherwise, wrap the data in our format
      return {
        success: true,
        message: 'Operation completed successfully',
        data: data as T,
      };
    }
    
    // Return primitive values
    return {
      success: true,
      message: 'Operation completed successfully',
      data: data as unknown as T,
    };
  }
  
  /**
   * Execute fetch request with timeout and retries
   */
  private async executeFetch<T>(
    url: string, 
    options: RequestInit,
    retries: number = this.config.retries || 0
  ): Promise<ApiResponse<T>> {
    // Create an AbortController for this request
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    
    // Create a new options object with the signal
    const fetchOptions = {
      ...options,
      signal: controller.signal
    };
    
    // Set up the timeout if configured
    if (this.config.timeout) {
      timeoutId = setTimeout(() => {
        controller.abort();
      }, this.config.timeout);
    }
    
    try {
      // Execute request
      const response = await fetch(url, fetchOptions);
      
      // Process response
      return await this.processResponse<T>(response);
    } catch (error) {
      // Handle abort error (timeout)
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError(408, 'Request timeout');
      }
      
      // Handle network error
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new ApiError(0, 'Network error');
      }
      
      // If retries are available, retry the request
      if (retries > 0) {
        await sleep(this.config.retryDelay || 1000);
        return this.executeFetch<T>(url, options, retries - 1);
      }
      
      // Re-throw API errors
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Handle other errors
      throw new ApiError(
        500,
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      // Clean up timeout if it exists
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    }
  }
  
  /**
   * Make a GET request
   */
  async get<T = any>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    const headers = this.buildHeaders(options.headers);
    
    return this.executeFetch<T>(url, {
      ...options,
      method: 'GET',
      headers,
      credentials: 'include', // Always include credentials for auth cookies
    });
  }
  
  /**
   * Make a POST request
   */
  async post<T = any>(
    path: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    
    // If FormData is being sent, don't set Content-Type header
    // The browser will set it automatically with the correct boundary
    let customHeaders = options.headers || {};
    
    if (data instanceof FormData) {
      // Remove Content-Type for FormData requests to let browser set it
      if (customHeaders instanceof Headers) {
        customHeaders.delete('Content-Type');
      } else if (typeof customHeaders === 'object') {
        delete (customHeaders as Record<string, string>)['Content-Type'];
      }
      
      console.log('HttpClient: Detected FormData request, handling specially');
    }
    
    const headers = this.buildHeaders(customHeaders);
    
    // If data is provided and not already a string, stringify it
    let body = options.body || data;
    if (data && typeof data !== 'string' && !(data instanceof FormData)) {
      body = JSON.stringify(data);
    }
    
    return this.executeFetch<T>(url, {
      ...options,
      method: 'POST',
      headers,
      body,
      credentials: 'include', // Always include credentials for auth cookies
    });
  }
  
  /**
   * Make a PUT request
   */
  async put<T = any>(
    path: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    const headers = this.buildHeaders(options.headers);
    
    // If data is provided and not already a string, stringify it
    let body = options.body || data;
    if (data && typeof data !== 'string' && !(data instanceof FormData)) {
      body = JSON.stringify(data);
    }
    
    return this.executeFetch<T>(url, {
      ...options,
      method: 'PUT',
      headers,
      body,
      credentials: 'include', // Always include credentials for auth cookies
    });
  }
  
  /**
   * Make a PATCH request
   */
  async patch<T = any>(
    path: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    const headers = this.buildHeaders(options.headers);
    
    // If data is provided and not already a string, stringify it
    let body = options.body || data;
    if (data && typeof data !== 'string' && !(data instanceof FormData)) {
      body = JSON.stringify(data);
    }
    
    return this.executeFetch<T>(url, {
      ...options,
      method: 'PATCH',
      headers,
      body,
      credentials: 'include', // Always include credentials for auth cookies
    });
  }
  
  /**
   * Make a DELETE request
   */
  async delete<T = any>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    const headers = this.buildHeaders(options.headers);
    
    return this.executeFetch<T>(url, {
      ...options,
      method: 'DELETE',
      headers,
      credentials: 'include', // Always include credentials for auth cookies
    });
  }
}

// Export singleton instance with default configuration
export const httpClient = new HttpClient();

/**
 * Helper function for API requests
 * 
 * @param url API endpoint URL
 * @param options Request options
 * @returns Promise resolving to API response
 */
export const apiRequest = async <T = any>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
  const method = options.method || 'GET';
  
  if (method === 'GET') {
    return httpClient.get<T>(url, options);
  } else if (method === 'POST') {
    return httpClient.post<T>(url, options.body, options);
  } else if (method === 'PUT') {
    return httpClient.put<T>(url, options.body, options);
  } else if (method === 'PATCH') {
    return httpClient.patch<T>(url, options.body, options);
  } else if (method === 'DELETE') {
    return httpClient.delete<T>(url, options);
  }
  
  throw new Error(`Unsupported method: ${method}`);
};