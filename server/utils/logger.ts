/**
 * Logger Utility
 * 
 * A centralized logging system with structured JSON output and filtering capabilities.
 * Configurable log levels and pretty printing for development.
 */

import pino from 'pino';
import config from './config';

// Get log configuration from centralized config
const { level, prettyPrint } = config.logging;
const APP_NAME = 'blueearth-portal';

// Configure pino logger
const logger = pino({
  level,
  name: APP_NAME,
  base: { app: APP_NAME, env: config.env },
  transport: prettyPrint 
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      } 
    : undefined,
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  redact: [
    'req.headers.authorization',
    'req.headers.cookie',
    'body.password',
    'body.token',
    'body.refreshToken',
    'data.password',
    'data.token',
    'data.refreshToken',
  ],
});

/**
 * Create a child logger with additional context
 * @param context Additional context to include with log entries
 */
export function createLogger(context: Record<string, any> = {}) {
  return logger.child(context);
}

/**
 * Log HTTP request details
 * @param req Express request object
 * @param res Express response object
 */
export function logRequest(req: any, res: any) {
  const requestId = req.id || '';
  const method = req.method;
  const path = req.path;
  const query = req.query;
  const ip = req.ip;

  logger.debug(
    {
      requestId,
      method,
      path,
      type: 'request',
      query,
      ip,
    },
    `Request: ${method} ${path}`
  );

  logger.debug(`Received request: ${method} ${path}`);

  // Log response when it completes
  res.on('finish', () => {
    const statusCode = res.statusCode;
    const duration = Date.now() - req.startTime;

    if (statusCode >= 400) {
      logger.error(
        {
          requestId,
          method,
          path,
          type: 'response',
          statusCode,
          duration: `${duration}ms`,
          error: res.statusMessage || 'Unknown error',
        },
        `Error response: ${method} ${path} ${statusCode}`
      );
    } else if (statusCode >= 300) {
      logger.info(
        {
          requestId,
          method,
          path,
          type: 'response',
          statusCode,
          duration: `${duration}ms`,
          redirectUrl: res.getHeader('Location'),
        },
        `Redirect response: ${method} ${path} ${statusCode}`
      );
    } else {
      logger.debug(
        {
          requestId,
          method,
          path,
          type: 'response',
          statusCode,
          duration: `${duration}ms`,
        },
        `Success response: ${method} ${path} ${statusCode}`
      );
    }
  });
}

/**
 * Create middleware for HTTP request logging
 */
export function createRequestLogger() {
  return (req: any, res: any, next: any) => {
    // Add request start time for duration calculation
    req.startTime = Date.now();
    
    // Generate a unique ID for each request
    req.id = Math.random().toString(36).substring(2, 15);
    
    // Log the request
    logRequest(req, res);
    
    // Continue to next middleware
    next();
  };
}

export { logger };