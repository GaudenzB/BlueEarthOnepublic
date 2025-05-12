import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { logger } from '../utils/logger';
import config from '../utils/config';

/**
 * Middleware to secure Express applications
 * - CORS protection
 * - HTTP security headers via Helmet
 */
export function setupSecurityMiddleware(app: express.Application): void {
  // Configure CORS settings from centralized config
  const corsOptions = {
    origin: config.cors.origin,
    methods: config.cors.methods,
    allowedHeaders: config.cors.allowedHeaders,
    maxAge: config.cors.maxAge
  };
  app.use(cors(corsOptions));
  
  // Set up Helmet for HTTP security headers
  app.use(helmet({
    contentSecurityPolicy: config.security.contentSecurityPolicy,
    crossOriginEmbedderPolicy: false, 
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hidePoweredBy: true,
    hsts: config.security.hsts,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true
  }));
  
  // Configure trust proxy settings for production environments behind load balancers
  if (config.server.trustProxy) {
    app.set('trust proxy', 1);
  }
  
  // Set body size limits to prevent DoS attacks
  app.use(express.json({ limit: config.server.bodyLimit }));
  app.use(express.urlencoded({ extended: false, limit: config.server.bodyLimit }));
  
  // Add a health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: config.env.current
    });
  });
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