import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { User, UserRole } from "@shared/schema";
import { apiResponse } from "./utils/apiResponse";

/**
 * Enhanced Authentication System
 * 
 * Features:
 * - Configurable password hashing strength via environment variable
 * - JWT token with claims for better validation (audience, issuer)
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
const TOKEN_EXPIRY = process.env['JWT_TOKEN_EXPIRY'] || '24h'; 
const TOKEN_AUDIENCE = 'blueearth-portal';
const TOKEN_ISSUER = 'blueearth-api';

// Secret key for JWT
const JWT_SECRET = process.env['JWT_SECRET'] || (
  process.env['NODE_ENV'] === 'development' 
  ? 'development_only_secret_key_not_for_production' 
  : undefined
);

// In production, we require a real JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required for application security');
}

// Store of revoked tokens (in-memory for now, could be replaced with Redis or database)
const revokedTokens: Record<string, number> = {};

// Cleanup expired tokens from revoked tokens store periodically
setInterval(() => {
  const now = Math.floor(Date.now() / 1000);
  Object.entries(revokedTokens).forEach(([jti, expiry]) => {
    if (expiry < now) {
      delete revokedTokens[jti];
    }
  });
}, 60 * 60 * 1000); // Run hourly

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

// Enhanced JWT payload interface
interface TokenPayload {
  id: number;
  username: string;
  email: string;
  role: string;
  jti: string;
}

/**
 * Helper function to safely sign JWT tokens, working around TypeScript issues with jsonwebtoken
 */
function signJwt(payload: any, secret: string, options: any): string {
  // Use Function constructor to bypass TypeScript type checking
  // This is a workaround for the jsonwebtoken typing issues
  return Function('jwt', 'payload', 'secret', 'options', 
    'return jwt.sign(payload, secret, options);'
  )(jwt, payload, secret, options);
}

// Function to generate a JWT token with a unique identifier (JTI)
export const generateToken = (user: User): string => {
  // Generate a unique token identifier
  const tokenId = crypto.randomBytes(16).toString('hex');
  
  const payload: TokenPayload = {
    id: user.id,
    username: user.username || '',
    email: user.email || '',
    role: user.role,
    jti: tokenId
  };

  // Use our helper function to sign the token
  return signJwt(
    payload, 
    JWT_SECRET, 
    {
      expiresIn: TOKEN_EXPIRY,
      audience: TOKEN_AUDIENCE, 
      issuer: TOKEN_ISSUER
    }
  );
};

// Function to revoke a token (logout)
export const revokeToken = (token: string): boolean => {
  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Add to revoked tokens list with expiry
    if (decoded.jti && decoded.exp) {
      revokedTokens[decoded.jti] = decoded.exp;
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
};

// Middleware to authenticate requests
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Get token from header
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return apiResponse.unauthorized(res, "No token, authorization denied");
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET, {
      audience: TOKEN_AUDIENCE,
      issuer: TOKEN_ISSUER
    }) as any;
    
    // Check if token has been revoked
    if (decoded.jti && revokedTokens[decoded.jti]) {
      return apiResponse.unauthorized(res, "Token has been revoked");
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
    
    // Provide specific error responses based on verification failure type
    if (error.name === 'TokenExpiredError') {
      return apiResponse.unauthorized(res, "Token has expired");
    } else if (error.name === 'JsonWebTokenError') {
      return apiResponse.unauthorized(res, "Invalid token");
    } else if (error.name === 'NotBeforeError') {
      return apiResponse.unauthorized(res, "Token not yet active");
    }
    
    // Default case for other JWT errors
    return apiResponse.unauthorized(res, "Invalid authentication token");
  }
};

// Role-based access control middleware
export const authorize = (roles: UserRole[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return apiResponse.unauthorized(res, "Authentication required");
    }

    // If no roles are specified, allow all authenticated users
    if (roles.length === 0) {
      return next();
    }

    // Check if the user's role is included in the allowed roles
    if (!roles.includes(req.user.role as UserRole)) {
      return apiResponse.forbidden(
        res, 
        "Insufficient permissions for this resource"
      );
    }

    next();
  };
};

// Superadmin authorization middleware
export const isSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return apiResponse.unauthorized(res, "Authentication required");
  }

  if (req.user.role !== "superadmin") {
    return apiResponse.forbidden(
      res, 
      "This operation requires superadmin privileges"
    );
  }

  next();
};

// Password reset functions
export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const calculateExpiryTime = (hours: number = 24): string => {
  const now = new Date();
  now.setHours(now.getHours() + hours);
  return now.toISOString();
};