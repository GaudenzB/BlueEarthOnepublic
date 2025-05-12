/**
 * Standardized API Response Utilities
 * 
 * This module provides consistent response formatting for all API endpoints.
 * It ensures that responses follow a standardized structure with proper status codes.
 */

import { Response } from 'express';
import { ZodError, ZodIssue } from 'zod';

/**
 * Base interface for all API responses
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T | undefined;
  message?: string | undefined;
  errors?: Record<string, string[]> | undefined;
}

/**
 * Success response with optional data and message
 */
function success<T>(res: Response, data?: T, message?: string): Response {
  // Log what we're about to send
  console.log("About to send success response with data:", {
    dataExists: data !== undefined,
    dataType: typeof data,
    isArray: Array.isArray(data),
    dataLength: Array.isArray(data) ? data.length : null,
    sample: Array.isArray(data) && data.length > 0 ? data[0] : null
  });
  
  // Special case for employee endpoints - return raw data for compatibility with client
  if (res.req?.url && res.req.url.includes('/api/employees')) {
    return res.status(200).json(data);
  }
  
  // Standard API response format
  const response: ApiResponse<T> = {
    success: true,
    data: data, // Always include data property, even if undefined
    ...(message && { message })
  };
  
  return res.status(200).json(response);
}

/**
 * Created response with data and optional message (status 201)
 */
function created<T>(res: Response, data: T, message?: string): Response {
  // Special case for employee endpoints - return raw data for compatibility with client
  if (res.req?.url && res.req.url.includes('/api/employees')) {
    return res.status(201).json(data);
  }
  
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message })
  };
  return res.status(201).json(response);
}

/**
 * No content response (status 204)
 */
function noContent(res: Response): Response {
  return res.status(204).end();
}

/**
 * Bad request error response (status 400)
 */
function badRequest(res: Response, message?: string): void;
function badRequest(res: Response, message: string): Response;
function badRequest(res: Response, message = 'Bad request'): Response | void {
  const response: ApiResponse<null> = {
    success: false,
    message
  };
  return res.status(400).json(response);
};

/**
 * Unauthorized error response (status 401)
 * This version can be used in both middleware and regular route handlers
 */
function unauthorized(res: Response, message?: string): void;
function unauthorized(res: Response, message: string): Response;
function unauthorized(res: Response, message = 'Unauthorized'): void | Response {
  const response: ApiResponse<null> = {
    success: false,
    message
  };
  return res.status(401).json(response);
}

/**
 * Forbidden error response (status 403)
 * This version can be used in both middleware and regular route handlers
 */
function forbidden(res: Response, message?: string): void;
function forbidden(res: Response, message: string): Response;
function forbidden(res: Response, message = 'Forbidden'): void | Response {
  const response: ApiResponse<null> = {
    success: false,
    message
  };
  return res.status(403).json(response);
};

/**
 * Not found error response (status 404)
 * This version can be used in both middleware and regular route handlers
 */
function notFound(res: Response, message?: string): void;
function notFound(res: Response, message: string): Response;
function notFound(res: Response, message = 'Resource not found'): void | Response {
  const response: ApiResponse<null> = {
    success: false,
    message
  };
  return res.status(404).json(response);
};

/**
 * Conflict error response (status 409)
 * This version can be used in both middleware and regular route handlers
 */
function conflict(res: Response, message?: string): void;
function conflict(res: Response, message: string): Response;
function conflict(res: Response, message = 'Resource conflict'): void | Response {
  const response: ApiResponse<null> = {
    success: false,
    message
  };
  return res.status(409).json(response);
};

/**
 * Validation error response (status 422)
 * This version can be used in both middleware and regular route handlers
 */
function validationError(res: Response): void;
function validationError(res: Response, errors: Record<string, string[]> | ZodError): Response;
function validationError(res: Response, errors?: Record<string, string[]> | ZodError): void | Response {
  const formattedErrors = errors instanceof ZodError ? formatErrors(errors) : errors;
  
  // Internal helper to format ZodError into a user-friendly format
  function formatErrors(error: ZodError): Record<string, string[]> {
    const formatted: Record<string, string[]> = {};
    
    error.errors.forEach(err => {
      const path = err.path.join('.');
      if (!formatted[path]) {
        formatted[path] = [];
      }
      formatted[path].push(err.message);
    });
    
    return formatted;
  }
  const response: ApiResponse<null> = {
    success: false,
    message: 'Validation failed',
    errors: formattedErrors
  };
  return res.status(422).json(response);
};

