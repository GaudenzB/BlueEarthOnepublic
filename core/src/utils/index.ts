/**
 * Core API response utilities
 */

/**
 * Standard success response format
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  success: false;
  error: string;
  details?: Record<string, any>;
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

/**
 * Create a success response object
 * @param data The data to include in the response
 * @param message Optional success message
 * @returns Standardized success response object
 */
export function createSuccessResponse<T>(data: T, message?: string): SuccessResponse<T> {
  return {
    success: true,
    data,
    message
  };
}

/**
 * Create an error response object
 * @param error The error message
 * @param details Optional error details
 * @returns Standardized error response object
 */
export function createErrorResponse(error: string, details?: Record<string, any>): ErrorResponse {
  return {
    success: false,
    error,
    details
  };
}

/**
 * Re-export all utilities from individual files
 * Eventually these will be moved to separate files as the codebase grows
 */

// Function to format a date with standard options
export function formatDate(date: Date | string | number): string {
  if (!date) return '';
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

// Function to format a date with time
export function formatDateTime(date: Date | string | number): string {
  if (!date) return '';
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(d);
}

// Function to truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

// Function to generate initials from a name
export function getInitials(name: string): string {
  if (!name) return '';
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

// Create a timeout promise for async operations
export function timeout(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Safely parse JSON with a fallback value
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (e) {
    return fallback;
  }
}

// Deep clone an object
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}