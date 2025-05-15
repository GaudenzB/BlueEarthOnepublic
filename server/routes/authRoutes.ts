import express, { Request, Response } from 'express';
import { apiResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';
import { userRepository } from '../repositories/userRepository';
import { generateToken, TokenType } from '../utils/jwtConfig';
import { setAuthCookies } from '../utils/cookieManager';

const router = express.Router();

/**
 * @route POST /api/auth/dev-login
 * @desc Development-only endpoint to quickly get a valid auth token
 * @access Public (development only)
 */
router.post('/dev-login', (req: Request, res: Response) => {
  // Only available in development environment
  if (process.env.NODE_ENV === 'production') {
    return apiResponse.unauthorized(res, "This endpoint is only available in development");
  }
  
  logger.warn('Development login endpoint used', {
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  
  // Auto-authenticate as admin in development
  const devUser = {
    id: 1,
    username: 'admin',
    email: 'admin@blueearthcapital.com',
    role: 'superadmin'
  };
  
  // Set session for cookie-based auth (most reliable method in development)
  if (req.session) {
    req.session.userId = devUser.id;
    req.session.userRole = devUser.role;
    req.session.username = devUser.username;
    req.session.email = devUser.email;
    
    // Log session data for debugging
    logger.debug('Set development session data', {
      sessionId: req.sessionID,
      userId: devUser.id,
      role: devUser.role
    });
  }
  
  // Generate JWT token for token-based auth
  const token = generateToken(devUser, TokenType.ACCESS);
  
  // Extract rememberMe from request body, default to true for dev login
  const rememberMe = req.body?.rememberMe !== false;
  
  // Use our common auth cookie helper with debug information
  logger.debug('Setting auth cookies with rememberMe=' + rememberMe);
  setAuthCookies(res, token, undefined, rememberMe);
  
  // Set a direct SameSite=Lax cookie that isn't HttpOnly for browser detection
  res.cookie('auth_present', 'true', {
    httpOnly: false, // Allows JavaScript detection
    secure: false,   // Works in dev without HTTPS
    sameSite: 'lax', // More permissive for development
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 30 days or 1 day
  });
  
  // Return success with user data
  apiResponse.success(res, {
    user: devUser,
    token
  }, "Development login successful");
});

export default router;