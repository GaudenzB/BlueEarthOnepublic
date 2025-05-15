import { Response } from 'express';
import { env } from '../config/env';
import { logger } from './logger';

/**
 * Cookie configuration object for different environments
 */
const cookieConfig = {
  // Base configuration for all environments
  base: {
    // HttpOnly: true prevents JavaScript from accessing the cookie (crucial for security)
    httpOnly: true,
    // Path: '/' makes the cookie available for all paths
    path: '/',
    // SameSite: 'strict' prevents the cookie from being sent in cross-site requests
    sameSite: 'strict' as const,
  },
  
  // Development-specific configuration
  development: {
    // Domain: not needed in development
    domain: undefined,
    // Secure: false allows cookies over HTTP in development
    secure: false,
    // Max age: 7 days in milliseconds
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
  
  // Production-specific configuration
  production: {
    // Domain: specific to the production domain
    domain: undefined, // Will be set based on configuration
    // Secure: true requires HTTPS (recommended in production)
    secure: true,
    // Max age: 7 days in milliseconds
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
  
  // Test-specific configuration
  test: {
    // Domain: not needed in test
    domain: undefined,
    // Secure: false allows cookies over HTTP in test
    secure: false,
    // Max age: shorter in test environment
    maxAge: 1 * 24 * 60 * 60 * 1000,
  },
};

/**
 * Get the cookie configuration for the current environment
 */
function getCookieConfig(name?: string, maxAgeOverride?: number): Record<string, any> {
  const environment = process.env.NODE_ENV || 'development';
  const envConfig = cookieConfig[environment as keyof typeof cookieConfig] || cookieConfig.development;
  
  // Merge base and environment-specific configs
  const config: Record<string, any> = {
    ...cookieConfig.base,
    ...envConfig,
  };
  
  // Apply domain from environment variable if available
  if (process.env.COOKIE_DOMAIN) {
    config.domain = process.env.COOKIE_DOMAIN;
  }
  
  // Apply max age override if provided
  if (maxAgeOverride !== undefined) {
    config.maxAge = maxAgeOverride;
  }
  
  // Log cookie configuration in development for debugging
  if (environment === 'development') {
    logger.debug(`Cookie configuration for ${name || 'unnamed cookie'}:`, {
      httpOnly: Boolean(config.httpOnly),
      secure: Boolean(config.secure),
      sameSite: config.sameSite,
      domain: config.domain || 'not set',
      maxAge: config.maxAge || 'not set'
    });
  }
  
  return config;
}

/**
 * Set a secure cookie that is HttpOnly and properly configured for the environment
 */
export function setSecureCookie(
  res: Response, 
  name: string, 
  value: string, 
  maxAge?: number
): void {
  res.cookie(name, value, getCookieConfig(name, maxAge));
  logger.debug(`Set secure cookie: ${name}`);
}

/**
 * Clear a cookie by setting it to expire immediately
 */
export function clearCookie(res: Response, name: string): void {
  const config = getCookieConfig(name);
  // To clear a cookie, set maxAge to 0 and provide an empty value
  res.cookie(name, '', { ...config, maxAge: 0 });
  logger.debug(`Cleared cookie: ${name}`);
}

/**
 * Set authentication cookies
 * @param res - Express response object
 * @param accessToken - JWT access token
 * @param refreshToken - JWT refresh token (optional)
 * @param rememberMe - Whether to set a longer expiry (30 days) for persistent login
 */
export function setAuthCookies(
  res: Response, 
  accessToken: string, 
  refreshToken?: string,
  rememberMe: boolean = false
): void {
  // Default token expiry from environment or fallback
  const defaultAccessTokenExpiry = parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRY_SECONDS || '3600') * 1000;
  const defaultRefreshTokenExpiry = parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRY_SECONDS || '604800') * 1000;
  
  // For "Remember Me", use a longer expiry (30 days) for both tokens
  const rememberMeExpiry = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  
  // Set access token cookie with appropriate expiry
  setSecureCookie(
    res, 
    'accessToken', 
    accessToken, 
    rememberMe ? rememberMeExpiry : defaultAccessTokenExpiry
  );
  
  // Set refresh token cookie if provided
  if (refreshToken) {
    setSecureCookie(
      res, 
      'refreshToken', 
      refreshToken, 
      rememberMe ? rememberMeExpiry : defaultRefreshTokenExpiry
    );
  }
  
  logger.debug('Set authentication cookies', { rememberMe });
}

/**
 * Clear authentication cookies
 */
export function clearAuthCookies(res: Response): void {
  clearCookie(res, 'accessToken');
  clearCookie(res, 'refreshToken');
  logger.debug('Cleared authentication cookies');
}