import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";
import { User } from "@shared/schema";
import { apiResponse } from "./utils/apiResponse";
import { generateToken, verifyToken, revokeToken, TokenType } from "./utils/jwtConfig";
import { roleHelpers, UserRole } from './utils/roleHelpers';
import { logger } from './utils/logger';

/**
 * Enhanced Authentication System
 * 
 * Features:
 * - Configurable password hashing strength via environment variable
 * - JWT token with claims for better validation (audience, issuer)
 * - Separate access and refresh tokens with different lifetimes
 * - Token revocation support for logout functionality
 * - Standardized API responses for auth errors
 * - Role-based access control with fine-grained error messages
 */

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        email: string;
        role: string;
        jti?: string; // JWT token ID
      };
    }
  }
}

// Configurable security settings with environment variable overrides
const SALT_ROUNDS = parseInt(process.env['PASSWORD_SALT_ROUNDS'] || '10', 10);

// Token storage and cleanup is now handled in jwtConfig.ts

// Function to hash a password with configurable salt rounds
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

// Function to compare a password with a hash
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate a JWT token pair for a user
 * 
 * @param user - The user object to generate tokens for
 * @returns An object containing access token and refresh token
 */
export const generateUserToken = (user: User): { accessToken: string, refreshToken: string } => {
  const payload = {
    id: user.id,
    username: user.username || '',
    email: user.email || '',
    role: user.role
  };

  // Generate access token
  const accessToken = generateToken(payload, TokenType.ACCESS);
  
  // Generate refresh token with minimal info (just ID and JTI)
  const refreshToken = generateToken({ id: user.id }, TokenType.REFRESH);
  
  return { accessToken, refreshToken };
};

// Middleware to authenticate requests
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Try to get token from cookies first (our new preferred method)
  const cookieToken = req.cookies?.accessToken;
  
  // Fallback to Authorization header if no cookie (for backward compatibility)
  const headerToken = req.header("Authorization")?.replace("Bearer ", "");
  
  // Use the cookie token if available, otherwise use the header token
  const token = cookieToken || headerToken;

  // Special handling for document upload routes to provide better error diagnostics
  const isDocumentUpload = req.path.includes('/documents') && req.method === 'POST';
  
  if (!token) {
    if (isDocumentUpload) {
      logger.error('Document upload authentication failed - no token provided', {
        path: req.path,
        method: req.method,
        hasAuthHeader: !!req.header("Authorization"),
        hasCookies: !!req.cookies?.accessToken,
        headers: Object.keys(req.headers),
        ip: req.ip
      });
    }
    apiResponse.unauthorized(res, "Authentication required");
    return;
  }

  try {
    // Verify token using our centralized token verification
    const decoded = verifyToken(token, TokenType.ACCESS);
    
    if (!decoded) {
      apiResponse.unauthorized(res, "Invalid authentication token");
      return;
    }
    
    // Set user in request
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
      jti: decoded.jti
    };
    
    next();
  } catch (err) {
    const error = err as Error;
    
    // Enhanced error logging for document uploads
    if (isDocumentUpload) {
      logger.error('Document upload authentication failed during token verification', {
        path: req.path,
        method: req.method,
        errorName: error.name,
        errorMessage: error.message,
        hasAuthHeader: !!req.header("Authorization"),
        hasCookies: !!req.cookies?.accessToken
      });
    }
    
    // Provide specific error responses based on verification failure type
    if (error.name === 'TokenExpiredError') {
      apiResponse.unauthorized(res, "Authentication session expired");
      return;
    } else if (error.name === 'JsonWebTokenError') {
      apiResponse.unauthorized(res, "Invalid authentication token");
      return;
    } else if (error.name === 'NotBeforeError') {
      apiResponse.unauthorized(res, "Authentication token not yet active");
      return;
    }
    
    // Default case for other JWT errors
    apiResponse.unauthorized(res, "Authentication failed");
    return;
  }
};

// Role-based access control middleware
export const authorize = (roles: UserRole[] = []): ((req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      apiResponse.unauthorized(res, "Authentication required");
      return;
    }

    // If no roles are specified, allow all authenticated users
    if (roles.length === 0) {
      next();
      return;
    }

    // Check if the user's role is included in the allowed roles
    if (!roles.includes(req.user.role as UserRole)) {
      apiResponse.forbidden(
        res, 
        "Insufficient permissions for this resource"
      );
      return;
    }

    next();
  };
};

// Superadmin authorization middleware
export const isSuperAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    apiResponse.unauthorized(res, "Authentication required");
    return;
  }

  // Use roleHelpers for consistent role checking
  if (!roleHelpers.isSuperAdmin(req.user.role as UserRole)) {
    apiResponse.forbidden(
      res, 
      "This operation requires superadmin privileges"
    );
    return;
  }

  next();
};

// Password reset functions
// Use Node's native crypto for reset tokens instead of JWT
export const generateResetToken = (): string => {
  return crypto.randomUUID();
};

export const calculateExpiryTime = (hours: number = 24): string => {
  const now = new Date();
  now.setHours(now.getHours() + hours);
  return now.toISOString();
};