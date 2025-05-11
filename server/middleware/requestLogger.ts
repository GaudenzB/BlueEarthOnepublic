import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logger, createRequestLogger } from '../utils/logger';

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
  // Skip logging for static assets or non-API routes
  if (!req.path.startsWith('/api')) {
    return next();
  }
  
  // Generate a unique ID for this request
  req.id = randomUUID();
  
  // Create a child logger with request context
  const reqLogger = createRequestLogger(req);
  
  // Capture request start time
  const startTime = Date.now();
  
  // Log basic request info
  reqLogger.debug({
    type: 'request',
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip
  }, `Request: ${req.method} ${req.path}`);
  
  // Only log request body for certain content types and only in debug mode
  const contentType = req.get('Content-Type');
  if (contentType && contentType.includes('application/json') && logger.isLevelEnabled('debug')) {
    reqLogger.debug({ body: sanitizeBody(req.body) }, 'Request body');
  }
  
  // Capture the original response functions
  const originalEnd = res.end;
  const originalJson = res.json;
  let responseBody: any;
  
  // Override res.json to capture the response body
  res.json = function(body) {
    responseBody = body;
    return originalJson.apply(res, [body] as any);
  };
  
  // Log on response completion
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    
    const logObject = {
      type: 'response',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    };
    
    // Only include response body for certain status codes and only in debug mode
    if (responseBody && logger.isLevelEnabled('debug')) {
      logObject.body = truncateResponseBody(responseBody);
    }
    
    reqLogger[logLevel](
      logObject, 
      `Response: ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`
    );
  });
  
  next();
}

/**
 * Sanitize request body to remove sensitive information
 */
function sanitizeBody(body: any): any {
  if (!body) return body;
  
  const sensitiveFields = ['password', 'token', 'secret', 'authorization', 'key'];
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * Truncate response body if it's too large
 */
function truncateResponseBody(body: any): any {
  if (!body) return body;
  
  const stringified = JSON.stringify(body);
  const maxLength = 500;
  
  if (stringified.length <= maxLength) {
    return body;
  }
  
  return {
    _truncated: true,
    _originalSize: stringified.length,
    message: 'Response body truncated due to size',
    preview: stringified.substring(0, maxLength) + '...'
  };
}