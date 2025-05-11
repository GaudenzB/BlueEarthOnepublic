import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { User, UserRole } from "@shared/schema";
import { sendUnauthorized, sendForbidden } from "./utils/apiResponse";

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        email: string;
        role: string;
      };
    }
  }
}

// Configurable security settings with environment variable overrides
const SALT_ROUNDS = parseInt(process.env.PASSWORD_SALT_ROUNDS || '10', 10);
const TOKEN_EXPIRY = process.env.JWT_TOKEN_EXPIRY || '24h'; 

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || (
  process.env.NODE_ENV === 'development' 
  ? 'development_only_secret_key_not_for_production' 
  : undefined
);

// In production, we require a real JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required for application security');
}

// Store of revoked tokens (in-memory for now, could be replaced with Redis or database)
// Keys are token JTIs (unique identifiers), values are expiry timestamps
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

// Type definitions for JWT handling
interface JwtUserPayload {
  id: number;
  username: string;
  email: string;
  role: string;
  jti: string;
  aud: string;
  iss: string;
  iat: number;
  exp: number;
}

// Function to generate a JWT token with a unique identifier (JTI)
export const generateToken = (user: User): string => {
  // Generate a unique token identifier
  const tokenId = crypto.randomBytes(16).toString('hex');
  
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    jti: tokenId, // Include token ID for revocation support
  };

  // Cast JWT_SECRET to the appropriate type to satisfy TypeScript
  return jwt.sign(
    payload, 
    JWT_SECRET, 
    { 
      expiresIn: TOKEN_EXPIRY,
      audience: 'blueearth-portal', // Add audience claim for additional validation
      issuer: 'blueearth-api',      // Add issuer claim for additional validation
    }
  );
};

// Function to revoke a token (logout)
export const revokeToken = (token: string): boolean => {
  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      jti: string;
      exp: number;
    };
    
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
    return sendUnauthorized(res, "No token, authorization denied");
  }

  try {
    // Verify token with enhanced validation options
    const decoded = jwt.verify(token, JWT_SECRET, {
      audience: 'blueearth-portal',
      issuer: 'blueearth-api',
      complete: true, // Return full decoded token for additional info
    }) as {
      payload: {
        id: number;
        username: string;
        email: string;
        role: string;
        jti: string;
      }
    };
    
    // Check if token has been revoked
    if (decoded.payload.jti && revokedTokens[decoded.payload.jti]) {
      return sendUnauthorized(res, "Token has been revoked");
    }
    
    req.user = {
      id: decoded.payload.id,
      username: decoded.payload.username,
      email: decoded.payload.email,
      role: decoded.payload.role
    };
    
    next();
  } catch (err) {
    const error = err as Error;
    let message = "Token is not valid";
    
    // Provide more specific error messages based on verification failure
    if (error.name === 'TokenExpiredError') {
      message = "Token has expired";
    } else if (error.name === 'JsonWebTokenError') {
      message = "Invalid token format";
    } else if (error.name === 'NotBeforeError') {
      message = "Token not yet active";
    }
    
    return sendUnauthorized(res, message);
  }
};

// Role-based access control middleware
export const authorize = (roles: UserRole[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendUnauthorized(res, "Authentication required");
    }

    // If no roles are specified, allow all authenticated users
    if (roles.length === 0) {
      return next();
    }

    // Check if the user's role is included in the allowed roles
    if (!roles.includes(req.user.role as UserRole)) {
      return sendForbidden(res, "Insufficient permissions for this resource");
    }

    next();
  };
};

// Superadmin authorization middleware
export const isSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return sendUnauthorized(res, "Authentication required");
  }

  if (req.user.role !== "superadmin") {
    return sendForbidden(res, "This operation requires superadmin privileges");
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