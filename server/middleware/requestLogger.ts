import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger, logFormats } from '../utils/logger';
import config from '../utils/config';

// Extend Express Request type to include request ID
declare global {
  namespace Express {
    interface Request {
      id?: string;
      startTime?: [number, number]; // hrtime tuple
    }
  }
}

/**
 * Middleware to log HTTP requests and responses
 * 
 * Features:
 * - Assigns unique request ID to each request
 * - Logs request details on start (method, path, query params, etc.)
 * - Times request duration
 * - Logs response details on completion (status code, duration)
 * - Only logs API routes in detail
 * - Truncates overly verbose response bodies
 */
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  // Assign unique ID to request
  req.id = req.id || req.headers['x-request-id'] as string || uuidv4();
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', req.id);
  
  // Record start time
  req.startTime = process.hrtime();
  
  // Only log detailed information for API routes
  const isApiRoute = req.path.startsWith('/api');
  
  // Log basic info for all requests
  if (isApiRoute) {
    logger.debug({
      requestId: req.id,
      method: req.method,
      path: req.path,
      type: 'request',
      query: req.query,
      ip: req.ip,
    }, `Request: ${req.method} ${req.path}`);
    
    // Log request body for non-GET requests in development, but sanitize sensitive data
    if (config.nodeEnv === 'development' && req.method !== 'GET' && req.body) {
      logger.debug({
        requestId: req.id,
        body: sanitizeBody(req.body),
      }, 'Request body');
    }
  }
  
  // Capture the original response.end method
  const originalEnd = res.end;
  
  // Override the response.end method to use correct function signature
  const endHandler = function(this: Response, chunk: any, encoding?: BufferEncoding | (() => void), callback?: () => void): Response {
    // Restore original end method
    res.end = originalEnd;
    
    // Calculate duration
    const hrTime = process.hrtime(req.startTime);
    const durationMs = hrTime[0] * 1000 + hrTime[1] / 1000000;
    const duration = `${durationMs.toFixed(0)}ms`;
    
    // Only log detailed response for API routes
    if (isApiRoute) {
      // Skip logging the response body for employee routes to reduce noise
      // We already log the relevant details in the controller before sending
      if (req.path.includes('/api/employees')) {
        logger.info({
          requestId: req.id,
          method: req.method,
          path: req.path,
          type: 'response',
          statusCode: res.statusCode,
          duration,
          body: { employeeDataSkipped: true }
        }, `Response: ${req.method} ${req.path} ${res.statusCode}`);
      } else if (res.statusCode >= 400 && res.statusCode < 600) {
        // Log error responses with more detail
        logger.error({
          requestId: req.id,
          method: req.method,
          path: req.path,
          type: 'response',
          statusCode: res.statusCode,
          duration,
          error: 'See error logs for details'
        }, `Error response: ${req.method} ${req.path} ${res.statusCode}`);
      } else {
        // Log successful responses without trying to parse the body
        logger.info({
          requestId: req.id,
          method: req.method,
          path: req.path,
          type: 'response',
          statusCode: res.statusCode,
          duration
        }, `Response: ${req.method} ${req.path} ${res.statusCode}`);
      }
    }
    
    // Handle cases based on arguments
    if (typeof encoding === 'function') {
      // Case: .end(chunk, callback)
      return originalEnd.call(this, chunk, encoding);
    } else {
      // Case: .end(chunk, encoding, callback)
      return originalEnd.call(this, chunk, encoding, callback);
    }
  };
  
  // Override the end method
  res.end = endHandler as any;
  
  next();
}

/**
 * Sanitize request body to remove sensitive information
 */
function sanitizeBody(body: any): any {
  if (!body) return body;
  
  // Create a copy of the body
  const sanitized = { ...body };
  
  // List of sensitive fields to redact
  const sensitiveFields = [
    'password', 'newPassword', 'oldPassword', 'confirmPassword',
    'token', 'accessToken', 'refreshToken', 'apiKey', 'secret',
    'creditCard', 'cardNumber', 'cvv', 'ssn', 'socialSecurity'
  ];
  
  // Redact sensitive fields
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

/**
 * Truncate response body if it's too large
 */
function truncateResponseBody(body: any): any {
  if (!body) return body;
  
  // Stringify the body to get its size
  const bodyString = JSON.stringify(body);
  
  // If body is too large, truncate it
  if (bodyString.length > 500) {
    return {
      _truncated: true,
      _originalSize: bodyString.length,
      message: 'Response body truncated due to size',
      preview: bodyString.substring(0, 500) + '...'
    };
  }
  
  return body;
}

export default requestLoggerMiddleware;