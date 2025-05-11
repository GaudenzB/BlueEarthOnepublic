import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { logger } from '../utils/logger';

/**
 * Middleware to secure Express applications
 * - CORS protection
 * - HTTP security headers via Helmet
 */
export function setupSecurityMiddleware(app: express.Application): void {
  // Configure CORS settings
  const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
      ? [/\.blueearth\.capital$/, /\.replit\.app$/] // Allow only specific domains in production
      : '*', // Allow all origins in development
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400 // 24 hours
  };
  app.use(cors(corsOptions));
  
  // Set up Helmet for HTTP security headers
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: false, 
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hidePoweredBy: true,
    hsts: process.env.NODE_ENV === 'production' ? {
      maxAge: 15552000, // 180 days
      includeSubDomains: true,
      preload: true
    } : false,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true
  }));
  
  // Validate required environment variables
  app.use(validateRequiredEnvVars);
  
  // Add a health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
}

/**
 * Environment Variables Validation
 * Ensures required environment variables are set before the application starts
 */
function validateRequiredEnvVars(req: Request, res: Response, next: NextFunction): void {
  // Only check on the first request (excluding health checks)
  if (req.path !== '/api/health' && !(req as any).app.locals.envValidated) {
    const requiredVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'SESSION_SECRET'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`;
      logger.error(errorMessage);
      
      // In production, fail hard
      if (process.env.NODE_ENV === 'production') {
        res.status(500).json({ 
          success: false, 
          message: 'Server configuration error', 
          errors: { errorCode: 'ENV_VARS_MISSING' } 
        });
        return;
      }
      
      // In development, just log a warning
      logger.warn('Continuing in development mode despite missing environment variables');
    }
    
    // Mark as validated to avoid checking on every request
    (req as any).app.locals.envValidated = true;
  }
  
  next();
}

/**
 * XSS Sanitization
 * Helper function to sanitize user input to prevent XSS attacks
 */
export function sanitizeUserInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Parameter Validation
 * Helper function to validate URL parameters (like IDs)
 */
export function validateIdParam(id: any): boolean {
  // Check if id is a valid number
  const parsedId = parseInt(id);
  return !isNaN(parsedId) && parsedId > 0 && parsedId.toString() === id.toString();
}

/**
 * File Upload Validation
 * Helper function to validate file uploads
 */
export function validateFileUpload(
  file: { size: number; mimetype: string }, 
  allowedTypes: string[], 
  maxSizeMB: number
): boolean {
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return false;
  }
  
  // Check file type
  if (!allowedTypes.includes(file.mimetype)) {
    return false;
  }
  
  return true;
}