import pino from 'pino';

/**
 * Centralized Logger Configuration
 * 
 * This module provides a structured logger for the application using pino.
 * Features:
 * - Consistent log format across all components
 * - Log level filtering based on environment
 * - Request/response context capturing
 * - Pretty printing in development mode
 */

// Determine the log level based on environment
const getLogLevel = () => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return 'info';
    case 'test':
      return 'error';
    default:
      return 'debug';
  }
};

// Configure pino options
const pinoConfig = {
  level: getLogLevel(),
  transport: process.env.NODE_ENV !== 'production' 
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        }
      } 
    : undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
  // Add application name and version to all logs
  base: {
    app: 'blueearth-portal',
    env: process.env.NODE_ENV || 'development',
  },
};

/**
 * Application logger instance
 */
export const logger = pino(pinoConfig);

/**
 * Request context logger
 * Adds request-specific information to logs
 */
export const createRequestLogger = (req: any) => {
  return logger.child({
    requestId: req.id || 'unknown',
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.id || 'anonymous',
  });
};

// Export log level constants for use throughout the application
export const LOG_LEVELS = {
  TRACE: 'trace',
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal',
};

/**
 * Error logging helper
 * Formats errors consistently with stack traces
 */
export const logError = (err: Error, context: string = '') => {
  logger.error({
    error: {
      type: err.constructor.name,
      message: err.message,
      stack: err.stack,
    },
    context,
  }, `Error: ${context ? context + ' - ' : ''}${err.message}`);
};