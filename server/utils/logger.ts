import pino from 'pino';

/**
 * Application Logger Configuration
 * 
 * Utilizes Pino logger for structured, JSON-based logging with appropriate 
 * formatting based on the environment.
 */

// Determine environment for logger configuration
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

// Default log level from environment variable or based on environment
const LOG_LEVEL = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

// Create the logger instance with appropriate configuration
export const logger = pino({
  name: 'blueearth-portal',
  level: LOG_LEVEL,
  
  // Custom fields to include in every log
  base: {
    app: 'blueearth-portal',
    env: process.env.NODE_ENV || 'development',
  },
  
  // Format logs for development environment
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
    
  // Additional options
  redact: isProduction
    ? ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.secret', '*.token']
    : [],
});

/**
 * Standardized error formatter for consistent error logging
 * 
 * @param error The error object to format
 * @returns Object with formatted error details
 */
export function formatError(error: unknown): Record<string, any> {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: isDevelopment ? error.stack : undefined,
      name: error.name,
      ...(error as any)
    };
  }
  
  return { error };
}

// Export a default logger instance
export default logger;