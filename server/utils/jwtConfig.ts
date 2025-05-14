import crypto from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { logger } from './logger';

// Define token types
export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
  PREVIEW = 'preview'
}

// Configure different token settings based on type
const tokenSettings = {
  [TokenType.ACCESS]: {
    expiresIn: process.env['JWT_ACCESS_TOKEN_EXPIRY'] || process.env['JWT_TOKEN_EXPIRY'] || '1h',
    audience: 'blueearth-portal',
    issuer: 'blueearth-api'
  },
  [TokenType.REFRESH]: {
    expiresIn: process.env['JWT_REFRESH_TOKEN_EXPIRY'] || '7d',
    audience: 'blueearth-portal',
    issuer: 'blueearth-api'
  },
  [TokenType.PREVIEW]: {
    expiresIn: process.env['JWT_PREVIEW_TOKEN_EXPIRY'] || '15m',
    audience: 'blueearth-portal',
    issuer: 'blueearth-api'
  }
};

// Environment-specific JWT secrets
const getJwtSecret = (tokenType: TokenType): string => {
  // Check for token-specific secret first
  if (tokenType === TokenType.REFRESH && process.env['JWT_REFRESH_SECRET']) {
    return process.env['JWT_REFRESH_SECRET'];
  }
  
  if (tokenType === TokenType.PREVIEW && process.env['JWT_PREVIEW_SECRET']) {
    return process.env['JWT_PREVIEW_SECRET'];
  }
  
  // Fall back to the main JWT secret
  const mainSecret = process.env['JWT_SECRET'];
  
  if (mainSecret) {
    return mainSecret;
  }
  
  // Last resort for development only
  if (process.env['NODE_ENV'] === 'development') {
    logger.warn('Using development JWT secret - this should never happen in production');
    return 'development_only_secret_key_not_for_production';
  }
  
  // No secret available - this should never happen in production
  throw new Error(`JWT_SECRET environment variable is required for application security (${tokenType} token)`);
};

// Store revoked tokens
interface RevokedToken {
  jti: string;
  exp: number; // Expiration timestamp
  type: TokenType;
}

// In-memory storage for revoked tokens (in a real app, use Redis or a database)
const revokedTokens: Record<string, RevokedToken> = {};

// Clean up expired revoked tokens occasionally
setInterval(() => {
  const now = Math.floor(Date.now() / 1000);
  Object.keys(revokedTokens).forEach(jti => {
    if (revokedTokens[jti].exp < now) {
      delete revokedTokens[jti];
    }
  });
}, 60 * 60 * 1000); // Clean up every hour

/**
 * Generate a JWT token of the specified type
 * 
 * @param payload - The data to include in the token
 * @param tokenType - The type of token to generate
 * @returns The signed JWT token
 */
export function generateToken(payload: any, tokenType: TokenType = TokenType.ACCESS): string {
  // Generate a unique token identifier if not provided
  if (!payload.jti) {
    payload.jti = crypto.randomBytes(16).toString('hex');
  }
  
  // Add token type to payload
  const enhancedPayload = {
    ...payload,
    type: tokenType
  };
  
  const secret = getJwtSecret(tokenType);
  const settings = tokenSettings[tokenType];
  
  return jwt.sign(enhancedPayload, secret, {
    expiresIn: settings.expiresIn,
    audience: settings.audience,
    issuer: settings.issuer
  });
}

/**
 * Verify a JWT token
 * 
 * @param token - The token to verify
 * @param tokenType - The expected token type
 * @returns The decoded token payload or null if invalid
 */
export function verifyToken(token: string, tokenType: TokenType = TokenType.ACCESS): JwtPayload | null {
  try {
    const secret = getJwtSecret(tokenType);
    const settings = tokenSettings[tokenType];
    
    const decoded = jwt.verify(token, secret, {
      audience: settings.audience,
      issuer: settings.issuer
    }) as JwtPayload;
    
    // Check if token has been revoked
    if (decoded.jti && revokedTokens[decoded.jti]) {
      logger.warn('Attempt to use revoked token', { jti: decoded.jti });
      return null;
    }
    
    // Check token type
    const tokenTypeValue = decoded['type'];
    if (tokenTypeValue !== tokenType) {
      logger.warn('Token type mismatch', { expected: tokenType, actual: tokenTypeValue });
      return null;
    }
    
    return decoded;
  } catch (error) {
    logger.debug('Token verification failed', { error: (error as Error).message });
    return null;
  }
}

/**
 * Revoke a token (e.g., on logout)
 * 
 * @param token - The token to revoke
 * @param tokenType - The type of token
 * @returns true if the token was successfully revoked
 */
export function revokeToken(token: string, tokenType: TokenType = TokenType.ACCESS): boolean {
  try {
    // Basic structure check to avoid unnecessary processing
    if (!token || typeof token !== 'string') {
      return false;
    }
    
    const secret = getJwtSecret(tokenType);
    const decoded = jwt.verify(token, secret) as JwtPayload;
    
    if (decoded.jti && decoded.exp) {
      revokedTokens[decoded.jti] = {
        jti: decoded.jti,
        exp: decoded.exp,
        type: tokenType
      };
      return true;
    }
    return false;
  } catch (error) {
    logger.debug('Error revoking token', { error: (error as Error).message });
    return false;
  }
}