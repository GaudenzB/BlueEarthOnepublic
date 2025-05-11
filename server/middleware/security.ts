import { Request as ExpressRequest, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import csrf from 'csrf';
import { logger } from '../utils/logger';
import { Express } from 'express';
import multer from 'multer';
import session from 'express-session';

// Add CSRF secret to the session type
declare module 'express-session' {
  interface SessionData {
    csrfSecret?: string;
  }
}

// Extend Request type to include session
interface Request extends ExpressRequest {
  session?: session.Session & {
    csrfSecret?: string;
  };
}

// Initialize CSRF protection
const tokens = new csrf();

/**
 * Middleware to secure Express applications
 * - CORS protection
 * - HTTP security headers via Helmet
 * - CSRF protection
 */
export function setupSecurityMiddleware(app: any) {
  // Configure CORS - restrictive in production, permissive in dev
  const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
      ? [/\.blueearth\.capital$/, /\.replit\.app$/] // Allow only specific domains in production
      : '*', // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposedHeaders: ['X-CSRF-Token'],
    maxAge: 86400 // 24 hours
  };
  app.use(cors(corsOptions));
  
  // Set up Helmet for HTTP security headers
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: false, // Allow loading resources from different origins
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
      maxAge: 15552000, // 180 days
      includeSubDomains: true,
      preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true
  }));
  
  // Don't apply CSP in development as it breaks Vite's Hot Module Replacement
  if (process.env.NODE_ENV === 'production') {
    app.use(require('helmet-csp')({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"], // Add any other script sources you need
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "https://api.sendgrid.com", "https://bubble.io"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
      }
    }));
  }
  
  // Add CSRF protection for state-changing requests
  // Only enabled in production by default
  if (process.env.NODE_ENV === 'production') {
    app.use(csrfProtection);
    
    // Endpoint to get a new CSRF token
    app.get('/api/csrf-token', (req: Request, res: Response) => {
      const secret = tokens.secretSync();
      const token = tokens.create(secret);
      
      // Store the secret in the session
      if (req.session) {
        req.session.csrfSecret = secret;
      }
      
      res.setHeader('X-CSRF-Token', token);
      res.json({ success: true });
    });
  }
  
  // Validate environment variables
  app.use(validateRequiredEnvVars);
}

/**
 * CSRF Protection Middleware
 * Validates CSRF tokens for state-changing requests (POST, PUT, DELETE, PATCH)
 */
function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Skip for API routes that don't need CSRF protection (e.g., webhooks)
  if (req.path.startsWith('/api/webhooks/')) {
    return next();
  }
  
  const token = req.headers['x-csrf-token'] as string;
  const secret = req.session?.csrfSecret;
  
  if (!secret) {
    logger.warn({ path: req.path }, 'CSRF validation failed: No secret in session');
    return res.status(403).json({ 
      success: false, 
      message: 'CSRF validation failed', 
      errors: { errorCode: 'CSRF_SECRET_MISSING' } 
    });
  }
  
  if (!token) {
    logger.warn({ path: req.path }, 'CSRF validation failed: No token provided');
    return res.status(403).json({ 
      success: false, 
      message: 'CSRF validation failed', 
      errors: { errorCode: 'CSRF_TOKEN_MISSING' } 
    });
  }
  
  if (!tokens.verify(secret, token)) {
    logger.warn({ path: req.path }, 'CSRF validation failed: Invalid token');
    return res.status(403).json({ 
      success: false, 
      message: 'CSRF validation failed', 
      errors: { errorCode: 'CSRF_TOKEN_INVALID' } 
    });
  }
  
  next();
}

/**
 * Environment Variables Validation
 * Ensures required environment variables are set before the application starts
 */
function validateRequiredEnvVars(req: Request, res: Response, next: NextFunction) {
  // Only check on the first request
  if (req.path !== '/api/health' && !req.app.locals.envValidated) {
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
        return res.status(500).json({ 
          success: false, 
          message: 'Server configuration error', 
          errors: { errorCode: 'ENV_VARS_MISSING' } 
        });
      }
      
      // In development, just log a warning
      logger.warn('Continuing in development mode despite missing environment variables');
    }
    
    // Mark as validated to avoid checking on every request
    req.app.locals.envValidated = true;
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
export function validateFileUpload(file: Express.Multer.File, allowedTypes: string[], maxSizeMB: number): boolean {
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