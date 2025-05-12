import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { apiResponse } from '../utils/apiResponse';
import { errorHandling } from '../utils/errorHandling';

/**
 * Custom Error class for API errors
 */
export class ApiError extends Error {
  statusCode: number;
  errorCode?: string;
  details?: any;
  
  constructor(message: string, statusCode: number = 500, errorCode?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

/**
 * Middleware to handle all application errors
 * 
 * Features:
 * - Different handling for various error types (Zod, ApiError, general errors)
 * - Structured error responses
 * - Error logging with context
 * - Hides internal error details in production
 */
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  // Log the error with context
  const errorContext = {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.id || 'unauthenticated'
  };
  
  logger.error('Request error', {
    ...errorContext,
    error: err,
    stack: err.stack
  });
  
  // Already sent response - don't try to send again
  if (res.headersSent) {
    logger.warn({ path: req.path }, 'Response already sent, cannot send error response');
    return;
  }

  // Handle ZodError (validation errors)
  if (err instanceof ZodError) {
    const formattedErrors: Record<string, string[]> = {};
    const errors = err.format();
    
    Object.entries(errors).forEach(([field, error]: [string, any]) => {
      if (field !== '_errors' && error._errors && error._errors.length > 0) {
        formattedErrors[field] = error._errors;
      }
    });
    
    return apiResponse.validationError(res, formattedErrors);
  }
  
  // Handle ApiError (our custom error class)
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details && { details: err.details }),
      ...(err.errorCode && { errorCode: err.errorCode })
    });
  }
  
  // Handle general errors
  const statusCode = err.status || err.statusCode || 500;
  const message = statusCode < 500 
    ? err.message 
    : process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'  // Hide details in production
      : err.message || 'Internal Server Error';
      
  return apiResponse.error(res, message, statusCode);
}

/**
 * Middleware to handle 404 errors for routes that don't exist
 * 
 * In development mode, API routes return a 404 error,
 * but client-side routes are allowed to pass through to be handled by Vite
 */
export function notFoundHandler(req: Request, res: Response) {
  // Only handle API routes with the error handler
  if (req.path.startsWith('/api/')) {
    logger.debug({ path: req.path, method: req.method }, 'API route not found');
    return apiResponse.notFound(res, `Route ${req.method} ${req.path} not found`);
  }
  
  // For client-side routes, this should be unreachable in development
  // as Vite middleware should handle them, but just in case
  logger.debug({ path: req.path, method: req.method }, 'Client route not found, passing through');
  return res.status(404).send('Not found');
}