/**
 * Server error response (status 500)
 * This version can be used in both middleware and regular route handlers
 */
function serverError(res: Response, message?: string): void;
function serverError(res: Response, message: string): Response;
function serverError(res: Response, message = 'Internal server error'): void | Response {
  const response: ApiResponse<null> = {
    success: false,
    message
  };
  return res.status(500).json(response);
};

/**
 * Generic error response with custom status code
 * This version can be used in both middleware and regular route handlers
 */
function error(res: Response): void;
function error(res: Response, message: string, statusCode?: number, errors?: Record<string, string[]>): Response;
function error(res: Response, message: string = 'Internal server error', statusCode: number = 500, errors?: Record<string, string[]>): void | Response {
  const response: ApiResponse<null> = {
    success: false,
    message,
    ...(errors && { errors })
  };
  return res.status(statusCode).json(response);
};

/**
 * API Response Utilities
 */
export const apiResponse = {
  success,
  created,
  noContent,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  validationError,
  serverError,
  error
};

// Legacy API for backward compatibility - will be deprecated
export function sendSuccess(res: Response, data?: any, message?: string, statusCode?: number): Response {
  if (statusCode === 201) {
    return apiResponse.created(res, data, message);
  }
  
  // Ensure we don't lose data when using legacy function
  // Log the response being sent for debugging purposes
  console.log("sendSuccess called with data:", {
    dataType: typeof data,
    isArray: Array.isArray(data),
    length: Array.isArray(data) ? data.length : null,
    sampleData: Array.isArray(data) && data.length > 0 ? data[0] : null
  });
  
  return apiResponse.success(res, data, message);
}

export function sendError(res: Response, message?: string): void;
export function sendError(res: Response, message: string, statusCode?: number): Response;
export function sendError(res: Response, message: string = 'Internal server error', statusCode: number = 500): Response | void {
  if (statusCode === 409) return apiResponse.conflict(res, message);
  if (statusCode === 404) return apiResponse.notFound(res, message);
  if (statusCode === 403) return apiResponse.forbidden(res, message);
  if (statusCode === 401) return apiResponse.unauthorized(res, message);
  if (statusCode === 400) return apiResponse.badRequest(res, message);
  return apiResponse.serverError(res, message);
}

export function sendValidationError(res: Response, errors?: any): void;
export function sendValidationError(res: Response, errors: any): Response;
export function sendValidationError(res: Response, errors: any): Response | void {
  if (errors instanceof ZodError) {
    // Use the error directly if it's a ZodError
    return apiResponse.validationError(res, errors);
  } else if (Array.isArray(errors) && errors.length > 0 && errors[0].path && errors[0].message) {
    // Handle arrays that look like ZodIssue[]
    const formattedErrors: Record<string, string[]> = {};
    errors.forEach(issue => {
      const path = Array.isArray(issue.path) ? issue.path.join('.') : String(issue.path) || 'general';
      if (!formattedErrors[path]) formattedErrors[path] = [];
      formattedErrors[path].push(issue.message);
    });
    return apiResponse.validationError(res, formattedErrors);
  } else if (typeof errors === 'object') {
    // Handle Record<string, string | string[]>
    const formattedErrors: Record<string, string[]> = {};
    Object.keys(errors).forEach(key => {
      const value = errors[key];
      formattedErrors[key] = Array.isArray(value) ? value : [String(value)];
    });
    return apiResponse.validationError(res, formattedErrors);
  } else {
    // Default case - create a generic validation error
    return apiResponse.validationError(res, { general: ['Validation failed'] });
  }
}

export function sendNotFound(res: Response, message?: string): void;
export function sendNotFound(res: Response, message: string): Response;
export function sendNotFound(res: Response, message?: string): Response | void {
  return apiResponse.notFound(res, message);
}

export function sendServerError(res: Response, message?: string): void;
export function sendServerError(res: Response, message: string): Response;
export function sendServerError(res: Response, message?: string): Response | void {
  return apiResponse.serverError(res, message);
}