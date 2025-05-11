import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger, logError } from '../utils/logger';
import { sendError, sendValidationError } from '../utils/apiResponse';

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
  // Log the error
  const errorContext = `${req.method} ${req.path}`;
  logError(err, errorContext);
  
  // Already sent response - don't try to send again
  if (res.headersSent) {
    logger.warn({ path: req.path }, 'Response already sent, cannot send error response');
    return;
  }

  // Handle ZodError (validation errors)
  if (err instanceof ZodError) {
    return sendValidationError(res, err.format(), 'Validation failed');
  }
  
  // Handle ApiError (our custom error class)
  if (err instanceof ApiError) {
    return sendError(
      res, 
      err.message, 
      err.statusCode, 
      err.details || (err.errorCode ? { errorCode: err.errorCode } : undefined)
    );
  }
  
  // Handle general errors
  const statusCode = err.status || err.statusCode || 500;
  const message = statusCode < 500 
    ? err.message 
    : process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'  // Hide details in production
      : err.message || 'Internal Server Error';
      
  return sendError(res, message, statusCode);
}

/**
 * Middleware to handle 404 errors for routes that don't exist
 */
export function notFoundHandler(req: Request, res: Response) {
  logger.debug({ path: req.path, method: req.method }, 'Route not found');
  return sendError(res, `Route ${req.method} ${req.path} not found`, 404, { errorCode: 'ROUTE_NOT_FOUND' });
}