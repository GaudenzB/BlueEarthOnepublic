import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

/**
 * Configuration options for rate limiters
 */
interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

/**
 * Default rate limit configuration
 */
const defaultOptions: RateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
};

/**
 * More strict rate limit for authentication endpoints
 */
const authLimiterOptions: RateLimitOptions = {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: 'Too many login attempts from this IP, please try again later',
};

/**
 * Rate limiter for general API routes
 */
export const apiLimiter = rateLimit({
  ...defaultOptions,
  // Skip rate limiting in development mode
  skip: () => process.env.NODE_ENV === 'development',
  // Log rate limit hits
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      status: 'error',
      message: options.message,
    });
  },
});

/**
 * Stricter rate limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
  ...defaultOptions,
  ...authLimiterOptions,
  // Skip rate limiting in development mode
  skip: () => process.env.NODE_ENV === 'development',
  // Log rate limit hits with more details for auth endpoints
  handler: (req, res, next, options) => {
    logger.warn('Authentication rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      username: req.body?.username || 'unknown',
    });
    res.status(429).json({
      status: 'error',
      message: 'Too many login attempts, please try again later',
    });
  },
});

/**
 * Very strict rate limiter for password reset endpoints
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: 'Too many password reset attempts, please try again later',
  // Skip rate limiting in development mode
  skip: () => process.env.NODE_ENV === 'development',
});

/**
 * Rate limiter for file uploads
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  message: 'Too many file uploads, please try again later',
  // Skip rate limiting in development mode
  skip: () => process.env.NODE_ENV === 'development',
});