/**
 * API Response Utilities
 * 
 * This module provides standardized response functions for API endpoints
 * to ensure consistent response format across the application.
 */

import { Response } from 'express';
import { logger } from './logger';

// Standard API response interface
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// HTTP status codes
export enum StatusCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

/**
 * Send a successful response with data
 */
export function success<T = any>(
  res: Response, 
  data: T, 
  message: string = 'Success', 
  statusCode: number = StatusCode.OK
): Response<ApiResponse<T>> {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Send a successful response with no data (for DELETE operations)
 */
export function noContent(
  res: Response, 
  message: string = 'Resource deleted successfully'
): Response<ApiResponse<null>> {
  return res.status(StatusCode.NO_CONTENT).json({
    success: true,
    message,
  });
}

/**
 * Send a created response (for POST operations)
 */
export function created<T = any>(
  res: Response, 
  data: T, 
  message: string = 'Resource created successfully'
): Response<ApiResponse<T>> {
  return res.status(StatusCode.CREATED).json({
    success: true,
    message,
    data,
  });
}

/**
 * Send an error response
 */
export function error(
  res: Response, 
  message: string = 'An error occurred', 
  statusCode: number = StatusCode.INTERNAL_SERVER_ERROR,
  errors?: Record<string, string[]>
): Response<ApiResponse<null>> {
  // Log server errors
  if (statusCode >= 500) {
    logger.error({ statusCode, message, errors }, 'Server error in API response');
  } else {
    logger.debug({ statusCode, message, errors }, 'Client error in API response');
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}

/**
 * Send a bad request error response
 */
export function badRequest(
  res: Response, 
  message: string = 'Bad request', 
  errors?: Record<string, string[]>
): Response<ApiResponse<null>> {
  return error(res, message, StatusCode.BAD_REQUEST, errors);
}

/**
 * Send an unauthorized error response
 */
export function unauthorized(
  res: Response, 
  message: string = 'Unauthorized'
): Response<ApiResponse<null>> {
  return error(res, message, StatusCode.UNAUTHORIZED);
}

/**
 * Send a forbidden error response
 */
export function forbidden(
  res: Response, 
  message: string = 'Forbidden'
): Response<ApiResponse<null>> {
  return error(res, message, StatusCode.FORBIDDEN);
}

/**
 * Send a not found error response
 */
export function notFound(
  res: Response, 
  message: string = 'Resource not found'
): Response<ApiResponse<null>> {
  return error(res, message, StatusCode.NOT_FOUND);
}

/**
 * Send a conflict error response
 */
export function conflict(
  res: Response, 
  message: string = 'Resource already exists',
  errors?: Record<string, string[]>
): Response<ApiResponse<null>> {
  return error(res, message, StatusCode.CONFLICT, errors);
}

/**
 * Send a validation error response
 */
export function validationError(
  res: Response, 
  errors: Record<string, string[]>,
  message: string = 'Validation error'
): Response<ApiResponse<null>> {
  return error(res, message, StatusCode.UNPROCESSABLE_ENTITY, errors);
}

/**
 * Send a service unavailable error response
 */
export function serviceUnavailable(
  res: Response, 
  message: string = 'Service temporarily unavailable'
): Response<ApiResponse<null>> {
  return error(res, message, StatusCode.SERVICE_UNAVAILABLE);
}

// Export all functions and types as a single object
export const apiResponse = {
  success,
  created,
  noContent,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  validationError,
  serviceUnavailable,
  StatusCode,
};

export default apiResponse;