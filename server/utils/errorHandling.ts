import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger, logFormats } from './logger';
import { ApiError } from '../middleware/errorHandler';

/**
 * Transforms various error types into standardized ApiError instances
 * 
 * This ensures consistent error handling across the application
 */
export function transformError(error: unknown): Error {
  // Already an ApiError, just pass it through
  if (error instanceof ApiError) {
    return error;
  }
  
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return new ApiError(
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      { errors: error.format() }
    );
  }
  
  // Handle database errors (specific to Postgres)
  if (error instanceof Error && (error as any).code) {
    const pgError = error as any;
    
    // Unique constraint violation
    if (pgError.code === '23505') {
      return new ApiError(
        'A record with this information already exists',
        409,
        'CONFLICT',
        { detail: pgError.detail }
      );
    }
    
    // Foreign key constraint violation
    if (pgError.code === '23503') {
      return new ApiError(
        'Referenced record does not exist',
        400,
        'REFERENCE_ERROR',
        { detail: pgError.detail }
      );
    }
    
    // Other database errors
    if (pgError.code.startsWith('22') || pgError.code.startsWith('23')) {
      return new ApiError(
        'Database constraint violation',
        400,
        'DATABASE_CONSTRAINT',
        { detail: pgError.detail }
      );
    }
  }
  
  // Handle JWT errors
  if (error instanceof Error && error.name === 'JsonWebTokenError') {
    return new ApiError(
      'Invalid token',
      401,
      'INVALID_TOKEN'
    );
  }
  
  if (error instanceof Error && error.name === 'TokenExpiredError') {
    return new ApiError(
      'Token expired',
      401,
      'TOKEN_EXPIRED'
    );
  }
  
  // Handle generic errors
  if (error instanceof Error) {
    // For security, don't expose internal error details in production
    const isProduction = process.env.NODE_ENV === 'production';
    const message = isProduction ? 'Internal server error' : error.message;
    
    return new ApiError(
      message,
      500,
      'INTERNAL_ERROR',
      isProduction ? undefined : { stack: error.stack }
    );
  }
  
  // For unknown error types, create a generic error
  return new ApiError(
    'An unexpected error occurred',
    500,
    'UNKNOWN_ERROR'
  );
}

/**
 * Wraps a request handler to standardize error handling
 * 
 * Benefits:
 * - Controllers can focus on core logic without try/catch boilerplate
 * - Errors are consistently transformed and passed to error middleware
 * - Request context is captured for better logging
 * 
 * @param handler The original request handler function
 * @returns Wrapped handler with standardized error handling
 */
export function wrapHandler(handler: RequestHandler): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      // Log the error with request context
      logger.error({
        ...logFormats.formatRequest(req),
        ...logFormats.formatError(error),
      }, 'Request handler error');
      
      // Transform and pass to error middleware
      next(transformError(error));
    }
  };
}

/**
 * Utility to create a controller with all methods wrapped in error handling
 * 
 * @param controllers Object with handler methods
 * @returns Object with the same methods, but wrapped with error handling
 */
export function createController<T extends Record<string, RequestHandler>>(controllers: T): T {
  const wrappedController: Record<string, RequestHandler> = {};
  
  // Wrap each method in the controller
  for (const [key, handler] of Object.entries(controllers)) {
    wrappedController[key] = wrapHandler(handler);
  }
  
  return wrappedController as T;
}

/**
 * Helper function to validate request parameters
 * This reduces boilerplate in controllers
 */
export function validateRequest<T>(schema: any, req: Request): T {
  try {
    return schema.parse(req.body) as T;
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ApiError('Validation failed', 400, 'VALIDATION_ERROR', { errors: error.format() });
    }
    throw error;
  }
}