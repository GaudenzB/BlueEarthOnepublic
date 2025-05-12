/**
 * Standardized API Response Utilities
 * 
 * This module provides consistent response formatting for all API endpoints.
 * It ensures that responses follow a standardized structure with proper status codes.
 */

import { Response } from 'express';
import { ZodError } from 'zod';

/**
 * Base interface for all API responses
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

/**
 * Success response with optional data and message
 */
const success = <T>(res: Response, data?: T, message?: string): Response => {
  const response: ApiResponse<T> = {
    success: true,
    ...(data !== undefined && { data }),
    ...(message && { message })
  };
  return res.status(200).json(response);
};

/**
 * Created response with data and optional message (status 201)
 */
const created = <T>(res: Response, data: T, message?: string): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message })
  };
  return res.status(201).json(response);
};

/**
 * No content response (status 204)
 */
const noContent = (res: Response): Response => {
  return res.status(204).end();
};

/**
 * Bad request error response (status 400)
 */
const badRequest = (res: Response, message = 'Bad request'): Response => {
  const response: ApiResponse<null> = {
    success: false,
    message
  };
  return res.status(400).json(response);
};

/**
 * Unauthorized error response (status 401)
 */
const unauthorized = (res: Response, message = 'Unauthorized'): Response => {
  const response: ApiResponse<null> = {
    success: false,
    message
  };
  return res.status(401).json(response);
};

/**
 * Forbidden error response (status 403)
 */
const forbidden = (res: Response, message = 'Forbidden'): Response => {
  const response: ApiResponse<null> = {
    success: false,
    message
  };
  return res.status(403).json(response);
};

/**
 * Not found error response (status 404)
 */
const notFound = (res: Response, message = 'Resource not found'): Response => {
  const response: ApiResponse<null> = {
    success: false,
    message
  };
  return res.status(404).json(response);
};

/**
 * Conflict error response (status 409)
 */
const conflict = (res: Response, message = 'Resource conflict'): Response => {
  const response: ApiResponse<null> = {
    success: false,
    message
  };
  return res.status(409).json(response);
};

/**
 * Validation error response (status 422)
 */
const validationError = (res: Response, errors: Record<string, string[]> | ZodError): Response => {
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
 */
const serverError = (res: Response, message = 'Internal server error'): Response => {
  const response: ApiResponse<null> = {
    success: false,
    message
  };
  return res.status(500).json(response);
};

/**
 * Generic error response with custom status code
 */
const error = (res: Response, message: string, statusCode: number = 500, errors?: Record<string, string[]>): Response => {
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
export const sendSuccess = success;
export const sendError = (res: Response, message = 'Internal server error', statusCode = 500): Response => {
  if (statusCode === 409) return apiResponse.conflict(res, message);
  if (statusCode === 404) return apiResponse.notFound(res, message);
  if (statusCode === 403) return apiResponse.forbidden(res, message);
  if (statusCode === 401) return apiResponse.unauthorized(res, message);
  if (statusCode === 400) return apiResponse.badRequest(res, message);
  return apiResponse.serverError(res, message);
};
export const sendValidationError = validationError;
export const sendNotFound = notFound;