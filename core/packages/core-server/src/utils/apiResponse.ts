/**
 * API Response Utilities
 * 
 * This file provides standardized functions for creating API responses.
 * Following a consistent response format improves the developer experience
 * and makes client-side error handling more predictable.
 */

import { ZodIssue, ZodError } from 'zod';
import { Response } from 'express';

/**
 * Standard API Success Response Interface
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Standard API Error Response Interface
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Error Codes Enum
 * Standardized error codes for API responses
 */
export enum ErrorCode {
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFLICT = 'CONFLICT',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR'
}

/**
 * HTTP Status Codes
 */
export enum HttpStatus {
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
  SERVICE_UNAVAILABLE = 503
}

/**
 * Send a success response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = HttpStatus.OK,
  meta?: ApiSuccessResponse<T>['meta']
): void {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    message,
    meta
  };
  
  res.status(statusCode).json(response);
}

/**
 * Send an error response
 */
export function sendError(
  res: Response,
  code: ErrorCode,
  message: string,
  statusCode: number = HttpStatus.BAD_REQUEST,
  details?: any
): void {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details
    }
  };
  
  res.status(statusCode).json(response);
}

/**
 * Send a validation error response from Zod validation errors
 */
export function sendValidationError(
  res: Response,
  error: ZodError
): void {
  sendError(
    res,
    ErrorCode.VALIDATION_ERROR,
    'Validation failed',
    HttpStatus.UNPROCESSABLE_ENTITY,
    error.format()
  );
}

/**
 * Send a "not found" error response
 */
export function sendNotFound(
  res: Response,
  resource: string = 'Resource'
): void {
  sendError(
    res,
    ErrorCode.NOT_FOUND,
    `${resource} not found`,
    HttpStatus.NOT_FOUND
  );
}

/**
 * Send an unauthorized error response
 */
export function sendUnauthorized(
  res: Response,
  message: string = 'Authentication required'
): void {
  sendError(
    res,
    ErrorCode.UNAUTHORIZED,
    message,
    HttpStatus.UNAUTHORIZED
  );
}

/**
 * Send a forbidden error response
 */
export function sendForbidden(
  res: Response,
  message: string = 'You do not have permission to access this resource'
): void {
  sendError(
    res,
    ErrorCode.FORBIDDEN,
    message,
    HttpStatus.FORBIDDEN
  );
}

/**
 * Send a server error response
 */
export function sendServerError(
  res: Response,
  message: string = 'An unexpected error occurred',
  details?: any
): void {
  // In production, we may want to sanitize the details
  const safeDetails = process.env.NODE_ENV === 'production' ? undefined : details;
  
  sendError(
    res,
    ErrorCode.INTERNAL_SERVER_ERROR,
    message,
    HttpStatus.INTERNAL_SERVER_ERROR,
    safeDetails
  );
}

/**
 * Send a database error response
 */
export function sendDatabaseError(
  res: Response,
  message: string = 'Database operation failed',
  details?: any
): void {
  // In production, we should never expose database details
  const safeDetails = process.env.NODE_ENV === 'production' ? undefined : details;
  
  sendError(
    res,
    ErrorCode.DATABASE_ERROR,
    message,
    HttpStatus.INTERNAL_SERVER_ERROR,
    safeDetails
  );
}

/**
 * Send a conflict error response
 */
export function sendConflict(
  res: Response,
  message: string = 'Resource already exists or conflicts with another resource',
  details?: any
): void {
  sendError(
    res,
    ErrorCode.CONFLICT,
    message,
    HttpStatus.CONFLICT,
    details
  );
}