/**
 * Error Handling Utilities
 * 
 * This file provides standardized error handling functionality.
 * Having a centralized error handling approach improves debugging
 * and makes the codebase more maintainable.
 */

import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { sendServerError, sendValidationError } from './apiResponse';
import { ErrorCode, HttpStatus } from '@blueearth/core-common';

/**
 * Custom API Error Class
 * Base class for all custom application errors
 */
export class ApiError extends Error {
  code: ErrorCode;
  statusCode: number;
  details?: any;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
    statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
    details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found Error
 */
export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(
      message,
      ErrorCode.NOT_FOUND,
      HttpStatus.NOT_FOUND,
      details
    );
  }
}

/**
 * Validation Error
 */
export class ValidationError extends ApiError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(
      message,
      ErrorCode.VALIDATION_ERROR,
      HttpStatus.UNPROCESSABLE_ENTITY,
      details
    );
  }
}

/**
 * Unauthorized Error
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Authentication required', details?: any) {
    super(
      message,
      ErrorCode.UNAUTHORIZED,
      HttpStatus.UNAUTHORIZED,
      details
    );
  }
}

/**
 * Forbidden Error
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = 'Access forbidden', details?: any) {
    super(
      message,
      ErrorCode.FORBIDDEN,
      HttpStatus.FORBIDDEN,
      details
    );
  }
}

/**
 * Database Error
 */
export class DatabaseError extends ApiError {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(
      message,
      ErrorCode.DATABASE_ERROR,
      HttpStatus.INTERNAL_SERVER_ERROR,
      details
    );
  }
}

/**
 * Conflict Error
 */
export class ConflictError extends ApiError {
  constructor(message: string = 'Resource conflict', details?: any) {
    super(
      message,
      ErrorCode.CONFLICT,
      HttpStatus.CONFLICT,
      details
    );
  }
}

/**
 * Service Unavailable Error
 */
export class ServiceUnavailableError extends ApiError {
  constructor(message: string = 'Service unavailable', details?: any) {
    super(
      message,
      ErrorCode.SERVICE_UNAVAILABLE,
      HttpStatus.SERVICE_UNAVAILABLE,
      details
    );
  }
}

/**
 * Authentication Error
 */
export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication failed', details?: any) {
    super(
      message,
      ErrorCode.AUTHENTICATION_ERROR,
      HttpStatus.UNAUTHORIZED,
      details
    );
  }
}

/**
 * Permission Error
 */
export class PermissionError extends ApiError {
  constructor(message: string = 'Insufficient permissions', details?: any) {
    super(
      message,
      ErrorCode.PERMISSION_ERROR,
      HttpStatus.FORBIDDEN,
      details
    );
  }
}

/**
 * Async Handler Utility
 * Wrap async route handlers to gracefully catch and forward errors
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global Error Handler Middleware
 * This should be registered as the last middleware in Express
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log the error (in production, you might want to use a proper logging service)
  console.error(`Error: ${err.message}`);
  console.error(err.stack);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return sendValidationError(res, err);
  }

  // Handle known API errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    });
  }

  // Handle unknown errors
  return sendServerError(
    res,
    'An unexpected error occurred',
    process.env.NODE_ENV === 'development' ? { message: err.message, stack: err.stack } : undefined
  );
};