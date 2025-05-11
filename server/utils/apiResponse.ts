import { Response } from 'express';

/**
 * Standardized API Response Utility
 * 
 * This utility provides consistent response formatting across all API endpoints.
 * It helps ensure that error handling and response structures follow a uniform pattern.
 */

// Success response with optional data
export function sendSuccess(
  res: Response, 
  data: any = null, 
  message: string = 'Operation successful', 
  statusCode: number = 200
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

// Error response with standardized format
export function sendError(
  res: Response, 
  message: string = 'An error occurred', 
  statusCode: number = 500, 
  errors: any = null
) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}

// Authentication error (401 Unauthorized)
export function sendUnauthorized(
  res: Response, 
  message: string = 'Authentication required',
  errorCode: string = 'AUTH_REQUIRED'
) {
  return sendError(res, message, 401, { errorCode });
}

// Authorization error (403 Forbidden)
export function sendForbidden(
  res: Response, 
  message: string = 'Insufficient permissions',
  errorCode: string = 'PERMISSION_DENIED'
) {
  return sendError(res, message, 403, { errorCode });
}

// Authentication specific errors
export function sendTokenExpired(res: Response) {
  return sendUnauthorized(
    res, 
    'Your session has expired, please log in again', 
    'TOKEN_EXPIRED'
  );
}

export function sendTokenInvalid(res: Response) {
  return sendUnauthorized(
    res, 
    'Invalid authentication token', 
    'TOKEN_INVALID'
  );
}

export function sendTokenRevoked(res: Response) {
  return sendUnauthorized(
    res, 
    'Your session has been revoked', 
    'TOKEN_REVOKED'
  );
}

// Not found error (404)
export function sendNotFound(res: Response, message: string = 'Resource not found') {
  return sendError(res, message, 404);
}

// Validation error (400 Bad Request)
export function sendValidationError(res: Response, errors: any, message: string = 'Validation failed') {
  return sendError(res, message, 400, errors);
}