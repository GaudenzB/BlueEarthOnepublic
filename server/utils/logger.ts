import pino from 'pino';
import config from './config';

// Configure log levels and transport options
const loggerOptions = {
  level: config.logging.level,
  name: 'blueearth-portal',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label: string) => {
      return { level: label.toUpperCase() };
    },
  },
  base: {
    app: 'blueearth-portal',
    env: config.env.current,
  },
  // Only use pretty printing in development
  transport: config.logging.prettyPrint
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
};

// Create the shared logger instance
export const logger = pino(loggerOptions);

// Utility functions for log formatting
export const logFormats = {
  // Format error objects for better logging
  formatError: (error: any) => {
    if (!error) return { error: 'Unknown error' };
    
    const errorObj: Record<string, any> = {
      message: error.message || 'Unknown error',
      name: error.name || 'Error',
      stack: config.env.isDevelopment ? error.stack : undefined,
    };
    
    // Include additional error properties if available
    if (error.code) errorObj.code = error.code;
    if (error.status || error.statusCode) errorObj.statusCode = error.status || error.statusCode;
    if (error.path) errorObj.path = error.path;
    if (error.type) errorObj.type = error.type;
    
    // Include validation errors if available (common with Zod, express-validator, etc.)
    if (error.errors || error.details) {
      errorObj.details = error.errors || error.details;
    }
    
    return { error: errorObj };
  },
  
  // Format request objects for logging
  formatRequest: (req: any) => {
    if (!req) return {};
    
    return {
      method: req.method,
      url: req.url,
      path: req.path,
      query: req.query,
      params: req.params,
      ip: req.ip,
      headers: config.env.isDevelopment
        ? req.headers
        : {
            'user-agent': req.headers['user-agent'],
            'content-type': req.headers['content-type'],
            'x-request-id': req.headers['x-request-id'],
          },
    };
  },
  
  // Format response objects for logging
  formatResponse: (res: any) => {
    if (!res) return {};
    
    return {
      statusCode: res.statusCode,
      duration: res.responseTime,
      headers: config.env.isDevelopment
        ? res.getHeaders()
        : {
            'content-type': res.getHeader('content-type'),
            'content-length': res.getHeader('content-length'),
          },
    };
  }
};

// Create child loggers for specific components
export const createLogger = (component: string, context?: any) => {
  return logger.child({ component, ...(context || {}) });
};

// Export default logger
export default logger;