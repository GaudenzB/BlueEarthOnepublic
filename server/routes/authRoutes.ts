import express, { Request, Response } from 'express';
import { apiResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';
import { userRepository } from '../repositories/userRepository';
import { generateToken, TokenType } from '../utils/jwtConfig';

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
  
  // Set session for cookie-based auth
  if (req.session) {
    req.session.userId = devUser.id;
    req.session.userRole = devUser.role;
  }
  
  // Generate JWT token for token-based auth
  const token = generateToken(devUser, TokenType.ACCESS);
  
  // Set as cookie as well
  res.cookie('accessToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  });
  
  // Return success with user data
  apiResponse.success(res, {
    user: devUser,
    token
  }, "Development login successful");
});

export default router;