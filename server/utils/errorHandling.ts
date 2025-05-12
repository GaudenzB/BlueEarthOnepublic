/**
 * Error Handling Utilities
 * 
 * This module provides utilities for handling errors consistently across
 * controllers and middleware.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from './logger';
import apiResponse from './apiResponse';
import { DatabaseError } from 'pg';
import { DrizzleError } from 'drizzle-orm';

/**
 * Error types that can be handled specifically by the error handler
 */
export enum ErrorType {
  VALIDATION = 'ValidationError',
  DATABASE = 'DatabaseError',
  AUTHENTICATION = 'AuthenticationError',
  AUTHORIZATION = 'AuthorizationError',
  NOT_FOUND = 'NotFoundError',
  CONFLICT = 'ConflictError',
  INTEGRATION = 'IntegrationError',
  RATE_LIMIT = 'RateLimitError',
  SERVER = 'ServerError'
}

/**
 * Base application error class
 */
export class AppError extends Error {
  public type: ErrorType;
  public statusCode: number;
  public errors?: Record<string, string[]>;

  constructor(
    message: string,
    type: ErrorType = ErrorType.SERVER,
    statusCode: number = 500,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.type = type;
    this.statusCode = statusCode;
    this.errors = errors;
    
    // Properly capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  constructor(
    message: string = 'Validation failed',
    errors?: Record<string, string[]>
  ) {
    super(message, ErrorType.VALIDATION, 422, errors);
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, ErrorType.AUTHENTICATION, 401);
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Not authorized') {
    super(message, ErrorType.AUTHORIZATION, 403);
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, ErrorType.NOT_FOUND, 404);
  }
}

/**
 * Conflict error class
 */
export class ConflictError extends AppError {
  constructor(
    message: string = 'Resource already exists',
    errors?: Record<string, string[]>
  ) {
    super(message, ErrorType.CONFLICT, 409, errors);
  }
}

/**
 * Database error class
 */
export class DatabaseError extends AppError {
  constructor(
    message: string = 'Database operation failed',
    errors?: Record<string, string[]>
  ) {
    super(message, ErrorType.DATABASE, 500, errors);
  }
}

/**
 * Integration error class
 */
export class IntegrationError extends AppError {
  constructor(
    message: string = 'External service integration failed',
    statusCode: number = 500,
    errors?: Record<string, string[]>
  ) {
    super(message, ErrorType.INTEGRATION, statusCode, errors);
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, ErrorType.RATE_LIMIT, 429);
  }
}

/**
 * Server error class
 */
export class ServerError extends AppError {
  constructor(
    message: string = 'Internal server error',
    errors?: Record<string, string[]>
  ) {
    super(message, ErrorType.SERVER, 500, errors);
  }
}

/**
 * Convert a ZodError to a ValidationError
 */
export function convertZodError(error: ZodError): ValidationError {
  // Format errors for client consumption
  const formattedErrors: Record<string, string[]> = {};
  
  error.errors.forEach(err => {
    const path = err.path.join('.');
    if (!formattedErrors[path]) {
      formattedErrors[path] = [];
    }
    formattedErrors[path].push(err.message);
  });
  
  return new ValidationError('Validation failed', formattedErrors);
}

/**
 * Format a database error for client consumption
 */
export function formatDatabaseError(error: DatabaseError | DrizzleError): Record<string, string[]> {
  // Extract meaningful information from database errors
  const formattedErrors: Record<string, string[]> = {
    database: ['Database operation failed. Please try again later.']
  };
  
  if (error instanceof DatabaseError) {
    // Handle PostgreSQL specific errors
    if (error.message.includes('duplicate key')) {
      formattedErrors.database = ['A record with this value already exists.'];
    } else if (error.message.includes('foreign key')) {
      formattedErrors.database = ['Referenced record does not exist or cannot be deleted due to dependencies.'];
    }
  }
  
  return formattedErrors;
}

/**
 * Sanitize errors to avoid leaking sensitive information
 */
export function sanitizeErrors(errors: Record<string, string[]>): Record<string, string[]> {
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'apiKey'];
  
  // Create a new object to avoid mutation
  const sanitized: Record<string, string[]> = {};
  
  Object.entries(errors).forEach(([key, messages]) => {
    // Check if key contains any sensitive field
    const isSensitive = sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()));
    
    if (isSensitive) {
      sanitized[key] = ['Invalid value'];
    } else {
      sanitized[key] = messages;
    }
  });
  
  return sanitized;
}

/**
 * Global error handler middleware
 */
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error({
    err,
    path: req.path,
    method: req.method,
    statusCode: res.statusCode
  }, `Error: ${err.message}`);
  
  // Handle ZodError validation errors
  if (err instanceof ZodError) {
    const validationError = convertZodError(err);
    return apiResponse.validationError(res, validationError.errors || {}, validationError.message);
  }
  
  // Handle application errors
  if (err instanceof AppError) {
    const sanitizedErrors = err.errors ? sanitizeErrors(err.errors) : undefined;
    
    switch (err.type) {
      case ErrorType.VALIDATION:
        return apiResponse.validationError(res, sanitizedErrors || {}, err.message);
      case ErrorType.AUTHENTICATION:
        return apiResponse.unauthorized(res, err.message);
      case ErrorType.AUTHORIZATION:
        return apiResponse.forbidden(res, err.message);
      case ErrorType.NOT_FOUND:
        return apiResponse.notFound(res, err.message);
      case ErrorType.CONFLICT:
        return apiResponse.conflict(res, err.message, sanitizedErrors);
      case ErrorType.DATABASE:
      case ErrorType.INTEGRATION:
      case ErrorType.SERVER:
        return apiResponse.error(res, 'An unexpected error occurred. Please try again later.', 500);
      case ErrorType.RATE_LIMIT:
        return apiResponse.error(res, err.message, 429);
      default:
        return apiResponse.error(res, 'An unexpected error occurred. Please try again later.', 500);
    }
  }
  
  // Handle PostgreSQL errors
  if (err instanceof DatabaseError) {
    const formattedErrors = formatDatabaseError(err);
    return apiResponse.error(res, 'Database operation failed', 500, formattedErrors);
  }
  
  // Handle Drizzle ORM errors
  if (err instanceof DrizzleError) {
    const formattedErrors = formatDatabaseError(err as any);
    return apiResponse.error(res, 'Database operation failed', 500, formattedErrors);
  }
  
  // Handle all other errors as 500 Internal Server Error
  return apiResponse.error(res, 'An unexpected error occurred. Please try again later.', 500);
}

/**
 * Async handler to catch errors in async/await route handlers
 */
export function wrapHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export const errorHandling = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  IntegrationError,
  RateLimitError,
  ServerError,
  errorHandler,
  wrapHandler,
  convertZodError,
  formatDatabaseError,
  sanitizeErrors,
  ErrorType
};

export default errorHandling;