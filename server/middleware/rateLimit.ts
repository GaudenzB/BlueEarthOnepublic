import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';
import { env } from '../config/env';

/**
 * Configure rate limiters for different API routes
 * 
 * We implement tiered rate limiting:
 * 1. Strict limits for auth routes (login, register)
 * 2. Special limits for password reset functionality
 * 3. General limits for all other API routes
 */

// General API rate limiter - applies to all non-auth routes
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip non-API routes
    return !req.path.startsWith('/api/');
  },
  handler: (req, res) => {
    logger.warn({
      type: 'rate_limit_exceeded',
      ip: req.ip,
      path: req.path,
      method: req.method,
      headers: req.headers['user-agent'],
    }, `Rate limit exceeded for ${req.ip} on ${req.method} ${req.path}`);
    
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
      retryAfter: Math.ceil(env.RATE_LIMIT_WINDOW_MS / 1000 / 60),
    });
  },
});

// Auth-specific rate limiter - stricter limits for auth routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({
      type: 'auth_rate_limit_exceeded',
      ip: req.ip,
      path: req.path,
      method: req.method,
      headers: req.headers['user-agent'],
    }, `Auth rate limit exceeded for ${req.ip} on ${req.method} ${req.path}`);
    
    res.status(429).json({
      success: false,
      message: 'Too many login attempts, please try again later.',
      retryAfter: 15,
    });
  },
});

// Password reset rate limiter - specific limits for password reset functionality
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  max: 3, // 3 password reset attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({
      type: 'password_reset_rate_limit_exceeded',
      ip: req.ip,
      path: req.path,
      method: req.method,
      headers: req.headers['user-agent'],
      email: req.body.email, // Log the email being used for password reset attempts
    }, `Password reset rate limit exceeded for ${req.ip} on ${req.method} ${req.path}`);
    
    res.status(429).json({
      success: false,
      message: 'Too many password reset attempts, please try again later.',
      retryAfter: 60,
    });
  },
});